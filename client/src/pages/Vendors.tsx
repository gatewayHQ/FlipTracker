import { useState, useEffect } from 'react';
import {
  Plus, Star, Phone, Mail, X, ChevronDown, ChevronUp,
  Search, Wrench, ShieldCheck, ShieldAlert, ShieldX,
  AlertTriangle, Ban, FileCheck, FileX,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Vendor } from '../types';

type W9Status = 'missing' | 'pending' | 'received';

type FormData = {
  name: string; company: string; phone: string; email: string;
  specialty: string; trade_category: string;
  rating: string; hourly_rate: string; notes: string;
  license_number: string; license_state: string;
  insurance_expiry: string; w9_status: W9Status; do_not_rehire: boolean;
};

const INITIAL_FORM: FormData = {
  name: '', company: '', phone: '', email: '',
  specialty: '', trade_category: '', rating: '5', hourly_rate: '', notes: '',
  license_number: '', license_state: '', insurance_expiry: '',
  w9_status: 'missing', do_not_rehire: false,
};

const SPECIALTIES = [
  'General Contractor', 'Electrical', 'Plumbing', 'HVAC', 'Roofing',
  'Flooring', 'Painting', 'Landscaping', 'Demolition', 'Framing',
  'Drywall', 'Kitchen & Bath', 'Windows & Doors', 'Concrete', 'Other',
];

const W9_OPTIONS: { value: W9Status; label: string }[] = [
  { value: 'missing', label: 'Not Collected' },
  { value: 'pending', label: 'Requested' },
  { value: 'received', label: 'On File' },
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange?.(i)} className={i <= value ? 'text-brand' : 'text-surface-400'}>
          <Star size={16} fill={i <= value ? '#f97316' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function daysUntilExpiry(dateStr: string): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
}

function InsuranceBadge({ expiry }: { expiry: string }) {
  if (!expiry) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-500 text-gray-500 font-bold">No COI</span>;
  const days = daysUntilExpiry(expiry);
  if (days < 0) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
      <ShieldX size={10} />COI Expired
    </span>
  );
  if (days <= 30) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">
      <ShieldAlert size={10} />Expires {days}d
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
      <ShieldCheck size={10} />COI Valid
    </span>
  );
}

function W9Badge({ status }: { status: W9Status }) {
  if (status === 'received') return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
      <FileCheck size={10} />W9 On File
    </span>
  );
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">
      <FileX size={10} />W9 Pending
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-surface-500 text-gray-500 font-bold">
      <FileX size={10} />W9 Missing
    </span>
  );
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [complianceFilter, setComplianceFilter] = useState(false);

  const load = () => {
    api.vendors.list().then(v => { setVendors(v as Vendor[]); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name, company: v.company, phone: v.phone, email: v.email,
      specialty: v.specialty, trade_category: v.trade_category ?? '',
      rating: String(v.rating), hourly_rate: String(v.hourly_rate || ''), notes: v.notes,
      license_number: v.license_number ?? '', license_state: v.license_state ?? '',
      insurance_expiry: v.insurance_expiry ?? '', w9_status: v.w9_status ?? 'missing',
      do_not_rehire: Boolean(v.do_not_rehire),
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      rating: parseInt(form.rating) || 5,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      do_not_rehire: form.do_not_rehire ? 1 : 0,
    };
    if (editingId) { await api.vendors.update(editingId, payload); }
    else { await api.vendors.create(payload); }
    setShowForm(false); setEditingId(null); setForm(INITIAL_FORM); setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => { await api.vendors.delete(id); load(); };

  const allSpecialties = [...new Set(vendors.map(v => v.specialty).filter(Boolean))];

  // Flag vendors with compliance issues
  const hasComplianceIssue = (v: Vendor) => {
    const insExpiry = v.insurance_expiry ? daysUntilExpiry(v.insurance_expiry) : Infinity;
    return v.do_not_rehire || insExpiry < 0 || insExpiry <= 30 || v.w9_status === 'missing';
  };

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.company?.toLowerCase().includes(q) || v.specialty?.toLowerCase().includes(q);
    const matchSpec = !specialtyFilter || v.specialty === specialtyFilter;
    const matchCompliance = !complianceFilter || hasComplianceIssue(v);
    return matchSearch && matchSpec && matchCompliance;
  });

  const complianceIssueCount = vendors.filter(hasComplianceIssue).length;

  return (
    <div className="min-h-full bg-surface-900">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Vendors</h1>
          {complianceIssueCount > 0 && (
            <p className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
              <AlertTriangle size={11} />{complianceIssueCount} compliance issue{complianceIssueCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(INITIAL_FORM); }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="input-field pl-10" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSpecialtyFilter('')}
          className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${!specialtyFilter && !complianceFilter ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
        >
          All
        </button>
        {complianceIssueCount > 0 && (
          <button
            onClick={() => setComplianceFilter(c => !c)}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${complianceFilter ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'border-surface-400 text-gray-400'}`}
          >
            <AlertTriangle size={11} />Issues ({complianceIssueCount})
          </button>
        )}
        {allSpecialties.map(s => (
          <button
            key={s}
            onClick={() => { setSpecialtyFilter(s === specialtyFilter ? '' : s); setComplianceFilter(false); }}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${specialtyFilter === s ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-5 pb-8 space-y-3">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Wrench size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No vendors match your search.' : 'No vendors yet.'}</p>
            {!search && <button onClick={() => setShowForm(true)} className="mt-3 text-brand text-sm font-semibold">Add Your First Vendor →</button>}
          </div>
        ) : (
          filtered.map(v => {
            const insExpiry = v.insurance_expiry ? daysUntilExpiry(v.insurance_expiry) : Infinity;
            const hasIssue = hasComplianceIssue(v);
            return (
              <div key={v.id} className={`card ${v.do_not_rehire ? 'border border-red-500/40 opacity-75' : hasIssue ? 'border border-yellow-500/30' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm">{v.name}</p>
                      {v.do_not_rehire ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                          <Ban size={10} />Do Not Rehire
                        </span>
                      ) : (
                        v.specialty && <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">{v.specialty}</span>
                      )}
                    </div>
                    {v.company && <p className="text-xs text-gray-400 mt-0.5">{v.company}</p>}
                    <StarRating value={v.rating} />

                    {/* Compliance badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <InsuranceBadge expiry={v.insurance_expiry} />
                      <W9Badge status={v.w9_status} />
                      {v.license_number && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                          Lic #{v.license_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 mt-1">
                    {hasIssue && !v.do_not_rehire && <AlertTriangle size={14} className="text-yellow-400" />}
                    {expandedId === v.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>

                {expandedId === v.id && (
                  <div className="mt-3 pt-3 border-t border-surface-400/20 space-y-2">
                    {v.phone && <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-sm text-brand"><Phone size={14} />{v.phone}</a>}
                    {v.email && <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-sm text-brand"><Mail size={14} />{v.email}</a>}
                    {v.hourly_rate > 0 && <p className="text-xs text-gray-400">Rate: <span className="text-white font-semibold">${v.hourly_rate}/hr</span></p>}

                    {/* Compliance details */}
                    {(v.license_number || v.insurance_expiry) && (
                      <div className="bg-surface-600 rounded-lg p-3 space-y-1.5 text-xs">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Compliance</p>
                        {v.license_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">License</span>
                            <span className="text-white font-semibold">{v.license_number}{v.license_state ? ` (${v.license_state})` : ''}</span>
                          </div>
                        )}
                        {v.insurance_expiry && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">COI Expires</span>
                            <span className={`font-semibold ${insExpiry < 0 ? 'text-red-400' : insExpiry <= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {new Date(v.insurance_expiry + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {insExpiry < 0 ? ' (expired)' : insExpiry <= 30 ? ` (${insExpiry}d)` : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">W9 Status</span>
                          <span className={`font-semibold ${v.w9_status === 'received' ? 'text-green-400' : v.w9_status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {W9_OPTIONS.find(o => o.value === v.w9_status)?.label ?? 'Not Collected'}
                          </span>
                        </div>
                      </div>
                    )}

                    {v.notes && <p className="text-xs text-gray-400 italic">{v.notes}</p>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(v)} className="flex-1 py-2 rounded-lg bg-surface-500 text-white text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Vendor Sheet */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-surface-700 rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-700 flex items-center justify-between px-5 py-4 border-b border-surface-400/20">
              <h3 className="text-base font-bold text-white">{editingId ? 'Edit Vendor' : 'New Vendor'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-8">

              {/* Basic Info */}
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Basic Info</p>
              <div>
                <label className="label">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Smith" className="input-field" required />
              </div>
              <div>
                <label className="label">Company</label>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Smith Contracting LLC" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="555-000-0000" className="input-field" type="tel" />
                </div>
                <div>
                  <label className="label">Hourly Rate</label>
                  <input name="hourly_rate" value={form.hourly_rate} onChange={handleChange} placeholder="85" className="input-field" type="number" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" value={form.email} onChange={handleChange} placeholder="john@contractor.com" className="input-field" type="email" />
              </div>
              <div>
                <label className="label">Specialty / Trade</label>
                <select name="specialty" value={form.specialty} onChange={handleChange} className="input-field">
                  <option value="">Select specialty...</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Rating</label>
                <StarRating value={parseInt(form.rating)} onChange={v => setForm(p => ({ ...p, rating: String(v) }))} />
              </div>

              {/* Compliance */}
              <div className="pt-2 border-t border-surface-400/20">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Compliance & Credentials</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">License #</label>
                    <input name="license_number" value={form.license_number} onChange={handleChange} placeholder="LIC123456" className="input-field" />
                  </div>
                  <div>
                    <label className="label">License State</label>
                    <input name="license_state" value={form.license_state} onChange={handleChange} placeholder="TX" className="input-field" maxLength={2} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="label">Insurance / COI Expiry</label>
                  <input name="insurance_expiry" value={form.insurance_expiry} onChange={handleChange} type="date" className="input-field" />
                </div>
                <div className="mt-3">
                  <label className="label">W9 Status</label>
                  <select name="w9_status" value={form.w9_status} onChange={handleChange} className="input-field">
                    {W9_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes & flags */}
              <div className="pt-2 border-t border-surface-400/20">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Notes & Flags</p>
                <div>
                  <label className="label">Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Reliable, fast, quality work..." className="input-field resize-none" />
                </div>
                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative ${form.do_not_rehire ? 'bg-red-500' : 'bg-surface-400'}`}
                    onClick={() => setForm(p => ({ ...p, do_not_rehire: !p.do_not_rehire }))}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.do_not_rehire ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Do Not Rehire</p>
                    <p className="text-xs text-gray-500">Flags this vendor so you never accidentally use them again</p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={saving} className="btn-primary rounded-xl py-4">
                {saving ? 'Saving...' : editingId ? 'Update Vendor' : 'Add Vendor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
