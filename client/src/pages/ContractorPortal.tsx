import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, ChevronDown, DollarSign, MapPin, Send, AlertCircle, Clock, Wrench } from 'lucide-react';
import { fmtFull, fmtDate } from '../lib/api';

interface PortalPhase {
  id: string;
  phase_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  budget: number;
  actual_cost: number;
  start_date: string;
  target_date: string;
  end_date: string;
  notes: string;
}

interface PortalData {
  vendor: { id: string; name: string; company: string; specialty: string; phone: string };
  project: { id: string; name: string; address: string; city: string; state: string; status: string };
  assignment: { contracted_amount: number; paid_amount: number; phase_name: string; notes: string } | null;
  phases: PortalPhase[];
  change_orders: Array<{ id: string; phase_name: string; description: string; amount: number; status: string; submitted_date: string }>;
  token_label: string;
  expires_at: string;
}

const PHASE_STATUS_COLORS = {
  pending: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-green-500/20 text-green-400',
};

const PHASE_STATUS_NEXT: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

const PHASE_STATUS_LABEL: Record<string, string> = {
  pending: 'Mark Started',
  in_progress: 'Mark Complete',
  completed: 'Reopen',
};

export default function ContractorPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Pay request form
  const [showPayRequest, setShowPayRequest] = useState(false);
  const [payForm, setPayForm] = useState({ phase_name: '', description: '', amount: '' });
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Phase update state
  const [updatingPhase, setUpdatingPhase] = useState<string | null>(null);

  // Notes editing
  const [phaseNotes, setPhaseNotes] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/contractor/${token}`)
      .then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e.error || 'Failed to load'));
        return r.json();
      })
      .then((d: PortalData) => {
        setData(d);
        const notes: Record<string, string> = {};
        d.phases.forEach(p => { notes[p.id] = p.notes || ''; });
        setPhaseNotes(notes);
        setLoading(false);
      })
      .catch(e => { setError(typeof e === 'string' ? e : 'Failed to load portal'); setLoading(false); });
  }, [token]);

  const handlePhaseStatusUpdate = async (phase: PortalPhase) => {
    if (!token) return;
    setUpdatingPhase(phase.id);
    const nextStatus = PHASE_STATUS_NEXT[phase.status];
    try {
      const res = await fetch(`/api/contractor/${token}/phases/${phase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(prev => prev ? {
          ...prev,
          phases: prev.phases.map(p => p.id === phase.id ? { ...p, status: updated.status } : p),
        } : prev);
      }
    } catch {}
    setUpdatingPhase(null);
  };

  const handleSaveNotes = async (phase: PortalPhase) => {
    if (!token) return;
    try {
      await fetch(`/api/contractor/${token}/phases/${phase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: phaseNotes[phase.id] }),
      });
      setEditingNotes(null);
    } catch {}
  };

  const handlePayRequest = async () => {
    if (!token || !payForm.amount || !payForm.description.trim()) return;
    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/contractor/${token}/pay-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }),
      });
      if (res.ok) {
        setPaySuccess(true);
        setPayForm({ phase_name: '', description: '', amount: '' });
        setShowPayRequest(false);
        // Refresh data to show new CO
        const dataRes = await fetch(`/api/contractor/${token}`);
        if (dataRes.ok) setData(await dataRes.json());
      }
    } catch {}
    setPaySubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-orange-400 animate-pulse text-sm font-semibold">Loading portal…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-white font-bold text-xl mb-2">Link Not Valid</h1>
          <p className="text-gray-400 text-sm">{error || 'This portal link is invalid or has expired.'}</p>
          <p className="text-gray-600 text-xs mt-4">Contact your project manager for a new link.</p>
        </div>
      </div>
    );
  }

  const { vendor, project, assignment, phases, change_orders } = data;
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const inProgressCount = phases.filter(p => p.status === 'in_progress').length;
  const totalPaid = assignment?.paid_amount ?? 0;
  const totalContracted = assignment?.contracted_amount ?? 0;
  const balance = totalContracted - totalPaid;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 pt-10 pb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Wrench size={16} className="text-orange-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">FlipFolio</span>
            </div>
            <h1 className="text-xl font-bold text-white">{vendor.name}</h1>
            {vendor.company && <p className="text-sm text-gray-400">{vendor.company}</p>}
            {vendor.specialty && <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full mt-1 inline-block">{vendor.specialty}</span>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-3 flex items-start gap-2">
          <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">{project.name || project.address}</p>
            <p className="text-xs text-gray-400">{project.address}, {project.city}, {project.state}</p>
          </div>
        </div>
      </div>

      {/* Pay summary strip */}
      {(totalContracted > 0 || totalPaid > 0) && (
        <div className="grid grid-cols-3 gap-0 border-b border-gray-800">
          {[
            { label: 'Contracted', value: totalContracted, color: 'text-white' },
            { label: 'Paid', value: totalPaid, color: 'text-green-400' },
            { label: 'Balance', value: balance, color: balance > 0 ? 'text-orange-400' : 'text-gray-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="py-3 px-4 text-center border-r border-gray-800 last:border-r-0">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-sm font-bold ${color}`}>{fmtFull(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress indicator */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-semibold">{completedCount} of {phases.length} phases complete</span>
          {inProgressCount > 0 && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
              {inProgressCount} in progress
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
            style={{ width: `${phases.length > 0 ? (completedCount / phases.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="px-5 pb-32 space-y-3">

        {/* Success banner */}
        {paySuccess && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <Check size={16} className="text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400 font-semibold">Pay request submitted — waiting for approval.</p>
          </div>
        )}

        {/* Phases */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Your Phases</h2>

        {phases.length === 0 && (
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">No phases assigned yet.</p>
          </div>
        )}

        {phases.map(phase => {
          const isEditing = editingNotes === phase.id;
          return (
            <div key={phase.id} className={`bg-gray-900 rounded-2xl overflow-hidden border ${
              phase.status === 'completed' ? 'border-green-500/20' :
              phase.status === 'in_progress' ? 'border-orange-500/30' :
              'border-gray-800'
            }`}>
              {/* Phase header */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">{phase.phase_name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PHASE_STATUS_COLORS[phase.status]}`}>
                    {phase.status.replace('_', ' ')}
                  </span>
                </div>

                {phase.target_date && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={11} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Target: {fmtDate(phase.target_date)}</span>
                  </div>
                )}

                {/* Notes */}
                {isEditing ? (
                  <div className="mb-3">
                    <textarea
                      value={phaseNotes[phase.id] || ''}
                      onChange={e => setPhaseNotes(prev => ({ ...prev, [phase.id]: e.target.value }))}
                      placeholder="Add notes, updates, issues…"
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleSaveNotes(phase)} className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold">Save Notes</button>
                      <button onClick={() => setEditingNotes(null)} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  phase.notes || phaseNotes[phase.id] ? (
                    <div className="bg-gray-800 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-gray-400">{phaseNotes[phase.id] || phase.notes}</p>
                      <button onClick={() => setEditingNotes(phase.id)} className="text-[10px] text-orange-400 mt-1">Edit</button>
                    </div>
                  ) : null
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePhaseStatusUpdate(phase)}
                    disabled={updatingPhase === phase.id}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                      phase.status === 'completed'
                        ? 'bg-gray-700 text-gray-400'
                        : phase.status === 'in_progress'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {updatingPhase === phase.id ? '…' : PHASE_STATUS_LABEL[phase.status]}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => setEditingNotes(phase.id)}
                      className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm"
                    >
                      Notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Change Orders / Pay Requests */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 pt-2">Pay Requests</h2>

        {change_orders.length === 0 ? (
          <div className="bg-gray-900 rounded-xl px-4 py-4 text-center border border-gray-800">
            <p className="text-gray-500 text-sm">No pay requests submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {change_orders.map(co => (
              <div key={co.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{co.description}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    co.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    co.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{co.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-bold text-orange-400">{fmtFull(Number(co.amount))}</span>
                  {co.phase_name && <span>{co.phase_name}</span>}
                  {co.submitted_date && <span>{fmtDate(co.submitted_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating pay request button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-5 py-4">
        {showPayRequest ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Request Payment</h4>
              <button onClick={() => setShowPayRequest(false)} className="text-gray-500 text-xs">Cancel</button>
            </div>
            <div>
              <select
                value={payForm.phase_name}
                onChange={e => setPayForm(p => ({ ...p, phase_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Select phase (optional)</option>
                {phases.map(p => <option key={p.id} value={p.phase_name}>{p.phase_name}</option>)}
              </select>
            </div>
            <input
              value={payForm.description}
              onChange={e => setPayForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (e.g. 50% completion draw)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                value={payForm.amount}
                onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="Amount"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={handlePayRequest}
              disabled={paySubmitting || !payForm.amount || !payForm.description.trim()}
              className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={14} />
              {paySubmitting ? 'Submitting…' : 'Submit Pay Request'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowPayRequest(true); setPaySuccess(false); }}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <DollarSign size={18} />
            Request Payment
          </button>
        )}
      </div>
    </div>
  );
}
