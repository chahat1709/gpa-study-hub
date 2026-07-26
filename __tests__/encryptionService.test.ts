import { describe, it, expect } from 'vitest';
import { encryptText, decryptText } from '../services/encryptionService';

describe('encryptionService', () => {
  it('should encrypt and decrypt text round-trip', async () => {
    const original = 'Hello, this is a secret message!';
    const chatId = 'test-chat-001';

    const encrypted = await encryptText(original, chatId);
    expect(encrypted).not.toBe(original);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await decryptText(encrypted, chatId);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext for same plaintext (random salt+IV)', async () => {
    const text = 'Same message twice';
    const chatId = 'test-chat-002';

    const encrypted1 = await encryptText(text, chatId);
    const encrypted2 = await encryptText(text, chatId);

    // Should produce different ciphertext due to random salt+IV
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should decrypt to different text with wrong chatId', async () => {
    const text = 'Secret for chat A';
    const encrypted = await encryptText(text, 'chat-A');

    const decrypted = await decryptText(encrypted, 'chat-B');
    // Wrong key should produce either garbled text or the "Securely Encrypted" fallback
    expect(decrypted).not.toBe(text);
  });

  it('should handle empty strings gracefully', async () => {
    const chatId = 'test-chat-003';
    const encrypted = await encryptText('', chatId);
    const decrypted = await decryptText(encrypted, chatId);
    expect(decrypted).toBe('');
  });

  it('should return original text for short inputs (not encrypted)', async () => {
    const shortText = 'abc';
    const result = await decryptText(shortText, 'chat-id');
    expect(result).toBe(shortText);
  });

  it('should return fallback for corrupted base64', async () => {
    const result = await decryptText('!!!invalid-base64!!!', 'chat-id');
    // Should return the short input as-is or a fallback
    expect(typeof result).toBe('string');
  });

  it('should handle Unicode text', async () => {
    const unicodeText = 'नमस्ते दुनिया 🌍 こんにちは';
    const chatId = 'test-chat-unicode';

    const encrypted = await encryptText(unicodeText, chatId);
    const decrypted = await decryptText(encrypted, chatId);
    expect(decrypted).toBe(unicodeText);
  });

  it('should handle long text', async () => {
    const longText = 'A'.repeat(10000);
    const chatId = 'test-chat-long';

    const encrypted = await encryptText(longText, chatId);
    const decrypted = await decryptText(encrypted, chatId);
    expect(decrypted).toBe(longText);
  });
});
