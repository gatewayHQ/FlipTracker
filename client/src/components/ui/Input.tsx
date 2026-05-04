import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  prefix?: string; // e.g. "$"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, prefix, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            >
              {leftIcon}
            </span>
          )}
          {prefix && (
            <span
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
            >
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(' ') || undefined
            }
            className={[
              'w-full bg-surface-600 border rounded-xl px-4 py-3 text-white text-sm',
              'placeholder-gray-500 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon || prefix ? 'pl-9' : '',
              rightIcon ? 'pr-10' : '',
              error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                : 'border-surface-400 focus:border-brand focus:ring-brand/20',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={helperId} className="mt-1.5 text-xs text-gray-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── MoneyInput convenience wrapper ───────────────────────────
interface MoneyInputProps extends Omit<InputProps, 'prefix' | 'type'> {
  label: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ label, ...props }, ref) => (
    <Input
      ref={ref}
      label={label}
      type="number"
      prefix="$"
      step="100"
      min="0"
      inputMode="decimal"
      {...props}
    />
  )
);

MoneyInput.displayName = 'MoneyInput';
