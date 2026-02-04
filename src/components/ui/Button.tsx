import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#0e639c] text-white hover:bg-[#1177bb] focus:ring-[#0e639c]',
      secondary: 'bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a] focus:ring-[#3c3c3c]',
      outline: 'border border-[#3c3c3c] bg-transparent text-[#cccccc] hover:bg-[#2a2d2e] focus:ring-[#3c3c3c]',
      ghost: 'text-[#cccccc] hover:bg-[#2a2d2e] focus:ring-[#3c3c3c]',
      danger: 'bg-[#f14c4c] text-white hover:bg-[#d73a3a] focus:ring-[#f14c4c]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
