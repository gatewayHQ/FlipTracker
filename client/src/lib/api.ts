const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
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
  bids: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/bids`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/bids`, data),
    update: (projectId: string, bidId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/bids/${bidId}`, data),
    delete: (projectId: string, bidId: string) =>
      req('DELETE', `/projects/${projectId}/bids/${bidId}`),
    approve: (projectId: string, bidId: string) =>
      req('PUT', `/projects/${projectId}/bids/${bidId}/approve`),
    reject: (projectId: string, bidId: string) =>
      req('PUT', `/projects/${projectId}/bids/${bidId}/reject`),
  },
  changeOrders: {
    list: (projectId: string) => req('GET', `/projects/${projectId}/change-orders`),
    create: (projectId: string, data: unknown) => req('POST', `/projects/${projectId}/change-orders`, data),
    update: (projectId: string, coId: string, data: unknown) =>
      req('PUT', `/projects/${projectId}/change-orders/${coId}`, data),
    delete: (projectId: string, coId: string) =>
      req('DELETE', `/projects/${projectId}/change-orders/${coId}`),
    approve: (projectId: string, coId: string) =>
      req('PUT', `/projects/${projectId}/change-orders/${coId}/approve`),
    reject: (projectId: string, coId: string) =>
      req('PUT', `/projects/${projectId}/change-orders/${coId}/reject`),
  },
  contractor: {
    generateLink: (projectId: string, vendorId: string, data?: unknown) =>
      req('POST', `/projects/${projectId}/vendors/${vendorId}/portal-link`, data ?? {}),
    listLinks: (projectId: string, vendorId: string) =>
      req('GET', `/projects/${projectId}/vendors/${vendorId}/portal-links`),
    revokeLink: (tokenId: string) => req('DELETE', `/contractor-tokens/${tokenId}`),
    // Public portal (no auth needed — use fetch directly in ContractorPortal)
    getPortal: (token: string) => req('GET', `/contractor/${token}`),
    updatePhase: (token: string, phaseId: string, data: unknown) =>
      req('PUT', `/contractor/${token}/phases/${phaseId}`, data),
    submitPayRequest: (token: string, data: unknown) =>
      req('POST', `/contractor/${token}/pay-request`, data),
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
