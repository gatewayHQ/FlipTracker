import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Pre-built confirm/cancel layout */
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  confirmLoading?: boolean;
}

export function Modal({
  open, onClose, title, description, children,
  confirmLabel, confirmVariant = 'danger', onConfirm, confirmLoading,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 z-40 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="bg-surface-700 rounded-3xl p-6 w-full max-w-sm border border-surface-400/20 shadow-2xl animate-[slideUp_0.2s_ease-out]"
        >
          <div className="flex items-start justify-between mb-2">
            <h2 id={titleId} className="text-lg font-bold text-white pr-4">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {description && (
            <p className="text-sm text-gray-400 mb-5">{description}</p>
          )}

          {children}

          {(confirmLabel || onConfirm) && (
            <div className="flex flex-col gap-2 mt-5">
              <Button
                variant={confirmVariant}
                fullWidth
                size="lg"
                loading={confirmLoading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
              <Button variant="secondary" fullWidth size="lg" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
