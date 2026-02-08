import type { AgentStatus, AgentStep } from '../../agent/core/types';

interface AgentThinkingProps {
  status: AgentStatus;
  currentStep: AgentStep | null;
  maxSteps: number;
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: '',
  planning: 'Planning...',
  executing_tools: 'Executing tools...',
  validating: 'Validating results...',
  compacting: 'Compacting context...',
  complete: 'Done',
  error: 'Error',
  max_steps_reached: 'Wrapping up...',
};

export function AgentThinking({ status, currentStep, maxSteps }: AgentThinkingProps) {
  if (status === 'idle' || status === 'complete') return null;

  const label = currentStep?.toolCalls?.[0]
    ? `Calling ${currentStep.toolCalls[0].name}...`
    : STATUS_LABELS[status];

  const stepNum = currentStep?.stepNumber || 1;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-[#252526] border border-[#3c3c3c] flex items-center justify-center flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#4fc1ff] animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#cccccc]">{label}</div>
        <div className="text-xs text-[#8a8a8a] mt-0.5">
          Step {stepNum} of {maxSteps}
        </div>
      </div>
    </div>
  );
}
