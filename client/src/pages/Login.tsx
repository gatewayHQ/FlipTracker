import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.auth.login({ email, password });
      login(token, user);
      navigate('/portfolio', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-surface-900 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center">
          <TrendingUp size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FlipFolio</h1>
          <p className="text-xs text-gray-400">Real Estate Investment Tracker</p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-9"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-2xl py-4 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
