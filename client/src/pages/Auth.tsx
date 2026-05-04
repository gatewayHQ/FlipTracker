import { useState } from 'react';
import { TrendingUp, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <TrendingUp size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">FlipFolio</h1>
        <p className="text-gray-400 text-sm mt-1">Real Estate Flip Tracker</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface-700 rounded-3xl p-6 border border-surface-400/20">
        <h2 className="text-lg font-bold text-white mb-6">
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <span className="text-green-400 text-sm">{message}</span>
            </div>
          )}

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

          {mode !== 'reset' && (
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  className="input-field pl-9 pr-10"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary rounded-xl py-4 mt-2">
            {loading
              ? 'Please wait...'
              : mode === 'login' ? 'Sign In'
              : mode === 'signup' ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 space-y-2 text-center">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('reset')} className="text-xs text-gray-400 hover:text-brand block w-full">
                Forgot password?
              </button>
              <button onClick={() => setMode('signup')} className="text-sm text-brand font-semibold block w-full">
                Don't have an account? Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => setMode('login')} className="text-sm text-brand font-semibold block w-full">
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button onClick={() => setMode('login')} className="text-sm text-brand font-semibold block w-full">
              Back to sign in
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-6 text-center">
        Your data is private and encrypted.
      </p>
    </div>
  );
}
