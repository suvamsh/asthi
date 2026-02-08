// Agent Core — extractable as standalone package (zero React/Supabase imports)

export { runAgent } from './core/agentLoop';
export { ToolRegistry } from './tools/registry';
export { createLLMProvider, PROVIDER_PRESETS } from './llm/providerFactory';
export { LoopDetector } from './core/loopDetector';
export { validateStepResults } from './core/validator';
export { parseAgentError } from './core/errors';
export { compactMessages } from './core/compaction';

export type {
  AgentMessage,
  AgentStatus,
  AgentStep,
  AgentRun,
  AgentConfig,
  AgentCallbacks,
  ValidationResult,
  ToolCall,
  ToolResult,
} from './core/types';

export type { AgentError, AgentErrorCode } from './core/errors';

export { DEFAULT_AGENT_CONFIG } from './core/types';

export type {
  ToolDefinition,
  ToolParameter,
  AgentTool,
} from './tools/types';

export type {
  LLMProvider,
  LLMProviderConfig,
  LLMProviderType,
  LLMResponse,
} from './llm/types';

export type { ProviderPreset } from './llm/providerFactory';
