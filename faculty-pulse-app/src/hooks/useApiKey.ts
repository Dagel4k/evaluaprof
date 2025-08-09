import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'openai_api_key';
const API_KEY_STORAGE_KEY_ENC = 'openai_api_key_enc_v1';
const SALT_KEY = 'device_salt_v1';

async function getSalt(): Promise<CryptoKey> {
  // Derive a key from a device-specific salt stored in IndexedDB/localStorage
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16)).toString();
    localStorage.setItem(SALT_KEY, salt);
  }
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(salt), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('evaluaprof_salt'), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  ) as Promise<CryptoKey>;
}

async function encrypt(text: string): Promise<string> {
  const key = await getSalt();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...out));
}

async function decrypt(b64: string): Promise<string | null> {
  try {
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const key = await getSalt();
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // Primero verificar si hay una API key en las variables de entorno
      const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (envApiKey) {
        setApiKey(envApiKey);
        setIsConfigured(true);
        return;
      }

      // Intentar recuperar encriptada
      const encKey = localStorage.getItem(API_KEY_STORAGE_KEY_ENC);
      if (encKey) {
        const plain = await decrypt(encKey);
        if (plain) {
          setApiKey(plain);
          setIsConfigured(true);
          return;
        }
      }

      // Fallback: buscar en texto plano (compatibilidad)
      const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (storedApiKey) {
        setApiKey(storedApiKey);
        setIsConfigured(true);
      }
    })();
  }, []);

  const saveApiKey = async (key: string) => {
    if (key && key.trim() !== '') {
      try {
        const enc = await encrypt(key);
        localStorage.setItem(API_KEY_STORAGE_KEY_ENC, enc);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      } catch {
        // Si falla, almacenar plano como último recurso
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      }
      setApiKey(key);
      setIsConfigured(true);
      return true;
    }
    return false;
  };

  const refreshApiKey = async () => {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
      setIsConfigured(true);
      return;
    }

    const encKey = localStorage.getItem(API_KEY_STORAGE_KEY_ENC);
    if (encKey) {
      const plain = await decrypt(encKey);
      if (plain) {
        setApiKey(plain);
        setIsConfigured(true);
        return;
      }
    }

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
    localStorage.removeItem(API_KEY_STORAGE_KEY_ENC);
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
