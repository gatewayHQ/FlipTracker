import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Edit2, Trash2, Plus, Check, Clock, DollarSign,
  Wrench, Users, FileText, X, MapPin, CreditCard, AlertTriangle, Pencil,
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { api, fmt, fmtFull, fmtDate, fmtDateShort, daysOverdue } from '../lib/api';
import type { ProjectDetail as PD, RenovationPhase, Milestone, Vendor, Expense, Loan } from '../types';
import { STATUS_COLORS, EXPENSE_CATEGORIES, RENOVATION_PHASES } from '../types';

type Tab = 'overview' | 'phases' | 'expenses' | 'milestones' | 'vendors' | 'financing';

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-surface-400 text-gray-400',
  in_progress: 'bg-brand/20 text-brand',
  completed: 'bg-green-500/20 text-green-400',
};

const BLANK_EXPENSE = { category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' };
const BLANK_LOAN = { lender: '', loan_amount: '', interest_rate: '', points: '', term_months: '12', monthly_payment: '', origination_date: '', maturity_date: '', notes: '' };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<PD | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);

  // Milestone state
  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '', notes: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);

  // Expense state
  const [expenseForm, setExpenseForm] = useState(BLANK_EXPENSE);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [addingExpense, setAddingExpense] = useState(false);

  // Phase state
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhase, setNewPhase] = useState({ phase_name: '', budget: '', target_date: '' });
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);

  // Loan state
  const [loanForm, setLoanForm] = useState(BLANK_LOAN);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [addingLoan, setAddingLoan] = useState(false);

  // Vendor attach state
  const [attachForm, setAttachForm] = useState({ contracted_amount: '', phase_name: '', notes: '' });
  const [attachingVendorId, setAttachingVendorId] = useState<string | null>(null);

  const loadProject = () => {
    if (!id) return;
    api.projects.get(id).then(d => {
      setProject(d as PD);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProject();
    api.vendors.list().then(v => setAllVendors(v as Vendor[]));
  }, [id]);

  const handleDeleteProject = async () => {
    if (!id) return;
    await api.projects.delete(id);
    navigate('/projects');
  };

  const handlePhaseStatusCycle = async (phase: RenovationPhase) => {
    const next: Record<string, string> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    await api.phases.update(id!, phase.id, { status: next[phase.status] });
    loadProject();
  };

  const handleToggleMilestone = async (m: Milestone) => {
    const completed = m.completed ? 0 : 1;
    const completed_date = completed ? new Date().toISOString().slice(0, 10) : '';
    await api.milestones.update(id!, m.id, { completed, completed_date });
    loadProject();
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    await api.milestones.create(id!, newMilestone);
    setNewMilestone({ title: '', due_date: '', notes: '' });
    setAddingMilestone(false);
    loadProject();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    await api.milestones.delete(id!, milestoneId);
    loadProject();
  };

  // ---- Expenses ----
  const openNewExpense = () => {
    setExpenseForm(BLANK_EXPENSE);
    setEditingExpenseId(null);
    setAddingExpense(true);
  };

  const openEditExpense = (e: Expense) => {
    setExpenseForm({ category: e.category, description: e.description, amount: String(e.amount), date: e.date, notes: e.notes });
    setEditingExpenseId(e.id);
    setAddingExpense(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount) return;
    const payload = { ...expenseForm, amount: parseFloat(expenseForm.amount) };
    if (editingExpenseId) {
      await api.expenses.update(id!, editingExpenseId, payload);
    } else {
      await api.expenses.create(id!, payload);
    }
    setExpenseForm(BLANK_EXPENSE);
    setEditingExpenseId(null);
    setAddingExpense(false);
    loadProject();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await api.expenses.delete(id!, expenseId);
    loadProject();
  };

  // ---- Phases ----
  const handleAddPhase = async () => {
    if (!newPhase.phase_name.trim()) return;
    await api.phases.create(id!, { phase_name: newPhase.phase_name, budget: parseFloat(newPhase.budget) || 0, target_date: newPhase.target_date });
    setNewPhase({ phase_name: '', budget: '', target_date: '' });
    setAddingPhase(false);
    loadProject();
  };

  const handleDeletePhase = async (phaseId: string) => {
    await api.phases.delete(id!, phaseId);
    setDeletingPhaseId(null);
    loadProject();
  };

  // ---- Loans ----
  const openNewLoan = () => {
    setLoanForm(BLANK_LOAN);
    setEditingLoanId(null);
    setAddingLoan(true);
  };

  const openEditLoan = (l: Loan) => {
    setLoanForm({
      lender: l.lender, loan_amount: String(l.loan_amount), interest_rate: String(l.interest_rate),
      points: String(l.points), term_months: String(l.term_months), monthly_payment: String(l.monthly_payment),
      origination_date: l.origination_date, maturity_date: l.maturity_date, notes: l.notes,
    });
    setEditingLoanId(l.id);
    setAddingLoan(true);
  };

  const handleSaveLoan = async () => {
    if (!loanForm.lender.trim()) return;
    const payload = {
      lender: loanForm.lender,
      loan_amount: parseFloat(loanForm.loan_amount) || 0,
      interest_rate: parseFloat(loanForm.interest_rate) || 0,
      points: parseFloat(loanForm.points) || 0,
      term_months: parseInt(loanForm.term_months) || 12,
      monthly_payment: parseFloat(loanForm.monthly_payment) || 0,
      origination_date: loanForm.origination_date,
      maturity_date: loanForm.maturity_date,
      notes: loanForm.notes,
    };
    if (editingLoanId) {
      await api.loans.update(id!, editingLoanId, payload);
    } else {
      await api.loans.create(id!, payload);
    }
    setLoanForm(BLANK_LOAN);
    setEditingLoanId(null);
    setAddingLoan(false);
    loadProject();
  };

  const handleDeleteLoan = async (loanId: string) => {
    await api.loans.delete(id!, loanId);
    loadProject();
  };

  // ---- Vendors ----
  const handleAttachVendor = async (vendorId: string) => {
    try {
      await api.vendors.attachToProject(vendorId, id!, {
        contracted_amount: parseFloat(attachForm.contracted_amount) || 0,
        phase_name: attachForm.phase_name,
        notes: attachForm.notes,
      });
      setAttachingVendorId(null);
      setAttachForm({ contracted_amount: '', phase_name: '', notes: '' });
      loadProject();
    } catch {}
  };

  const handleDetachVendor = async (vendorId: string) => {
    await api.vendors.detachFromProject(vendorId, id!);
    loadProject();
  };

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Project not found</p>
          <button onClick={() => navigate('/projects')} className="text-brand">Back to Projects</button>
        </div>
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
  const totalLoanAmount = (project.loans || []).reduce((s, l) => s + l.loan_amount, 0);

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'overview', label: 'Overview', Icon: FileText },
    { id: 'phases', label: 'Phases', Icon: Wrench },
    { id: 'expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'milestones', label: 'Timeline', Icon: Clock },
    { id: 'vendors', label: 'Vendors', Icon: Users },
    { id: 'financing', label: 'Financing', Icon: CreditCard },
  ];

  const rehabStatus = rehabPercent > 100 ? 'over_budget' : rehabPercent > 90 ? 'at_risk' : 'on_track';
  const rehabStatusLabel: Record<string, string> = { on_track: 'On Track', at_risk: 'At Risk', over_budget: 'Over Budget' };
  const rehabStatusColor: Record<string, string> = { on_track: 'text-green-400', at_risk: 'text-yellow-400', over_budget: 'text-red-400' };

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate('/projects')} className="text-brand">
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
          <button onClick={() => navigate(`/projects/${id}/edit`)} className="text-gray-400 hover:text-brand transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        <span className={`status-badge ${STATUS_COLORS[project.status]}`}>{project.status}</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto no-scrollbar border-b border-surface-400/30 px-5 mb-0">
        {tabs.map(({ id: tabId, label, Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === tabId ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 pb-24 space-y-4">

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <>
            <div className="card flex flex-col items-center py-6">
              <p className="label mb-4 text-center">Capital Utilization</p>
              <DonutChart percent={Math.min(capitalPercent, 99)} size={200} strokeWidth={20} />
              <p className="text-sm text-gray-400 text-center mt-4">
                {fmt(computed.totalInvestment + rehabSpent)} of total {fmt(project.estimated_sale_price)} estimated value committed.
              </p>
            </div>

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

            <div className="card">
              <h3 className="text-sm font-bold text-white mb-4">Renovation & Holding</h3>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider">Budget Utilization</span>
                <span className="font-bold text-white">{rehabPercent}%</span>
              </div>
              <div className="h-2 bg-surface-400 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(rehabPercent, 100)}%`,
                    background: rehabPercent >= 100 ? 'linear-gradient(90deg,#f97316,#ef4444)' : rehabPercent >= 90 ? 'linear-gradient(90deg,#f97316,#eab308)' : 'linear-gradient(90deg,#f97316,#fb923c)',
                  }}
                />
              </div>
              <p className={`text-xs font-semibold mb-4 ${rehabStatusColor[rehabStatus]}`}>
                {rehabStatusLabel[rehabStatus]} · {rehabPercent > 100 ? `$${(rehabSpent - project.rehab_budget).toLocaleString()} over budget` : `$${(project.rehab_budget - rehabSpent).toLocaleString()} remaining`}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Labor Spend</div>
                  <div className="text-lg font-bold text-white">{fmt(project.labor_cost)}</div>
                </div>
                <div className="bg-surface-600 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Materials</div>
                  <div className="text-lg font-bold text-white">{fmt(project.materials_cost)}</div>
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
                  <span className={`text-sm font-bold ${computed.roi >= 0 ? 'text-brand' : 'text-red-400'}`}>{computed.roi}%</span>
                </div>
              </div>
            </div>

            {project.milestones.filter(m => !m.completed).slice(0, 3).length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Upcoming Milestones</h3>
                  <button onClick={() => setTab('milestones')} className="text-xs text-brand">View All</button>
                </div>
                <div className="space-y-2">
                  {project.milestones.filter(m => !m.completed).slice(0, 3).map(m => {
                    const overdue = daysOverdue(m.due_date);
                    return (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${overdue > 0 ? 'bg-red-400' : 'bg-brand'}`} />
                          <span className="text-sm text-white">{m.title}</span>
                        </div>
                        <span className={`text-xs ${overdue > 0 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                          {overdue > 0 ? `${overdue}d overdue` : fmtDateShort(m.due_date)}
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
              <div className="w-12 h-12">
                <DonutChart percent={phaseProgress} size={48} strokeWidth={6} label="" />
              </div>
            </div>

            <button
              onClick={() => setAddingPhase(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} /> Add Phase
            </button>

            {addingPhase && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">New Phase</h4>
                  <button onClick={() => setAddingPhase(false)}><X size={16} className="text-gray-400" /></button>
                </div>
                <div>
                  <label className="label">Phase Name</label>
                  <select
                    value={newPhase.phase_name}
                    onChange={e => setNewPhase(p => ({ ...p, phase_name: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select or type...</option>
                    {RENOVATION_PHASES.map(p => (
                      <option key={p.name} value={p.name}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Budget</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="number" value={newPhase.budget} onChange={e => setNewPhase(p => ({ ...p, budget: e.target.value }))} placeholder="0" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Target Date</label>
                    <input type="date" value={newPhase.target_date} onChange={e => setNewPhase(p => ({ ...p, target_date: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <button onClick={handleAddPhase} className="btn-primary rounded-xl py-3">Add Phase</button>
              </div>
            )}

            {project.phases.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No renovation phases yet. Add your first one above.</p>
              </div>
            ) : (
              project.phases.map(phase => {
                const budgetPct = phase.budget > 0 ? Math.min((phase.actual_cost / phase.budget) * 100, 100) : 0;
                const overBudget = phase.budget > 0 && phase.actual_cost > phase.budget;
                return (
                  <div key={phase.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePhaseStatusCycle(phase)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                            phase.status === 'completed' ? 'bg-green-500 border-green-500'
                              : phase.status === 'in_progress' ? 'bg-brand/20 border-brand'
                              : 'border-surface-300'
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
                        <span className={`status-badge text-[10px] ${PHASE_STATUS_COLORS[phase.status]}`}>
                          {phase.status.replace('_', ' ')}
                        </span>
                        {deletingPhaseId === phase.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDeletePhase(phase.id)} className="text-xs text-red-400 font-semibold px-2 py-1 bg-red-500/10 rounded-lg">Del</button>
                            <button onClick={() => setDeletingPhaseId(null)} className="text-xs text-gray-400 px-2 py-1 bg-surface-500 rounded-lg">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingPhaseId(phase.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {(phase.budget > 0 || phase.actual_cost > 0) && (
                      <div className="mt-3 pt-3 border-t border-surface-400/20">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-500">Budget: </span>
                            <span className="text-white font-semibold">{fmt(phase.budget)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Actual: </span>
                            <span className={`font-semibold ${overBudget ? 'text-red-400' : 'text-green-400'}`}>{fmt(phase.actual_cost)}</span>
                          </div>
                        </div>
                        {phase.budget > 0 && (
                          <div className="h-1.5 bg-surface-400 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${budgetPct}%`,
                                background: overBudget ? '#ef4444' : budgetPct > 90 ? '#eab308' : '#22c55e',
                              }}
                            />
                          </div>
                        )}
                        {overBudget && (
                          <p className="text-xs text-red-400 mt-1 font-semibold">
                            +{fmt(phase.actual_cost - phase.budget)} over budget
                          </p>
                        )}
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
              onClick={openNewExpense}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} /> Add Expense
            </button>

            {addingExpense && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">{editingExpenseId ? 'Edit Expense' : 'New Expense'}</h4>
                  <button onClick={() => { setAddingExpense(false); setEditingExpenseId(null); }}><X size={16} className="text-gray-400" /></button>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Kitchen cabinets" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Amount</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <input value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} placeholder="Invoice #, vendor, etc." className="input-field" />
                </div>
                <button onClick={handleSaveExpense} className="btn-primary rounded-xl py-3">{editingExpenseId ? 'Update Expense' : 'Add Expense'}</button>
              </div>
            )}

            {project.expenses.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No expenses logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.expenses.map(e => (
                  <div key={e.id} className="card flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{e.category} · {fmtDateShort(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-sm font-bold text-white">{fmt(e.amount)}</span>
                      <button onClick={() => openEditExpense(e)} className="text-gray-500 hover:text-brand transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDeleteExpense(e.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <X size={14} />
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
              onClick={() => setAddingMilestone(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} /> Add Milestone
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
                <div>
                  <label className="label">Notes (optional)</label>
                  <input value={newMilestone.notes} onChange={e => setNewMilestone(p => ({ ...p, notes: e.target.value }))} placeholder="Permit #, contact, etc." className="input-field" />
                </div>
                <button onClick={handleAddMilestone} className="btn-primary rounded-xl py-3">Add Milestone</button>
              </div>
            )}

            {project.milestones.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No milestones yet. Add key dates and checkpoints.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-400/50" />
                <div className="space-y-3 pl-10">
                  {project.milestones.map(m => {
                    const overdue = !m.completed && daysOverdue(m.due_date) > 0;
                    return (
                      <div key={m.id} className="relative">
                        <div
                          className={`absolute -left-[30px] top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            m.completed ? 'bg-green-500 border-green-500' : overdue ? 'bg-red-500/20 border-red-400' : 'bg-surface-700 border-brand'
                          }`}
                          onClick={() => handleToggleMilestone(m)}
                        >
                          {m.completed && <Check size={10} className="text-white" />}
                          {!m.completed && overdue && <AlertTriangle size={8} className="text-red-400" />}
                        </div>
                        <div className={`card flex items-start justify-between ${m.completed ? 'opacity-60' : ''}`}>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${m.completed ? 'line-through text-gray-500' : 'text-white'}`}>{m.title}</p>
                            {m.due_date && (
                              <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                                {m.completed && m.completed_date
                                  ? `Completed ${fmtDateShort(m.completed_date)}`
                                  : overdue
                                  ? `${daysOverdue(m.due_date)} days overdue (${fmtDateShort(m.due_date)})`
                                  : `Due ${fmtDateShort(m.due_date)}`}
                              </p>
                            )}
                            {m.notes && <p className="text-xs text-gray-500 mt-1 italic">{m.notes}</p>}
                          </div>
                          <button onClick={() => handleDeleteMilestone(m.id)} className="text-gray-600 hover:text-red-400 ml-2 flex-shrink-0">
                            <X size={14} />
                          </button>
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
                    {v.specialty && (
                      <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full mt-1 inline-block">{v.specialty}</span>
                    )}
                  </div>
                  <button onClick={() => handleDetachVendor(v.vendor_id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {v.phone && <a href={`tel:${v.phone}`} className="text-brand">{v.phone}</a>}
                  {v.contracted_amount > 0 && (
                    <div><span className="text-gray-500">Contracted: </span><span className="text-white font-semibold">{fmt(v.contracted_amount)}</span></div>
                  )}
                  {v.paid_amount > 0 && (
                    <div><span className="text-gray-500">Paid: </span><span className="text-green-400 font-semibold">{fmt(v.paid_amount)}</span></div>
                  )}
                  {v.contracted_amount > 0 && v.contracted_amount > v.paid_amount && (
                    <div><span className="text-gray-500">Owed: </span><span className="text-red-400 font-semibold">{fmt(v.contracted_amount - v.paid_amount)}</span></div>
                  )}
                </div>
              </div>
            ))}

            <div className="card">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Attach Vendor</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {allVendors
                  .filter(v => !project.vendors.some(pv => pv.vendor_id === v.id))
                  .map(v => (
                    <div key={v.id}>
                      {attachingVendorId === v.id ? (
                        <div className="p-3 rounded-lg bg-surface-600 space-y-2">
                          <p className="text-sm font-bold text-white">{v.name}</p>
                          <div>
                            <label className="label text-[10px]">Contracted Amount</label>
                            <div className="relative">
                              <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                              <input
                                type="number"
                                value={attachForm.contracted_amount}
                                onChange={e => setAttachForm(p => ({ ...p, contracted_amount: e.target.value }))}
                                placeholder="0"
                                className="input-field pl-8 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="label text-[10px]">Phase / Scope</label>
                            <input
                              value={attachForm.phase_name}
                              onChange={e => setAttachForm(p => ({ ...p, phase_name: e.target.value }))}
                              placeholder="e.g. Kitchen"
                              className="input-field py-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAttachVendor(v.id)} className="flex-1 py-2 rounded-lg bg-brand text-white text-xs font-bold">Attach</button>
                            <button onClick={() => setAttachingVendorId(null)} className="flex-1 py-2 rounded-lg bg-surface-500 text-gray-300 text-xs font-semibold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAttachingVendorId(v.id); setAttachForm({ contracted_amount: '', phase_name: '', notes: '' }); }}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-surface-600 hover:bg-surface-500 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm text-white font-medium">{v.name}</p>
                            <p className="text-xs text-gray-400">{v.specialty}</p>
                          </div>
                          <Plus size={16} className="text-brand flex-shrink-0" />
                        </button>
                      )}
                    </div>
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

        {/* ===== FINANCING ===== */}
        {tab === 'financing' && (
          <div className="space-y-3">
            {(project.loans || []).length > 0 && (
              <div className="card">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Borrowed</div>
                <div className="text-2xl font-bold text-white">{fmtFull(totalLoanAmount)}</div>
                <div className="text-xs text-gray-400 mt-0.5">{project.loans.length} loan{project.loans.length !== 1 ? 's' : ''}</div>
              </div>
            )}

            <button
              onClick={openNewLoan}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-surface-400 rounded-xl py-3 text-sm text-gray-400 hover:border-brand/50 hover:text-brand transition-colors"
            >
              <Plus size={16} /> Add Loan
            </button>

            {addingLoan && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white">{editingLoanId ? 'Edit Loan' : 'New Loan'}</h4>
                  <button onClick={() => { setAddingLoan(false); setEditingLoanId(null); }}><X size={16} className="text-gray-400" /></button>
                </div>
                <div>
                  <label className="label">Lender Name</label>
                  <input value={loanForm.lender} onChange={e => setLoanForm(p => ({ ...p, lender: e.target.value }))} placeholder="ABC Hard Money LLC" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Loan Amount</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="number" value={loanForm.loan_amount} onChange={e => setLoanForm(p => ({ ...p, loan_amount: e.target.value }))} placeholder="0" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Interest Rate %</label>
                    <input type="number" value={loanForm.interest_rate} onChange={e => setLoanForm(p => ({ ...p, interest_rate: e.target.value }))} placeholder="12" className="input-field" step="0.1" />
                  </div>
                  <div>
                    <label className="label">Points %</label>
                    <input type="number" value={loanForm.points} onChange={e => setLoanForm(p => ({ ...p, points: e.target.value }))} placeholder="2" className="input-field" step="0.25" />
                  </div>
                  <div>
                    <label className="label">Term (months)</label>
                    <input type="number" value={loanForm.term_months} onChange={e => setLoanForm(p => ({ ...p, term_months: e.target.value }))} placeholder="12" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Monthly Payment</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="number" value={loanForm.monthly_payment} onChange={e => setLoanForm(p => ({ ...p, monthly_payment: e.target.value }))} placeholder="0" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Origination Date</label>
                    <input type="date" value={loanForm.origination_date} onChange={e => setLoanForm(p => ({ ...p, origination_date: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label">Maturity Date</label>
                  <input type="date" value={loanForm.maturity_date} onChange={e => setLoanForm(p => ({ ...p, maturity_date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input value={loanForm.notes} onChange={e => setLoanForm(p => ({ ...p, notes: e.target.value }))} placeholder="Draw schedule, conditions, etc." className="input-field" />
                </div>
                <button onClick={handleSaveLoan} className="btn-primary rounded-xl py-3">{editingLoanId ? 'Update Loan' : 'Add Loan'}</button>
              </div>
            )}

            {(project.loans || []).length === 0 ? (
              <div className="card text-center py-8">
                <CreditCard size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No financing tracked yet.</p>
                <p className="text-xs text-gray-500 mt-1">Track hard money loans, private money, and draw schedules.</p>
              </div>
            ) : (
              project.loans.map(loan => {
                const pointsCost = (loan.points / 100) * loan.loan_amount;
                const totalInterest = loan.monthly_payment * loan.term_months - loan.loan_amount;
                return (
                  <div key={loan.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-white text-sm">{loan.lender}</p>
                        <p className="text-xs text-gray-400">{loan.interest_rate}% rate · {loan.points} pts · {loan.term_months}mo</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditLoan(loan)} className="text-gray-500 hover:text-brand transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteLoan(loan.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-surface-600 rounded-xl p-3">
                        <div className="text-gray-500 uppercase tracking-wider mb-1">Loan Amount</div>
                        <div className="text-lg font-bold text-white">{fmt(loan.loan_amount)}</div>
                      </div>
                      <div className="bg-surface-600 rounded-xl p-3">
                        <div className="text-gray-500 uppercase tracking-wider mb-1">Monthly Pmt</div>
                        <div className="text-lg font-bold text-white">{loan.monthly_payment > 0 ? fmt(loan.monthly_payment) : '—'}</div>
                      </div>
                    </div>
                    {(pointsCost > 0 || totalInterest > 0) && (
                      <div className="mt-3 pt-3 border-t border-surface-400/20 grid grid-cols-2 gap-2 text-xs">
                        {pointsCost > 0 && (
                          <div><span className="text-gray-500">Points cost: </span><span className="text-red-400 font-semibold">{fmt(pointsCost)}</span></div>
                        )}
                        {totalInterest > 0 && (
                          <div><span className="text-gray-500">Est. interest: </span><span className="text-red-400 font-semibold">{fmt(totalInterest)}</span></div>
                        )}
                        {loan.origination_date && <div><span className="text-gray-500">Originated: </span><span className="text-white">{fmtDateShort(loan.origination_date)}</span></div>}
                        {loan.maturity_date && <div><span className="text-gray-500">Matures: </span><span className="text-white">{fmtDateShort(loan.maturity_date)}</span></div>}
                      </div>
                    )}
                    {loan.notes && <p className="text-xs text-gray-500 mt-2 italic">{loan.notes}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-5 pb-8">
          <div className="bg-surface-700 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete "{project.name || project.address}" and all its data.
            </p>
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

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
