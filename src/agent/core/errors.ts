export type AgentErrorCode =
  | 'token_limit'
  | 'rate_limit'
  | 'auth_error'
  | 'network_error'
  | 'server_error'
  | 'unknown';

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  retryAfterMs?: number;
  raw: unknown;
}

export function parseAgentError(err: unknown): AgentError {
  const raw = err;
  const msg = err instanceof Error ? err.message : String(err);

  // Network errors (fetch failures)
  if (err instanceof TypeError || /failed to fetch|network|econnrefused|dns/i.test(msg)) {
    return {
      code: 'network_error',
      message: "Can't reach the LLM provider. Check your connection.",
      raw,
    };
  }

  // Parse HTTP status from "API error (NNN): ..." format used by both providers
  const statusMatch = msg.match(/API error \((\d+)\)/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

  // Auth errors
  if (status === 401 || status === 403) {
    return {
      code: 'auth_error',
      message: 'API key is invalid. Check your settings.',
      raw,
    };
  }

  // Rate limit
  if (status === 429 || /rate.?limit/i.test(msg)) {
    let retryAfterMs: number | undefined;

    // Groq format: "try again in Xs" or "Please try again in 1m20.556s"
    const retryMatch = msg.match(/try again in (\d+(?:\.\d+)?)s/i);
    if (retryMatch) {
      retryAfterMs = Math.ceil(parseFloat(retryMatch[1]) * 1000);
    }
    // Format with minutes: "1m20.556s"
    const retryMinMatch = msg.match(/try again in (\d+)m(\d+(?:\.\d+)?)s/i);
    if (retryMinMatch) {
      retryAfterMs = Math.ceil(
        (parseInt(retryMinMatch[1], 10) * 60 + parseFloat(retryMinMatch[2])) * 1000,
      );
    }

    // Fallback: 60s default cooldown
    if (!retryAfterMs) {
      retryAfterMs = 60_000;
    }

    return {
      code: 'rate_limit',
      message: 'Rate limit reached. Waiting for cooldown...',
      retryAfterMs,
      raw,
    };
  }

  // Token / context length limit
  if (
    status === 413 ||
    /request too large|context_length_exceeded|maximum context length|token/i.test(msg)
  ) {
    return {
      code: 'token_limit',
      message: 'Conversation is too long for this model. Try clearing history.',
      raw,
    };
  }

  // Server errors
  if (status >= 500) {
    return {
      code: 'server_error',
      message: 'The LLM provider is having issues. Try again shortly.',
      raw,
    };
  }

  return {
    code: 'unknown',
    message: 'Something went wrong. Please try again.',
    raw,
  };
}
