interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export function Skeleton({ className = '', height, width }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-500/60 ${className}`}
      style={{ height, width }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading"
      className="bg-surface-700 rounded-2xl p-4 border border-surface-400/20 space-y-3"
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? 'w-3/5' : 'w-4/5'}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, card = true }: { count?: number; card?: boolean }) {
  return (
    <div role="status" aria-label="Loading content" className="space-y-3">
      {Array.from({ length: count }).map((_, i) =>
        card ? (
          <SkeletonCard key={i} />
        ) : (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        )
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-700 rounded-2xl p-4 border border-surface-400/20"
    >
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
