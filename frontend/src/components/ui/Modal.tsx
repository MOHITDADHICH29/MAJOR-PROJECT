import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'md',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft mint / sage translucent scrim */}
      <div
        className="fixed inset-0 bg-forest/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered white modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white border border-border rounded-panel shadow-modal p-6 sm:p-8 z-10 animate-fade-in-up`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-forest p-1 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || subtitle) && (
          <div className="mb-6 space-y-1 pr-6">
            {title && (
              <h3 className="text-2xl sm:text-3xl font-serif text-forest font-semibold">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted font-sans">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
