import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CheckCircle, XCircle, Trash2, Save, Calculator } from 'lucide-react';
import { api, fmt, fmtFull } from '../lib/api';
import type { DealAnalysis } from '../types';

interface FormState {
  name: string;
  address: string;
  purchase_price: string;
  arv: string;
  repair_cost: string;
  holding_months: string;
  holding_cost_monthly: string;
  financing_cost: string;
  agent_commission_pct: string;
  closing_cost_pct: string;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  address: '',
  purchase_price: '',
  arv: '',
  repair_cost: '',
  holding_months: '6',
  holding_cost_monthly: '',
  financing_cost: '',
  agent_commission_pct: '6',
  closing_cost_pct: '2',
  notes: '',
};

function n(val: string): number {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

export default function Analyzer() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<DealAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.analyzer.list().then(data => {
      setAnalyses(data as DealAnalysis[]);
      setLoading(false);
    }).catch((err: Error) => {
      setErrorMsg(err.message || 'Failed to load analyses');
      setLoading(false);
    });
  }, []);

  const calc = useMemo(() => {
    const purchasePrice = n(form.purchase_price);
    const arv = n(form.arv);
    const repairCost = n(form.repair_cost);
    const holdingMonths = n(form.holding_months);
    const holdingCostMonthly = n(form.holding_cost_monthly);
    const financingCost = n(form.financing_cost);
    const agentCommissionPct = n(form.agent_commission_pct);
    const closingCostPct = n(form.closing_cost_pct);

    const mao = arv * 0.70 - repairCost;
    const agentCommission = arv * (agentCommissionPct / 100);
    const closingCost = arv * (closingCostPct / 100);
    const holdingTotal = holdingCostMonthly * holdingMonths;
    const totalCosts = purchasePrice + repairCost + holdingTotal + financingCost + agentCommission + closingCost;
    const netProfit = arv - totalCosts;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
    const cashOnCash = purchasePrice > 0 ? (netProfit / purchasePrice) * 100 : 0;
    const isGo = netProfit > 0 && purchasePrice <= mao && purchasePrice > 0 && arv > 0;
    const underMao = purchasePrice > 0 && purchasePrice <= mao;
    const hasValues = arv > 0 || purchasePrice > 0;

    return { mao, totalCosts, netProfit, roi, cashOnCash, isGo, underMao, hasValues, purchasePrice, arv };
  }, [form]);

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function loadAnalysis(a: DealAnalysis) {
    setForm({
      name: a.name ?? '',
      address: a.address ?? '',
      purchase_price: a.purchase_price ? String(a.purchase_price) : '',
      arv: a.arv ? String(a.arv) : '',
      repair_cost: a.repair_cost ? String(a.repair_cost) : '',
      holding_months: a.holding_months ? String(a.holding_months) : '6',
      holding_cost_monthly: a.holding_cost_monthly ? String(a.holding_cost_monthly) : '',
      financing_cost: a.financing_cost ? String(a.financing_cost) : '',
      agent_commission_pct: a.agent_commission_pct ? String(a.agent_commission_pct) : '6',
      closing_cost_pct: a.closing_cost_pct ? String(a.closing_cost_pct) : '2',
      notes: a.notes ?? '',
    });
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  async function handleSave() {
    const payload = {
      name: form.name || '',
      address: form.address || '',
      purchase_price: n(form.purchase_price),
      arv: n(form.arv),
      repair_cost: n(form.repair_cost),
      holding_months: n(form.holding_months),
      holding_cost_monthly: n(form.holding_cost_monthly),
      financing_cost: n(form.financing_cost),
      agent_commission_pct: n(form.agent_commission_pct),
      closing_cost_pct: n(form.closing_cost_pct),
      notes: form.notes || '',
    };

    setSaving(true);
    setErrorMsg(null);
    try {
      if (editingId) {
        await api.analyzer.update(editingId, payload);
      } else {
        await api.analyzer.create(payload);
      }
      // Re-fetch from server to confirm persistence (not just optimistic update)
      const fresh = await api.analyzer.list() as DealAnalysis[];
      setAnalyses(fresh);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.analyzer.delete(id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    if (editingId === id) resetForm();
  }

  function computeAnalysisStats(a: DealAnalysis) {
    const agentCommission = a.arv * (a.agent_commission_pct / 100);
    const closingCost = a.arv * (a.closing_cost_pct / 100);
    const holdingTotal = a.holding_cost_monthly * a.holding_months;
    const totalCosts = a.purchase_price + a.repair_cost + holdingTotal + a.financing_cost + agentCommission + closingCost;
    const netProfit = a.arv - totalCosts;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
    return { netProfit, roi };
  }

  return (
    <div className="min-h-full bg-surface-900">
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={20} className="text-brand" />
          <h1 className="text-xl font-bold text-white">Deal Analyzer</h1>
        </div>
        <p className="text-xs text-gray-500">70% Rule &amp; Profit Calculator</p>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-semibold">Error</p>
              <p className="text-xs text-red-300 mt-0.5">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400/60 hover:text-red-400">
              <XCircle size={14} />
            </button>
          </div>
        )}

        {/* Calculator Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brand" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand">
              {editingId ? 'Edit Analysis' : 'New Analysis'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="ml-auto text-xs text-gray-400 underline">
                Clear
              </button>
            )}
          </div>

          {/* Optional fields */}
          <div className="space-y-3">
            <div>
              <label className="label">Deal Name (optional)</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. 123 Maple St Deal"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Address (optional)</label>
              <input
                className="input-field"
                type="text"
                placeholder="Property address"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* Core numbers */}
          <div className="space-y-3">
            <div>
              <label className="label">Purchase Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  className="input-field pl-7"
                  type="number"
                  placeholder="0"
                  value={form.purchase_price}
                  onChange={e => handleChange('purchase_price', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">After Repair Value (ARV)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  className="input-field pl-7"
                  type="number"
                  placeholder="0"
                  value={form.arv}
                  onChange={e => handleChange('arv', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Repair Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  className="input-field pl-7"
                  type="number"
                  placeholder="0"
                  value={form.repair_cost}
                  onChange={e => handleChange('repair_cost', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Holding */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Holding Months</label>
              <input
                className="input-field"
                type="number"
                placeholder="6"
                value={form.holding_months}
                onChange={e => handleChange('holding_months', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Monthly Holding Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  className="input-field pl-7"
                  type="number"
                  placeholder="0"
                  value={form.holding_cost_monthly}
                  onChange={e => handleChange('holding_cost_monthly', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Financing & commissions */}
          <div>
            <label className="label">Financing Cost (Points + Origination)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                className="input-field pl-7"
                type="number"
                placeholder="0"
                value={form.financing_cost}
                onChange={e => handleChange('financing_cost', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Agent Commission %</label>
              <div className="relative">
                <input
                  className="input-field pr-7"
                  type="number"
                  placeholder="6"
                  value={form.agent_commission_pct}
                  onChange={e => handleChange('agent_commission_pct', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Closing Cost %</label>
              <div className="relative">
                <input
                  className="input-field pr-7"
                  type="number"
                  placeholder="2"
                  value={form.closing_cost_pct}
                  onChange={e => handleChange('closing_cost_pct', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Results */}
        {calc.hasValues && (
          <div className="card space-y-4">
            {/* GO / NO-GO Banner */}
            <div className={`rounded-xl px-4 py-4 flex items-center gap-3 ${calc.isGo ? 'bg-green-400/10 border border-green-400/30' : 'bg-red-400/10 border border-red-400/30'}`}>
              {calc.isGo ? (
                <CheckCircle size={28} className="text-green-400 shrink-0" />
              ) : (
                <XCircle size={28} className="text-red-400 shrink-0" />
              )}
              <div>
                <div className={`text-2xl font-extrabold tracking-wide ${calc.isGo ? 'text-green-400' : 'text-red-400'}`}>
                  {calc.isGo ? 'GO' : 'NO-GO'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {calc.isGo
                    ? 'Deal meets the 70% rule & shows positive profit'
                    : calc.netProfit <= 0
                      ? 'Negative net profit'
                      : 'Purchase price exceeds 70% Rule MAO'}
                </div>
              </div>
            </div>

            {/* 70% Rule MAO */}
            <div className="bg-surface-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-brand" />
                <span className="label">70% Rule MAO</span>
              </div>
              <div className={`text-2xl font-bold ${calc.arv > 0 ? 'text-white' : 'text-gray-500'}`}>
                {calc.arv > 0 ? fmtFull(calc.mao) : '—'}
              </div>
              <div className="text-xs mt-1">
                {calc.purchasePrice > 0 && calc.arv > 0 ? (
                  calc.underMao ? (
                    <span className="text-green-400">Purchase price is {fmtFull(calc.mao - calc.purchasePrice)} under MAO</span>
                  ) : (
                    <span className="text-red-400">Purchase price is {fmtFull(calc.purchasePrice - calc.mao)} over MAO</span>
                  )
                ) : (
                  <span className="text-gray-500">ARV × 0.70 − Repair Cost</span>
                )}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-700 rounded-xl p-3">
                <div className="label mb-1">Total Costs</div>
                <div className="text-base font-bold text-white">{fmtFull(calc.totalCosts)}</div>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <div className="label mb-1">Net Profit</div>
                <div className={`text-base font-bold ${calc.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {calc.netProfit >= 0 ? '+' : ''}{fmtFull(calc.netProfit)}
                </div>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <div className="label mb-1">ROI</div>
                <div className={`text-base font-bold ${calc.roi >= 0 ? 'text-brand' : 'text-red-400'}`}>
                  {calc.roi.toFixed(1)}%
                </div>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <div className="label mb-1">Cash on Cash</div>
                <div className={`text-base font-bold ${calc.cashOnCash >= 0 ? 'text-brand' : 'text-red-400'}`}>
                  {calc.cashOnCash.toFixed(1)}%
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || (!calc.purchasePrice && !calc.arv)}
              className="btn-primary rounded-xl py-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving…' : editingId ? 'Update Analysis' : 'Save Analysis'}
            </button>
          </div>
        )}

        {!calc.hasValues && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary rounded-xl py-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving…' : editingId ? 'Update Analysis' : 'Save Analysis'}
          </button>
        )}

        {/* Saved Analyses */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Saved Analyses</h2>

          {loading ? (
            <div className="text-gray-400 text-sm text-center py-8 animate-pulse">Loading…</div>
          ) : analyses.length === 0 ? (
            <div className="card text-center py-12">
              <Calculator size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No saved analyses yet.</p>
              <p className="text-gray-500 text-xs mt-1">Fill in the form above and tap Save.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map(a => {
                const { netProfit, roi } = computeAnalysisStats(a);
                const isActive = editingId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`card transition-colors ${isActive ? 'border-brand/60' : 'hover:border-brand/30'}`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => loadAnalysis(a)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">
                            {a.name || a.address || 'Untitled Deal'}
                          </p>
                          {a.name && a.address && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{a.address}</p>
                          )}
                          <p className="text-[10px] text-gray-600 mt-1">
                            {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full ml-2 shrink-0">
                            Editing
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500 mb-0.5">Purchase</div>
                          <div className="font-semibold text-white">{fmt(a.purchase_price)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">ARV</div>
                          <div className="font-semibold text-white">{fmt(a.arv)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">Net Profit</div>
                          <div className={`font-semibold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-0.5">ROI</div>
                          <div className={`font-semibold ${roi >= 0 ? 'text-brand' : 'text-red-400'}`}>
                            {roi.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="mt-3 pt-3 border-t border-surface-600 flex justify-end">
                      {deleteConfirm === a.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Delete this analysis?</span>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-xs text-red-400 font-semibold"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(a.id)}
                          className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                          aria-label="Delete analysis"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
