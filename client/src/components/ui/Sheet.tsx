import {
  useEffect, useRef, useCallback, type ReactNode,
} from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max height as a Tailwind class, default 90vh */
  maxHeight?: string;
}

/**
 * Mobile-first bottom sheet with:
 * - Focus trap
 * - Escape key dismiss
 * - Body scroll lock
 * - ARIA dialog role
 * - Backdrop click dismiss
 */
export function Sheet({ open, onClose, title, children, maxHeight = 'max-h-[90vh]' }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `sheet-title-${Math.random().toString(36).slice(2)}`;

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Move focus into panel
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 z-40 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-surface-700 rounded-t-3xl ${maxHeight} flex flex-col animate-[slideUp_0.25s_ease-out]`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-surface-400" aria-hidden />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-400/20 flex-shrink-0">
            <h2 id={titleId} className="text-base font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </>
  );
}
