import type { AgentMessage } from './types';

/** Conservative estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: AgentMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

/**
 * Extract the token limit from an error message.
 * Groq: "Limit 6000"
 * OpenAI: "maximum context length is 4097 tokens"
 */
export function extractTokenLimit(errorRaw: unknown): number | null {
  const msg = errorRaw instanceof Error ? errorRaw.message : String(errorRaw);

  const groqMatch = msg.match(/Limit\s+(\d+)/i);
  if (groqMatch) return parseInt(groqMatch[1], 10);

  const openaiMatch = msg.match(/maximum context length is (\d+)/i);
  if (openaiMatch) return parseInt(openaiMatch[1], 10);

  const genericMatch = msg.match(/(\d{3,6})\s*tokens/i);
  if (genericMatch) return parseInt(genericMatch[1], 10);

  return null;
}

/**
 * Compact conversation messages to fit within a token budget.
 * Applies progressively aggressive phases:
 *  1. Truncate tool results to 500 chars
 *  2. Truncate tool results to 200 chars
 *  3. Replace tool results with "[data omitted]"
 *  4. Drop all but last 2 user/assistant exchanges
 *  5. Drop all but last 1 exchange
 *
 * Returns null if even the system prompt alone exceeds the budget.
 */
export function compactMessages(
  messages: AgentMessage[],
  tokenBudget: number,
): AgentMessage[] | null {
  // Budget target: 80% of limit to leave room for response
  const target = Math.floor(tokenBudget * 0.8);

  // If system prompt alone exceeds budget, we can't help
  const systemMsg = messages[0]?.role === 'system' ? messages[0] : null;
  if (systemMsg && estimateTokens(systemMsg.content) > target) {
    return null;
  }

  let working = messages.map(m => ({ ...m }));

  // Phase 1: Truncate tool results to 500 chars
  if (estimateMessagesTokens(working) > target) {
    working = truncateToolResults(working, 500);
  }

  // Phase 2: Truncate tool results to 200 chars
  if (estimateMessagesTokens(working) > target) {
    working = truncateToolResults(working, 200);
  }

  // Phase 3: Replace tool results with "[data omitted]"
  if (estimateMessagesTokens(working) > target) {
    working = working.map(m =>
      m.role === 'tool' ? { ...m, content: '[data omitted]' } : m,
    );
  }

  // Phase 4: Keep system + last 2 user/assistant exchanges
  if (estimateMessagesTokens(working) > target) {
    working = keepLastExchanges(working, 2);
  }

  // Phase 5: Keep system + last 1 exchange
  if (estimateMessagesTokens(working) > target) {
    working = keepLastExchanges(working, 1);
  }

  // If still over budget after all phases, return null
  if (estimateMessagesTokens(working) > target) {
    return null;
  }

  return working;
}

function truncateToolResults(messages: AgentMessage[], maxLen: number): AgentMessage[] {
  return messages.map(m => {
    if (m.role === 'tool' && m.content.length > maxLen) {
      return { ...m, content: m.content.slice(0, maxLen) + '...' };
    }
    return m;
  });
}

function keepLastExchanges(messages: AgentMessage[], count: number): AgentMessage[] {
  const systemMsg = messages[0]?.role === 'system' ? messages[0] : null;
  const nonSystem = systemMsg ? messages.slice(1) : messages;

  // Find the last N user messages and keep everything from the first one onward
  const userIndices: number[] = [];
  for (let i = nonSystem.length - 1; i >= 0; i--) {
    if (nonSystem[i].role === 'user') {
      userIndices.unshift(i);
      if (userIndices.length >= count) break;
    }
  }

  if (userIndices.length === 0) return messages;

  const kept = nonSystem.slice(userIndices[0]);
  return systemMsg ? [systemMsg, ...kept] : kept;
}
