import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helpText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#cccccc] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 bg-[#3c3c3c] border rounded-md
            text-[#cccccc] placeholder-[#6e6e6e]
            focus:outline-none focus:ring-2 focus:ring-[#0e639c] focus:border-[#0e639c]
            disabled:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:text-[#6e6e6e]
            ${error ? 'border-[#f14c4c]' : 'border-[#3c3c3c]'}
            ${className}
          `}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1 text-sm text-[#8a8a8a]">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-[#f14c4c]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
