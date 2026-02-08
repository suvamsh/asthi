import { useState, useCallback, useRef, useMemo } from 'react';
import type { AgentMessage, AgentRun, AgentStatus, AgentStep } from '../../agent/core/types';
import { DEFAULT_AGENT_CONFIG } from '../../agent/core/types';
import { runAgent } from '../../agent/core/agentLoop';
import { createLLMProvider } from '../../agent/llm/providerFactory';
import type { LLMProviderConfig } from '../../agent/llm/types';
import { parseAgentError } from '../../agent/core/errors';
import type { AgentError } from '../../agent/core/errors';
import { createAsthiToolRegistry } from '../tools';
import type { ToolContext } from '../types';
import type { ToastData } from '../components/Toast';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentRun?: AgentRun;
}

export function useResearchAgent(
  toolContext: ToolContext,
  llmConfig: LLMProviderConfig,
) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<AgentStatus>('idle');
  const [currentStep, setCurrentStep] = useState<AgentStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const abortRef = useRef(false);
  const lastErrorRef = useRef<AgentError | null>(null);

  const toolRegistry = useMemo(
    () => createAsthiToolRegistry(toolContext),
    [toolContext]
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const ask = useCallback(async (question: string) => {
    if (isRunning) return;

    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsRunning(true);
    setError(null);
    setCurrentStatus('planning');
    setCurrentStep(null);
    abortRef.current = false;
    lastErrorRef.current = null;

    try {
      const llm = createLLMProvider(llmConfig);

      // Build conversation history for context
      const history: AgentMessage[] = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const config = {
        ...DEFAULT_AGENT_CONFIG,
        callbacks: {
          onStatusChange: (status: AgentStatus) => {
            if (!abortRef.current) {
              setCurrentStatus(status);
            }
          },
          onStepUpdate: (step: AgentStep) => {
            if (!abortRef.current) {
              setCurrentStep(step);
            }
          },
          onError: (agentError: AgentError) => {
            lastErrorRef.current = agentError;
          },
          onCompaction: () => {
            if (!abortRef.current) {
              setToast({ message: 'Context compacted to fit model limits.', type: 'info' });
            }
          },
        },
      };

      const result = await runAgent(
        question,
        history,
        config,
        llm,
        toolRegistry,
      );

      if (!abortRef.current) {
        const assistantMsg: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.finalResponse || 'I was unable to generate a response.',
          timestamp: Date.now(),
          agentRun: result,
        };

        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      if (!abortRef.current) {
        const agentError = lastErrorRef.current ?? parseAgentError(err);

        switch (agentError.code) {
          case 'rate_limit': {
            const retryMs = agentError.retryAfterMs ?? 60_000;
            setCooldownUntil(Date.now() + retryMs);
            setToast({ message: agentError.message, type: 'warning' });
            // Remove the user message that triggered this — don't clutter chat
            setMessages(prev => prev.slice(0, -1));
            break;
          }
          case 'token_limit': {
            const errorMsg: ConversationMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'Conversation is too long for this model. Try clearing history.',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            break;
          }
          case 'auth_error': {
            setToast({ message: agentError.message, type: 'error' });
            const errorMsg: ConversationMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'API key is invalid. Check your settings.',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            break;
          }
          case 'network_error': {
            setToast({ message: agentError.message, type: 'error' });
            const errorMsg: ConversationMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: "Can't reach the LLM provider. Check your connection.",
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            break;
          }
          case 'server_error': {
            const errorMsg: ConversationMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'The LLM provider is having issues. Try again shortly.',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            break;
          }
          default: {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            const errorMsg: ConversationMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `Something went wrong. Please try again.`,
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
          }
        }
      }
    } finally {
      if (!abortRef.current) {
        setIsRunning(false);
        setCurrentStatus('idle');
        setCurrentStep(null);
      }
    }
  }, [isRunning, messages, llmConfig, toolRegistry]);

  const clearHistory = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setIsRunning(false);
    setCurrentStatus('idle');
    setCurrentStep(null);
    setError(null);
    setCooldownUntil(null);
    setToast(null);
  }, []);

  return {
    messages,
    isRunning,
    currentStatus,
    currentStep,
    ask,
    clearHistory,
    error,
    cooldownUntil,
    toast,
    dismissToast,
  };
}
