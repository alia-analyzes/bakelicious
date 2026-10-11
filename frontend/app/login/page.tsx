'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuthToken, isAuthenticated } from '@/lib/auth';
import { Lock, Mail, AlertCircle, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('admin@bakelicious.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: emailOrUsername,
        password: password
      });

      const { access_token, user } = response.data;
      setAuthToken(access_token, user);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 flex flex-col items-center justify-center p-4">
      {/* Link back to Public Website */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="px-4 py-2 bg-cream-100 hover:bg-cream-300 text-maroon-900 border border-cream-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Home className="w-4 h-4 text-maroon-600" />
          <span>Back to Bakery Website</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-cream-100 rounded-3xl shadow-xl border border-cream-300 p-8 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cream-200 border-2 border-cream-300 p-2 shadow-sm mb-2">
            <img
              src="/logo.png"
              alt="Bakelicious Logo"
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-black text-maroon-900 font-serif tracking-tight">
            Bakelicious
          </h1>
          <p className="text-xs text-charcoal-muted font-bold uppercase tracking-wider">
            Bakery Management ERP System
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-maroon-900 mb-1">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="admin@bakelicious.com"
                className="w-full pl-9 pr-4 py-2.5 bg-cream-200 border border-cream-300 rounded-xl text-sm font-medium text-maroon-900 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:bg-cream-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-maroon-900 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-cream-200 border border-cream-300 rounded-xl text-sm font-medium text-maroon-900 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:bg-cream-100 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-maroon-600 hover:bg-maroon-700 text-white rounded-xl font-bold text-sm shadow-md shadow-maroon-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to ERP Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3.5 bg-cream-200 rounded-xl border border-cream-300 text-center">
          <p className="text-[11px] text-charcoal-muted font-medium">
            Development Administrator Credentials:
          </p>
          <p className="text-xs font-mono font-bold text-maroon-800 mt-0.5">
            admin@bakelicious.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
