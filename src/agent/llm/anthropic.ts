import type { AgentMessage } from '../core/types';
import type { ToolDefinition } from '../tools/types';
import type { LLMProvider, LLMResponse } from './types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

function convertMessages(messages: AgentMessage[]): { system: string; messages: AnthropicMessage[] } {
  let system = '';
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = msg.content;
      continue;
    }

    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
      continue;
    }

    if (msg.role === 'assistant') {
      const blocks: AnthropicContentBlock[] = [];
      if (msg.content) {
        blocks.push({ type: 'text', text: msg.content });
      }
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          blocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
      }
      result.push({
        role: 'assistant',
        content: blocks.length === 1 && blocks[0].type === 'text' ? blocks[0].text : blocks,
      });
      continue;
    }

    if (msg.role === 'tool' && msg.toolResults) {
      const blocks: AnthropicContentBlock[] = msg.toolResults.map(tr => ({
        type: 'tool_result' as const,
        tool_use_id: tr.toolCallId,
        content: tr.error || JSON.stringify(tr.result),
      }));
      result.push({ role: 'user', content: blocks });
    }
  }

  return { system, messages: result };
}

function convertTools(tools: ToolDefinition[]): AnthropicTool[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        tool.parameters.map(p => [
          p.name,
          {
            type: p.type,
            description: p.description,
            ...(p.enum ? { enum: p.enum } : {}),
          },
        ])
      ),
      required: tool.parameters.filter(p => p.required).map(p => p.name),
    },
  }));
}

export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private baseUrl: string = 'https://api.anthropic.com',
  ) {}

  async chat(
    messages: AgentMessage[],
    tools: ToolDefinition[],
    temperature: number,
  ): Promise<LLMResponse> {
    const { system, messages: converted } = convertMessages(messages);

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      temperature,
      messages: converted,
    };

    if (system) {
      body.system = system;
    }

    if (tools.length > 0) {
      body.tools = convertTools(tools);
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    let content = '';
    const toolCalls: LLMResponse['toolCalls'] = [];

    for (const block of data.content || []) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input || {},
        });
      }
    }

    return { content, toolCalls };
  }
}
