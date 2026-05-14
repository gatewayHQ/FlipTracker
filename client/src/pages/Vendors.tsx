import { useState, useEffect } from 'react';
import { Plus, Star, Phone, Mail, X, ChevronDown, ChevronUp, Search, Wrench, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { api, daysUntil } from '../lib/api';
import type { Vendor } from '../types';

type FormData = {
  name: string; company: string; phone: string; email: string;
  specialty: string; rating: string; hourly_rate: string; notes: string;
  license_number: string; license_expiry: string; insurance_expiry: string; w9_on_file: boolean;
};

const INITIAL_FORM: FormData = {
  name: '', company: '', phone: '', email: '',
  specialty: '', rating: '5', hourly_rate: '', notes: '',
  license_number: '', license_expiry: '', insurance_expiry: '', w9_on_file: false,
};

function expiryStatus(dateStr: string): 'ok' | 'soon' | 'expired' | 'none' {
  if (!dateStr) return 'none';
  const d = daysUntil(dateStr);
  if (d < 0) return 'expired';
  if (d <= 60) return 'soon';
  return 'ok';
}

function ExpiryBadge({ label, date }: { label: string; date: string }) {
  const status = expiryStatus(date);
  if (status === 'none') return null;
  const colors = { ok: 'text-green-400', soon: 'text-yellow-400', expired: 'text-red-400' };
  const Icon = status === 'ok' ? ShieldCheck : status === 'soon' ? ShieldAlert : ShieldX;
  return (
    <div className={`flex items-center gap-1 text-xs ${colors[status]}`}>
      <Icon size={12} />
      <span>{label}: {date}</span>
    </div>
  );
}

const SPECIALTIES = [
  'General Contractor', 'Electrical', 'Plumbing', 'HVAC', 'Roofing',
  'Flooring', 'Painting', 'Landscaping', 'Demolition', 'Framing',
  'Drywall', 'Kitchen & Bath', 'Windows & Doors', 'Concrete', 'Other',
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={i <= value ? 'text-brand' : 'text-surface-400'}
        >
          <Star size={16} fill={i <= value ? '#f97316' : 'none'} />
        </button>
      ))}
    </div>
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

  const load = () => {
    api.vendors.list().then(v => {
      setVendors(v as Vendor[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name, company: v.company, phone: v.phone, email: v.email,
      specialty: v.specialty, rating: String(v.rating), hourly_rate: String(v.hourly_rate || ''), notes: v.notes,
      license_number: v.license_number || '', license_expiry: v.license_expiry || '',
      insurance_expiry: v.insurance_expiry || '', w9_on_file: !!v.w9_on_file,
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
      w9_on_file: form.w9_on_file ? 1 : 0,
    };
    if (editingId) {
      await api.vendors.update(editingId, payload);
    } else {
      await api.vendors.create(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.vendors.delete(id);
    load();
  };

  const allSpecialties = [...new Set(vendors.map(v => v.specialty).filter(Boolean))];

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.company.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q);
    const matchSpec = !specialtyFilter || v.specialty === specialtyFilter;
    return matchSearch && matchSpec;
  });

  return (
    <div className="min-h-full bg-surface-900">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Vendors</h1>
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

      {/* Specialty filter */}
      {allSpecialties.length > 0 && (
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSpecialtyFilter('')}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${!specialtyFilter ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
          >
            All
          </button>
          {allSpecialties.map(s => (
            <button
              key={s}
              onClick={() => setSpecialtyFilter(s === specialtyFilter ? '' : s)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${specialtyFilter === s ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pb-8 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Wrench size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No vendors match your search.' : 'No vendors yet.'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-3 text-brand text-sm font-semibold">
                Add Your First Vendor →
              </button>
            )}
          </div>
        ) : (
          filtered.map(v => (
            <div key={v.id} className="card">
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{v.name}</p>
                    {v.specialty && (
                      <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">{v.specialty}</span>
                    )}
                  </div>
                  {v.company && <p className="text-xs text-gray-400 mt-0.5">{v.company}</p>}
                  <StarRating value={v.rating} />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {expandedId === v.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </div>

              {expandedId === v.id && (
                <div className="mt-3 pt-3 border-t border-surface-400/20 space-y-2">
                  {v.phone && (
                    <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-sm text-brand">
                      <Phone size={14} />{v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-sm text-brand">
                      <Mail size={14} />{v.email}
                    </a>
                  )}
                  {v.hourly_rate > 0 && (
                    <p className="text-xs text-gray-400">Rate: <span className="text-white font-semibold">${v.hourly_rate}/hr</span></p>
                  )}
                  {v.notes && <p className="text-xs text-gray-400 italic">{v.notes}</p>}
                  {(v.license_number || v.license_expiry || v.insurance_expiry || v.w9_on_file) && (
                    <div className="pt-2 space-y-1 border-t border-surface-400/20">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Compliance</p>
                      {v.license_number && <p className="text-xs text-gray-400">License: <span className="text-white">{v.license_number}</span></p>}
                      <ExpiryBadge label="License Exp." date={v.license_expiry} />
                      <ExpiryBadge label="Insurance Exp." date={v.insurance_expiry} />
                      {v.w9_on_file ? (
                        <div className="flex items-center gap-1 text-xs text-green-400"><ShieldCheck size={12} /><span>W-9 on file</span></div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-yellow-400"><ShieldAlert size={12} /><span>W-9 missing</span></div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => openEdit(v)} className="flex-1 py-2 rounded-lg bg-surface-500 text-white text-xs font-semibold">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Vendor Sheet */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-surface-700 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-700 flex items-center justify-between px-5 py-4 border-b border-surface-400/20">
              <h3 className="text-base font-bold text-white">{editingId ? 'Edit Vendor' : 'New Vendor'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-8">
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
                <label className="label">Specialty</label>
                <select name="specialty" value={form.specialty} onChange={handleChange} className="input-field">
                  <option value="">Select specialty...</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Rating</label>
                <StarRating value={parseInt(form.rating)} onChange={v => setForm(p => ({ ...p, rating: String(v) }))} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Reliable, fast, quality work..." className="input-field resize-none" />
              </div>

              <div className="pt-2 border-t border-surface-400/20">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Compliance</p>
                <div className="space-y-3">
                  <div>
                    <label className="label">License Number</label>
                    <input name="license_number" value={form.license_number} onChange={handleChange} placeholder="CGC-012345" className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">License Expiry</label>
                      <input name="license_expiry" value={form.license_expiry} onChange={handleChange} className="input-field" type="date" />
                    </div>
                    <div>
                      <label className="label">Insurance Expiry</label>
                      <input name="insurance_expiry" value={form.insurance_expiry} onChange={handleChange} className="input-field" type="date" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-surface-600">
                    <span className="text-sm text-white">W-9 on File</span>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, w9_on_file: !p.w9_on_file }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${form.w9_on_file ? 'bg-brand' : 'bg-surface-400'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.w9_on_file ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
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
