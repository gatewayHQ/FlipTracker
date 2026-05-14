import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Edit2, Trash2, Plus, Check, Clock, DollarSign,
  Wrench, Users, FileText, X, MapPin, TrendingUp, AlertTriangle,
  AlertCircle, Flame, Target, Calendar,
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { api, fmt, fmtFull, fmtDate, fmtDateShort } from '../lib/api';
import type { ProjectDetail as PD, RenovationPhase, Milestone, Vendor, Expense } from '../types';
import { STATUS_COLORS, EXPENSE_CATEGORIES } from '../types';

type Tab = 'overview' | 'phases' | 'expenses' | 'milestones' | 'vendors';

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-surface-400 text-gray-400',
  in_progress: 'bg-brand/20 text-brand',
  completed: 'bg-green-500/20 text-green-400',
};

// ── Hold cost helpers ────────────────────────────────────────────────────────
function calcHoldDays(acquisitionDate: string, soldDate: string): number {
  if (!acquisitionDate) return 0;
  const start = new Date(acquisitionDate + 'T00:00:00');
  const end = soldDate ? new Date(soldDate + 'T00:00:00') : new Date();
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
}

// ── ARV Calculator card ──────────────────────────────────────────────────────
function ARVCalculator({ arv, rehabBudget, purchasePrice }: { arv: number; rehabBudget: number; purchasePrice: number }) {
  const mao = arv * 0.70 - rehabBudget;
  const underMAO = purchasePrice <= mao;
  const scenarios = [-15, -10, -5, 0, 5, 10].map(pct => {
    const scenarioArv = arv * (1 + pct / 100);
    const profit = scenarioArv - purchasePrice - rehabBudget;
    return { pct, arv: scenarioArv, profit };
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-brand" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand">ARV & Deal Analysis</h3>
      </div>

      {/* 70% Rule */}
      <div className={`rounded-xl p-3 mb-4 ${underMAO ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">70% Rule Check</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${underMAO ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {underMAO ? 'PASS' : 'FAIL'}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-gray-400">Max Allowable Offer</span>
          <span className="font-bold text-white">{fmtFull(mao)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">Purchase Price</span>
          <span className={`font-bold ${underMAO ? 'text-green-400' : 'text-red-400'}`}>{fmtFull(purchasePrice)}</span>
        </div>
        {!underMAO && (
          <p className="text-xs text-red-400 mt-2">
            Paid {fmtFull(purchasePrice - mao)} over MAO — tighter margin on exit.
          </p>
        )}
      </div>

      {/* Profit sensitivity */}
      <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Profit Sensitivity</h4>
      <div className="space-y-1.5">
        {scenarios.map(s => (
          <div key={s.pct} className={`flex items-center justify-between rounded-lg px-3 py-2 ${s.pct === 0 ? 'bg-brand/10 border border-brand/30' : 'bg-surface-600'}`}>
            <span className={`text-xs font-semibold ${s.pct === 0 ? 'text-brand' : 'text-gray-400'}`}>
              {s.pct === 0 ? 'At ARV' : `${s.pct > 0 ? '+' : ''}${s.pct}%`}
              <span className="text-gray-500 font-normal ml-1">{fmt(s.arv)}</span>
            </span>
            <span className={`text-xs font-bold ${s.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {s.profit >= 0 ? '+' : ''}{fmt(s.profit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hold Cost Tracker ─────────────────────────────────────────────────────────
function HoldCostTracker({ acquisitionDate, soldDate, holdingCostsMonthly, targetCompletionDate }: {
  acquisitionDate: string; soldDate: string;
  holdingCostsMonthly: number; targetCompletionDate: string;
}) {
  const holdDays = calcHoldDays(acquisitionDate, soldDate);
  const dailyCost = holdingCostsMonthly / 30.4;
  const totalHoldCost = holdDays * dailyCost;
  const daysToTarget = daysUntil(targetCompletionDate);
  const projectedAdditionalCost = daysToTarget > 0 && daysToTarget !== Infinity ? daysToTarget * dailyCost : null;
  const isOverdue = daysToTarget < 0 && !soldDate;
  const overdueDays = isOverdue ? Math.abs(daysToTarget) : 0;

  return (
    <div className={`card ${isOverdue ? 'border border-red-500/40' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={16} className={isOverdue ? 'text-red-400' : 'text-brand'} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand">Hold Cost Tracker</h3>
        {isOverdue && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {overdueDays}d Overdue
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface-600 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Days Held</div>
          <div className="text-xl font-bold text-white">{holdDays}</div>
        </div>
        <div className="bg-surface-600 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Per Day</div>
          <div className="text-xl font-bold text-brand">{fmt(dailyCost)}</div>
        </div>
        <div className="bg-surface-600 rounded-xl p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Cost</div>
          <div className={`text-xl font-bold ${isOverdue ? 'text-red-400' : 'text-white'}`}>{fmt(totalHoldCost)}</div>
        </div>
      </div>

      {projectedAdditionalCost !== null && (
        <div className="flex justify-between items-center py-2 border-t border-surface-400/20 text-xs">
          <span className="text-gray-400">Projected additional ({daysToTarget}d to target)</span>
          <span className="font-bold text-yellow-400">+{fmt(projectedAdditionalCost)}</span>
        </div>
      )}
      {isOverdue && (
        <p className="text-xs text-red-400 mt-2">
          {overdueDays} days past target — burning {fmt(overdueDays * dailyCost)} in unexpected hold costs.
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
  const [addingExpense, setAddingExpense] = useState(false);

  const loadProject = () => {
    if (!id) return;
    api.projects.get(id).then(d => { setProject(d as PD); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProject();
    api.vendors.list().then(v => setAllVendors(v as Vendor[]));
  }, [id]);

  const handleDeleteProject = async () => { if (!id) return; await api.projects.delete(id); navigate('/projects'); };
  const handlePhaseStatusCycle = async (phase: RenovationPhase) => {
    const next: Record<string, string> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    await api.phases.update(id!, phase.id, { status: next[phase.status] });
    loadProject();
  };
  const handleToggleMilestone = async (m: Milestone) => {
    const completed = m.completed ? 0 : 1;
    await api.milestones.update(id!, m.id, { completed, completed_date: completed ? new Date().toISOString().slice(0, 10) : '' });
    loadProject();
  };
  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    await api.milestones.create(id!, newMilestone);
    setNewMilestone({ title: '', due_date: '' });
    setAddingMilestone(false);
    loadProject();
  };
  const handleDeleteMilestone = async (milestoneId: string) => { await api.milestones.delete(id!, milestoneId); loadProject(); };
  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount) return;
    await api.expenses.create(id!, { ...newExpense, amount: parseFloat(newExpense.amount) });
    setNewExpense({ category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
    setAddingExpense(false);
    loadProject();
  };
  const handleDeleteExpense = async (expenseId: string) => { await api.expenses.delete(id!, expenseId); loadProject(); };
  const handleAttachVendor = async (vendorId: string) => { try { await api.vendors.attachToProject(vendorId, id!, {}); loadProject(); } catch {} };
  const handleDetachVendor = async (vendorId: string) => { await api.vendors.detachFromProject(vendorId, id!); loadProject(); };

  if (loading) return <div className="min-h-full bg-surface-900 flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading...</div></div>;
  if (!project) return (
    <div className="min-h-full bg-surface-900 flex items-center justify-center">
      <div className="text-center"><p className="text-gray-400 mb-4">Project not found</p><button onClick={() => navigate('/projects')} className="text-brand">Back to Projects</button></div>
    </div>
  );

  const { computed } = project;
  const rehabSpent = project.labor_cost + project.materials_cost;
  const rehabPercent = project.rehab_budget > 0 ? Math.round((rehabSpent / project.rehab_budget) * 100) : 0;
  const completedPhases = project.phases.filter(p => p.status === 'completed').length;
  const totalPhases = project.phases.length;
  const phaseProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // Real hold cost (actual days, not fixed 6mo)
  const holdDays = calcHoldDays(project.acquisition_date, project.sold_date);
  const dailyCost = project.holding_costs_monthly / 30.4;
  const realHoldCost = holdDays * dailyCost;

  // Annualized ROI
  const totalCostForROI = computed.totalInvestment + rehabSpent + realHoldCost;
  const realProfit = (project.actual_sale_price > 0 ? project.actual_sale_price : project.estimated_sale_price) - totalCostForROI;
  const simpleROI = totalCostForROI > 0 ? (realProfit / totalCostForROI) * 100 : 0;
  const annualizedROI = holdDays > 0 ? (simpleROI / holdDays) * 365 : simpleROI;

  const capitalPercent = Math.round(((project.purchase_price + project.legal_fees + project.inspection_cost + project.closing_costs + rehabSpent) / Math.max(project.estimated_sale_price, 1)) * 100);

  // Overdue milestones count
  const overdueMilestones = project.milestones.filter(m => !m.completed && daysUntil(m.due_date) < 0 && m.due_date);

  const tabs: { id: Tab; label: string; Icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', Icon: FileText },
    { id: 'phases', label: 'Phases', Icon: Wrench },
    { id: 'expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'milestones', label: 'Timeline', Icon: Clock, badge: overdueMilestones.length },
    { id: 'vendors', label: 'Vendors', Icon: Users },
  ];

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate('/projects')} className="text-brand"><ChevronLeft size={28} /></button>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-base font-bold text-white truncate">{project.name || project.address}</h1>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <MapPin size={11} className="text-gray-500" />
            <span className="text-xs text-gray-400">{project.city}, {project.state}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/projects/${id}/edit`)} className="text-gray-400 hover:text-brand transition-colors"><Edit2 size={18} /></button>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
        </div>
      </div>

      {/* Status + quick ROI strip */}
      <div className="flex items-center justify-center gap-3 mb-4 px-5">
        <span className={`status-badge ${STATUS_COLORS[project.status]}`}>{project.status}</span>
        <span className="text-xs text-gray-500">|</span>
        <span className={`text-xs font-bold ${simpleROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {simpleROI >= 0 ? '+' : ''}{simpleROI.toFixed(1)}% ROI
        </span>
        {holdDays > 0 && (
          <>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-400">{holdDays}d held</span>
          </>
        )}
        {annualizedROI !== simpleROI && holdDays > 0 && (
          <>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-brand font-bold">{annualizedROI.toFixed(1)}% ann.</span>
          </>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto no-scrollbar border-b border-surface-400/30 px-5">
        {tabs.map(({ id: tabId, label, Icon, badge }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`relative flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === tabId ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
            {badge ? (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 pb-24 space-y-4">

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <>
            {/* Budget overrun banner */}
            {rehabPercent > 100 && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-400">Rehab Budget Overrun</p>
                  <p className="text-xs text-gray-400">Over by {fmtFull(rehabSpent - project.rehab_budget)} ({rehabPercent - 100}% above budget)</p>
                </div>
              </div>
            )}

            {/* P&L Summary card — live */}
            <div className="card border border-brand/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-brand" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand">Live P&L</h3>
                <span className="ml-auto text-[9px] text-gray-500 uppercase tracking-wider">Updates as costs come in</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Est. Net Profit</div>
                  <div className={`text-3xl font-bold ${realProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {realProfit >= 0 ? '+' : ''}{fmt(realProfit)}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-400">ROI <span className={`font-bold ${simpleROI >= 0 ? 'text-brand' : 'text-red-400'}`}>{simpleROI.toFixed(1)}%</span></div>
                  {holdDays > 0 && <div className="text-xs text-gray-400">Ann. <span className="font-bold text-green-400">{annualizedROI.toFixed(1)}%</span></div>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-surface-400/20">
                {[
                  { label: 'Into Deal', value: computed.totalInvestment + rehabSpent },
                  { label: 'Hold Cost', value: realHoldCost },
                  { label: 'Target Sale', value: project.actual_sale_price > 0 ? project.actual_sale_price : project.estimated_sale_price },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{fmt(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capital Utilization Donut */}
            <div className="card flex flex-col items-center py-6">
              <p className="label mb-4 text-center">Capital Utilization</p>
              <DonutChart percent={Math.min(capitalPercent, 99)} size={200} strokeWidth={20} />
              <p className="text-sm text-gray-400 text-center mt-4">
                {fmt(computed.totalInvestment + rehabSpent)} of {fmt(project.estimated_sale_price)} est. sale committed.
              </p>
            </div>

            {/* ARV & Deal Analysis */}
            {project.estimated_sale_price > 0 && (
              <ARVCalculator
                arv={project.estimated_sale_price}
                rehabBudget={project.rehab_budget}
                purchasePrice={project.purchase_price}
              />
            )}

            {/* Hold Cost Tracker */}
            {project.holding_costs_monthly > 0 && project.acquisition_date && (
              <HoldCostTracker
                acquisitionDate={project.acquisition_date}
                soldDate={project.sold_date}
                holdingCostsMonthly={project.holding_costs_monthly}
                targetCompletionDate={project.target_completion_date}
              />
            )}

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
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider">Budget Utilization</span>
                <span className={`font-bold ${rehabPercent > 100 ? 'text-red-400' : 'text-white'}`}>{rehabPercent}%</span>
              </div>
              <div className="h-2 bg-surface-400 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(rehabPercent, 100)}%`,
                    background: rehabPercent >= 100 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : rehabPercent >= 80 ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#f97316,#fb923c)',
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {rehabPercent > 100
                  ? `Over budget by ${fmtFull(rehabSpent - project.rehab_budget)}`
                  : `${fmtFull(Math.max(0, project.rehab_budget - rehabSpent))} remaining`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Labor Spend</div>
                  <div className="text-lg font-bold text-white">{fmt(project.labor_cost)}</div>
                </div>
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Materials</div>
                  <div className="text-lg font-bold text-white">{fmt(project.materials_cost)}</div>
                </div>
              </div>
            </div>

            {/* Key Dates */}
            {(project.acquisition_date || project.target_completion_date || project.listed_date || project.sold_date) && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Key Dates</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Acquired', value: project.acquisition_date },
                    { label: 'Target Completion', value: project.target_completion_date },
                    { label: 'Listed', value: project.listed_date },
                    { label: 'Sold', value: project.sold_date },
                  ].filter(d => d.value).map(({ label, value }) => {
                    const days = daysUntil(value);
                    const isOverdue = days < 0 && label === 'Target Completion' && !project.sold_date;
                    return (
                      <div key={label} className="flex justify-between items-center text-sm py-1.5 border-b border-surface-400/10 last:border-0">
                        <span className="text-gray-400">{label}</span>
                        <div className="text-right">
                          <span className="text-white font-semibold">{fmtDate(value)}</span>
                          {isOverdue && <span className="ml-2 text-xs text-red-400 font-bold">{Math.abs(days)}d overdue</span>}
                          {!isOverdue && days >= 0 && days < 30 && label === 'Target Completion' && (
                            <span className="ml-2 text-xs text-yellow-400 font-bold">{days}d away</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Milestones preview */}
            {project.milestones.filter(m => !m.completed).slice(0, 3).length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming Milestones</h3>
                  <button onClick={() => setTab('milestones')} className="text-xs text-brand">View All</button>
                </div>
                <div className="space-y-2">
                  {project.milestones.filter(m => !m.completed).slice(0, 3).map(m => {
                    const days = daysUntil(m.due_date);
                    const overdue = days < 0 && m.due_date;
                    return (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${overdue ? 'bg-red-400' : 'bg-brand'}`} />
                          <span className="text-sm text-white">{m.title}</span>
                        </div>
                        <span className={`text-xs font-semibold ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                          {overdue ? `${Math.abs(days)}d overdue` : fmtDateShort(m.due_date)}
                        </span>
                      </div>
                    );
                  })}
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
              <div className="w-12 h-12"><DonutChart percent={phaseProgress} size={48} strokeWidth={6} label="" /></div>
            </div>

            {/* Budget summary across phases */}
            {project.phases.some(p => p.budget > 0) && (() => {
              const totalBudget = project.phases.reduce((s, p) => s + Number(p.budget), 0);
              const totalActual = project.phases.reduce((s, p) => s + Number(p.actual_cost), 0);
              const variance = totalActual - totalBudget;
              const pct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
              return (
                <div className={`card ${variance > 0 ? 'border border-red-500/30' : 'border border-green-500/20'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Rehab Budget</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${variance > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {variance > 0 ? '+' : ''}{fmt(variance)} variance
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div><span className="text-gray-500">Budget </span><span className="font-bold text-white">{fmt(totalBudget)}</span></div>
                    <div><span className="text-gray-500">Actual </span><span className={`font-bold ${variance > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(totalActual)}</span></div>
                    <div><span className="text-gray-500">Used </span><span className="font-bold text-white">{pct}%</span></div>
                  </div>
                </div>
              );
            })()}

            {project.phases.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No renovation phases added yet.</p>
                <button onClick={() => navigate(`/projects/${id}/edit`)} className="mt-3 text-brand text-sm font-semibold">Edit project to add phases</button>
              </div>
            ) : (
              project.phases.map(phase => {
                const budget = Number(phase.budget);
                const actual = Number(phase.actual_cost);
                const over = budget > 0 && actual > budget;
                const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0;
                return (
                  <div key={phase.id} className={`card ${over ? 'border border-red-500/30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePhaseStatusCycle(phase)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                            phase.status === 'completed' ? 'bg-green-500 border-green-500' : phase.status === 'in_progress' ? 'bg-brand/20 border-brand' : 'border-surface-300'
                          }`}
                        >
                          {phase.status === 'completed' && <Check size={14} className="text-white" />}
                          {phase.status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-brand" />}
                        </button>
                        <div>
                          <p className="font-semibold text-white text-sm">{phase.phase_name}</p>
                          {phase.target_date && <p className="text-xs text-gray-500">Target: {fmtDateShort(phase.target_date)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {over && <AlertTriangle size={14} className="text-red-400" />}
                        <span className={`status-badge text-[10px] ${PHASE_STATUS_COLORS[phase.status]}`}>{phase.status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {(budget > 0 || actual > 0) && (
                      <div className="mt-3 pt-3 border-t border-surface-400/20">
                        <div className="flex justify-between text-xs mb-1.5">
                          <div className="flex gap-3">
                            <span><span className="text-gray-500">Budget </span><span className="text-white font-semibold">{fmt(budget)}</span></span>
                            <span><span className="text-gray-500">Actual </span><span className={`font-semibold ${over ? 'text-red-400' : actual > 0 ? 'text-green-400' : 'text-gray-400'}`}>{fmt(actual)}</span></span>
                          </div>
                          <span className={`font-bold ${over ? 'text-red-400' : 'text-gray-400'}`}>{pct}%</span>
                        </div>
                        {budget > 0 && (
                          <div className="h-1.5 bg-surface-400 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: over ? '#ef4444' : pct > 80 ? 'linear-gradient(90deg,#f97316,#eab308)' : '#22c55e',
                              }}
                            />
                          </div>
                        )}
                        {over && <p className="text-xs text-red-400 mt-1">Over by {fmt(actual - budget)}</p>}
                      </div>
                    )}
                    {phase.notes && <p className="text-xs text-gray-500 mt-2">{phase.notes}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== EXPENSES ===== */}
        {tab === 'expenses' && (
          <div className="space-y-3">
            <div className="card">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Spent</div>
                  <div className="text-sm font-bold text-white">{fmt(project.expenses.reduce((s, e) => s + Number(e.amount), 0))}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Transactions</div>
                  <div className="text-sm font-bold text-white">{project.expenses.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Latest</div>
                  <div className="text-sm font-bold text-white">{project.expenses.length > 0 ? fmtDateShort(project.expenses[0].date) : '—'}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAddingExpense(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} />Add Expense
            </button>

            {addingExpense && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">New Expense</h4>
                  <button onClick={() => setAddingExpense(false)}><X size={16} className="text-gray-400" /></button>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Kitchen cabinets" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <button onClick={handleAddExpense} className="btn-primary rounded-xl py-3">Add Expense</button>
              </div>
            )}

            {project.expenses.length === 0 ? (
              <div className="card text-center py-8"><p className="text-gray-400 text-sm">No expenses logged yet.</p></div>
            ) : (
              <div className="space-y-2">
                {project.expenses.map(e => (
                  <div key={e.id} className="card flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{e.category} · {fmtDateShort(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-sm font-bold text-white">{fmt(Number(e.amount))}</span>
                      <button onClick={() => handleDeleteExpense(e.id)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={14} /></button>
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
            {overdueMilestones.length > 0 && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 font-semibold">{overdueMilestones.length} overdue milestone{overdueMilestones.length > 1 ? 's' : ''}</p>
              </div>
            )}

            <button
              onClick={() => setAddingMilestone(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} />Add Milestone
            </button>

            {addingMilestone && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">New Milestone</h4>
                  <button onClick={() => setAddingMilestone(false)}><X size={16} className="text-gray-400" /></button>
                </div>
                <div>
                  <label className="label">Title</label>
                  <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Permits Approved" className="input-field" />
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone(p => ({ ...p, due_date: e.target.value }))} className="input-field" />
                </div>
                <button onClick={handleAddMilestone} className="btn-primary rounded-xl py-3">Add Milestone</button>
              </div>
            )}

            {project.milestones.length === 0 ? (
              <div className="card text-center py-8"><p className="text-gray-400 text-sm">No milestones yet. Add key dates and checkpoints.</p></div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-400/50" />
                <div className="space-y-3 pl-10">
                  {project.milestones.map(m => {
                    const days = daysUntil(m.due_date);
                    const overdue = !m.completed && days < 0 && m.due_date;
                    const dueSoon = !m.completed && days >= 0 && days <= 7 && m.due_date;
                    return (
                      <div key={m.id} className="relative">
                        <div
                          className={`absolute -left-[30px] top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            m.completed ? 'bg-green-500 border-green-500' : overdue ? 'bg-red-500/20 border-red-500' : 'bg-surface-700 border-brand'
                          }`}
                          onClick={() => handleToggleMilestone(m)}
                        >
                          {m.completed && <Check size={10} className="text-white" />}
                        </div>
                        <div className={`card flex items-start justify-between ${m.completed ? 'opacity-50' : ''} ${overdue ? 'border border-red-500/30' : dueSoon ? 'border border-yellow-500/30' : ''}`}>
                          <div>
                            <p className={`text-sm font-semibold ${m.completed ? 'line-through text-gray-500' : 'text-white'}`}>{m.title}</p>
                            {m.due_date && (
                              <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400 font-bold' : dueSoon ? 'text-yellow-400' : 'text-gray-500'}`}>
                                {m.completed && m.completed_date
                                  ? `Completed ${fmtDateShort(m.completed_date)}`
                                  : overdue
                                  ? `${Math.abs(days)} days overdue`
                                  : dueSoon
                                  ? `Due in ${days} day${days !== 1 ? 's' : ''}`
                                  : `Due ${fmtDateShort(m.due_date)}`}
                              </p>
                            )}
                          </div>
                          <button onClick={() => handleDeleteMilestone(m.id)} className="text-gray-600 hover:text-red-400 ml-2 flex-shrink-0"><X size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== VENDORS ===== */}
        {tab === 'vendors' && (
          <div className="space-y-3">
            {project.vendors.map(v => (
              <div key={v.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{v.vendor_name}</p>
                    {v.company && <p className="text-xs text-gray-400">{v.company}</p>}
                    {v.specialty && <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full mt-1 inline-block">{v.specialty}</span>}
                  </div>
                  <button onClick={() => handleDetachVendor(v.vendor_id)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={16} /></button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {v.phone && <a href={`tel:${v.phone}`} className="text-brand">{v.phone}</a>}
                  {v.contracted_amount > 0 && <div><span className="text-gray-500">Contracted: </span><span className="text-white font-semibold">{fmt(Number(v.contracted_amount))}</span></div>}
                  {v.paid_amount > 0 && <div><span className="text-gray-500">Paid: </span><span className="text-green-400 font-semibold">{fmt(Number(v.paid_amount))}</span></div>}
                </div>
              </div>
            ))}

            <div className="card">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Attach Vendor</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allVendors
                  .filter(v => !project.vendors.some(pv => pv.vendor_id === v.id))
                  .map(v => (
                    <button key={v.id} onClick={() => handleAttachVendor(v.id)} className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-surface-600 hover:bg-surface-500 transition-colors">
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
              <button onClick={() => navigate('/vendors')} className="w-full text-center text-xs text-brand font-semibold mt-3">Manage Vendors →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-5 pb-8">
          <div className="bg-surface-700 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-400 mb-6">This will permanently delete "{project.name || project.address}" and all its data.</p>
            <div className="space-y-3">
              <button onClick={handleDeleteProject} className="w-full py-4 rounded-xl bg-red-500 text-white font-bold">Delete Project</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 rounded-xl bg-surface-500 text-white font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
