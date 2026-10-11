'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { Client, Order } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { showToast } from '@/lib/toast';
import { Plus, Search, Mail, MapPin, Phone, Trash2, Edit, User } from 'lucide-react';

export default function AdminClientsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      showToast('Failed to load client records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast('Client name and phone number are required', 'error');
      return;
    }

    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, { name, phone, email, address, notes });
        showToast('Client updated!', 'success');
      } else {
        await api.post('/clients', { name, phone, email, address, notes });
        showToast('New client registered!', 'success');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save client', 'error');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      showToast('Client record deleted', 'success');
      fetchClients();
    } catch (err) {
      showToast('Failed to delete client', 'error');
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <ProtectedRoute requiredPermission="CLIENTS_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Client CRM & Directory" />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-5 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                  Client CRM &amp; Contacts
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-0.5">
                  Manage bakery customer profiles, phone numbers, delivery addresses, and notes.
                </p>
              </div>

              <button
                onClick={handleOpenCreate}
                className="px-5 py-3 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Client</span>
              </button>
            </div>

            <div className="bg-cream-100 dark:bg-maroon-900 p-4 rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-charcoal-muted dark:text-cream-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client by name, phone or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs font-medium text-maroon-900 dark:text-cream-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-xs font-bold text-charcoal-muted">
                  Loading client directory...
                </div>
              ) : (
                filteredClients.map((c) => (
                  <div
                    key={c.id}
                    className="bg-cream-100 dark:bg-maroon-900 rounded-3xl border border-cream-300 dark:border-maroon-800 p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-maroon-800 text-cream-100 flex items-center justify-center font-bold text-sm font-serif shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-maroon-950 dark:text-cream-100 text-base font-serif">
                            {c.name}
                          </h3>
                          <span className="text-[11px] text-maroon-700 dark:text-cream-300 font-mono font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </span>
                        </div>
                      </div>

                      {c.email && (
                        <div className="text-xs text-charcoal-muted dark:text-cream-300/80 flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-maroon-600 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}

                      {c.address && (
                        <div className="text-xs text-charcoal-muted dark:text-cream-300/80 flex items-start gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-maroon-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{c.address}</span>
                        </div>
                      )}

                      {c.notes && (
                        <div className="p-2.5 bg-cream-200 dark:bg-maroon-800/60 rounded-xl border border-cream-300 dark:border-maroon-700 text-[11px] text-maroon-900 dark:text-cream-200 font-medium">
                          📝 {c.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-300 dark:border-maroon-800">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-2 rounded-xl text-maroon-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-maroon-800 transition"
                        title="Edit Client"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="p-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? `Edit Client: ${editingClient.name}` : 'Register New Client'}
        subtitle="Manage customer contact information."
        maxWidth="md"
      >
        <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-maroon-900 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Phone Number (WhatsApp) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@gmail.com"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Delivery Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 402, Park Street, Kolkata"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-maroon-900 mb-1">Internal Customer Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers eggless cakes, regular birthday buyer"
              className="w-full px-3.5 py-2 bg-cream-100 border border-cream-300 rounded-xl font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-300">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-cream-200 text-maroon-900 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-maroon-700 hover:bg-maroon-800 text-cream-100 font-bold rounded-xl shadow-md"
            >
              Save Client Profile
            </button>
          </div>
        </form>
      </Modal>
    </ProtectedRoute>
  );
}
