import { useState, useCallback } from 'react';
import type { LLMProviderConfig } from '../../agent/llm/types';

const STORAGE_KEY = 'asthi-agent-config';

const DEFAULT_CONFIG: LLMProviderConfig = {
  provider: 'ollama',
  model: 'llama3.1:8b',
  baseUrl: 'http://localhost:11434',
};

function loadConfig(): LLMProviderConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

export function useAgentConfig() {
  const [config, setConfig] = useState<LLMProviderConfig>(loadConfig);

  const isConfigured = Boolean(
    config.provider &&
    config.model &&
    (config.provider === 'ollama' || config.apiKey)
  );

  const saveConfig = useCallback((newConfig: LLMProviderConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  return { config, isConfigured, saveConfig };
}
