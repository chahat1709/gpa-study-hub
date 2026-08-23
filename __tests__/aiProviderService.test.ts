import { describe, it, expect, beforeEach } from 'vitest';
import {
  PROVIDERS,
  getSelectedProvider,
  setSelectedProvider,
  getGeminiApiKey,
  setGeminiApiKey,
  getZenApiKey,
  setZenApiKey,
  getCustomConfig,
  setCustomConfig,
  hasAnyApiKey,
  getCurrentApiKey,
} from '../services/aiProviderService';

describe('aiProviderService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('PROVIDERS', () => {
    it('should have gemini, opencode-zen, and custom providers', () => {
      expect(PROVIDERS.gemini).toBeDefined();
      expect(PROVIDERS['opencode-zen']).toBeDefined();
      expect(PROVIDERS.custom).toBeDefined();
    });

    it('opencode-zen should have correct endpoint', () => {
      expect(PROVIDERS['opencode-zen'].endpoint).toBe(
        'https://opencode.ai/zen/v1/chat/completions'
      );
      expect(PROVIDERS['opencode-zen'].model).toBe('mimo-v2.5-free');
    });
  });

  describe('provider selection', () => {
    it('should default to gemini', () => {
      expect(getSelectedProvider()).toBe('gemini');
    });

    it('should persist provider selection', () => {
      setSelectedProvider('opencode-zen');
      expect(getSelectedProvider()).toBe('opencode-zen');
    });

    it('should auto-detect opencode-zen when key exists', () => {
      localStorage.setItem('USER_ZEN_API_KEY', 'test-zen-key');
      expect(getSelectedProvider()).toBe('opencode-zen');
    });
  });

  describe('Gemini API key', () => {
    it('should return empty when not set', () => {
      expect(getGeminiApiKey()).toBe('');
    });

    it('should persist gemini key', () => {
      setGeminiApiKey('AIzaSyTest123');
      expect(getGeminiApiKey()).toBe('AIzaSyTest123');
    });
  });

  describe('Zen API key', () => {
    it('should return empty when not set', () => {
      expect(getZenApiKey()).toBe('');
    });

    it('should persist zen key', () => {
      setZenApiKey('zen-key-abc123');
      expect(getZenApiKey()).toBe('zen-key-abc123');
    });
  });

  describe('Custom config', () => {
    it('should return empty defaults when not set', () => {
      const config = getCustomConfig();
      expect(config.url).toBe('');
      expect(config.key).toBe('');
      expect(config.model).toBe('');
    });

    it('should persist custom config', () => {
      setCustomConfig('https://api.example.com/v1/chat/completions', 'sk-123', 'gpt-4o');
      const config = getCustomConfig();
      expect(config.url).toBe('https://api.example.com/v1/chat/completions');
      expect(config.key).toBe('sk-123');
      expect(config.model).toBe('gpt-4o');
    });
  });

  describe('hasAnyApiKey', () => {
    it('should return false when no keys set', () => {
      expect(hasAnyApiKey()).toBe(false);
    });

    it('should return true when gemini key exists', () => {
      setGeminiApiKey('AIzaSyTest');
      expect(hasAnyApiKey()).toBe(true);
    });

    it('should return true when zen key exists', () => {
      setZenApiKey('zen-key-123');
      expect(hasAnyApiKey()).toBe(true);
    });

    it('should return true when custom config exists', () => {
      setCustomConfig('https://api.test.com', 'sk-123', 'gpt-4');
      expect(hasAnyApiKey()).toBe(true);
    });
  });

  describe('getCurrentApiKey', () => {
    it('should return gemini key when gemini is selected', () => {
      setSelectedProvider('gemini');
      setGeminiApiKey('AIzaSyTest');
      expect(getCurrentApiKey()).toBe('AIzaSyTest');
    });

    it('should return zen key when zen is selected', () => {
      setSelectedProvider('opencode-zen');
      setZenApiKey('zen-key-123');
      expect(getCurrentApiKey()).toBe('zen-key-123');
    });

    it('should return custom key when custom is selected', () => {
      setSelectedProvider('custom');
      setCustomConfig('https://api.test.com', 'sk-custom', 'gpt-4');
      expect(getCurrentApiKey()).toBe('sk-custom');
    });
  });
});
