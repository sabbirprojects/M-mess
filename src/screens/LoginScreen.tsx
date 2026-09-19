import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('smart_meal_remembered_username') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || 'Invalid username or password');
      } else {
        try {
          if (rememberMe) {
            localStorage.setItem('smart_meal_remembered_username', username.trim());
          } else {
            localStorage.removeItem('smart_meal_remembered_username');
          }
        } catch {}
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E6F2DD]/60 px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md">
        
        {/* Single Premium Minimalist Card */}
        <div className="rounded-3xl border border-[#B1D3B9]/60 bg-white p-6 sm:p-8 shadow-xl shadow-[#659287]/10 space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#659287] text-white shadow-md shadow-[#659287]/25">
              <UtensilsCrossed className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1A332C]">
                Smart Meal Manager
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Mess Accounting & Daily Meal Management
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              id="auth-error-alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-username-input"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="auth-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="block w-full rounded-xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#659287] focus:outline-none focus:ring-2 focus:ring-[#88BDA4]/40 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                <input
                  id="auth-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#659287] focus:ring-[#88BDA4] cursor-pointer"
                />
                <span>Stay signed in on this device</span>
              </label>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#659287] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#659287]/25 hover:bg-[#52776e] focus:outline-none focus:ring-2 focus:ring-[#88BDA4] focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Single Account Badge Footer */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 text-[#659287]" />
            <span>Role Guard Active • Master Key Protected</span>
          </div>

        </div>

      </div>
    </div>
  );
};
