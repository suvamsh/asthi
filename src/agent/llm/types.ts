import type { AgentMessage } from '../core/types';
import type { ToolDefinition } from '../tools/types';

export interface LLMResponse {
  content: string;
  toolCalls: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }[];
}

export interface LLMProvider {
  chat(
    messages: AgentMessage[],
    tools: ToolDefinition[],
    temperature: number,
  ): Promise<LLMResponse>;
}

export type LLMProviderType = 'ollama' | 'openai' | 'groq' | 'together' | 'anthropic';

export interface LLMProviderConfig {
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  useProxy?: boolean;
}
