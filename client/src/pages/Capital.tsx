import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Wrench, Home, ArrowRight } from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { api, fmt, fmtFull } from '../lib/api';
import type { Project } from '../types';
import { STATUS_COLORS } from '../types';

interface CapitalSummary {
  totalCapital: number;
  deployed: number;
  available: number;
  deployedPercent: number;
  byProject: {
    id: string;
    name: string;
    address: string;
    status: string;
    invested: number;
    rehabSpent: number;
    totalDeployed: number;
    estProfit: number;
    roi: number;
  }[];
  byCategory: { label: string; amount: number; color: string }[];
}

export default function Capital() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects.list().then(data => {
      setProjects(data as Project[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeProjects = projects.filter(p => ['acquired', 'renovation', 'listed'].includes(p.status));

  const totalPurchase = projects.reduce((s, p) => s + p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs, 0);
  const totalRehab = projects.reduce((s, p) => s + p.labor_cost + p.materials_cost, 0);
  const totalHolding = projects.reduce((s, p) => s + p.holding_costs_monthly * 6, 0);
  const totalDeployed = totalPurchase + totalRehab + totalHolding;

  const totalEstSale = projects.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.estimated_sale_price, 0);
  const deployedPercent = totalEstSale > 0 ? Math.round((totalDeployed / totalEstSale) * 100) : 0;

  const byProject = activeProjects.map(p => {
    const invested = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs;
    const rehabSpent = p.labor_cost + p.materials_cost;
    const totalD = invested + rehabSpent + p.holding_costs_monthly * 6;
    const profit = p.estimated_sale_price - totalD;
    const roi = totalD > 0 ? Math.round((profit / totalD) * 1000) / 10 : 0;
    return {
      id: p.id,
      name: p.name || p.address,
      address: p.address,
      status: p.status,
      invested,
      rehabSpent,
      totalDeployed: totalD,
      estProfit: profit,
      roi,
    };
  });

  const byCategory = [
    { label: 'Purchase & Acquisition', amount: totalPurchase, color: '#f97316' },
    { label: 'Labor & Renovation', amount: totalRehab, color: '#3b82f6' },
    { label: 'Holding Costs', amount: totalHolding, color: '#8b5cf6' },
  ].filter(c => c.amount > 0);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Capital</h1>
        <p className="text-xs text-gray-500 mt-0.5">Across {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Capital Utilization Donut */}
        <div className="card flex flex-col items-center py-6">
          <p className="label mb-4 text-center">Capital Utilization</p>
          <DonutChart percent={deployedPercent} size={200} strokeWidth={20} />
          <p className="text-sm text-gray-400 text-center mt-4">
            {fmt(totalDeployed)} of total {fmt(totalEstSale)} estimated sale value currently committed.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <div className="text-brand mb-1 flex justify-center"><Home size={18} /></div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Acquisition</div>
            <div className="text-sm font-bold text-white">{fmt(totalPurchase)}</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-blue-400 mb-1 flex justify-center"><Wrench size={18} /></div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Renovation</div>
            <div className="text-sm font-bold text-white">{fmt(totalRehab)}</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-purple-400 mb-1 flex justify-center"><DollarSign size={18} /></div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Holding</div>
            <div className="text-sm font-bold text-white">{fmt(totalHolding)}</div>
          </div>
        </div>

        {/* Total Deployed */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-brand" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand">Total Capital Deployed</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{fmtFull(totalDeployed)}</div>
          <div className="text-sm text-gray-400">Purchase + Acquisition + Renovation + Holding</div>

          {byCategory.length > 0 && (
            <div className="mt-4 space-y-3">
              {byCategory.map(cat => (
                <div key={cat.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{cat.label}</span>
                    <span className="text-white font-semibold">{fmt(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-400 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalDeployed > 0 ? (cat.amount / totalDeployed) * 100 : 0}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Project Capital */}
        {byProject.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">By Project</h2>
            {byProject.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="card w-full text-left hover:border-brand/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <span className={`status-badge text-[10px] mt-1 ${STATUS_COLORS[p.status as keyof typeof STATUS_COLORS] ?? 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span>
                  </div>
                  <ArrowRight size={16} className="text-gray-500 mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500 mb-0.5">Deployed</div>
                    <div className="font-bold text-white">{fmt(p.totalDeployed)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Est. Profit</div>
                    <div className={`font-bold ${p.estProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.estProfit >= 0 ? '+' : ''}{fmt(p.estProfit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">ROI</div>
                    <div className={`font-bold ${p.roi >= 0 ? 'text-brand' : 'text-red-400'}`}>{p.roi}%</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <div className="card text-center py-12">
            <DollarSign size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No projects yet.</p>
            <button onClick={() => navigate('/projects/new')} className="mt-4 text-brand text-sm font-semibold">
              Add Your First Project →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
