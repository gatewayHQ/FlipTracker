import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Award, Clock, DollarSign } from 'lucide-react';
import { api, fmt } from '../lib/api';
import type { Project } from '../types';
import { STATUS_COLORS } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-600 border border-surface-400 rounded-xl px-3 py-2">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects.list().then(data => {
      setProjects(data as Project[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = projects.filter(p => p.status !== 'cancelled');

  const chartData = active.map(p => {
    const totalCost = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs + p.rehab_budget + p.holding_costs_monthly * 6;
    const salePrice = p.actual_sale_price > 0 ? p.actual_sale_price : p.estimated_sale_price;
    const profit = salePrice - totalCost;
    const roi = totalCost > 0 ? Math.round((profit / totalCost) * 100 * 10) / 10 : 0;
    return {
      name: (p.name || p.address).slice(0, 14),
      Investment: Math.round(totalCost),
      'Est. Sale': Math.round(salePrice),
      profit,
      roi,
    };
  });

  const totalProfit = chartData.reduce((s, d) => s + d.profit, 0);
  const avgRoi = chartData.length > 0 ? (chartData.reduce((s, d) => s + d.roi, 0) / chartData.length).toFixed(1) : '0';
  const bestProject = chartData.sort((a, b) => b.profit - a.profit)[0];

  const soldProjects = projects.filter(p => p.status === 'sold');
  const avgDays = soldProjects.length > 0
    ? Math.round(soldProjects.reduce((s, p) => {
        if (!p.acquisition_date || !p.sold_date) return s;
        return s + (new Date(p.sold_date).getTime() - new Date(p.acquisition_date).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / soldProjects.length)
    : null;

  const statusBreakdown = ['acquired', 'renovation', 'listed', 'sold', 'cancelled'].map(s => ({
    status: s,
    count: projects.filter(p => p.status === s).length,
  })).filter(s => s.count > 0);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Portfolio performance overview</p>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <TrendingUp size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Add projects to see analytics.</p>
            <button onClick={() => navigate('/projects/new')} className="mt-4 text-brand text-sm font-semibold">
              Add First Project →
            </button>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-green-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Profit</span>
                </div>
                <div className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
                </div>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={14} className="text-brand" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Avg ROI</span>
                </div>
                <div className="text-xl font-bold text-brand">{avgRoi}%</div>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-purple-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Avg Flip Days</span>
                </div>
                <div className="text-xl font-bold text-white">{avgDays !== null ? avgDays : '—'}</div>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Projects</span>
                </div>
                <div className="text-xl font-bold text-white">{projects.length}</div>
              </div>
            </div>

            {/* Best Performer */}
            {bestProject && (
              <div className="card border border-brand/30">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-brand" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand">Top Performer</span>
                </div>
                <p className="font-bold text-white">{bestProject.name}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-green-400 font-bold">{bestProject.profit >= 0 ? '+' : ''}{fmt(bestProject.profit)}</span>
                  <span className="text-brand">{bestProject.roi}% ROI</span>
                </div>
              </div>
            )}

            {/* Investment vs Sale Bar Chart */}
            {chartData.length > 0 && (
              <div className="card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Investment vs Est. Sale</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barGap={2}>
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="Investment" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Est. Sale" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-gray-400">Investment</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-brand" /><span className="text-xs text-gray-400">Est. Sale</span></div>
                </div>
              </div>
            )}

            {/* ROI by Project */}
            {chartData.length > 0 && (
              <div className="card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">ROI by Project</h3>
                <div className="space-y-3">
                  {[...chartData].sort((a, b) => b.roi - a.roi).map(p => (
                    <div key={p.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 truncate flex-1">{p.name}</span>
                        <span className={`font-bold ml-2 ${p.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.roi >= 0 ? '+' : ''}{p.roi}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-400 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.abs(p.roi) * 3, 100)}%`,
                            background: p.roi >= 0 ? 'linear-gradient(90deg,#f97316,#22c55e)' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Breakdown */}
            <div className="card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Portfolio Status</h3>
              <div className="space-y-2">
                {statusBreakdown.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`status-badge ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? 'bg-gray-500/20 text-gray-400'}`}>{status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-surface-400 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${(count / projects.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white w-4">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
