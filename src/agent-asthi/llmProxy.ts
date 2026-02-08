import type { AgentMessage } from '../agent/core/types';
import type { ToolDefinition } from '../agent/tools/types';
import type { LLMProvider, LLMResponse } from '../agent/llm/types';
import { supabase } from '../lib/supabase';

export class ProxiedLLMProvider implements LLMProvider {
  constructor(
    private provider: string,
    private model: string,
    private userApiKey?: string,
  ) {}

  async chat(
    messages: AgentMessage[],
    tools: ToolDefinition[],
    temperature: number,
  ): Promise<LLMResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider: this.provider,
          model: this.model,
          messages,
          tools,
          temperature,
          userApiKey: this.userApiKey,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proxy error (${response.status}): ${text}`);
    }

    return response.json();
  }
}
