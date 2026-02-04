import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[#cccccc] mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-3 py-2 bg-[#3c3c3c] border rounded-md
            text-[#cccccc]
            focus:outline-none focus:ring-2 focus:ring-[#0e639c] focus:border-[#0e639c]
            disabled:bg-[#2d2d2d] disabled:cursor-not-allowed
            ${error ? 'border-[#f14c4c]' : 'border-[#3c3c3c]'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#3c3c3c]">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-[#f14c4c]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
