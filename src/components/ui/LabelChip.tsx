import { X } from 'lucide-react';
import type { Label } from '../../types';

interface LabelChipProps {
  label: Label;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

function getColorForLabel(label: Label): string {
  if (label.color) return label.color;
  // Generate consistent color based on label name
  let hash = 0;
  for (let i = 0; i < label.name.length; i++) {
    hash = label.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
}

export function LabelChip({ label, onRemove, size = 'sm' }: LabelChipProps) {
  const color = getColorForLabel(label);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-white/20 rounded-full p-0.5 -mr-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
