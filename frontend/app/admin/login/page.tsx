'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuthToken, isAuthenticated, getStoredUser } from '@/lib/auth';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect according to role
    if (isAuthenticated()) {
      const user = getStoredUser();
      if (user?.primary_role?.toLowerCase() === 'baker' && !user.is_superadmin) {
        router.replace('/admin/production');
      } else {
        router.replace('/admin/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: emailOrUsername.trim(),
        password: password
      });

      const { access_token, user } = response.data;
      setAuthToken(access_token, user);

      // Baker redirection vs Admin redirection
      if (user.primary_role?.toLowerCase() === 'baker' && !user.is_superadmin) {
        router.push('/admin/production');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Backend server unavailable. Please ensure the Bakelicious backend is running on port 8000.');
      } else if (err.response.status === 401) {
        setError(err.response.data?.detail || 'Invalid email or password.');
      } else if (err.response.status === 400) {
        setError(err.response.data?.detail || 'Account is inactive. Please contact system admin.');
      } else {
        setError(err.response.data?.detail || 'Server error occurred during authentication. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 flex flex-col items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
      <div className="w-full max-w-md bg-cream-100 dark:bg-maroon-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-maroon-950/20 dark:border-cream-100/20 p-5 sm:p-8 space-y-5 sm:space-y-6">
        {/* Logo and Brand */}
        <div className="text-center flex flex-col items-center space-y-3">
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-cream-50 dark:bg-maroon-800 border-2 sm:border-3 border-maroon-950 dark:border-cream-100 p-1.5 sm:p-2 shadow-neo flex items-center justify-center shrink-0">
            <img
              src="/logo.svg"
              alt="Bakelicious Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
              Bakelicious ERP
            </h1>
            <p className="text-xs text-maroon-700 dark:text-cream-300 font-black uppercase tracking-widest mt-1">
              Bakery Management System
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-maroon-900 dark:text-cream-200 mb-1">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoComplete="off"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter email or username"
                className="w-full pl-9 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-sm font-medium text-maroon-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-maroon-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-maroon-900 dark:text-cream-200 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-11 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl text-sm font-medium text-maroon-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-maroon-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-charcoal-muted dark:text-cream-400 hover:text-maroon-900 dark:hover:text-cream-100 transition rounded-lg"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Bakery ERP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
