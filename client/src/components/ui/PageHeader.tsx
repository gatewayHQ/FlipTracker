import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | string;  // true = navigate(-1), string = navigate to path
  action?: ReactNode;
  center?: boolean;
}

export function PageHeader({ title, subtitle, back, action, center = false }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };

  return (
    <header className="flex items-center gap-3 px-5 pt-12 pb-4">
      {back && (
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex-shrink-0 text-brand -ml-1 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronLeft size={28} aria-hidden />
        </button>
      )}

      <div className={`flex-1 min-w-0 ${center ? 'text-center' : ''}`}>
        <h1 className="text-lg font-bold text-white truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
