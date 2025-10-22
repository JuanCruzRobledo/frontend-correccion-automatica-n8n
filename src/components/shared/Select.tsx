/**
 * Componente Select reutilizable
 * Mantiene el estilo Tailwind oscuro del diseño original
 */
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder = 'Selecciona una opción',
      className = '',
      ...props
    },
    ref
  ) => {
    const selectStyles = `
      w-full px-4 py-2.5
      bg-bg-tertiary
      border ${error ? 'border-danger-1' : 'border-border-primary/60'}
      rounded-2xl
      text-text-primary
      focus:outline-none
      focus:ring-2
      ${error ? 'focus:ring-danger-1/40 focus:border-danger-1/70' : 'focus:ring-ring/40 focus:border-ring/70'}
      disabled:opacity-40
      disabled:cursor-not-allowed
      transition-all duration-200
      cursor-pointer
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-tertiary mb-2">
            {label}
          </label>
        )}

        <select ref={ref} className={`${selectStyles} ${className}`} {...props}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1.5 text-sm text-danger-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

Select.displayName = 'Select';

export default Select;
