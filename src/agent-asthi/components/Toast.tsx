import { useEffect } from 'react';
import { Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ToastData {
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface ToastProps extends ToastData {
  onDismiss: () => void;
  autoDismissMs?: number;
}

const TOAST_STYLES = {
  info: {
    bg: 'bg-[#063b49]',
    border: 'border-[#4fc1ff]',
    text: 'text-[#4fc1ff]',
    Icon: Info,
  },
  warning: {
    bg: 'bg-[#3d3214]',
    border: 'border-[#cca700]',
    text: 'text-[#cca700]',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-[#3d1417]',
    border: 'border-[#f14c4c]',
    text: 'text-[#f14c4c]',
    Icon: AlertCircle,
  },
};

export function Toast({ message, type, onDismiss, autoDismissMs = 8000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  const style = TOAST_STYLES[type];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md border ${style.bg} ${style.border} text-sm`}
    >
      <style.Icon className={`w-4 h-4 flex-shrink-0 ${style.text}`} />
      <span className="text-[#cccccc] flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="text-[#8a8a8a] hover:text-[#cccccc] flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
