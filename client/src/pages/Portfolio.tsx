import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Wallet, TrendingUp, Clock, Bell, Search, User } from 'lucide-react';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import { SkeletonStatCard, EmptyState, useToast } from '../components/ui';
import { api, fmt } from '../lib/api';
import type { DashboardData } from '../types';

export default function Portfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get()
      .then((d) => {
        setData(d as DashboardData);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  const stats = data?.stats;

  const quarter = stats && stats.totalProjects > 0 ? '+1 this quarter' : 'No projects yet';
  const roiText = stats ? `${((stats.estTotalProfit / Math.max(stats.capitalDeployed, 1)) * 100).toFixed(1)}% Projected ROI` : '';
  const daysText = stats ? `${stats.avgDaysToFlip > 45 ? '+' : '-'}${Math.abs(stats.avgDaysToFlip - 45)} days from avg` : '';

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">FlipFolio</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full bg-surface-500 flex items-center justify-center">
            <User size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* New Project CTA */}
        <button
          onClick={() => navigate('/projects/new')}
          className="btn-primary flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand/60"
          style={{ padding: '18px' }}
        >
          <Plus size={20} className="text-white" />
          <span>NEW PROJECT</span>
        </button>

        {loading ? (
          <div className="space-y-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
        ) : (
          <>
            <StatCard
              label="Total Projects"
              value={String(stats?.totalProjects ?? 0).padStart(2, '0')}
              sub={`↗ ${quarter}`}
              subColor="text-green-400"
              icon={<FolderKanban size={22} />}
            />

            <StatCard
              label="Capital Deployed"
              value={fmt(stats?.capitalDeployed ?? 0)}
              sub="Allocated to current pipeline"
              subColor="text-gray-400"
              icon={<Wallet size={22} />}
            />

            <StatCard
              label="Est. Total Profit"
              value={fmt(stats?.estTotalProfit ?? 0)}
              sub={`↗ ${roiText}`}
              subColor="text-brand"
              icon={<TrendingUp size={22} />}
            />

            <StatCard
              label="Avg Days to Flip"
              value={String(stats?.avgDaysToFlip ?? 0)}
              sub={`↘ ${daysText}`}
              subColor={stats && stats.avgDaysToFlip <= 45 ? 'text-green-400' : 'text-red-400'}
              icon={<Clock size={22} />}
            />

            {data && data.recentProjects.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Projects</h2>
                  <button onClick={() => navigate('/projects')} className="text-xs text-brand font-semibold">
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {data.recentProjects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<FolderKanban size={32} />}
                title="No projects yet"
                description="Add your first flip to start tracking your portfolio."
                action={{ label: 'Add First Project', onClick: () => navigate('/projects/new') }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
