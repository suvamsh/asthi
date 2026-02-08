import { useState, useRef, useEffect, useMemo } from 'react';
import { Settings, Trash2, Send, AlertCircle } from 'lucide-react';
import type { AssetType, AssetWithValue } from '../../types';
import { Button } from '../../components/ui/Button';
import { useNews } from '../../hooks/useNews';
import { useStrategy } from '../../hooks/useStrategy';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { useResearchAgent } from '../hooks/useResearchAgent';
import type { ToolContext } from '../types';
import { generateSuggestedQuestions } from '../suggestedQuestions';
import { ChatMessage } from './ChatMessage';
import { AgentThinking } from './AgentThinking';
import { SuggestedQuestions } from './SuggestedQuestions';
import { AgentConfigModal } from './AgentConfigModal';
import { Toast } from './Toast';

interface ResearchPageProps {
  assetsWithValues: AssetWithValue[];
  breakdown: Record<AssetType, number>;
  totalNetWorth: number;
  userId: string;
  stockPrices: Record<string, number>;
  goldPrice: number | null;
  loading?: boolean;
}

export function ResearchPage({
  assetsWithValues,
  breakdown,
  totalNetWorth,
  userId,
  stockPrices,
  goldPrice,
  loading,
}: ResearchPageProps) {
  const [input, setInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { portfolioNews, searchNews, searchResults } = useNews(assetsWithValues);
  const { strategyData } = useStrategy(userId);
  const { config, isConfigured, saveConfig } = useAgentConfig();

  const toolContext: ToolContext = useMemo(() => ({
    assetsWithValues,
    breakdown,
    totalNetWorth,
    portfolioNews,
    searchNewsFn: searchNews,
    searchResults,
    strategyData,
    stockPrices,
    goldPrice,
  }), [assetsWithValues, breakdown, totalNetWorth, portfolioNews, searchNews, searchResults, strategyData, stockPrices, goldPrice]);

  const {
    messages,
    isRunning,
    currentStatus,
    currentStep,
    ask,
    clearHistory,
    cooldownUntil,
    toast,
    dismissToast,
  } = useResearchAgent(toolContext, config);

  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const isCoolingDown = cooldownRemaining > 0;

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(assetsWithValues, breakdown, totalNetWorth, strategyData),
    [assetsWithValues, breakdown, totalNetWorth, strategyData]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;
    setInput('');
    ask(trimmed);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isRunning) return;
    ask(question);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#4fc1ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3c3c3c]">
        <h1 className="text-xl font-bold text-[#e0e0e0]">Research</h1>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory} title="Clear history">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(true)}
            title="LLM settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
        {messages.length === 0 && !isRunning ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#e0e0e0] mb-1">
                Ask anything about your portfolio
              </h2>
              <p className="text-sm text-[#8a8a8a]">
                The research agent will analyze your holdings, news, strategy, and market data to answer your questions.
              </p>
              {!isConfigured && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[#cca700]">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Configure an LLM provider to get started.{' '}
                    <button
                      onClick={() => setShowConfig(true)}
                      className="text-[#4fc1ff] hover:underline"
                    >
                      Open settings
                    </button>
                  </span>
                </div>
              )}
            </div>
            <div className="w-full max-w-2xl">
              <SuggestedQuestions
                questions={suggestedQuestions}
                onSelect={handleSuggestedQuestion}
                disabled={!isConfigured || isRunning}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isRunning && (
              <AgentThinking
                status={currentStatus}
                currentStep={currentStep}
                maxSteps={10}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested questions strip (when has messages) */}
      {messages.length > 0 && !isRunning && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestedQuestions.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-[#252526] border border-[#3c3c3c] text-[#8a8a8a] hover:text-[#cccccc] hover:border-[#4fc1ff] transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-[#3c3c3c]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isCoolingDown ? `Rate limited — wait ${cooldownRemaining}s...` : isConfigured ? 'Ask about your portfolio...' : 'Configure LLM provider first...'}
            disabled={!isConfigured || isRunning || isCoolingDown}
            className="flex-1 px-4 py-2.5 bg-[#3c3c3c] border border-[#3c3c3c] rounded-lg text-[#cccccc] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#0e639c] focus:border-[#0e639c] disabled:bg-[#2d2d2d] disabled:cursor-not-allowed text-sm"
          />
          <Button
            type="submit"
            disabled={!isConfigured || isRunning || isCoolingDown || !input.trim()}
            className="px-3"
          >
            {isCoolingDown ? (
              <span className="text-xs font-mono">{cooldownRemaining}s</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Config modal */}
      <AgentConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config}
        onSave={saveConfig}
      />
    </div>
  );
}
