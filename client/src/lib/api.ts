const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ff_token');
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('ff_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      req<{ token: string; user: any }>('POST', '/auth/register', data),
    login: (data: { email: string; password: string }) =>
      req<{ token: string; user: any }>('POST', '/auth/login', data),
    me: () => req<any>('GET', '/auth/me'),
    updateProfile: (data: { name?: string; email?: string }) =>
      req<any>('PUT', '/auth/profile', data),
    updateSettings: (data: { capital_goal?: number; target_roi?: number; target_flip_days?: number; notifications_enabled?: number }) =>
      req<any>('PUT', '/auth/settings', data),
  },
  dashboard: {
    get: () => req('GET', '/dashboard'),
  },
  projects: {
    list: () => req('GET', '/projects'),
    get: (id: string) => req('GET', `/projects/${id}`),
    create: (data: unknown) => req('POST', '/projects', data),
    update: (id: string, data: unknown) => req('PUT', `/projects/${id}`, data),
    delete: (id: string) => req('DELETE', `/projects/${id}`),
  },
  phases: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/phases`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/phases`, data),
    update: (projectId: string, phaseId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/phases/${phaseId}`, data),
    delete: (projectId: string, phaseId: string) =>
      req('DELETE', `/projects/${projectId}/phases/${phaseId}`),
  },
  expenses: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/expenses`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/expenses`, data),
    update: (projectId: string, expenseId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/expenses/${expenseId}`, data),
    delete: (projectId: string, expenseId: string) =>
      req('DELETE', `/projects/${projectId}/expenses/${expenseId}`),
  },
  milestones: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/milestones`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/milestones`, data),
    update: (projectId: string, milestoneId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/milestones/${milestoneId}`, data),
    delete: (projectId: string, milestoneId: string) =>
      req('DELETE', `/projects/${projectId}/milestones/${milestoneId}`),
  },
  loans: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/loans`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/loans`, data),
    update: (projectId: string, loanId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/loans/${loanId}`, data),
    delete: (projectId: string, loanId: string) =>
      req('DELETE', `/projects/${projectId}/loans/${loanId}`),
  },
  vendors: {
    list: () => req('GET', '/vendors'),
    get: (id: string) => req('GET', `/vendors/${id}`),
    create: (data: unknown) => req('POST', '/vendors', data),
    update: (id: string, data: unknown) => req('PUT', `/vendors/${id}`, data),
    delete: (id: string) => req('DELETE', `/vendors/${id}`),
    attachToProject: (vendorId: string, projectId: string, data: unknown) =>
      req('POST', `/vendors/${vendorId}/projects/${projectId}`, data),
    detachFromProject: (vendorId: string, projectId: string) =>
      req('DELETE', `/vendors/${vendorId}/projects/${projectId}`),
  },
  tasks: {
    create: (projectId: string, phaseId: string, data: unknown) =>
      req('POST', `/projects/${projectId}/phases/${phaseId}/tasks`, data),
    update: (projectId: string, phaseId: string, taskId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/phases/${phaseId}/tasks/${taskId}`, data),
    delete: (projectId: string, phaseId: string, taskId: string) =>
      req('DELETE', `/projects/${projectId}/phases/${phaseId}/tasks/${taskId}`),
  },
  comps: {
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/comps`, data),
    delete: (projectId: string, compId: string) => req('DELETE', `/projects/${projectId}/comps/${compId}`),
  },
  notes: {
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/notes`, data),
    delete: (projectId: string, noteId: string) => req('DELETE', `/projects/${projectId}/notes/${noteId}`),
  },
  documents: {
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/documents`, data),
    delete: (projectId: string, docId: string) => req('DELETE', `/projects/${projectId}/documents/${docId}`),
  },
  analyzer: {
    list: () => req('GET', '/analyzer'),
    create: (data: unknown) => req('POST', '/analyzer', data),
    update: (id: string, data: unknown) => req('PUT', `/analyzer/${id}`, data),
    delete: (id: string) => req('DELETE', `/analyzer/${id}`),
  },
};

export function fmt(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function fmtFull(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

export function fmtDate(date: string): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateShort(date: string): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysOverdue(dateStr: string): number {
  if (!dateStr) return 0;
  const due = new Date(dateStr + 'T00:00:00').getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr + 'T00:00:00').getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}
