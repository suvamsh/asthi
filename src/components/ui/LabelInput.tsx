import { useState, useRef, useEffect } from 'react';
import { Plus, Tag } from 'lucide-react';
import { LabelChip } from './LabelChip';
import type { Label } from '../../types';

interface LabelInputProps {
  labels: Label[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
  onCreateLabel: (name: string) => Promise<Label | null>;
  placeholder?: string;
}

export function LabelInput({
  labels,
  selectedLabelIds,
  onChange,
  onCreateLabel,
  placeholder = 'Add labels...',
}: LabelInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabels = labels.filter(l => selectedLabelIds.includes(l.id));
  const normalizedInput = inputValue.toLowerCase().trim();

  // Filter labels based on input, excluding already selected
  const filteredLabels = labels.filter(
    l => !selectedLabelIds.includes(l.id) && l.name.includes(normalizedInput)
  );

  // Check if input matches an existing label exactly
  const exactMatch = labels.find(l => l.name === normalizedInput);
  const canCreateNew = normalizedInput.length > 0 && !exactMatch;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLabel = (label: Label) => {
    if (!selectedLabelIds.includes(label.id)) {
      onChange([...selectedLabelIds, label.id]);
    }
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveLabel = (labelId: string) => {
    onChange(selectedLabelIds.filter(id => id !== labelId));
  };

  const handleCreateLabel = async () => {
    if (!canCreateNew || creating) return;

    setCreating(true);
    try {
      const newLabel = await onCreateLabel(normalizedInput);
      if (newLabel) {
        onChange([...selectedLabelIds, newLabel.id]);
        setInputValue('');
        setShowDropdown(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLabels.length > 0) {
        handleSelectLabel(filteredLabels[0]);
      } else if (canCreateNew) {
        handleCreateLabel();
      }
    } else if (e.key === 'Backspace' && inputValue === '' && selectedLabels.length > 0) {
      // Remove last label when backspace is pressed on empty input
      handleRemoveLabel(selectedLabels[selectedLabels.length - 1].id);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-[#cccccc] mb-1">
        <Tag className="w-3.5 h-3.5 inline mr-1" />
        Labels
      </label>

      <div
        className={`
          w-full min-h-[42px] px-3 py-2 bg-[#3c3c3c] border rounded-md
          flex flex-wrap gap-1.5 items-center cursor-text
          focus-within:ring-2 focus-within:ring-[#0e639c] focus-within:border-[#0e639c]
          border-[#3c3c3c]
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedLabels.map(label => (
          <LabelChip
            key={label.id}
            label={label}
            onRemove={() => handleRemoveLabel(label.id)}
          />
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedLabels.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-[#cccccc] placeholder-[#6e6e6e] text-sm"
        />
      </div>

      {showDropdown && (inputValue.length > 0 || filteredLabels.length > 0) && (
        <div className="relative">
          <div className="absolute z-10 w-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredLabels.map(label => (
              <button
                key={label.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-[#2a2d2e] flex items-center gap-2"
                onClick={() => handleSelectLabel(label)}
              >
                <LabelChip label={label} />
              </button>
            ))}

            {canCreateNew && (
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-[#2a2d2e] flex items-center gap-2 text-[#4fc1ff] border-t border-[#3c3c3c]"
                onClick={handleCreateLabel}
                disabled={creating}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">
                  {creating ? 'Creating...' : `Create "${normalizedInput}"`}
                </span>
              </button>
            )}

            {filteredLabels.length === 0 && !canCreateNew && inputValue.length > 0 && (
              <div className="px-3 py-2 text-sm text-[#8a8a8a]">
                No labels found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
