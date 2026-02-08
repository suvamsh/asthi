import type { LLMProvider, LLMProviderConfig, LLMProviderType } from './types';
import { OpenAICompatibleProvider } from './openaiCompatible';
import { AnthropicProvider } from './anthropic';

export interface ProviderPreset {
  provider: LLMProviderType;
  label: string;
  defaultModel: string;
  defaultBaseUrl: string;
  requiresApiKey: boolean;
}

export const PROVIDER_PRESETS: Record<LLMProviderType, ProviderPreset> = {
  ollama: {
    provider: 'ollama',
    label: 'Ollama (Local)',
    defaultModel: 'llama3.1:8b',
    defaultBaseUrl: 'http://localhost:11434',
    requiresApiKey: false,
  },
  groq: {
    provider: 'groq',
    label: 'Groq',
    defaultModel: 'llama-3.1-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai',
    requiresApiKey: true,
  },
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com',
    requiresApiKey: true,
  },
  together: {
    provider: 'together',
    label: 'Together AI',
    defaultModel: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    defaultBaseUrl: 'https://api.together.xyz',
    requiresApiKey: true,
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    defaultBaseUrl: 'https://api.anthropic.com',
    requiresApiKey: true,
  },
};

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  const preset = PROVIDER_PRESETS[config.provider];
  const baseUrl = config.baseUrl || preset.defaultBaseUrl;
  const model = config.model || preset.defaultModel;

  if (config.provider === 'anthropic') {
    if (!config.apiKey) {
      throw new Error('Anthropic provider requires an API key');
    }
    return new AnthropicProvider(config.apiKey, model, baseUrl);
  }

  // All others use OpenAI-compatible format
  return new OpenAICompatibleProvider(baseUrl, model, config.apiKey);
}
