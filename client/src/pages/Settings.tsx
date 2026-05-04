import { useState } from 'react';
import { User, Bell, Shield, HelpCircle, ChevronRight, Moon, DollarSign, TrendingUp, Building2, LogOut } from 'lucide-react';

interface SettingRow {
  icon: any;
  label: string;
  sub?: string;
  type?: 'toggle' | 'chevron' | 'text';
  value?: boolean;
  key?: string;
}

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency] = useState('USD');
  const [capitalGoal, setCapitalGoal] = useState('');

  const profileRows: SettingRow[] = [
    { icon: Bell, label: 'Push Notifications', type: 'toggle', value: notifications, key: 'notifications' },
    { icon: Moon, label: 'Dark Mode', type: 'toggle', value: darkMode, key: 'darkMode' },
  ];

  const toggle = (key: string) => {
    if (key === 'notifications') setNotifications(p => !p);
  };

  return (
    <div className="min-h-full bg-surface-900">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Profile */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center">
              <User size={28} className="text-brand" />
            </div>
            <div>
              <p className="font-bold text-white">{name || 'Investor'}</p>
              <p className="text-xs text-gray-400">{email || 'No email set'}</p>
            </div>
          </div>
          <div>
            <label className="label">Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Investor" className="input-field" />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="input-field" type="email" />
          </div>
        </div>

        {/* Preferences */}
        <div className="card space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preferences</h2>
          {profileRows.map(row => (
            <div key={row.key} className="flex items-center justify-between py-3 border-b border-surface-400/20 last:border-0">
              <div className="flex items-center gap-3">
                <row.icon size={18} className="text-gray-400" />
                <span className="text-sm text-white">{row.label}</span>
              </div>
              <button
                onClick={() => toggle(row.key!)}
                className={`w-12 h-6 rounded-full transition-colors relative ${row.value ? 'bg-brand' : 'bg-surface-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${row.value ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Investment Goals */}
        <div className="card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Investment Goals</h2>
          <div>
            <label className="label">Annual Capital Goal</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={capitalGoal}
                onChange={e => setCapitalGoal(e.target.value)}
                placeholder="500,000"
                type="number"
                className="input-field pl-8"
              />
            </div>
          </div>
          <div>
            <label className="label">Target ROI per Flip</label>
            <div className="relative">
              <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input placeholder="15" type="number" className="input-field pl-8" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Percentage</p>
          </div>
          <div>
            <label className="label">Target Flip Duration (days)</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input placeholder="90" type="number" className="input-field pl-8" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">About</h2>
          {[
            { icon: Shield, label: 'Privacy Policy' },
            { icon: HelpCircle, label: 'Help & Support' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center justify-between w-full py-3 border-b border-surface-400/20 last:border-0">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-gray-400" />
                <span className="text-sm text-white">{label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          ))}
          <div className="pt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">Version</span>
            <span className="text-xs text-gray-400">1.0.0</span>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center py-4">
          <p className="text-sm font-bold text-gray-400">FlipFolio</p>
          <p className="text-xs text-gray-600">Real Estate Investment Tracker</p>
          <p className="text-xs text-gray-600 mt-1">Built for serious investors</p>
        </div>
      </div>
    </div>
  );
}
