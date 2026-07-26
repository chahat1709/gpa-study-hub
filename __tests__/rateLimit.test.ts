import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatRetryTime,
} from '../utils/rateLimit';

describe('rateLimit utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', () => {
      const result = checkRateLimit('test-user');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should track remaining attempts', () => {
      recordFailedAttempt('test-user');
      const result = checkRateLimit('test-user');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should lock out after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt('test-user');
      }
      const result = checkRateLimit('test-user');
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      // Simulate old attempts by manually setting storage
      const limits = {
        'old-user': {
          attempts: 3,
          lastAttempt: Date.now() - 20 * 60 * 1000, // 20 minutes ago
        },
      };
      localStorage.setItem('gpa_hub_rate_limits', JSON.stringify(limits));

      const result = checkRateLimit('old-user');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should create new entry on first failure', () => {
      recordFailedAttempt('new-user');
      const result = checkRateLimit('new-user');
      expect(result.remainingAttempts).toBe(4);
    });

    it('should increment attempts', () => {
      recordFailedAttempt('inc-user');
      recordFailedAttempt('inc-user');
      recordFailedAttempt('inc-user');
      const result = checkRateLimit('inc-user');
      expect(result.remainingAttempts).toBe(2);
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limit on success', () => {
      recordFailedAttempt('clear-user');
      recordFailedAttempt('clear-user');
      clearRateLimit('clear-user');
      const result = checkRateLimit('clear-user');
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('formatRetryTime', () => {
    it('should format seconds', () => {
      expect(formatRetryTime(30)).toBe('30 seconds');
    });

    it('should format minutes', () => {
      expect(formatRetryTime(120)).toBe('2 minutes');
    });

    it('should format minutes and seconds', () => {
      expect(formatRetryTime(90)).toBe('1m 30s');
    });
  });
});
