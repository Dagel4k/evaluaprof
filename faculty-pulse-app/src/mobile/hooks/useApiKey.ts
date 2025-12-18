import { useState, useEffect } from 'react';
import { getDecryptedApiKey, saveEncryptedApiKey, clearStoredApiKey } from '@/shared/lib/secureStorage';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const key = await getDecryptedApiKey();
      if (key) {
        setApiKey(key);
        setIsConfigured(true);
      }
    })();
  }, []);

  const saveApiKey = async (key: string) => {
    const trimmed = (key || '').trim();
    if (trimmed) {
      try {
        await saveEncryptedApiKey(trimmed);
      } catch {
        // If encryption fails, still avoid storing plain; just keep in memory for session
      }
      setApiKey(trimmed);
      setIsConfigured(true);
      return true;
    }
    return false;
  };

  const refreshApiKey = async () => {
    const key = await getDecryptedApiKey();
    setApiKey(key);
    setIsConfigured(!!key);
  };

  const clearApiKey = () => {
    clearStoredApiKey();
    setApiKey('');
    setIsConfigured(false);
  };

  const validateApiKey = (key: string): { isValid: boolean; error?: string } => {
    const trimmed = (key || '').trim();
    if (!trimmed) return { isValid: false, error: 'La API key no puede estar vacía' };
    if (!trimmed.startsWith('sk-')) return { isValid: false, error: 'La API key debe comenzar con "sk-"' };
    if (trimmed.length < 20) return { isValid: false, error: 'La API key parece ser demasiado corta' };
    return { isValid: true };
  };

  return {
    apiKey,
    isConfigured,
    saveApiKey,
    clearApiKey,
    validateApiKey,
    refreshApiKey
  };
};
