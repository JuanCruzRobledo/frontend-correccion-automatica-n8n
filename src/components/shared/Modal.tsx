/**
 * Componente Modal reutilizable
 * Mantiene el estilo Tailwind oscuro del diseño original
 */
import { ReactNode, useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmLoading?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showFooter = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  confirmLoading = false,
}: ModalProps) => {
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Tamaños responsive: móvil (full) → tablet → desktop
  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl',        // Móvil: 384px → Tablet: 448px → Desktop: 512px → Grande: 672px
    md: 'max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl',       // Móvil: 448px → Tablet: 512px → Desktop: 672px → Grande: 768px (default)
    lg: 'max-w-lg sm:max-w-2xl md:max-w-4xl lg:max-w-5xl',      // Móvil: 512px → Tablet: 672px → Desktop: 896px → Grande: 1024px
    xl: 'max-w-xl sm:max-w-3xl md:max-w-5xl lg:max-w-6xl',      // Móvil: 576px → Tablet: 768px → Desktop: 1024px → Grande: 1152px
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-bg-elevated border border-border-primary/60
          rounded-xl sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]
          max-h-[90vh] sm:max-h-[85vh] overflow-y-auto
          motion-safe:animate-[slideUp_0.3s_ease-out]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-border-primary/60">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-disabled hover:text-text-primary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6">{children}</div>

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 border-t border-border-primary/60">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            {onConfirm && (
              <Button onClick={onConfirm} loading={confirmLoading}>
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
