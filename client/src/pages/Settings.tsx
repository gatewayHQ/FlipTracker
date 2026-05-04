import { useState } from 'react';
import { User, Bell, Shield, HelpCircle, ChevronRight, Moon, DollarSign, TrendingUp, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Button, Input, useToast } from '../components/ui';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [darkMode] = useState(true);
  const [name, setName] = useState('');
  const [capitalGoal, setCapitalGoal] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error('Failed to sign out');
      setSigningOut(false);
    }
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
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <Input
            label="Display Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Investor"
          />
        </div>

        {/* Preferences */}
        <div className="card space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preferences</h2>
          {[
            { icon: Bell, label: 'Push Notifications', value: notifications, onToggle: () => setNotifications(p => !p) },
            { icon: Moon, label: 'Dark Mode', value: darkMode, onToggle: () => {} },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-surface-400/20 last:border-0">
              <div className="flex items-center gap-3">
                <row.icon size={18} className="text-gray-400" aria-hidden />
                <span className="text-sm text-white">{row.label}</span>
              </div>
              <button
                onClick={row.onToggle}
                role="switch"
                aria-checked={row.value}
                aria-label={row.label}
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
          <Input
            label="Annual Capital Goal"
            type="number"
            prefix="$"
            value={capitalGoal}
            onChange={e => setCapitalGoal(e.target.value)}
            placeholder="500,000"
          />
          <Input
            label="Target ROI per Flip"
            type="number"
            leftIcon={<TrendingUp size={14} />}
            placeholder="15"
            helper="Percentage"
          />
          <Input
            label="Target Flip Duration (days)"
            type="number"
            leftIcon={<Building2 size={14} />}
            placeholder="90"
          />
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
                <Icon size={18} className="text-gray-400" aria-hidden />
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

        <Button
          variant="danger"
          fullWidth
          size="lg"
          loading={signingOut}
          onClick={handleSignOut}
          leftIcon={<LogOut size={16} />}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
