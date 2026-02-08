export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
  durationMs: number;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'executing_tools'
  | 'validating'
  | 'compacting'
  | 'complete'
  | 'error'
  | 'max_steps_reached';

export interface AgentStep {
  stepNumber: number;
  status: AgentStatus;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  validation: ValidationResult | null;
  response: string | null;
}

export interface AgentRun {
  id: string;
  query: string;
  steps: AgentStep[];
  finalResponse: string | null;
  status: AgentStatus;
  totalDurationMs: number;
}

export interface AgentCallbacks {
  onStepUpdate?: (step: AgentStep) => void;
  onStatusChange?: (status: AgentStatus) => void;
  onError?: (error: import('./errors').AgentError) => void;
  onCompaction?: () => void;
}

export interface AgentConfig {
  maxSteps: number;
  maxToolCallsPerStep: number;
  systemPrompt: string;
  temperature: number;
  callbacks?: AgentCallbacks;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  needsRefinement: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxSteps: 10,
  maxToolCallsPerStep: 3,
  temperature: 0.3,
  systemPrompt: `You are a portfolio research assistant. You help users understand their investment portfolio by analyzing their holdings, news, strategy alignment, and market data.

You have access to tools that provide real portfolio data. Always use these tools to ground your answers in facts — never make up numbers or holdings.

When answering:
- Be concise and specific
- Reference actual portfolio data (ticker symbols, dollar amounts, percentages)
- Highlight risks and opportunities
- If the user asks about something outside your tools' capabilities, say so clearly

Think step by step:
1. Identify what data you need to answer the question
2. Call the appropriate tools to gather that data
3. Synthesize the results into a clear, actionable answer`,
};
