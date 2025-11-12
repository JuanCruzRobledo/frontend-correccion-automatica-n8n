/**
 * Componente Input reutilizable
 * Mantiene el estilo Tailwind oscuro del diseño original
 */
import { InputHTMLAttributes, forwardRef } from 'react';
import { TooltipIcon } from './TooltipIcon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, tooltip, className = '', ...props }, ref) => {
    const inputStyles = `
      w-full px-4 py-2.5
      bg-bg-tertiary
      border ${error ? 'border-danger-1' : 'border-border-primary/60'}
      rounded-2xl
      text-text-primary
      placeholder-text-placeholder
      focus:outline-none
      focus:ring-2
      ${error ? 'focus:ring-danger-1/40 focus:border-danger-1/70' : 'focus:ring-ring/40 focus:border-ring/70'}
      disabled:opacity-40
      disabled:cursor-not-allowed
      transition-all duration-200
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-text-tertiary mb-2">
            <span>{label}</span>
            {tooltip && <TooltipIcon content={tooltip} />}
          </label>
        )}

        <input ref={ref} className={`${inputStyles} ${className}`} {...props} />

        {error && (
          <p className="mt-1.5 text-sm text-danger-1 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
