import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, MapPin, LayoutList, Columns, AlertCircle } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { api, fmt } from '../lib/api';
import type { Project, ProjectStatus } from '../types';
import { STATUS_COLORS } from '../types';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Acquired', value: 'acquired' },
  { label: 'Renovation', value: 'renovation' },
  { label: 'Listed', value: 'listed' },
  { label: 'Sold', value: 'sold' },
];

const KANBAN_COLUMNS: { label: string; value: ProjectStatus }[] = [
  { label: 'Acquired', value: 'acquired' },
  { label: 'Renovation', value: 'renovation' },
  { label: 'Listed', value: 'listed' },
  { label: 'Sold', value: 'sold' },
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    api.projects.list().then((data) => {
      setProjects(data as Project[]);
      setLoading(false);
    }).catch((err: Error) => {
      setErrorMsg(err.message || 'Failed to load projects');
      setLoading(false);
    });
  }, []);

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Kanban uses search only — columns handle status grouping
  const kanbanFiltered = projects.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Projects</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-surface-700 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setView('list')}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${view === 'list' ? 'bg-surface-500' : ''}`}
              aria-label="List view"
            >
              <LayoutList size={15} className={view === 'list' ? 'text-brand' : 'text-gray-500'} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${view === 'kanban' ? 'bg-surface-500' : ''}`}
              aria-label="Kanban view"
            >
              <Columns size={15} className={view === 'kanban' ? 'text-brand' : 'text-gray-500'} />
            </button>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-5 mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by address, city..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Status filter chips — hidden in kanban mode */}
      {view === 'list' && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                filter === value
                  ? 'bg-brand border-brand text-white'
                  : 'border-surface-400 text-gray-400 hover:border-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="px-5 pb-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="card animate-pulse h-32" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center mb-4">
                <SlidersHorizontal size={28} className="text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">
                {search || filter !== 'all' ? 'No projects match your filters.' : 'No projects yet.'}
              </p>
              {!search && filter === 'all' && (
                <button
                  onClick={() => navigate('/projects/new')}
                  className="mt-4 btn-primary w-auto px-8 py-3 rounded-xl text-sm"
                >
                  Add Your First Project
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="pb-8">
          {loading ? (
            <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 min-w-64 card animate-pulse h-48" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar pb-2">
              {KANBAN_COLUMNS.map(({ label, value }) => {
                const colProjects = kanbanFiltered.filter(p => p.status === value);
                return (
                  <div key={value} className="flex-shrink-0 min-w-64 flex flex-col">
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`status-badge ${STATUS_COLORS[value]}`}>{label}</span>
                      <span className="text-xs font-bold text-gray-500 bg-surface-700 rounded-full w-5 h-5 flex items-center justify-center">
                        {colProjects.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3 flex-1">
                      {colProjects.length === 0 ? (
                        <div className="card border-dashed border-surface-500 flex items-center justify-center py-8">
                          <p className="text-xs text-gray-600">
                            {search ? 'No matches' : 'No projects'}
                          </p>
                        </div>
                      ) : (
                        colProjects.map(p => {
                          const salePrice = p.actual_sale_price > 0 ? p.actual_sale_price : p.estimated_sale_price;
                          const totalCost = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs + p.rehab_budget;
                          const profit = salePrice - totalCost;
                          return (
                            <button
                              key={p.id}
                              onClick={() => navigate(`/projects/${p.id}`)}
                              className="card w-full text-left hover:border-brand/40 transition-colors active:scale-[0.99] space-y-2"
                            >
                              <p className="font-bold text-white text-sm leading-snug truncate">
                                {p.name || p.address}
                              </p>
                              <div className="flex items-center gap-1">
                                <MapPin size={10} className="text-gray-500 flex-shrink-0" />
                                <span className="text-xs text-gray-400 truncate">{p.city}, {p.state}</span>
                              </div>
                              <div className="flex justify-between items-end pt-1">
                                <div>
                                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Purchase</div>
                                  <div className="text-xs font-bold text-white">{fmt(p.purchase_price)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Est. Profit</div>
                                  <div className={`text-xs font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {profit >= 0 ? '+' : ''}{fmt(profit)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
