import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, AlertCircle } from 'lucide-react';
import type { AgentStep } from '../../agent/core/types';

interface ToolCallDisplayProps {
  steps: AgentStep[];
}

export function ToolCallDisplay({ steps }: ToolCallDisplayProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  const toolSteps = steps.filter(s => s.toolCalls.length > 0);
  if (toolSteps.length === 0) return null;

  const toggleStep = (stepNum: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNum)) next.delete(stepNum);
      else next.add(stepNum);
      return next;
    });
  };

  const toggleCall = (id: string) => {
    setExpandedCalls(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {toolSteps.map(step => (
        <div key={step.stepNumber} className="border border-[#3c3c3c] rounded-md overflow-hidden">
          <button
            onClick={() => toggleStep(step.stepNumber)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
          >
            {expandedSteps.has(step.stepNumber) ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-[#8a8a8a]">Step {step.stepNumber}</span>
            <span className="text-[#cccccc]">
              {step.toolCalls.map(tc => tc.name).join(', ')}
            </span>
          </button>

          {expandedSteps.has(step.stepNumber) && (
            <div className="border-t border-[#3c3c3c] px-3 py-2 space-y-2">
              {step.toolCalls.map((tc, i) => {
                const result = step.toolResults[i];
                const callId = `${step.stepNumber}-${tc.id}`;
                const isExpanded = expandedCalls.has(callId);
                const hasError = result?.error;

                return (
                  <div key={tc.id} className="rounded border border-[#3c3c3c]">
                    <button
                      onClick={() => toggleCall(callId)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-[#2a2d2e] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 flex-shrink-0 text-[#8a8a8a]" />
                      ) : (
                        <ChevronRight className="w-3 h-3 flex-shrink-0 text-[#8a8a8a]" />
                      )}
                      {hasError ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#f14c4c] flex-shrink-0" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5 text-[#4ec9b0] flex-shrink-0" />
                      )}
                      <span className="font-mono text-[#4ec9b0]">{tc.name}</span>
                      {result && (
                        <span className="text-[#6e6e6e] ml-auto">
                          {result.durationMs}ms
                        </span>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#3c3c3c] px-2 py-1.5 space-y-1.5">
                        {Object.keys(tc.arguments).length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#6e6e6e] mb-0.5">Input</div>
                            <pre className="text-xs text-[#cccccc] bg-[#1e1e1e] rounded p-1.5 overflow-x-auto max-h-32 overflow-y-auto">
                              {JSON.stringify(tc.arguments, null, 2)}
                            </pre>
                          </div>
                        )}
                        {result && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#6e6e6e] mb-0.5">
                              {hasError ? 'Error' : 'Output'}
                            </div>
                            <pre className={`text-xs rounded p-1.5 overflow-x-auto max-h-48 overflow-y-auto ${
                              hasError
                                ? 'text-[#f14c4c] bg-[#2d1515]'
                                : 'text-[#cccccc] bg-[#1e1e1e]'
                            }`}>
                              {hasError
                                ? result.error
                                : JSON.stringify(result.result, null, 2)
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {step.validation && !step.validation.isValid && (
                <div className="text-xs text-[#cca700] bg-[#2d2a15] rounded px-2 py-1.5">
                  {step.validation.issues.join(' ')}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
