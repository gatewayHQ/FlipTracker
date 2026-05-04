import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';
import type { Project } from '../types';
import { STATUS_COLORS } from '../types';
import { fmt } from '../lib/api';

interface Props {
  project: Project & { progress?: number };
}

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const progress = project.progress ?? 0;
  const salePrice = project.actual_sale_price > 0 ? project.actual_sale_price : project.estimated_sale_price;
  const totalCost = project.purchase_price + project.legal_fees + project.inspection_cost + project.closing_costs
    + project.rehab_budget;
  const profit = salePrice - totalCost;

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card w-full text-left hover:border-brand/40 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base truncate">{project.name || project.address}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={11} className="text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{project.city}, {project.state}</span>
          </div>
        </div>
        <span className={`status-badge ml-2 flex-shrink-0 ${STATUS_COLORS[project.status]}`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Purchase</div>
          <div className="text-sm font-bold text-white">{fmt(project.purchase_price)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Est. Sale</div>
          <div className="text-sm font-bold text-white">{fmt(project.estimated_sale_price)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Est. Profit</div>
          <div className={`text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}{fmt(profit)}
          </div>
        </div>
      </div>

      {project.phase_count !== undefined && project.phase_count > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp size={10} /> Renovation Progress
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-400 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: progress >= 80 ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#f97316,#fb923c)',
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
