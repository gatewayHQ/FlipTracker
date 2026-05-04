import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Edit2, Trash2, Plus, Check, Clock, DollarSign,
  Wrench, Users, FileText, MapPin,
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { SkeletonList, EmptyState, Modal, Sheet, ProgressBar, Button, Input, Select, useToast } from '../components/ui';
import { api, fmt, fmtFull, fmtDate, fmtDateShort } from '../lib/api';
import type { ProjectDetail as PD, RenovationPhase, Milestone, Vendor, Expense } from '../types';
import { STATUS_COLORS, EXPENSE_CATEGORIES } from '../types';

type Tab = 'overview' | 'phases' | 'expenses' | 'milestones' | 'vendors';

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-surface-400 text-gray-400',
  in_progress: 'bg-brand/20 text-brand',
  completed: 'bg-green-500/20 text-green-400',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  // Milestone sheet
  const [milestoneSheetOpen, setMilestoneSheetOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' });
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Expense sheet
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
  const [savingExpense, setSavingExpense] = useState(false);

  const loadProject = () => {
    if (!id) return;
    api.projects.get(id).then(d => {
      setProject(d as PD);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load project');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProject();
    api.vendors.list().then(v => setAllVendors(v as Vendor[]));
  }, [id]);

  const handleDeleteProject = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await api.projects.delete(id);
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePhaseStatusCycle = async (phase: RenovationPhase) => {
    const next: Record<string, string> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    try {
      await api.phases.update(id!, phase.id, { status: next[phase.status] });
      loadProject();
    } catch {
      toast.error('Failed to update phase');
    }
  };

  const handleToggleMilestone = async (m: Milestone) => {
    const completed = !m.completed;
    const completed_date = completed ? new Date().toISOString().slice(0, 10) : null;
    try {
      await api.milestones.update(id!, m.id, { completed, completed_date });
      loadProject();
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    setSavingMilestone(true);
    try {
      await api.milestones.create(id!, {
        title: newMilestone.title,
        due_date: newMilestone.due_date || null,
      });
      setNewMilestone({ title: '', due_date: '' });
      setMilestoneSheetOpen(false);
      toast.success('Milestone added');
      loadProject();
    } catch {
      toast.error('Failed to add milestone');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await api.milestones.delete(id!, milestoneId);
      loadProject();
    } catch {
      toast.error('Failed to delete milestone');
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount) return;
    setSavingExpense(true);
    try {
      await api.expenses.create(id!, { ...newExpense, amount: parseFloat(newExpense.amount) });
      setNewExpense({ category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setExpenseSheetOpen(false);
      toast.success('Expense logged');
      loadProject();
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.expenses.delete(id!, expenseId);
      loadProject();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleAttachVendor = async (vendorId: string) => {
    try {
      await api.vendors.attachToProject(vendorId, id!, {});
      loadProject();
    } catch {
      toast.error('Failed to attach vendor');
    }
  };

  const handleDetachVendor = async (vendorId: string) => {
    try {
      await api.vendors.detachFromProject(vendorId, id!);
      loadProject();
    } catch {
      toast.error('Failed to detach vendor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 px-5 pt-16">
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center px-5">
        <EmptyState
          icon={<FileText size={28} />}
          title="Project not found"
          description="This project may have been deleted."
          action={{ label: 'Back to Projects', onClick: () => navigate('/projects') }}
        />
      </div>
    );
  }

  const { computed } = project;
  const rehabSpent = project.labor_cost + project.materials_cost;
  const rehabPercent = project.rehab_budget > 0 ? Math.round((rehabSpent / project.rehab_budget) * 100) : 0;
  const completedPhases = project.phases.filter(p => p.status === 'completed').length;
  const totalPhases = project.phases.length;
  const phaseProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  const capitalPercent = Math.round(
    ((project.purchase_price + project.legal_fees + project.inspection_cost + project.closing_costs + rehabSpent) /
      Math.max(project.estimated_sale_price, 1)) * 100
  );

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'overview', label: 'Overview', Icon: FileText },
    { id: 'phases', label: 'Phases', Icon: Wrench },
    { id: 'expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'milestones', label: 'Timeline', Icon: Clock },
    { id: 'vendors', label: 'Vendors', Icon: Users },
  ];

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate('/projects')} className="text-brand" aria-label="Back to projects">
          <ChevronLeft size={28} />
        </button>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-base font-bold text-white truncate">{project.name || project.address}</h1>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <MapPin size={11} className="text-gray-500" />
            <span className="text-xs text-gray-400">{project.city}, {project.state}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/projects/${id}/edit`)} className="text-gray-400 hover:text-brand transition-colors" aria-label="Edit project">
            <Edit2 size={18} />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete project">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <span className={`status-badge ${STATUS_COLORS[project.status]}`}>{project.status}</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto no-scrollbar border-b border-surface-400/30 px-5 mb-0" role="tablist">
        {tabs.map(({ id: tabId, label, Icon }) => (
          <button
            key={tabId}
            role="tab"
            aria-selected={tab === tabId}
            onClick={() => setTab(tabId)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === tabId
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 pb-24 space-y-4">

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <>
            {/* Capital Utilization Donut */}
            <div className="card flex flex-col items-center py-6">
              <p className="label mb-4 text-center">Capital Utilization</p>
              <DonutChart percent={Math.min(capitalPercent, 99)} size={200} strokeWidth={20} />
              <p className="text-sm text-gray-400 text-center mt-4">
                {fmt(computed.totalInvestment + rehabSpent)} of total {fmt(project.estimated_sale_price)} budget currently committed.
              </p>
            </div>

            {/* Investment & Acquisition */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand">Investment & Acquisition</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Purchase Price', value: project.purchase_price },
                  { label: 'Legal & Title Fees', value: project.legal_fees },
                  { label: 'Property Inspection', value: project.inspection_cost },
                  { label: 'Closing Costs (Buyer Side)', value: project.closing_costs },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-surface-400/20 last:border-0">
                    <span className="text-sm text-gray-300">{label}</span>
                    <span className="text-sm font-bold text-white">{fmtFull(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-white">Total Acquisition</span>
                  <span className="text-base font-bold text-brand">{fmtFull(computed.totalInvestment)}</span>
                </div>
              </div>
            </div>

            {/* Renovation & Holding */}
            <div className="card">
              <h3 className="text-sm font-bold text-white mb-4">Renovation & Holding</h3>
              <ProgressBar
                value={rehabPercent}
                label="Budget Utilization"
                showPercent
              />
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Estimated ${Math.max(0, project.rehab_budget - rehabSpent).toLocaleString()} remaining
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Labor Spend</div>
                  <div className="text-lg font-bold text-white">{fmt(project.labor_cost)}</div>
                  <div className="text-xs text-green-400 mt-0.5">On Track</div>
                </div>
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Materials</div>
                  <div className="text-lg font-bold text-white">{fmt(project.materials_cost)}</div>
                  {project.rehab_budget > 0 && (
                    <div className={`text-xs mt-0.5 ${rehabPercent > 100 ? 'text-red-400' : 'text-brand'}`}>
                      {rehabPercent > 100 ? '+' : ''}{Math.abs(rehabPercent - 80)}% variance
                    </div>
                  )}
                </div>
              </div>

              {[
                { label: 'Rehab Budget', value: project.rehab_budget },
                { label: 'Holding Costs/Mo', value: project.holding_costs_monthly },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-surface-400/20 last:border-0">
                  <span className="text-sm text-gray-300">{label}</span>
                  <span className="text-sm font-bold text-white">{fmtFull(value)}</span>
                </div>
              ))}
            </div>

            {/* Projected Revenue */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUpIcon />
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand">Projected Revenue</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Estimated Sale Price', value: project.estimated_sale_price },
                  { label: 'Total Investment', value: -computed.totalInvestment },
                  { label: 'Total Renovation', value: -rehabSpent },
                  { label: 'Holding Costs (est. 6mo)', value: -computed.holdingTotal },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-surface-400/20 last:border-0">
                    <span className="text-sm text-gray-300">{label}</span>
                    <span className={`text-sm font-bold ${value < 0 ? 'text-red-400' : 'text-white'}`}>
                      {value < 0 ? '-' : ''}{fmtFull(Math.abs(value))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-white">Est. Net Profit</span>
                  <span className={`text-lg font-bold ${computed.estProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {computed.estProfit >= 0 ? '+' : ''}{fmtFull(computed.estProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">ROI</span>
                  <span className={`text-sm font-bold ${computed.roi >= 0 ? 'text-brand' : 'text-red-400'}`}>
                    {computed.roi}%
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Milestones preview */}
            {project.milestones.filter(m => !m.completed).slice(0, 3).length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming Milestones</h3>
                  <button onClick={() => setTab('milestones')} className="text-xs text-brand">View All</button>
                </div>
                <div className="space-y-2">
                  {project.milestones.filter(m => !m.completed).slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand" />
                        <span className="text-sm text-white">{m.title}</span>
                      </div>
                      <span className="text-xs text-gray-400">{fmtDateShort(m.due_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== PHASES ===== */}
        {tab === 'phases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{completedPhases}/{totalPhases} phases complete</p>
                <p className="text-xs text-gray-400">{phaseProgress}% overall progress</p>
              </div>
              <div className="w-12 h-12">
                <DonutChart percent={phaseProgress} size={48} strokeWidth={6} label="" />
              </div>
            </div>

            {project.phases.length === 0 ? (
              <EmptyState
                icon={<Wrench size={28} />}
                title="No renovation phases"
                description="Edit the project to add renovation phases."
                action={{ label: 'Edit Project', onClick: () => navigate(`/projects/${id}/edit`) }}
              />
            ) : (
              project.phases.map(phase => (
                <div key={phase.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePhaseStatusCycle(phase)}
                        aria-label={`Phase status: ${phase.status}. Click to advance.`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                          phase.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : phase.status === 'in_progress'
                            ? 'bg-brand/20 border-brand'
                            : 'border-surface-300'
                        }`}
                      >
                        {phase.status === 'completed' && <Check size={14} className="text-white" />}
                        {phase.status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-brand" />}
                      </button>
                      <div>
                        <p className="font-semibold text-white text-sm">{phase.phase_name}</p>
                        {phase.target_date && (
                          <p className="text-xs text-gray-500">Target: {fmtDateShort(phase.target_date)}</p>
                        )}
                      </div>
                    </div>
                    <span className={`status-badge text-[10px] ${PHASE_STATUS_COLORS[phase.status]}`}>
                      {phase.status.replace('_', ' ')}
                    </span>
                  </div>

                  {(phase.budget > 0 || phase.actual_cost > 0) && (
                    <div className="mt-3 pt-3 border-t border-surface-400/20 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Budget: </span>
                        <span className="text-white font-semibold">{fmt(phase.budget)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Actual: </span>
                        <span className={`font-semibold ${phase.actual_cost > phase.budget && phase.budget > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {fmt(phase.actual_cost)}
                        </span>
                      </div>
                    </div>
                  )}

                  {phase.notes && <p className="text-xs text-gray-500 mt-2">{phase.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== EXPENSES ===== */}
        {tab === 'expenses' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="card">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Spent</div>
                  <div className="text-sm font-bold text-white">{fmt(project.expenses.reduce((s, e) => s + e.amount, 0))}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Transactions</div>
                  <div className="text-sm font-bold text-white">{project.expenses.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Latest</div>
                  <div className="text-sm font-bold text-white">
                    {project.expenses.length > 0 ? fmtDateShort(project.expenses[0].date) : '—'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setExpenseSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} />
              Add Expense
            </button>

            {project.expenses.length === 0 ? (
              <EmptyState
                icon={<DollarSign size={28} />}
                title="No expenses yet"
                description="Log your first expense to track spending."
                action={{ label: 'Add Expense', onClick: () => setExpenseSheetOpen(true) }}
              />
            ) : (
              <div className="space-y-2">
                {project.expenses.map(e => (
                  <div key={e.id} className="card flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{e.category} · {fmtDateShort(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-bold text-white">{fmt(e.amount)}</span>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        aria-label="Delete expense"
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MILESTONES / TIMELINE ===== */}
        {tab === 'milestones' && (
          <div className="space-y-3">
            <button
              onClick={() => setMilestoneSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} />
              Add Milestone
            </button>

            {project.milestones.length === 0 ? (
              <EmptyState
                icon={<Clock size={28} />}
                title="No milestones yet"
                description="Add key dates and checkpoints for this project."
                action={{ label: 'Add Milestone', onClick: () => setMilestoneSheetOpen(true) }}
              />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-400/50" aria-hidden />
                <div className="space-y-3 pl-10">
                  {project.milestones.map(m => (
                    <div key={m.id} className="relative">
                      <button
                        onClick={() => handleToggleMilestone(m)}
                        aria-label={m.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`absolute -left-[30px] top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          m.completed
                            ? 'bg-green-500 border-green-500'
                            : 'bg-surface-700 border-brand hover:bg-brand/20'
                        }`}
                      >
                        {m.completed ? <Check size={10} className="text-white" /> : null}
                      </button>
                      <div className={`card flex items-start justify-between ${m.completed ? 'opacity-60' : ''}`}>
                        <div>
                          <p className={`text-sm font-semibold ${m.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                            {m.title}
                          </p>
                          {m.due_date && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {m.completed && m.completed_date
                                ? `Completed ${fmtDateShort(m.completed_date)}`
                                : `Due ${fmtDateShort(m.due_date)}`}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          aria-label="Delete milestone"
                          className="text-gray-600 hover:text-red-400 ml-2 flex-shrink-0 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== VENDORS ===== */}
        {tab === 'vendors' && (
          <div className="space-y-3">
            {project.vendors.length === 0 && (
              <EmptyState
                icon={<Users size={28} />}
                title="No vendors attached"
                description="Attach vendors to track who's working on this project."
              />
            )}
            {project.vendors.map(v => (
              <div key={v.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{v.vendor_name}</p>
                    {v.company && <p className="text-xs text-gray-400">{v.company}</p>}
                    {v.specialty && (
                      <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full mt-1 inline-block">
                        {v.specialty}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDetachVendor(v.vendor_id)}
                    aria-label={`Remove ${v.vendor_name}`}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {v.phone && (
                    <a href={`tel:${v.phone}`} className="text-brand">{v.phone}</a>
                  )}
                  {v.contracted_amount > 0 && (
                    <div>
                      <span className="text-gray-500">Contracted: </span>
                      <span className="text-white font-semibold">{fmt(v.contracted_amount)}</span>
                    </div>
                  )}
                  {v.paid_amount > 0 && (
                    <div>
                      <span className="text-gray-500">Paid: </span>
                      <span className="text-green-400 font-semibold">{fmt(v.paid_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Attach existing vendor */}
            <div className="card">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Attach Vendor</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allVendors
                  .filter(v => !project.vendors.some(pv => pv.vendor_id === v.id))
                  .map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleAttachVendor(v.id)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-surface-600 hover:bg-surface-500 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm text-white font-medium">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.specialty}</p>
                      </div>
                      <Plus size={16} className="text-brand flex-shrink-0" />
                    </button>
                  ))}
                {allVendors.filter(v => !project.vendors.some(pv => pv.vendor_id === v.id)).length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">All vendors attached</p>
                )}
              </div>
              <button onClick={() => navigate('/vendors')} className="w-full text-center text-xs text-brand font-semibold mt-3">
                Manage Vendors →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Project?"
        description={`This will permanently delete "${project.name || project.address}" and all its data. This cannot be undone.`}
        confirmLabel="Delete Project"
        confirmVariant="danger"
        onConfirm={handleDeleteProject}
        confirmLoading={deleteLoading}
      />

      {/* Add Expense Sheet */}
      <Sheet open={expenseSheetOpen} onClose={() => setExpenseSheetOpen(false)} title="Log Expense">
        <div className="px-5 py-4 space-y-4 pb-8">
          <Select
            label="Category"
            value={newExpense.category}
            onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
            options={EXPENSE_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />
          <Input
            label="Description"
            value={newExpense.description}
            onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
            placeholder="e.g. Kitchen cabinets"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              prefix="$"
              value={newExpense.amount}
              onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Date"
              type="date"
              value={newExpense.date}
              onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))}
            />
          </div>
          <Button fullWidth size="lg" loading={savingExpense} onClick={handleAddExpense}>
            Log Expense
          </Button>
        </div>
      </Sheet>

      {/* Add Milestone Sheet */}
      <Sheet open={milestoneSheetOpen} onClose={() => setMilestoneSheetOpen(false)} title="Add Milestone">
        <div className="px-5 py-4 space-y-4 pb-8">
          <Input
            label="Title"
            value={newMilestone.title}
            onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Permits Approved"
            autoFocus
          />
          <Input
            label="Due Date"
            type="date"
            value={newMilestone.due_date}
            onChange={e => setNewMilestone(p => ({ ...p, due_date: e.target.value }))}
          />
          <Button fullWidth size="lg" loading={savingMilestone} onClick={handleAddMilestone}>
            Add Milestone
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
