import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Project } from '../types';
import { STATUS_COLORS, HEALTH_COLORS } from '../types';
import { fmt } from '../lib/api';

interface Props {
  project: Project & { progress?: number };
}

function MetricCell({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${className || 'text-white'}`}>{value}</div>
    </div>
  );
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const progress = project.progress ?? 0;

  // Defensively coerce — Neon can return NUMERIC as strings even after server coercion
  const purchasePrice = Number(project.purchase_price) || 0;
  const legalFees = Number(project.legal_fees) || 0;
  const inspectionCost = Number(project.inspection_cost) || 0;
  const closingCosts = Number(project.closing_costs) || 0;
  const rehabBudget = Number(project.rehab_budget) || 0;
  const estimatedSale = Number(project.estimated_sale_price) || 0;
  const actualSale = Number(project.actual_sale_price) || 0;

  const salePrice = actualSale > 0 ? actualSale : estimatedSale;
  const totalCost = purchasePrice + legalFees + inspectionCost + closingCosts + rehabBudget;
  const profit = salePrice > 0 ? salePrice - totalCost : null;

  const ProfitIcon = profit === null ? Minus : profit >= 0 ? TrendingUp : TrendingDown;
  const profitColor = profit === null ? 'text-gray-600' : profit >= 0 ? 'text-green-400' : 'text-red-400';
  const profitLabel = profit === null ? '—' : `${profit >= 0 ? '+' : ''}${fmt(profit)}`;

  const statusLabel = project.status.charAt(0).toUpperCase() + project.status.slice(1);

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card w-full text-left hover:border-brand/40 transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      aria-label={`Open project: ${project.name || project.address}, ${project.city}, ${project.state}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-snug truncate">
            {project.name || project.address}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-gray-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-gray-400 truncate">{project.city}, {project.state}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.health && (
            <span
              className={`w-2 h-2 rounded-full ${HEALTH_COLORS[project.health]}`}
              role="img"
              aria-label={`Health: ${project.health.replace('_', ' ')}`}
            />
          )}
          <span className={`status-badge ${STATUS_COLORS[project.status]}`} aria-label={`Status: ${statusLabel}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricCell label="Purchase" value={purchasePrice > 0 ? fmt(purchasePrice) : '—'} />
        <MetricCell label="Est. Sale" value={salePrice > 0 ? fmt(salePrice) : '—'} />
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Est. Profit</div>
          <div className={`text-sm font-bold tabular-nums flex items-center gap-1 ${profitColor}`}>
            <ProfitIcon size={11} aria-hidden="true" />
            {profitLabel}
          </div>
        </div>
      </div>

      {/* Progress bar — only when project has renovation phases */}
      {(project.phase_count ?? 0) > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
            <span className="flex items-center gap-1">
              <TrendingUp size={9} aria-hidden="true" />
              Renovation Progress
            </span>
            <span aria-label={`${progress}% complete`}>{progress}%</span>
          </div>
          <div
            className="h-1.5 bg-surface-600 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Renovation progress"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 90
                  ? 'linear-gradient(90deg,#f97316,#ef4444)'
                  : progress >= 60
                  ? 'linear-gradient(90deg,#f59e0b,#f97316)'
                  : 'linear-gradient(90deg,#f97316,#fb923c)',
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
