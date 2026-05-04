interface ProgressBarProps {
  value: number;       // 0–100
  label?: string;
  showPercent?: boolean;
  variant?: 'brand' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

const TRACK_HEIGHT = { sm: 'h-1.5', md: 'h-2' };

export function ProgressBar({
  value,
  label,
  showPercent = true,
  variant,
  size = 'sm',
}: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100);

  // Auto-variant based on value if not overridden
  const resolvedVariant = variant ?? (pct >= 90 ? 'danger' : pct >= 100 ? 'success' : 'brand');

  const fill =
    resolvedVariant === 'danger'
      ? 'linear-gradient(90deg,#f97316,#ef4444)'
      : resolvedVariant === 'success'
      ? 'linear-gradient(90deg,#22c55e,#16a34a)'
      : 'linear-gradient(90deg,#f97316,#fb923c)';

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs mb-1.5">
          {label && <span className="text-gray-400 uppercase tracking-wider font-semibold">{label}</span>}
          {showPercent && (
            <span className={`font-bold ${resolvedVariant === 'danger' ? 'text-red-400' : 'text-white'}`}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className={`w-full ${TRACK_HEIGHT[size]} bg-surface-400 rounded-full overflow-hidden`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
