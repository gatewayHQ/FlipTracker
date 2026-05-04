import { supabase } from './supabase';
import type {
  Project, ProjectDetail, RenovationPhase, Vendor,
  Expense, Milestone, DashboardData,
} from '../types';

// ─── helpers ────────────────────────────────────────────────
async function uid(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function raise(error: any): never {
  throw new Error(error?.message ?? 'Unknown error');
}

// ─── formatters (used across pages) ─────────────────────────
export function fmt(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function fmtFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(amount);
}

export function fmtDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function fmtDateShort(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ─── computed helpers ────────────────────────────────────────
export function computeProject(p: Project) {
  const totalInvestment = p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs;
  const totalExpenses = p.labor_cost + p.materials_cost;
  const holdingTotal = p.holding_costs_monthly * 6;
  const salePrice = p.actual_sale_price > 0 ? p.actual_sale_price : p.estimated_sale_price;
  const estProfit = salePrice - totalInvestment - totalExpenses - holdingTotal;
  const roi = (totalInvestment + totalExpenses + holdingTotal) > 0
    ? Math.round((estProfit / (totalInvestment + totalExpenses + holdingTotal)) * 1000) / 10
    : 0;
  return { totalInvestment, totalExpenses, holdingTotal, estProfit, roi };
}

// ─── dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const userId = await uid();

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`*, renovation_phases(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) raise(error);

    const active = (projects ?? []).filter((p: any) =>
      ['acquired', 'renovation', 'listed'].includes(p.status));

    const capitalDeployed = active.reduce((s: number, p: any) =>
      s + p.purchase_price + p.legal_fees + p.inspection_cost + p.closing_costs + p.labor_cost + p.materials_cost, 0);

    const estTotalProfit = (projects ?? [])
      .filter((p: any) => p.status !== 'cancelled')
      .reduce((s: number, p: any) => {
        const { estProfit } = computeProject(p as Project);
        return s + estProfit;
      }, 0);

    const soldProjects = (projects ?? []).filter((p: any) => p.status === 'sold' && p.acquisition_date && p.sold_date);
    const avgDaysToFlip = soldProjects.length > 0
      ? Math.round(soldProjects.reduce((s: number, p: any) => {
          const days = (new Date(p.sold_date).getTime() - new Date(p.acquisition_date).getTime()) / 86400000;
          return s + days;
        }, 0) / soldProjects.length)
      : 42;

    const recentProjects = (projects ?? []).slice(0, 5).map((p: any) => {
      const phases: any[] = p.renovation_phases ?? [];
      const completedPhases = phases.filter((ph: any) => ph.status === 'completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
      const { estProfit } = computeProject(p as Project);
      return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress, est_profit: estProfit };
    });

    return {
      stats: {
        totalProjects: (projects ?? []).length,
        capitalDeployed,
        estTotalProfit,
        avgDaysToFlip,
        activeProjects: active.length,
        soldProjects: (projects ?? []).filter((p: any) => p.status === 'sold').length,
      },
      recentProjects,
    };
  },
};

// ─── projects ────────────────────────────────────────────────
export const projectsApi = {
  async list(): Promise<Project[]> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('projects')
      .select(`*, renovation_phases(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) raise(error);
    return (data ?? []).map((p: any) => {
      const phases: any[] = p.renovation_phases ?? [];
      const completedPhases = phases.filter((ph: any) => ph.status === 'completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;
      const { estProfit } = computeProject(p as Project);
      return { ...p, phase_count: phases.length, completed_phases: completedPhases, progress, est_profit: estProfit };
    });
  },

  async get(id: string): Promise<ProjectDetail> {
    const userId = await uid();
    const { data: p, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error) raise(error);

    const [phases, expenses, milestones, pv] = await Promise.all([
      supabase.from('renovation_phases').select('*').eq('project_id', id).order('created_at'),
      supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('milestones').select('*').eq('project_id', id).order('due_date'),
      supabase.from('project_vendors')
        .select('*, vendors(name,company,phone,email,specialty,rating)')
        .eq('project_id', id),
    ]);

    if (phases.error) raise(phases.error);
    if (expenses.error) raise(expenses.error);
    if (milestones.error) raise(milestones.error);

    const vendors = (pv.data ?? []).map((row: any) => ({
      ...row,
      vendor_name: row.vendors?.name,
      company: row.vendors?.company,
      phone: row.vendors?.phone,
      email: row.vendors?.email,
      specialty: row.vendors?.specialty,
      rating: row.vendors?.rating,
    }));

    const computed = computeProject(p as Project);
    return { ...p, phases: phases.data ?? [], expenses: expenses.data ?? [], milestones: milestones.data ?? [], vendors, computed };
  },

  async create(payload: Partial<Project> & { phases?: string[] }): Promise<Project> {
    const userId = await uid();
    const { phases, ...rest } = payload;
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...rest, user_id: userId })
      .select()
      .single();
    if (error) raise(error);

    if (phases && phases.length > 0) {
      const phaseRows = phases.map(phase_name => ({
        project_id: data.id, user_id: userId, phase_name, status: 'pending',
      }));
      const { error: pe } = await supabase.from('renovation_phases').insert(phaseRows);
      if (pe) raise(pe);
    }
    return data;
  },

  async update(id: string, payload: Partial<Project>): Promise<Project> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) raise(error);
    return data;
  },

  async delete(id: string): Promise<void> {
    const userId = await uid();
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', userId);
    if (error) raise(error);
  },
};

// ─── phases ──────────────────────────────────────────────────
export const phasesApi = {
  async create(projectId: string, payload: Partial<RenovationPhase>): Promise<RenovationPhase> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('renovation_phases')
      .insert({ ...payload, project_id: projectId, user_id: userId })
      .select().single();
    if (error) raise(error);
    return data;
  },

  async update(phaseId: string, payload: Partial<RenovationPhase>): Promise<RenovationPhase> {
    const { data, error } = await supabase
      .from('renovation_phases').update(payload).eq('id', phaseId).select().single();
    if (error) raise(error);
    return data;
  },

  async delete(phaseId: string): Promise<void> {
    const { error } = await supabase.from('renovation_phases').delete().eq('id', phaseId);
    if (error) raise(error);
  },
};

// ─── expenses ────────────────────────────────────────────────
export const expensesApi = {
  async create(projectId: string, payload: Partial<Expense>): Promise<Expense> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...payload, project_id: projectId, user_id: userId })
      .select().single();
    if (error) raise(error);
    return data;
  },

  async delete(expenseId: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) raise(error);
  },
};

// ─── milestones ───────────────────────────────────────────────
export const milestonesApi = {
  async create(projectId: string, payload: Partial<Milestone>): Promise<Milestone> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('milestones')
      .insert({ ...payload, project_id: projectId, user_id: userId })
      .select().single();
    if (error) raise(error);
    return data;
  },

  async update(milestoneId: string, payload: Partial<Milestone>): Promise<Milestone> {
    const { data, error } = await supabase
      .from('milestones').update(payload).eq('id', milestoneId).select().single();
    if (error) raise(error);
    return data;
  },

  async delete(milestoneId: string): Promise<void> {
    const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
    if (error) raise(error);
  },
};

// ─── vendors ─────────────────────────────────────────────────
export const vendorsApi = {
  async list(): Promise<Vendor[]> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('vendors').select('*').eq('user_id', userId).order('name');
    if (error) raise(error);
    return data ?? [];
  },

  async create(payload: Partial<Vendor>): Promise<Vendor> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('vendors').insert({ ...payload, user_id: userId }).select().single();
    if (error) raise(error);
    return data;
  },

  async update(id: string, payload: Partial<Vendor>): Promise<Vendor> {
    const userId = await uid();
    const { data, error } = await supabase
      .from('vendors').update(payload).eq('id', id).eq('user_id', userId).select().single();
    if (error) raise(error);
    return data;
  },

  async delete(id: string): Promise<void> {
    const userId = await uid();
    const { error } = await supabase.from('vendors').delete().eq('id', id).eq('user_id', userId);
    if (error) raise(error);
  },

  async attachToProject(vendorId: string, projectId: string, payload: object): Promise<void> {
    const userId = await uid();
    const { error } = await supabase.from('project_vendors').insert({
      vendor_id: vendorId, project_id: projectId, user_id: userId, ...payload,
    });
    if (error) raise(error);
  },

  async detachFromProject(vendorId: string, projectId: string): Promise<void> {
    const { error } = await supabase.from('project_vendors')
      .delete().eq('vendor_id', vendorId).eq('project_id', projectId);
    if (error) raise(error);
  },
};

// Legacy default export so existing page imports keep working
export const api = {
  dashboard: { get: dashboardApi.get },
  projects: projectsApi,
  phases: {
    create: phasesApi.create,
    update: (_pid: string, phaseId: string, payload: any) => phasesApi.update(phaseId, payload),
    delete: (_pid: string, phaseId: string) => phasesApi.delete(phaseId),
  },
  expenses: {
    create: expensesApi.create,
    delete: (_pid: string, expenseId: string) => expensesApi.delete(expenseId),
  },
  milestones: {
    create: milestonesApi.create,
    update: (_pid: string, milestoneId: string, payload: any) => milestonesApi.update(milestoneId, payload),
    delete: (_pid: string, milestoneId: string) => milestonesApi.delete(milestoneId),
  },
  vendors: vendorsApi,
};
