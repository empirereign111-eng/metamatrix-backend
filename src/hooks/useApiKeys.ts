import { useEffect, useRef } from 'react';
import { Provider, ApiKey } from '../types';
import { useStore } from '../store/useStore';

const DEFAULT_KEYS: Record<Provider, ApiKey[]> = {
  gemini: [],
  grok: [],
  mixtral: []
};

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const useApiKeys = (provider: Provider) => {
  const { apiKeys, setApiKeys } = useStore();
  
  // Load initial keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('metamatrix_api_keys_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_KEYS, ...parsed };
        
        // Remove default keys that were previously hardcoded
        const defaultGeminiKeys = [
          "GEMINI_API_KEY_HERE",
          "GEMINI_API_KEY_HERE"
        ];
        
        if (merged.gemini) {
          merged.gemini = merged.gemini.filter((k: ApiKey) => !defaultGeminiKeys.includes(k.key));
        }
        
        if (merged.grok) {
          merged.grok = merged.grok.filter((k: ApiKey) => 
            k.id !== 'default-grok' && 
            k.key !== 'Grok_API_KEY_Here' &&
            !k.key.startsWith('sk_CIxg')
          );
        }
        
        // Ensure at least one key is active if there are keys left
        if (merged.gemini && merged.gemini.length > 0 && !merged.gemini.some((k: ApiKey) => k.isActive)) {
          merged.gemini[0].isActive = true;
        }
        if (merged.grok && merged.grok.length > 0 && !merged.grok.some((k: ApiKey) => k.isActive)) {
          merged.grok[0].isActive = true;
        }
        if (merged.mixtral && merged.mixtral.length > 0 && !merged.mixtral.some((k: ApiKey) => k.isActive)) {
          merged.mixtral[0].isActive = true;
        }

        setApiKeys(merged);
      } catch (e) {
        setApiKeys(DEFAULT_KEYS);
      }
    } else {
      setApiKeys(DEFAULT_KEYS);
    }
  }, [setApiKeys]);
  
  useEffect(() => {
    localStorage.setItem('metamatrix_api_keys_v5', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const apiKeysRef = useRef(apiKeys);
  apiKeysRef.current = apiKeys;

  const handleAddKey = (newKey: string, newBaseUrl: string) => {
    if (!newKey.trim()) return;
    if (apiKeys[provider].length >= 100) {
      alert('Maximum 100 API keys allowed per provider.');
      return;
    }
    setApiKeys({
      ...apiKeys,
      [provider]: [
        ...apiKeys[provider].map(k => ({ ...k, isActive: false })),
        { 
          id: generateId(), 
          key: newKey.trim(), 
          isActive: true, 
          isValid: null,
          baseUrl: newBaseUrl.trim() || undefined
        }
      ]
    });
  };

  const handleRemoveKey = (id: string) => {
    const keys = apiKeys[provider].filter(k => k.id !== id);
    if (keys.length > 0 && !keys.some(k => k.isActive)) {
      keys[0].isActive = true;
    }
    setApiKeys({ ...apiKeys, [provider]: keys });
  };

  const handleActivateKey = (id: string) => {
    setApiKeys({
      ...apiKeys,
      [provider]: apiKeys[provider].map(k => ({ ...k, isActive: k.id === id }))
    });
  };

  const resetKeys = () => {
    setApiKeys({
      ...apiKeys,
      [provider]: apiKeys[provider].map(k => ({ ...k, isValid: null, cooldownUntil: undefined }))
    });
  };

  return {
    apiKeys,
    apiKeysRef,
    setApiKeys,
    handleAddKey,
    handleRemoveKey,
    handleActivateKey,
    resetKeys
  };
};
