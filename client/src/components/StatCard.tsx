import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: ReactNode;
}

export default function StatCard({ label, value, sub, subColor = 'text-gray-400', icon }: Props) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">{label}</span>
        <span className="text-brand/70">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      {sub && <div className={`text-xs font-medium ${subColor}`}>{sub}</div>}
    </div>
  );
}
