import { Check } from 'lucide-react';
import { RENOVATION_PHASES } from '../types';

interface Props {
  selected: string[];
  onChange: (phases: string[]) => void;
}

const PHASE_ICONS: Record<string, string> = {
  Demo: '🔨', 'Junk Removal': '🗑️', Roof: '🏠', Framing: '🪵',
  Electrical: '⚡', Plumbing: '🔧', HVAC: '❄️', Drywall: '🧱',
  Flooring: '🪟', Paint: '🎨', Kitchen: '🍳', Bathrooms: '🛁',
  Bedroom: '🛏️', Landscaping: '🌿', 'Final Punch': '✅',
};

export default function PhaseSelector({ selected, onChange }: Props) {
  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const selectAll = () => {
    if (selected.length === RENOVATION_PHASES.length) {
      onChange([]);
    } else {
      onChange(RENOVATION_PHASES.map(p => p.name));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="label">Renovation Phases</span>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-bold text-brand border border-brand/50 rounded-lg px-3 py-1 hover:bg-brand/10 transition-colors"
        >
          {selected.length === RENOVATION_PHASES.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {RENOVATION_PHASES.map(({ name }) => {
          const active = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                active
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-surface-400 bg-surface-600 text-gray-400 hover:border-surface-300'
              }`}
            >
              {active && (
                <span className="absolute top-1.5 left-1.5">
                  <Check size={12} className="text-brand" />
                </span>
              )}
              <span className="text-lg">{PHASE_ICONS[name]}</span>
              <span className="text-center leading-tight">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
