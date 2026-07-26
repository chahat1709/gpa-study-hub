import { describe, it, expect } from 'vitest';
import { getStoredApiKey } from '../services/geminiService';

describe('geminiService', () => {
  describe('getStoredApiKey', () => {
    it('should return empty string when no key stored', () => {
      localStorage.removeItem('USER_GEMINI_API_KEY');
      const key = getStoredApiKey();
      expect(key).toBe('');
    });

    it('should return stored key from localStorage', () => {
      localStorage.setItem('USER_GEMINI_API_KEY', 'test-api-key-12345');
      const key = getStoredApiKey();
      expect(key).toBe('test-api-key-12345');
    });
  });
});
