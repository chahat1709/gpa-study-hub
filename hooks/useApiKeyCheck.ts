import { useState, useEffect, useCallback } from 'react';
import { hasAnyApiKey } from '../services/aiProviderService';

/**
 * Hook to check if any AI API key is available (Gemini, OpenCode Zen, or Custom).
 */
export function useApiKeyCheck(intervalMs = 5000) {
  const [hasKey, setHasKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const check = useCallback(async () => {
    // Check external AI Studio first
    if (window.aistudio) {
      const validated = await window.aistudio.hasSelectedApiKey();
      if (validated) {
        setHasKey(true);
        setIsChecking(false);
        return;
      }
    }
    // Check any stored API key
    setHasKey(hasAnyApiKey());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(() => {
      if (!document.hidden) check();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);

  return { hasKey, isChecking };
}
