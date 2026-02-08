import type { AgentConfig, AgentMessage, AgentRun, AgentStep, AgentStatus, ToolCall, ToolResult } from './types';
import type { LLMProvider, LLMResponse } from '../llm/types';
import type { ToolRegistry } from '../tools/registry';
import type { ToolDefinition } from '../tools/types';
import { LoopDetector } from './loopDetector';
import { validateStepResults } from './validator';
import { parseAgentError } from './errors';
import { compactMessages, extractTokenLimit } from './compaction';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSystemPrompt(config: AgentConfig, tools: ToolRegistry): string {
  const toolDefs = tools.getToolDefinitions();
  const toolDescriptions = toolDefs
    .map(t => {
      const params = t.parameters
        .map(p => `  - ${p.name} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`)
        .join('\n');
      return `### ${t.name}\n${t.description}\nParameters:\n${params || '  (none)'}`;
    })
    .join('\n\n');

  return `${config.systemPrompt}\n\n## Available Tools\n\n${toolDescriptions}`;
}

async function chatWithRecovery(
  llm: LLMProvider,
  messages: AgentMessage[],
  toolDefs: ToolDefinition[],
  temperature: number,
  config: AgentConfig,
): Promise<{ response: LLMResponse; messages: AgentMessage[] }> {
  try {
    const response = await llm.chat(messages, toolDefs, temperature);
    return { response, messages };
  } catch (err) {
    const agentError = parseAgentError(err);
    config.callbacks?.onError?.(agentError);

    if (agentError.code === 'token_limit') {
      config.callbacks?.onStatusChange?.('compacting');

      const limit = extractTokenLimit(agentError.raw) ?? 6000;
      const compacted = compactMessages(messages, limit);

      if (compacted) {
        config.callbacks?.onCompaction?.();
        const response = await llm.chat(compacted, toolDefs, temperature);
        return { response, messages: compacted };
      }
    }

    throw err;
  }
}

async function executeToolCalls(
  toolCalls: ToolCall[],
  tools: ToolRegistry,
  maxCalls: number,
): Promise<ToolResult[]> {
  const limited = toolCalls.slice(0, maxCalls);
  const results: ToolResult[] = [];

  for (const tc of limited) {
    const start = Date.now();
    try {
      const result = await tools.execute(tc.name, tc.arguments);
      results.push({
        toolCallId: tc.id,
        name: tc.name,
        result,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      results.push({
        toolCallId: tc.id,
        name: tc.name,
        result: null,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}

export async function runAgent(
  query: string,
  history: AgentMessage[],
  config: AgentConfig,
  llm: LLMProvider,
  tools: ToolRegistry,
): Promise<AgentRun> {
  const runId = generateId();
  const startTime = Date.now();
  const loopDetector = new LoopDetector();
  const steps: AgentStep[] = [];
  const toolDefs = tools.getToolDefinitions();

  let messages: AgentMessage[] = [
    { role: 'system', content: buildSystemPrompt(config, tools) },
    ...history,
    { role: 'user', content: query },
  ];

  const emitStatus = (status: AgentStatus) => {
    config.callbacks?.onStatusChange?.(status);
  };

  const emitStep = (step: AgentStep) => {
    config.callbacks?.onStepUpdate?.(step);
  };

  let status: AgentStatus = 'planning';
  emitStatus(status);

  for (let stepNum = 1; stepNum <= config.maxSteps; stepNum++) {
    // Call LLM (with automatic compaction recovery on token limit errors)
    const recovery = await chatWithRecovery(llm, messages, toolDefs, config.temperature, config);
    const llmResponse = recovery.response;
    messages = recovery.messages;

    // If LLM returns text only (no tool calls), we're done
    if (llmResponse.toolCalls.length === 0) {
      const step: AgentStep = {
        stepNumber: stepNum,
        status: 'complete',
        toolCalls: [],
        toolResults: [],
        validation: null,
        response: llmResponse.content,
      };
      steps.push(step);
      emitStep(step);
      emitStatus('complete');

      return {
        id: runId,
        query,
        steps,
        finalResponse: llmResponse.content,
        status: 'complete',
        totalDurationMs: Date.now() - startTime,
      };
    }

    // LLM wants to call tools
    status = 'executing_tools';
    emitStatus(status);

    const toolCalls: ToolCall[] = llmResponse.toolCalls;

    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: llmResponse.content || '',
      toolCalls,
    });

    // Execute tool calls
    const toolResults = await executeToolCalls(toolCalls, tools, config.maxToolCallsPerStep);

    // Add tool results as messages
    messages.push({
      role: 'tool',
      content: toolResults.map(tr => tr.error || JSON.stringify(tr.result)).join('\n'),
      toolResults,
    });

    // Validate
    status = 'validating';
    emitStatus(status);

    loopDetector.recordCalls(toolCalls);
    const validation = validateStepResults(toolResults, loopDetector);

    const step: AgentStep = {
      stepNumber: stepNum,
      status: 'executing_tools',
      toolCalls,
      toolResults,
      validation,
      response: llmResponse.content || null,
    };
    steps.push(step);
    emitStep(step);

    // If validation fails, inject refinement hint
    if (!validation.isValid) {
      const hint = `Note: ${validation.issues.join(' ')}`;
      messages.push({
        role: 'user',
        content: hint,
      });
    }

    status = 'planning';
    emitStatus(status);
  }

  // Max steps reached — ask LLM for best-effort summary
  status = 'max_steps_reached';
  emitStatus(status);

  messages.push({
    role: 'user',
    content: 'You have reached the maximum number of steps. Please provide your best answer based on the data gathered so far.',
  });

  const finalRecovery = await chatWithRecovery(llm, messages, [], config.temperature, config);
  const finalResponse = finalRecovery.response;
  messages = finalRecovery.messages;

  const finalStep: AgentStep = {
    stepNumber: steps.length + 1,
    status: 'max_steps_reached',
    toolCalls: [],
    toolResults: [],
    validation: null,
    response: finalResponse.content,
  };
  steps.push(finalStep);
  emitStep(finalStep);

  return {
    id: runId,
    query,
    steps,
    finalResponse: finalResponse.content,
    status: 'max_steps_reached',
    totalDurationMs: Date.now() - startTime,
  };
}
