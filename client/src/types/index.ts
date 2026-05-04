export type ProjectStatus = 'acquired' | 'renovation' | 'listed' | 'sold' | 'cancelled';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  status: ProjectStatus;
  purchase_price: number;
  legal_fees: number;
  inspection_cost: number;
  closing_costs: number;
  rehab_budget: number;
  labor_cost: number;
  materials_cost: number;
  holding_costs_monthly: number;
  estimated_sale_price: number;
  actual_sale_price: number;
  // Supabase returns date columns as "YYYY-MM-DD" string or null
  acquisition_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  listed_date: string | null;
  sold_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // enriched fields added client-side
  phase_count?: number;
  completed_phases?: number;
  progress?: number;
  total_investment?: number;
  est_profit?: number;
}

export interface ProjectDetail extends Project {
  phases: RenovationPhase[];
  expenses: Expense[];
  milestones: Milestone[];
  vendors: ProjectVendor[];
  computed: {
    totalInvestment: number;
    totalExpenses: number;
    holdingTotal: number;
    estProfit: number;
    roi: number;
  };
}

export interface RenovationPhase {
  id: string;
  project_id: string;
  user_id?: string;
  phase_name: string;
  status: PhaseStatus;
  budget: number;
  actual_cost: number;
  start_date: string | null;
  target_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  specialty: string;
  rating: number;
  hourly_rate: number;
  notes: string | null;
  created_at: string;
}

export interface VendorDetail extends Vendor {
  projects: ProjectVendor[];
}

export interface ProjectVendor {
  id: string;
  project_id: string;
  vendor_id: string;
  user_id?: string;
  phase_name: string | null;
  contracted_amount: number;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  vendor_name?: string;
  company?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  rating?: number;
  project_name?: string;
  project_status?: string;
}

export interface Expense {
  id: string;
  project_id: string;
  user_id?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  user_id?: string;
  title: string;
  due_date: string | null;
  completed: boolean;          // PostgreSQL boolean (not SQLite 0/1)
  completed_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalProjects: number;
  capitalDeployed: number;
  estTotalProfit: number;
  avgDaysToFlip: number;
  activeProjects: number;
  soldProjects: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: (Project & { phase_count: number; completed_phases: number; progress: number })[];
}

export const RENOVATION_PHASES = [
  { name: 'Demo', icon: '🔨' },
  { name: 'Junk Removal', icon: '🗑️' },
  { name: 'Roof', icon: '🏠' },
  { name: 'Framing', icon: '🪵' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Plumbing', icon: '🔧' },
  { name: 'HVAC', icon: '❄️' },
  { name: 'Drywall', icon: '🧱' },
  { name: 'Flooring', icon: '🪵' },
  { name: 'Paint', icon: '🎨' },
  { name: 'Kitchen', icon: '🍳' },
  { name: 'Bathrooms', icon: '🛁' },
  { name: 'Bedroom', icon: '🛏️' },
  { name: 'Landscaping', icon: '🌿' },
  { name: 'Final Punch', icon: '✅' },
];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  acquired: 'bg-blue-500/20 text-blue-400',
  renovation: 'bg-brand/20 text-brand',
  listed: 'bg-purple-500/20 text-purple-400',
  sold: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export const EXPENSE_CATEGORIES = [
  { value: 'purchase', label: 'Purchase Price' },
  { value: 'closing', label: 'Closing Costs' },
  { value: 'legal', label: 'Legal & Title' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'holding', label: 'Holding Costs' },
  { value: 'permits', label: 'Permits' },
  { value: 'misc', label: 'Miscellaneous' },
];
