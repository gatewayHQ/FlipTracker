import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

// ─── Context ─────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType>({
  toast: {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
  },
});

export const useToast = () => useContext(ToastContext);

// ─── Styles ───────────────────────────────────────────────────
const TOAST_STYLES: Record<ToastVariant, { bg: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-surface-700 border-green-500/40',
    icon: <CheckCircle size={18} className="text-green-400 flex-shrink-0" aria-hidden />,
  },
  error: {
    bg: 'bg-surface-700 border-red-500/40',
    icon: <XCircle size={18} className="text-red-400 flex-shrink-0" aria-hidden />,
  },
  warning: {
    bg: 'bg-surface-700 border-amber-500/40',
    icon: <AlertCircle size={18} className="text-amber-400 flex-shrink-0" aria-hidden />,
  },
  info: {
    bg: 'bg-surface-700 border-blue-500/40',
    icon: <Info size={18} className="text-blue-400 flex-shrink-0" aria-hidden />,
  },
};

// ─── Individual Toast ─────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { bg, icon } = TOAST_STYLES[toast.variant];
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-2xl border shadow-xl shadow-black/40 ${bg} animate-[slideUp_0.2s_ease-out]`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-gray-400 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = ++counter.current;
      setToasts(prev => [...prev.slice(-3), { id, variant, title, description }]);
      setTimeout(() => dismiss(id), variant === 'error' ? 6000 : 4000);
    },
    [dismiss]
  );

  const toast = {
    success: (t: string, d?: string) => add('success', t, d),
    error: (t: string, d?: string) => add('error', t, d),
    warning: (t: string, d?: string) => add('warning', t, d),
    info: (t: string, d?: string) => add('info', t, d),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal — sits above everything else */}
      <div
        aria-label="Notifications"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
