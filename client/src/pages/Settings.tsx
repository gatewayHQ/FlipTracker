import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, HelpCircle, ChevronRight, Moon, DollarSign, TrendingUp, Building2, LogOut, Save } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [goalsMsg, setGoalsMsg] = useState('');

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [darkMode] = useState(true);

  // Goals
  const [capitalGoal, setCapitalGoal] = useState('');
  const [targetRoi, setTargetRoi] = useState('');
  const [targetFlipDays, setTargetFlipDays] = useState('');

  useEffect(() => {
    api.auth.me().then((data: any) => {
      setName(data.name || '');
      setEmail(data.email || '');
      if (data.settings) {
        setNotifications(!!data.settings.notifications_enabled);
        setCapitalGoal(data.settings.capital_goal ? String(data.settings.capital_goal) : '');
        setTargetRoi(data.settings.target_roi ? String(data.settings.target_roi) : '');
        setTargetFlipDays(data.settings.target_flip_days ? String(data.settings.target_flip_days) : '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await api.auth.updateProfile({ name, email });
      await refreshUser();
      setProfileMsg('Saved!');
      setTimeout(() => setProfileMsg(''), 2000);
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to save');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGoals(true);
    setGoalsMsg('');
    try {
      await api.auth.updateSettings({
        capital_goal: parseFloat(capitalGoal) || 0,
        target_roi: parseFloat(targetRoi) || 0,
        target_flip_days: parseInt(targetFlipDays) || 0,
        notifications_enabled: notifications ? 1 : 0,
      });
      setGoalsMsg('Saved!');
      setTimeout(() => setGoalsMsg(''), 2000);
    } catch (err: any) {
      setGoalsMsg(err.message || 'Failed to save');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleNotifications = async () => {
    const next = !notifications;
    setNotifications(next);
    await api.auth.updateSettings({ notifications_enabled: next ? 1 : 0 }).catch(() => {});
  };

  return (
    <div className="min-h-full bg-surface-900">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Profile */}
            <form onSubmit={handleSaveProfile} className="card space-y-4">
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
              <div className="flex items-center justify-between">
                <button type="submit" disabled={savingProfile} className="btn-primary rounded-xl py-2.5 px-5 flex items-center gap-2">
                  <Save size={14} />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
                {profileMsg && (
                  <span className={`text-sm font-semibold ${profileMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>
                    {profileMsg}
                  </span>
                )}
              </div>
            </form>

            {/* Preferences */}
            <div className="card space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preferences</h2>
              <div className="flex items-center justify-between py-3 border-b border-surface-400/20">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-gray-400" />
                  <span className="text-sm text-white">Push Notifications</span>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-brand' : 'bg-surface-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-gray-400" />
                  <span className="text-sm text-white">Dark Mode</span>
                </div>
                <button
                  className="w-12 h-6 rounded-full transition-colors relative bg-brand"
                  disabled
                >
                  <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>

            {/* Investment Goals */}
            <form onSubmit={handleSaveGoals} className="card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Investment Goals</h2>
              <div>
                <label className="label">Annual Capital Goal</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={capitalGoal}
                    onChange={e => setCapitalGoal(e.target.value)}
                    placeholder="500000"
                    type="number"
                    className="input-field pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="label">Target ROI per Flip</label>
                <div className="relative">
                  <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={targetRoi}
                    onChange={e => setTargetRoi(e.target.value)}
                    placeholder="15"
                    type="number"
                    className="input-field pl-8"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Percentage</p>
              </div>
              <div>
                <label className="label">Target Flip Duration (days)</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={targetFlipDays}
                    onChange={e => setTargetFlipDays(e.target.value)}
                    placeholder="90"
                    type="number"
                    className="input-field pl-8"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button type="submit" disabled={savingGoals} className="btn-primary rounded-xl py-2.5 px-5 flex items-center gap-2">
                  <Save size={14} />
                  {savingGoals ? 'Saving...' : 'Save Goals'}
                </button>
                {goalsMsg && (
                  <span className={`text-sm font-semibold ${goalsMsg === 'Saved!' ? 'text-green-400' : 'text-red-400'}`}>
                    {goalsMsg}
                  </span>
                )}
              </div>
            </form>

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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>

            <div className="text-center py-4">
              <p className="text-sm font-bold text-gray-400">FlipFolio</p>
              <p className="text-xs text-gray-600">Real Estate Investment Tracker</p>
              <p className="text-xs text-gray-600 mt-1">Built for serious investors</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
