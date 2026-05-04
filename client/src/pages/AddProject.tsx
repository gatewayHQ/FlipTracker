import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreVertical, DollarSign, AlertCircle } from 'lucide-react';
import PhaseSelector from '../components/PhaseSelector';
import { api } from '../lib/api';
import type { ProjectDetail } from '../types';

type FormData = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  purchase_price: string;
  legal_fees: string;
  inspection_cost: string;
  closing_costs: string;
  rehab_budget: string;
  labor_cost: string;
  materials_cost: string;
  holding_costs_monthly: string;
  estimated_sale_price: string;
  actual_sale_price: string;
  acquisition_date: string;
  target_completion_date: string;
  listed_date: string;
  sold_date: string;
  notes: string;
};

const INITIAL: FormData = {
  name: '', address: '', city: '', state: '', zip: '',
  status: 'acquired',
  purchase_price: '', legal_fees: '', inspection_cost: '', closing_costs: '',
  rehab_budget: '', labor_cost: '', materials_cost: '', holding_costs_monthly: '',
  estimated_sale_price: '', actual_sale_price: '',
  acquisition_date: '', target_completion_date: '', listed_date: '', sold_date: '',
  notes: '',
};

const STATUS_OPTIONS = ['acquired', 'renovation', 'listed', 'sold', 'cancelled'];

function MoneyInput({ label, name, value, onChange, placeholder = '0' }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          step="100"
          min="0"
          className="input-field pl-8"
        />
      </div>
    </div>
  );
}

export default function AddProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(INITIAL);
  const [phases, setPhases] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    api.projects.get(id).then((data) => {
      const p = data as ProjectDetail;
      setForm({
        name: p.name, address: p.address, city: p.city, state: p.state, zip: p.zip,
        status: p.status,
        purchase_price: String(p.purchase_price || ''),
        legal_fees: String(p.legal_fees || ''),
        inspection_cost: String(p.inspection_cost || ''),
        closing_costs: String(p.closing_costs || ''),
        rehab_budget: String(p.rehab_budget || ''),
        labor_cost: String(p.labor_cost || ''),
        materials_cost: String(p.materials_cost || ''),
        holding_costs_monthly: String(p.holding_costs_monthly || ''),
        estimated_sale_price: String(p.estimated_sale_price || ''),
        actual_sale_price: String(p.actual_sale_price || ''),
        acquisition_date: p.acquisition_date || '',
        target_completion_date: p.target_completion_date || '',
        listed_date: p.listed_date || '',
        sold_date: p.sold_date || '',
        notes: p.notes || '',
      });
      setPhases(p.phases.map(ph => ph.phase_name));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setError('Address, city, and state are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      name: form.name || form.address,
      purchase_price: parseFloat(form.purchase_price) || 0,
      legal_fees: parseFloat(form.legal_fees) || 0,
      inspection_cost: parseFloat(form.inspection_cost) || 0,
      closing_costs: parseFloat(form.closing_costs) || 0,
      rehab_budget: parseFloat(form.rehab_budget) || 0,
      labor_cost: parseFloat(form.labor_cost) || 0,
      materials_cost: parseFloat(form.materials_cost) || 0,
      holding_costs_monthly: parseFloat(form.holding_costs_monthly) || 0,
      estimated_sale_price: parseFloat(form.estimated_sale_price) || 0,
      actual_sale_price: parseFloat(form.actual_sale_price) || 0,
      phases: isEdit ? undefined : phases,
    };

    try {
      if (isEdit && id) {
        await api.projects.update(id, payload);
        if (!isEdit) {
          for (const phaseName of phases) {
            await api.phases.create(id, { phase_name: phaseName });
          }
        }
        navigate(`/projects/${id}`);
      } else {
        const created = await api.projects.create(payload) as { id: string };
        navigate(`/projects/${created.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const totalInitial = (parseFloat(form.purchase_price) || 0) + (parseFloat(form.legal_fees) || 0) +
    (parseFloat(form.inspection_cost) || 0) + (parseFloat(form.closing_costs) || 0);
  const totalRehab = (parseFloat(form.rehab_budget) || 0);
  const estimatedProfit = (parseFloat(form.estimated_sale_price) || 0) - totalInitial - totalRehab;

  return (
    <div className="min-h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-brand">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold text-white">{isEdit ? 'Edit Project' : 'Add New Project'}</h1>
        <button className="text-gray-400">
          <MoreVertical size={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-5 pb-32 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Property Info */}
          <section className="card space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Property Info</h2>

            <div>
              <label className="label">Project Name (optional)</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maple St Flip" className="input-field" />
            </div>

            <div>
              <label className="label">Street Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main Street" className="input-field" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Austin" className="input-field" required />
              </div>
              <div>
                <label className="label">State</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="TX" maxLength={2} className="input-field" required />
              </div>
            </div>

            <div>
              <label className="label">ZIP Code</label>
              <input name="zip" value={form.zip} onChange={handleChange} placeholder="78701" className="input-field" />
            </div>
          </section>

          {/* Investment & Acquisition */}
          <section className="card space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Investment & Acquisition</h2>
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Purchase Price" name="purchase_price" value={form.purchase_price} onChange={handleChange} placeholder="380,000" />
              <MoneyInput label="Closing Costs" name="closing_costs" value={form.closing_costs} onChange={handleChange} placeholder="7,500" />
              <MoneyInput label="Legal & Title Fees" name="legal_fees" value={form.legal_fees} onChange={handleChange} placeholder="8,000" />
              <MoneyInput label="Inspection Cost" name="inspection_cost" value={form.inspection_cost} onChange={handleChange} placeholder="1,200" />
            </div>
          </section>

          {/* Renovation Budget */}
          <section className="card space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Renovation Budget</h2>
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Total Rehab Budget" name="rehab_budget" value={form.rehab_budget} onChange={handleChange} placeholder="80,000" />
              <MoneyInput label="Holding Costs/Mo" name="holding_costs_monthly" value={form.holding_costs_monthly} onChange={handleChange} placeholder="2,200" />
              <MoneyInput label="Labor (to date)" name="labor_cost" value={form.labor_cost} onChange={handleChange} placeholder="45,000" />
              <MoneyInput label="Materials (to date)" name="materials_cost" value={form.materials_cost} onChange={handleChange} placeholder="35,000" />
            </div>
          </section>

          {/* Sale */}
          <section className="card space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sale Projections</h2>
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Est. Sale Price" name="estimated_sale_price" value={form.estimated_sale_price} onChange={handleChange} placeholder="680,000" />
              <MoneyInput label="Actual Sale Price" name="actual_sale_price" value={form.actual_sale_price} onChange={handleChange} placeholder="0" />
            </div>

            {form.estimated_sale_price && (
              <div className={`rounded-xl p-3 ${estimatedProfit >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className="text-xs text-gray-400 mb-1">Estimated Profit</div>
                <div className={`text-xl font-bold ${estimatedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {estimatedProfit >= 0 ? '+' : ''}${estimatedProfit.toLocaleString()}
                </div>
              </div>
            )}
          </section>

          {/* Dates */}
          <section className="card space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Key Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Acquisition Date</label>
                <input type="date" name="acquisition_date" value={form.acquisition_date} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">Target Completion</label>
                <input type="date" name="target_completion_date" value={form.target_completion_date} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">Listed Date</label>
                <input type="date" name="listed_date" value={form.listed_date} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">Sold Date</label>
                <input type="date" name="sold_date" value={form.sold_date} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </section>

          {/* Initial Status */}
          <section className="card space-y-3">
            <label className="label">Initial Project Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field appearance-none">
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </section>

          {/* Renovation Phases — only on new project */}
          {!isEdit && (
            <section className="card">
              <PhaseSelector selected={phases} onChange={setPhases} />
            </section>
          )}

          {/* Notes */}
          <section className="card space-y-3">
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this project..."
              className="input-field resize-none"
            />
          </section>
        </div>

        {/* Save button */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 pb-8 pt-4 bg-gradient-to-t from-surface-900 via-surface-900/95 to-transparent">
          <button type="submit" disabled={saving} className="btn-primary rounded-2xl py-5">
            {saving ? 'Saving...' : isEdit ? 'Update Project' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
