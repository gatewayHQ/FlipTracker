import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { api } from '../lib/api';
import type { Project, ProjectStatus } from '../types';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Acquired', value: 'acquired' },
  { label: 'Renovation', value: 'renovation' },
  { label: 'Listed', value: 'listed' },
  { label: 'Sold', value: 'sold' },
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    api.projects.list().then((data) => {
      setProjects(data as Project[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Projects</h1>
        <button
          onClick={() => navigate('/projects/new')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

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

      {/* Status filter chips */}
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
    </div>
  );
}
