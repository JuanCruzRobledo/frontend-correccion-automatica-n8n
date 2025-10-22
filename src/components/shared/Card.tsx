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
      border: 'hover:border-amber-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(251,191,36,0.25)]',
      gradient: 'from-amber-400/15',
      badge: 'bg-amber-500/20 text-amber-300 ring-amber-400/40',
    },
    sky: {
      border: 'hover:border-sky-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(56,189,248,0.25)]',
      gradient: 'from-sky-500/10',
      badge: 'bg-sky-500/20 text-sky-300 ring-sky-400/40',
    },
    indigo: {
      border: 'hover:border-indigo-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(99,102,241,0.25)]',
      gradient: 'from-indigo-500/15',
      badge: 'bg-indigo-500/20 text-indigo-300 ring-indigo-400/40',
    },
    purple: {
      border: 'hover:border-purple-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(168,85,247,0.25)]',
      gradient: 'from-purple-500/15',
      badge: 'bg-purple-500/20 text-purple-300 ring-purple-400/40',
    },
    emerald: {
      border: 'hover:border-emerald-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(16,185,129,0.25)]',
      gradient: 'from-emerald-500/15',
      badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/40',
    },
    rose: {
      border: 'hover:border-rose-400/60',
      shadow: 'hover:shadow-[0_35px_90px_rgba(244,63,94,0.25)]',
      gradient: 'from-rose-500/15',
      badge: 'bg-rose-500/20 text-rose-300 ring-rose-400/40',
    },
  };

  const colors = colorConfig[hoverColor];

  const baseStyles = `
    group relative overflow-hidden
    bg-slate-900/70
    border border-slate-800/60
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
              <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">{title}</h2>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default Card;
