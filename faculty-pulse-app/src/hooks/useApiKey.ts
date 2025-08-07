import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'openai_api_key';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    // Primero verificar si hay una API key en las variables de entorno
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
      setIsConfigured(true);
      return;
    }

    // Si no hay en el entorno, buscar en localStorage
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsConfigured(true);
    }
  }, []);

  const saveApiKey = (key: string) => {
    if (key && key.trim() !== '') {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
      setIsConfigured(true);
      return true;
    }
    return false;
  };

  const refreshApiKey = () => {
    // Primero verificar si hay una API key en las variables de entorno
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
      setIsConfigured(true);
      return;
    }

    // Si no hay en el entorno, buscar en localStorage
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsConfigured(true);
    } else {
      setApiKey('');
      setIsConfigured(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setIsConfigured(false);
  };

  const validateApiKey = (key: string): { isValid: boolean; error?: string } => {
    if (!key || key.trim() === '') {
      return { isValid: false, error: 'La API key no puede estar vacía' };
    }

    if (!key.startsWith('sk-')) {
      return { isValid: false, error: 'La API key debe comenzar con "sk-"' };
    }

    if (key.length < 20) {
      return { isValid: false, error: 'La API key parece ser demasiado corta' };
    }

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
