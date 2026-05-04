import type { ProjectStatus } from '../../types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400 border border-green-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  error:   'bg-red-500/15 text-red-400 border border-red-500/20',
  info:    'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  brand:   'bg-brand/15 text-brand border border-brand/20',
  default: 'bg-surface-400/60 text-gray-400 border border-surface-300/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${BADGE_VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  acquired:   'info',
  renovation: 'brand',
  listed:     'warning',
  sold:       'success',
  cancelled:  'error',
};

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {status}
    </Badge>
  );
}
