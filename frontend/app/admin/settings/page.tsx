'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Settings as SettingsIcon, Save, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { hasPermission, isSuperAdmin } from '@/lib/auth';

export default function AdminSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [bakeryName, setBakeryName] = useState('Bakelicious Artisan Bakery');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Park Street, Kolkata, West Bengal');
  const [currency, setCurrency] = useState('₹ (INR)');
  const [taxRate, setTaxRate] = useState(5.0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data) {
        setSettings(res.data);
        if (res.data.bakery_name) setBakeryName(res.data.bakery_name);
        if (res.data.phone) setPhone(res.data.phone);
        if (res.data.address) setAddress(res.data.address);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        key: 'business_name',
        value: bakeryName
      });
      showToast('Bakery system settings updated!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  return (
    <ProtectedRoute requiredPermission="SETTINGS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakery Store & System Settings" />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-4xl mx-auto w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-maroon-700 dark:text-cream-200" />
                  <span>ERP &amp; Store Configuration</span>
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Configure store contact info, WhatsApp order numbers, currency, and GST rates.
                </p>
              </div>
            </div>

            {/* Quick Access to User & Role Management */}
            {(isSuperAdmin() || hasPermission('USER_MANAGEMENT_VIEW')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/admin/users"
                  className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-xs hover:border-maroon-600/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-maroon-700 dark:bg-cream-100 text-cream-100 dark:text-maroon-900 flex items-center justify-center shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-maroon-950 dark:text-cream-100 group-hover:text-maroon-700 dark:group-hover:text-cream-200 transition">
                        User Management
                      </h4>
                      <p className="text-[10px] text-charcoal-muted dark:text-cream-300/70">
                        Manage bakery admins, bakers, and credentials
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted dark:text-cream-400 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  href="/admin/roles"
                  className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-xs hover:border-maroon-600/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-maroon-700 dark:bg-cream-100 text-cream-100 dark:text-maroon-900 flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-maroon-950 dark:text-cream-100 group-hover:text-maroon-700 dark:group-hover:text-cream-200 transition">
                        Role Permissions
                      </h4>
                      <p className="text-[10px] text-charcoal-muted dark:text-cream-300/70">
                        Configure system and custom permission schemes
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted dark:text-cream-400 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm space-y-5 sm:space-y-6 text-xs font-medium">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                    Bakery Business Name
                  </label>
                  <input
                    type="text"
                    value={bakeryName}
                    onChange={(e) => setBakeryName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                      Store Contact / WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-maroon-900 dark:text-cream-200 mb-1">
                    Bakery Address (Kolkata)
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-medium text-maroon-900 dark:text-cream-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
