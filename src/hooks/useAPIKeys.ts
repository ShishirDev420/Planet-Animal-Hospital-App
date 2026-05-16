import { useState, useEffect, useCallback } from 'react';

export interface APIKeyConfig {
  gemini: string;
  openai: string;
  sarvam: string;
  elevenlabs: string;
}

export interface APIKeyStatus {
  gemini: 'connected' | 'disconnected' | 'testing';
  openai: 'connected' | 'disconnected' | 'testing';
  sarvam: 'connected' | 'disconnected' | 'testing';
  elevenlabs: 'connected' | 'disconnected' | 'testing';
  freeTierAvailable: boolean;
}

const STORAGE_KEYS = {
  gemini: 'planet_animal_gemini_key',
  openai: 'planet_animal_openai_key',
  sarvam: 'planet_animal_sarvam_key',
  elevenlabs: 'planet_animal_elevenlabs_key',
  freeTierCount: 'planet_animal_free_tier_count',
};

const FREE_TIER_LIMIT = 10;

export function useAPIKeys() {
  const [keys, setKeys] = useState<APIKeyConfig>({
    gemini: '',
    openai: '',
    sarvam: '',
    elevenlabs: '',
  });
  const [status, setStatus] = useState<APIKeyStatus>({
    gemini: 'disconnected',
    openai: 'disconnected',
    sarvam: 'disconnected',
    elevenlabs: 'disconnected',
    freeTierAvailable: false,
  });
  const [freeTierCount, setFreeTierCount] = useState(0);

  useEffect(() => {
    const loadedKeys: Partial<APIKeyConfig> = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      if (key === 'freeTierCount') continue;
      const value = localStorage.getItem(storageKey);
      if (value) {
        loadedKeys[key as keyof APIKeyConfig] = value;
      }
    }
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.freeTierCount) || '0', 10);
    setFreeTierCount(count);

    setKeys(prev => ({ ...prev, ...loadedKeys }));

    setStatus(prev => ({
      ...prev,
      gemini: loadedKeys.gemini ? 'connected' : 'disconnected',
      openai: loadedKeys.openai ? 'connected' : 'disconnected',
      sarvam: loadedKeys.sarvam ? 'connected' : 'disconnected',
      elevenlabs: loadedKeys.elevenlabs ? 'connected' : 'disconnected',
      freeTierAvailable: count < FREE_TIER_LIMIT,
    }));
  }, []);

  const setKey = useCallback((provider: keyof APIKeyConfig, value: string) => {
    const trimmed = value.trim();
    localStorage.setItem(STORAGE_KEYS[provider], trimmed);
    setKeys(prev => ({ ...prev, [provider]: trimmed }));
    setStatus(prev => ({
      ...prev,
      [provider]: trimmed ? 'connected' : 'disconnected',
    }));
  }, []);

  const removeKey = useCallback((provider: keyof APIKeyConfig) => {
    localStorage.removeItem(STORAGE_KEYS[provider]);
    setKeys(prev => ({ ...prev, [provider]: '' }));
    setStatus(prev => ({ ...prev, [provider]: 'disconnected' }));
  }, []);

  const testKey = useCallback(async (provider: keyof APIKeyConfig): Promise<boolean> => {
    const key = keys[provider];
    if (!key) return false;

    setStatus(prev => ({ ...prev, [provider]: 'testing' }));

    try {
      if (provider === 'gemini') {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say hello' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        });
        const success = res.ok;
        setStatus(prev => ({ ...prev, gemini: success ? 'connected' : 'disconnected' }));
        return success;
      }

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10,
          }),
        });
        const success = res.ok;
        setStatus(prev => ({ ...prev, openai: success ? 'connected' : 'disconnected' }));
        return success;
      }

      if (provider === 'sarvam') {
        const res = await fetch('https://api.sarvam.ai/v1/models', {
          headers: { 'api-subscription-key': key },
        });
        const success = res.status !== 401;
        setStatus(prev => ({ ...prev, sarvam: success ? 'connected' : 'disconnected' }));
        return success;
      }

      if (provider === 'elevenlabs') {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': key },
        });
        const success = res.ok;
        setStatus(prev => ({ ...prev, elevenlabs: success ? 'connected' : 'disconnected' }));
        return success;
      }

      return false;
    } catch {
      setStatus(prev => ({ ...prev, [provider]: 'disconnected' }));
      return false;
    }
  }, [keys]);

  const consumeFreeTier = useCallback((): boolean => {
    if (freeTierCount >= FREE_TIER_LIMIT) {
      setStatus(prev => ({ ...prev, freeTierAvailable: false }));
      return false;
    }
    const newCount = freeTierCount + 1;
    setFreeTierCount(newCount);
    localStorage.setItem(STORAGE_KEYS.freeTierCount, newCount.toString());
    if (newCount >= FREE_TIER_LIMIT) {
      setStatus(prev => ({ ...prev, freeTierAvailable: false }));
    }
    return true;
  }, [freeTierCount]);

  const hasAnyLLMKey = keys.gemini || keys.openai || status.freeTierAvailable;

  return {
    keys,
    status,
    freeTierCount,
    freeTierLimit: FREE_TIER_LIMIT,
    hasAnyLLMKey,
    setKey,
    removeKey,
    testKey,
    consumeFreeTier,
  };
}
