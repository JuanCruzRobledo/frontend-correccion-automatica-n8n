/**
 * Componente Card reutilizable
 * Mantiene el estilo Tailwind oscuro del diseño original
 * Soporta hover effects con colores personalizados
 */
import { HTMLAttributes, ReactNode } from 'react';

type HoverColor = 'amber' | 'sky' | 'indigo' | 'purple' | 'emerald' | 'rose';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  hover?: boolean;
  hoverColor?: HoverColor;
  stepNumber?: string | number;
}

export const Card = ({
  children,
  title,
  hover = false,
  hoverColor = 'sky',
  stepNumber,
  className = '',
  ...props
}: CardProps) => {
  // Map colors to tailwind classes
  const colorConfig = {
    amber: {
      border: 'hover:border-accent-1/60',
      shadow: 'hover:shadow-hover-accent',
      gradient: 'from-accent-1/15',
      badge: 'bg-accent-1/20 text-accent-1 ring-accent-1/40',
    },
    sky: {
      border: 'hover:border-accent-1/60',
      shadow: 'hover:shadow-hover-accent',
      gradient: 'from-accent-1/10',
      badge: 'bg-accent-1/20 text-accent-1 ring-accent-1/40',
    },
    indigo: {
      border: 'hover:border-accent-2/60',
      shadow: 'hover:shadow-hover-accent',
      gradient: 'from-accent-2/15',
      badge: 'bg-accent-2/20 text-accent-2 ring-accent-2/40',
    },
    purple: {
      border: 'hover:border-accent-3/60',
      shadow: 'hover:shadow-hover-accent',
      gradient: 'from-accent-3/15',
      badge: 'bg-accent-3/20 text-accent-3 ring-accent-3/40',
    },
    emerald: {
      border: 'hover:border-accent-1/60',
      shadow: 'hover:shadow-hover-accent',
      gradient: 'from-accent-1/15',
      badge: 'bg-accent-1/20 text-accent-1 ring-accent-1/40',
    },
    rose: {
      border: 'hover:border-danger-1/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(var(--color-danger-1),0.25)]',
      gradient: 'from-danger-1/15',
      badge: 'bg-danger-1/20 text-danger-1 ring-danger-1/40',
    },
  };

  const colors = colorConfig[hoverColor];

  const baseStyles = `
    group relative overflow-hidden
    bg-bg-secondary/70
    border border-border-primary/60
    rounded-2xl sm:rounded-3xl
    p-5 sm:p-6 lg:p-8
    shadow-card
    transition duration-500
    ${hover ? `hover:-translate-y-1 ${colors.border} ${colors.shadow}` : ''}
  `;

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {/* Gradient overlay on hover */}
      {hover && (
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${colors.gradient} via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100`}
        />
      )}

      <div className="relative space-y-4 sm:space-y-5">
        {/* Title with optional step number */}
        {(title || stepNumber !== undefined) && (
          <div className="flex items-center gap-2 sm:gap-3">
            {stepNumber !== undefined && (
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm ring-1 ring-inset sm:h-9 sm:w-9 sm:rounded-2xl ${colors.badge}`}
              >
                {stepNumber}
              </span>
            )}
            {title && (
              <h2 className="text-lg font-semibold text-text-primary sm:text-xl">{title}</h2>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default Card;
