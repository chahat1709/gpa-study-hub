const GEMINI_KEY = 'USER_GEMINI_API_KEY';

/**
 * Returns the configured Gemini key without importing or initializing an AI SDK.
 * This keeps configuration reads deterministic in unit tests and offline mode.
 */
export const getStoredApiKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;

  const stored = localStorage.getItem(GEMINI_KEY);
  return stored || '';
};
