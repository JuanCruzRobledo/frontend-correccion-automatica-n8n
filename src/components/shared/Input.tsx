/**
 * Componente Input reutilizable
 * Mantiene el estilo Tailwind oscuro del diseño original
 */
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputStyles = `
      w-full px-4 py-2.5
      bg-slate-950
      border ${error ? 'border-rose-500' : 'border-slate-800/60'}
      rounded-2xl
      text-slate-100
      placeholder-slate-500
      focus:outline-none
      focus:ring-2
      ${error ? 'focus:ring-rose-400/40 focus:border-rose-400/70' : 'focus:ring-sky-400/40 focus:border-sky-400/70'}
      disabled:opacity-40
      disabled:cursor-not-allowed
      transition-all duration-200
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}

        <input ref={ref} className={`${inputStyles} ${className}`} {...props} />

        {error && (
          <p className="mt-1.5 text-sm text-rose-400 flex items-center gap-1">
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
          <p className="mt-1.5 text-sm text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
