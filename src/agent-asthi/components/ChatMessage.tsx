import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ConversationMessage } from '../hooks/useResearchAgent';
import { ToolCallDisplay } from './ToolCallDisplay';

interface ChatMessageProps {
  message: ConversationMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showSteps, setShowSteps] = useState(false);
  const isUser = message.role === 'user';
  const hasSteps = message.agentRun && message.agentRun.steps.some(s => s.toolCalls.length > 0);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#0e639c] text-white'
              : 'bg-[#252526] border border-[#3c3c3c] text-[#d4d4d4]'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {hasSteps && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-1 text-xs text-[#8a8a8a] hover:text-[#cccccc] transition-colors"
            >
              {showSteps ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              View analysis steps ({message.agentRun!.steps.filter(s => s.toolCalls.length > 0).length} tool calls)
              <span className="text-[#6e6e6e] ml-1">
                {(message.agentRun!.totalDurationMs / 1000).toFixed(1)}s
              </span>
            </button>

            {showSteps && (
              <div className="mt-1.5">
                <ToolCallDisplay steps={message.agentRun!.steps} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
