import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { SkeletonList, EmptyState, useToast } from '../components/ui';
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
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    api.projects.list()
      .then((data) => {
        setProjects(data as Project[]);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load projects');
        setLoading(false);
      });
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
          aria-label="New project"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by address, city..."
            className="input-field pl-10"
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
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
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          search || filter !== 'all' ? (
            <EmptyState
              icon={<SlidersHorizontal size={28} />}
              title="No matching projects"
              description="Try adjusting your filters or search query."
            />
          ) : (
            <EmptyState
              icon={<SlidersHorizontal size={28} />}
              title="No projects yet"
              description="Start tracking your first flip project."
              action={{ label: 'Add Your First Project', onClick: () => navigate('/projects/new') }}
            />
          )
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
