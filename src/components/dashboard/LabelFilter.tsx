import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { LabelChip } from '../ui/LabelChip';
import type { Label } from '../../types';

interface LabelFilterProps {
  labels: Label[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
}

export function LabelFilter({ labels, selectedLabelIds, onChange }: LabelFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabels = labels.filter(l => selectedLabelIds.includes(l.id));
  const hasSelection = selectedLabelIds.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onChange(selectedLabelIds.filter(id => id !== labelId));
    } else {
      onChange([...selectedLabelIds, labelId]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
          transition-colors border
          ${hasSelection
            ? 'bg-[#0e639c]/20 border-[#0e639c] text-[#4fc1ff]'
            : 'bg-[#3c3c3c] border-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a]'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span>
          {hasSelection ? `${selectedLabelIds.length} label${selectedLabelIds.length > 1 ? 's' : ''}` : 'Filter'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-64 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-lg">
          <div className="p-3 border-b border-[#3c3c3c] flex items-center justify-between">
            <span className="text-sm font-medium text-[#e0e0e0]">Filter by label</span>
            {hasSelection && (
              <button
                onClick={clearAll}
                className="text-xs text-[#8a8a8a] hover:text-[#e0e0e0] flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {labels.map(label => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`
                  w-full px-2 py-1.5 rounded flex items-center gap-2 text-left
                  ${selectedLabelIds.includes(label.id)
                    ? 'bg-[#0e639c]/20'
                    : 'hover:bg-[#2a2d2e]'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedLabelIds.includes(label.id)}
                  onChange={() => {}}
                  className="rounded border-[#3c3c3c] bg-[#3c3c3c] text-[#0e639c] focus:ring-[#0e639c]"
                />
                <LabelChip label={label} />
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSelection && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedLabels.map(label => (
            <LabelChip
              key={label.id}
              label={label}
              onRemove={() => toggleLabel(label.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
