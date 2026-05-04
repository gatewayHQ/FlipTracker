import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-600 flex items-center justify-center mb-4 text-gray-500">
        {icon}
      </div>
      <p className="text-white font-semibold text-base mb-1">{title}</p>
      {description && (
        <p className="text-gray-400 text-sm max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
