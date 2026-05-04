import { useState, useEffect } from 'react';
import { Plus, Star, Phone, Mail, ChevronDown, ChevronUp, Search, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import type { Vendor } from '../types';
import { SkeletonList, EmptyState, Sheet, Modal, Button, Input, Select, useToast } from '../components/ui';

type FormData = {
  name: string; company: string; phone: string; email: string;
  specialty: string; rating: string; hourly_rate: string; notes: string;
};

const INITIAL_FORM: FormData = {
  name: '', company: '', phone: '', email: '',
  specialty: '', rating: '5', hourly_rate: '', notes: '',
};

const SPECIALTIES = [
  'General Contractor', 'Electrical', 'Plumbing', 'HVAC', 'Roofing',
  'Flooring', 'Painting', 'Landscaping', 'Demolition', 'Framing',
  'Drywall', 'Kitchen & Bath', 'Windows & Doors', 'Concrete', 'Other',
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          aria-label={`${i} star${i !== 1 ? 's' : ''}`}
          aria-pressed={i <= value}
          className={i <= value ? 'text-brand' : 'text-surface-400'}
        >
          <Star size={16} fill={i <= value ? '#f97316' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function Vendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    api.vendors.list()
      .then(v => {
        setVendors(v as Vendor[]);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load vendors');
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openEdit = (v: Vendor) => {
    setForm({
      name: v.name, company: v.company, phone: v.phone, email: v.email,
      specialty: v.specialty, rating: String(v.rating), hourly_rate: String(v.hourly_rate || ''), notes: v.notes ?? '',
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const openAdd = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, rating: parseInt(form.rating) || 5, hourly_rate: parseFloat(form.hourly_rate) || 0 };
    try {
      if (editingId) {
        await api.vendors.update(editingId, payload);
        toast.success('Vendor updated');
      } else {
        await api.vendors.create(payload);
        toast.success('Vendor added');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
      load();
    } catch {
      toast.error(editingId ? 'Failed to update vendor' : 'Failed to add vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.vendors.delete(deleteId);
      toast.success('Vendor removed');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete vendor');
    } finally {
      setDeleting(false);
    }
  };

  const allSpecialties = [...new Set(vendors.map(v => v.specialty).filter(Boolean))];

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.company.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q);
    const matchSpec = !specialtyFilter || v.specialty === specialtyFilter;
    return matchSearch && matchSpec;
  });

  const vendorBeingDeleted = vendors.find(v => v.id === deleteId);

  return (
    <div className="min-h-full bg-surface-900">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Vendors</h1>
        <button
          onClick={openAdd}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
          aria-label="Add vendor"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="input-field pl-10" aria-label="Search vendors" />
        </div>
      </div>

      {/* Specialty filter */}
      {allSpecialties.length > 0 && (
        <div className="flex gap-2 px-5 mb-4 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by specialty">
          <button
            onClick={() => setSpecialtyFilter('')}
            aria-pressed={!specialtyFilter}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${!specialtyFilter ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
          >
            All
          </button>
          {allSpecialties.map(s => (
            <button
              key={s}
              onClick={() => setSpecialtyFilter(s === specialtyFilter ? '' : s)}
              aria-pressed={specialtyFilter === s}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${specialtyFilter === s ? 'bg-brand border-brand text-white' : 'border-surface-400 text-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pb-8 space-y-3">
        {loading ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          search || specialtyFilter ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No vendors match"
              description="Try a different search or filter."
            />
          ) : (
            <EmptyState
              icon={<Wrench size={32} />}
              title="No vendors yet"
              description="Build your contractor network by adding vendors."
              action={{ label: 'Add Your First Vendor', onClick: openAdd }}
            />
          )
        ) : (
          filtered.map(v => (
            <div key={v.id} className="card">
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedId === v.id}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(expandedId === v.id ? null : v.id); }}
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
                      <Phone size={14} aria-hidden />{v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} className="flex items-center gap-2 text-sm text-brand">
                      <Mail size={14} aria-hidden />{v.email}
                    </a>
                  )}
                  {v.hourly_rate > 0 && (
                    <p className="text-xs text-gray-400">Rate: <span className="text-white font-semibold">${v.hourly_rate}/hr</span></p>
                  )}
                  {v.notes && <p className="text-xs text-gray-400 italic">{v.notes}</p>}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => openEdit(v)} className="flex-1 py-2 rounded-lg bg-surface-500 text-white text-xs font-semibold hover:bg-surface-400 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(v.id)} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors">
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
      <Sheet open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Vendor' : 'New Vendor'}>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 pb-8">
          <Input
            label="Name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Smith"
            required
            autoFocus={!editingId}
          />
          <Input
            label="Company"
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Smith Contracting LLC"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="555-000-0000"
              type="tel"
            />
            <Input
              label="Hourly Rate"
              name="hourly_rate"
              value={form.hourly_rate}
              onChange={handleChange}
              placeholder="85"
              type="number"
              prefix="$"
            />
          </div>
          <Input
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@contractor.com"
            type="email"
          />
          <Select
            label="Specialty"
            name="specialty"
            value={form.specialty}
            onChange={handleChange}
            options={SPECIALTIES.map(s => ({ value: s, label: s }))}
            placeholder="Select specialty..."
          />
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
              Rating
            </label>
            <StarRating value={parseInt(form.rating)} onChange={v => setForm(p => ({ ...p, rating: String(v) }))} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Reliable, fast, quality work..."
              className="input-field resize-none"
            />
          </div>
          <Button type="submit" loading={saving} fullWidth size="lg">
            {editingId ? 'Update Vendor' : 'Add Vendor'}
          </Button>
        </form>
      </Sheet>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Remove Vendor?"
        description={`Remove "${vendorBeingDeleted?.name}" from your vendor list? This won't affect any projects they're attached to.`}
        confirmLabel="Remove Vendor"
        confirmVariant="danger"
        onConfirm={handleDelete}
        confirmLoading={deleting}
      />
    </div>
  );
}
