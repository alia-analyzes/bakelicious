'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { hasPermission, isSuperAdmin } from '@/lib/auth';
import {
  CalendarEvent,
  CalendarSummary,
  CalendarEventType,
  Ingredient,
  User
} from '@/types';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Boxes,
  ChefHat,
  ShoppingBag,
  StickyNote,
  Phone,
  MapPin,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Tag,
  DollarSign,
  Package,
  CalendarDays,
  Trash2,
  Edit,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminCalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [summary, setSummary] = useState<CalendarSummary | null>(null);

  // Filter state
  const [activeTypeFilters, setActiveTypeFilters] = useState<CalendarEventType[]>([
    'NEW_ORDER', 'MAKING', 'READY', 'DELIVERY', 'DELIVERED', 'LATE', 'STOCK', 'NOTE'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bakerFilter, setBakerFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Related metadata
  const [bakers, setBakers] = useState<User[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Selection & Drawers state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockDetailModalOpen, setStockDetailModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  // Reschedule Confirmation state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [pendingDropInfo, setPendingDropInfo] = useState<any | null>(null);

  // Form states
  const [stockForm, setStockForm] = useState({
    ingredient_id: '',
    type: 'PURCHASE',
    quantity_change: '',
    unit_cost_at_time: '',
    notes: ''
  });

  const [noteForm, setNoteForm] = useState({
    id: null as number | null,
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    all_day: true,
    priority: 'Normal',
    color: '#8B5CF6',
    is_completed: false
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchEvents(),
        fetchBakers(),
        fetchIngredients()
      ]);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/calendar/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const params: any = {};
      if (bakerFilter !== 'ALL') params.baker_id = bakerFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeTypeFilters.length < 8) params.event_type = activeTypeFilters.join(',');

      const res = await api.get('/calendar/events', { params });
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    }
  };

  const fetchBakers = async () => {
    try {
      const res = await api.get('/users');
      setBakers(res.data || []);
    } catch (err) {
      // User management permission might restrict /users, gracefully ignore
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await api.get('/ingredients');
      setIngredients(res.data || []);
      if (res.data && res.data.length > 0) {
        setStockForm(prev => ({ ...prev, ingredient_id: String(res.data[0].id) }));
      }
    } catch (err) {
      // Gracefully ignore if inventory permission not held
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTypeFilters, bakerFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const toggleTypeFilter = (type: CalendarEventType) => {
    if (activeTypeFilters.includes(type)) {
      if (activeTypeFilters.length === 1) return; // Keep at least one
      setActiveTypeFilters(activeTypeFilters.filter(t => t !== type));
    } else {
      setActiveTypeFilters([...activeTypeFilters, type]);
    }
  };

  const selectAllFilters = () => {
    setActiveTypeFilters(['NEW_ORDER', 'MAKING', 'READY', 'DELIVERY', 'DELIVERED', 'LATE', 'STOCK', 'NOTE']);
  };

  // FullCalendar event click & double click
  const lastClickTimeRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const handleEventClick = (info: any) => {
    const evId = info.event.id;
    const now = Date.now();
    const eventObj: CalendarEvent = info.event.extendedProps.calendarEvent;

    if (lastClickTimeRef.current.id === evId && now - lastClickTimeRef.current.time < 350) {
      // Double click action!
      handleEventDoubleClick(eventObj);
      return;
    }
    lastClickTimeRef.current = { id: evId, time: now };

    // Single click action
    setSelectedEvent(eventObj);
    if (eventObj.related_entity_type === 'ORDER' || eventObj.related_entity_type === 'PRODUCTION') {
      setOrderModalOpen(true);
    } else if (eventObj.related_entity_type === 'INVENTORY_TRANSACTION') {
      setStockDetailModalOpen(true);
    } else if (eventObj.related_entity_type === 'CALENDAR_NOTE') {
      openEditNoteModal(eventObj);
    }
  };

  const handleEventDoubleClick = (ev: CalendarEvent) => {
    if (ev.related_entity_type === 'ORDER') {
      router.push(`/admin/orders?search=${encodeURIComponent(ev.details?.order_number || '')}`);
    } else if (ev.related_entity_type === 'PRODUCTION') {
      router.push(`/admin/production`);
    } else if (ev.related_entity_type === 'INVENTORY_TRANSACTION') {
      router.push(`/admin/inventory`);
    }
  };

  const handleDateClick = (info: any) => {
    const clickedDateStr = info.dateStr;
    setSelectedDate(clickedDateStr);
    const dayEvs = events.filter(e => e.start_datetime.startsWith(clickedDateStr));
    setDayEvents(dayEvs);
    setDayDrawerOpen(true);
  };

  // Drag and Drop Reschedule
  const handleEventDrop = (dropInfo: any) => {
    setPendingDropInfo(dropInfo);
    setRescheduleModalOpen(true);
  };

  const confirmReschedule = async () => {
    if (!pendingDropInfo) return;
    const evObj: CalendarEvent = pendingDropInfo.event.extendedProps.calendarEvent;
    const newStart = pendingDropInfo.event.start.toISOString();

    let entity_type: 'ORDER_DELIVERY' | 'PRODUCTION' | 'CALENDAR_NOTE' = 'ORDER_DELIVERY';
    if (evObj.event_type === 'MAKING') entity_type = 'PRODUCTION';
    else if (evObj.event_type === 'NOTE') entity_type = 'CALENDAR_NOTE';

    try {
      await api.post('/calendar/reschedule', {
        entity_type,
        entity_id: evObj.related_entity_id,
        new_start_datetime: newStart
      });
      showToast(`Rescheduled ${evObj.title} to ${new Date(newStart).toLocaleDateString()}`);
      fetchEvents();
      fetchSummary();
    } catch (err: any) {
      console.error('Reschedule failed:', err);
      pendingDropInfo.revert(); // Rollback visually!
      showToast(err.response?.data?.detail || 'Failed to reschedule event. Permission denied or server error.');
    } finally {
      setRescheduleModalOpen(false);
      setPendingDropInfo(null);
    }
  };

  const cancelReschedule = () => {
    if (pendingDropInfo) {
      pendingDropInfo.revert();
    }
    setRescheduleModalOpen(false);
    setPendingDropInfo(null);
  };

  // Custom Note Creation & Editing
  const openNewNoteModal = (dateStr?: string) => {
    setNoteForm({
      id: null,
      title: '',
      description: '',
      date: dateStr || new Date().toISOString().split('T')[0],
      time: '10:00',
      all_day: true,
      priority: 'Normal',
      color: '#8B5CF6',
      is_completed: false
    });
    setEditingNote(null);
    setNoteModalOpen(true);
  };

  const openEditNoteModal = (ev: CalendarEvent) => {
    const details = ev.details || {};
    const dt = new Date(ev.start_datetime);
    setNoteForm({
      id: ev.related_entity_id,
      title: details.title || ev.title.replace('🟣 Note: ', ''),
      description: details.description || '',
      date: dt.toISOString().split('T')[0],
      time: dt.toTimeString().substring(0, 5),
      all_day: details.all_day ?? true,
      priority: details.priority || 'Normal',
      color: ev.color || '#8B5CF6',
      is_completed: details.is_completed || false
    });
    setEditingNote(ev);
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const start_datetime = noteForm.all_day
        ? `${noteForm.date}T00:00:00`
        : `${noteForm.date}T${noteForm.time}:00`;

      if (noteForm.id) {
        await api.put(`/calendar/notes/${noteForm.id}`, {
          title: noteForm.title,
          description: noteForm.description,
          start_datetime,
          all_day: noteForm.all_day,
          priority: noteForm.priority,
          color: noteForm.color,
          is_completed: noteForm.is_completed
        });
        showToast('Note updated successfully');
      } else {
        await api.post('/calendar/notes', {
          title: noteForm.title,
          description: noteForm.description,
          start_datetime,
          all_day: noteForm.all_day,
          priority: noteForm.priority,
          color: noteForm.color
        });
        showToast('Note created successfully');
      }
      setNoteModalOpen(false);
      fetchEvents();
      fetchSummary();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save note');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteForm.id) return;
    try {
      await api.delete(`/calendar/notes/${noteForm.id}`);
      showToast('Note deleted');
      setNoteModalOpen(false);
      fetchEvents();
      fetchSummary();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete note');
    }
  };

  // Stock Update Submission
  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        ingredient_id: parseInt(stockForm.ingredient_id),
        type: stockForm.type,
        quantity_change: parseFloat(stockForm.quantity_change),
        unit_cost_at_time: stockForm.unit_cost_at_time ? parseFloat(stockForm.unit_cost_at_time) : null,
        notes: stockForm.notes
      });
      showToast('Stock update saved and inventory updated!');
      setStockModalOpen(false);
      setStockForm({ ingredient_id: ingredients[0]?.id ? String(ingredients[0].id) : '', type: 'PURCHASE', quantity_change: '', unit_cost_at_time: '', notes: '' });
      fetchEvents();
      fetchSummary();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to record stock update');
    }
  };

  // Order Status update from drawer
  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!selectedEvent) return;
    try {
      await api.put(`/orders/${selectedEvent.details.order_id}/status`, { order_status: newStatus });
      showToast(`Order #${selectedEvent.details.order_number} status updated to ${newStatus}`);
      setSelectedEvent(prev => prev ? { ...prev, status: newStatus, details: { ...prev.details, order_status: newStatus } } : null);
      fetchEvents();
      fetchSummary();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update order status');
    }
  };

  // Event Card rendering in FullCalendar
  const renderEventContent = (eventInfo: any) => {
    const ev: CalendarEvent = eventInfo.event.extendedProps.calendarEvent;
    if (!ev) return null;

    let icon = '🔵';
    let typeBadge = 'NEW ORDER';
    let containerStyle = 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700/80';

    switch (ev.event_type) {
      case 'MAKING':
        icon = '🟠';
        typeBadge = 'MAKING';
        containerStyle = 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80';
        break;
      case 'READY':
        icon = '🟢';
        typeBadge = 'READY';
        containerStyle = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/80';
        break;
      case 'DELIVERY':
        icon = '🩵';
        typeBadge = 'DELIVERY';
        containerStyle = 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700/80';
        break;
      case 'DELIVERED':
        icon = '🟢';
        typeBadge = 'DELIVERED';
        containerStyle = 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700/80';
        break;
      case 'LATE':
        icon = '🔴';
        typeBadge = 'LATE';
        containerStyle = 'bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600 ring-1 ring-rose-500/40 font-semibold animate-pulse-subtle';
        break;
      case 'STOCK':
        icon = '🟡';
        typeBadge = 'STOCK';
        containerStyle = 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-950 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700/80';
        break;
      case 'NOTE':
        icon = '🟣';
        typeBadge = 'NOTE';
        containerStyle = 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700/80';
        break;
    }

    return (
      <div
        className={`w-full p-1.5 rounded-xl border text-[11px] leading-tight shadow-sm transition-all duration-150 hover:shadow-md cursor-pointer overflow-hidden ${containerStyle}`}
        title={`${ev.title} - Double click to view full details`}
      >
        <div className="flex items-center justify-between font-extrabold gap-1">
          <span className="truncate flex items-center gap-1">
            <span>{icon}</span>
            <span className="uppercase text-[9px] tracking-wider px-1 py-0.2 rounded bg-black/5 dark:bg-white/10">{typeBadge}</span>
          </span>
          {ev.details?.delivery_time && (
            <span className="text-[10px] font-mono opacity-90">{ev.details.delivery_time}</span>
          )}
        </div>
        <div className="font-bold truncate mt-0.5">{ev.title.replace(/^.[^\s]+\s*/, '')}</div>
        {ev.subtitle && (
          <div className="text-[10px] opacity-85 truncate font-medium">{ev.subtitle}</div>
        )}
      </div>
    );
  };

  const getEventDrawerStyle = (ev: CalendarEvent) => {
    switch (ev.event_type) {
      case 'NEW_ORDER':
        return {
          icon: '🔵',
          badge: 'NEW ORDER',
          cardStyle: 'bg-blue-50 dark:bg-blue-950/70 text-blue-950 dark:text-blue-100 border-blue-300 dark:border-blue-700/80 border-l-4 border-l-blue-500',
          badgeStyle: 'bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
        };
      case 'MAKING':
        return {
          icon: '🟠',
          badge: 'MAKING',
          cardStyle: 'bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700/80 border-l-4 border-l-amber-500',
          badgeStyle: 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
        };
      case 'READY':
        return {
          icon: '🟢',
          badge: 'READY',
          cardStyle: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700/80 border-l-4 border-l-emerald-500',
          badgeStyle: 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
        };
      case 'DELIVERY':
        return {
          icon: '🩵',
          badge: 'DELIVERY',
          cardStyle: 'bg-sky-50 dark:bg-sky-950/70 text-sky-950 dark:text-sky-100 border-sky-300 dark:border-sky-700/80 border-l-4 border-l-sky-500',
          badgeStyle: 'bg-sky-200/80 dark:bg-sky-900 text-sky-900 dark:text-sky-200'
        };
      case 'DELIVERED':
        return {
          icon: '🟢',
          badge: 'DELIVERED',
          cardStyle: 'bg-teal-50 dark:bg-teal-950/70 text-teal-950 dark:text-teal-100 border-teal-300 dark:border-teal-700/80 border-l-4 border-l-teal-600',
          badgeStyle: 'bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-200'
        };
      case 'LATE':
        return {
          icon: '🔴',
          badge: 'LATE / OVERDUE',
          cardStyle: 'bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-600 border-l-4 border-l-rose-600 ring-2 ring-rose-500/40 animate-pulse-subtle',
          badgeStyle: 'bg-rose-600 text-white font-black'
        };
      case 'STOCK':
        return {
          icon: '🟡',
          badge: 'STOCK',
          cardStyle: 'bg-yellow-50 dark:bg-yellow-950/70 text-yellow-950 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700/80 border-l-4 border-l-yellow-500',
          badgeStyle: 'bg-yellow-200/90 dark:bg-yellow-900 text-yellow-950 dark:text-yellow-200'
        };
      case 'NOTE':
        return {
          icon: '🟣',
          badge: 'NOTE',
          cardStyle: 'bg-purple-50 dark:bg-purple-950/70 text-purple-950 dark:text-purple-100 border-purple-300 dark:border-purple-700/80 border-l-4 border-l-purple-500',
          badgeStyle: 'bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200'
        };
      default:
        return {
          icon: '🔵',
          badge: 'EVENT',
          cardStyle: 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-100 border-cream-300 dark:border-maroon-700 border-l-4 border-l-maroon-600',
          badgeStyle: 'bg-cream-300 dark:bg-maroon-700 text-charcoal dark:text-cream-100'
        };
    }
  };

  // FullCalendar event source payload
  const calendarEventsPayload = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start_datetime,
    end: e.end_datetime || e.start_datetime,
    allDay: e.all_day,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    extendedProps: { calendarEvent: e }
  }));

  return (
    <ProtectedRoute requiredPermission="CALENDAR_VIEW">
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 text-charcoal dark:text-cream-100 flex font-sans">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenSidebar={() => setSidebarOpen(true)} title="Bakelicious Bakery Operations Calendar" />

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-maroon-900 text-cream-100 px-4 py-3 rounded-2xl shadow-2xl border border-cream-300/30 flex items-center gap-2 animate-bounce-short text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          <main className="flex-1 p-2.5 sm:p-5 space-y-3.5 sm:space-y-4 w-full max-w-full min-w-0">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-cream-100 dark:bg-maroon-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-maroon-950 dark:text-cream-100 flex items-center gap-2">
                  <CalendarDays className="w-7 h-7 text-maroon-600 dark:text-cream-300" />
                  Bakery Operations Calendar
                </h1>
                <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1">
                  Single control hub for orders, kitchen production, ready statuses, deliveries, stock updates, and operational notes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openNewNoteModal()}
                  className="px-3.5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Note</span>
                </button>

                {hasPermission('INVENTORY_ADJUST') && (
                  <button
                    onClick={() => setStockModalOpen(true)}
                    className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>+ Stock Update</span>
                  </button>
                )}

                {hasPermission('ORDERS_CREATE') && (
                  <button
                    onClick={() => router.push('/admin/orders')}
                    className="px-3.5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>+ New Order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Today's Operations Summary Bar */}
            {summary && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-charcoal-muted dark:text-cream-300/80 uppercase tracking-widest px-1">
                  TODAY'S OPERATIONS SUMMARY
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                  <div
                    onClick={() => toggleTypeFilter('NEW_ORDER')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('NEW_ORDER')
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">New Orders</span>
                    <span className="text-2xl font-black">{summary.new_orders_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('MAKING')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('MAKING')
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">In Production</span>
                    <span className="text-2xl font-black">{summary.making_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('READY')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('READY')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Ready</span>
                    <span className="text-2xl font-black">{summary.ready_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('DELIVERY')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('DELIVERY')
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase block">Scheduled Deliveries</span>
                    <span className="text-2xl font-black">{summary.deliveries_scheduled_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('LATE')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      summary.late_overdue_today > 0
                        ? 'bg-rose-100 dark:bg-rose-950 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/50 shadow-md'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase flex items-center justify-between">
                      <span>Late / Overdue</span>
                      {summary.late_overdue_today > 0 && <AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" />}
                    </span>
                    <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{summary.late_overdue_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('STOCK')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('STOCK')
                        ? 'bg-yellow-50 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-800 text-yellow-950 dark:text-yellow-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-yellow-800 dark:text-yellow-300 uppercase block">Stock Updates</span>
                    <span className="text-2xl font-black">{summary.stock_updates_today}</span>
                  </div>

                  <div
                    onClick={() => toggleTypeFilter('NOTE')}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                      activeTypeFilters.includes('NOTE')
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 shadow-sm'
                        : 'bg-cream-100 dark:bg-maroon-900/40 border-cream-300 dark:border-maroon-800 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block">Tasks / Notes</span>
                    <span className="text-2xl font-black">{summary.notes_today}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Legend & Filters Bar */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 space-y-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Interactive Legend Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-muted dark:text-cream-300/80 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filter Legend:
                  </span>

                  <button
                    onClick={selectAllFilters}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                      activeTypeFilters.length === 8
                        ? 'bg-maroon-800 text-cream-100 border-maroon-900'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal dark:text-cream-200 border-cream-300 dark:border-maroon-700'
                    }`}
                  >
                    All
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('NEW_ORDER')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('NEW_ORDER')
                        ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🔵</span> New Order
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('MAKING')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('MAKING')
                        ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🟠</span> Making
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('READY')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('READY')
                        ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🟢</span> Ready
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('DELIVERY')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('DELIVERY')
                        ? 'bg-sky-100 dark:bg-sky-900/80 text-sky-900 dark:text-sky-100 border-sky-300 dark:border-sky-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🩵</span> Delivery
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('DELIVERED')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('DELIVERED')
                        ? 'bg-teal-100 dark:bg-teal-900/80 text-teal-900 dark:text-teal-100 border-teal-300 dark:border-teal-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🟢</span> Delivered
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('LATE')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('LATE')
                        ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🔴</span> Late
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('STOCK')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('STOCK')
                        ? 'bg-yellow-100 dark:bg-yellow-900/80 text-yellow-950 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🟡</span> Stock
                  </button>

                  <button
                    onClick={() => toggleTypeFilter('NOTE')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                      activeTypeFilters.includes('NOTE')
                        ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700'
                        : 'bg-cream-200 dark:bg-maroon-800 text-charcoal-muted dark:text-cream-400 border-cream-300 dark:border-maroon-700 opacity-50'
                    }`}
                  >
                    <span>🟣</span> Note
                  </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-muted dark:text-cream-300/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order #, client, cake, stock..."
                    className="w-full pl-9 pr-3 py-2 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-maroon-600 dark:text-cream-100 placeholder:text-xs"
                  />
                </form>
              </div>

              {/* Baker & Priority Select Filters */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-cream-300/60 dark:border-maroon-800/80 text-xs">
                {bakers.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-charcoal-muted dark:text-cream-300/80">Baker:</span>
                    <select
                      value={bakerFilter}
                      onChange={(e) => setBakerFilter(e.target.value)}
                      className="bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="ALL">All Bakers</option>
                      {bakers.map(b => (
                        <option key={b.id} value={b.id}>{b.full_name || b.username}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-charcoal-muted dark:text-cream-300/80">Priority:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl px-2.5 py-1 text-xs font-semibold"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="ml-auto text-[11px] text-charcoal-muted dark:text-cream-300/60 font-medium hidden sm:block">
                  💡 Double-click events to jump directly to Order / Inventory / Production pages
                </div>
              </div>
            </div>

            {/* FullCalendar Operations Container */}
            <div className="bg-cream-100 dark:bg-maroon-900 p-2 sm:p-4 lg:p-6 rounded-2xl sm:rounded-3xl border border-cream-300 dark:border-maroon-800 shadow-sm overflow-hidden w-full">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-xs font-bold text-charcoal-muted dark:text-cream-300/70">
                  <RefreshCw className="w-8 h-8 animate-spin text-maroon-600 dark:text-cream-300 mb-2" />
                  <span>Loading Bakery Operations Calendar...</span>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek'
                  }}
                  events={calendarEventsPayload}
                  eventContent={renderEventContent}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  editable={hasPermission('CALENDAR_EDIT') || isSuperAdmin()}
                  eventDrop={handleEventDrop}
                  dayMaxEvents={4}
                  moreLinkClick={(info) => {
                    handleDateClick({ dateStr: info.date.toISOString().split('T')[0] });
                    return 'none';
                  }}
                  height="820px"
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* -------------------------------------------------------------
          1. DAY DETAILS SIDE DRAWER
         ------------------------------------------------------------- */}
      {dayDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-maroon-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-cream-100 dark:bg-maroon-900 h-full h-[100dvh] p-4 sm:p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-cream-300 dark:border-maroon-800 animate-slide-left">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-cream-300 dark:border-maroon-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-maroon-700 dark:text-cream-300 uppercase block">Daily Operations Schedule</span>
                  <h3 className="text-xl font-extrabold font-serif text-maroon-950 dark:text-cream-100">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Day Details'}
                  </h3>
                </div>
                <button onClick={() => setDayDrawerOpen(false)} className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-charcoal-muted dark:text-cream-300 hover:text-maroon-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event count overview for day */}
              <div className="flex items-center justify-between p-3 bg-cream-200 dark:bg-maroon-800 rounded-2xl text-xs font-bold">
                <span>Total Scheduled Operations:</span>
                <span className="px-2 py-0.5 rounded-xl bg-maroon-700 text-cream-100">{dayEvents.length} Events</span>
              </div>

              {/* Grouped Day Events */}
              {dayEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-charcoal-muted dark:text-cream-300/60 font-medium">
                  No scheduled orders, production, or stock events for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map(ev => {
                    const style = getEventDrawerStyle(ev);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setSelectedEvent(ev);
                          if (ev.related_entity_type === 'ORDER' || ev.related_entity_type === 'PRODUCTION') setOrderModalOpen(true);
                          else if (ev.related_entity_type === 'INVENTORY_TRANSACTION') setStockDetailModalOpen(true);
                          else if (ev.related_entity_type === 'CALENDAR_NOTE') openEditNoteModal(ev);
                        }}
                        onDoubleClick={() => handleEventDoubleClick(ev)}
                        className={`p-3.5 rounded-2xl border shadow-xs hover:shadow-md cursor-pointer transition space-y-1.5 ${style.cardStyle}`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs gap-2">
                          <span className="flex items-center gap-1.5 font-extrabold truncate">
                            <span>{style.icon}</span>
                            <span className="truncate">{ev.title.replace(/^.[^\s]+\s*/, '')}</span>
                          </span>
                          <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-lg uppercase shrink-0 ${style.badgeStyle}`}>
                            {style.badge}
                          </span>
                        </div>
                        {ev.subtitle && <p className="text-xs font-semibold opacity-90">{ev.subtitle}</p>}
                        {ev.description && <p className="text-[11px] opacity-80 font-medium">{ev.description}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-cream-300 dark:border-maroon-800 flex items-center justify-between gap-2">
              <button
                onClick={() => { setDayDrawerOpen(false); openNewNoteModal(selectedDate || undefined); }}
                className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Note on this day
              </button>
              {hasPermission('INVENTORY_ADJUST') && (
                <button
                  onClick={() => { setDayDrawerOpen(false); setStockModalOpen(true); }}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Boxes className="w-3.5 h-3.5" /> + Stock Update
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          2. ORDER QUICK DETAILS DRAWER / MODAL
         ------------------------------------------------------------- */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={selectedEvent ? `Order Details: ${selectedEvent.details?.order_number}` : 'Order Details'}
        maxWidth="lg"
      >
        {selectedEvent && selectedEvent.details && (
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 bg-cream-200 dark:bg-maroon-800 rounded-2xl border border-cream-300 dark:border-maroon-700">
              <div>
                <span className="font-extrabold text-base text-maroon-950 dark:text-cream-100 block">
                  {selectedEvent.details.client_name}
                </span>
                <span className="text-xs font-mono text-maroon-700 dark:text-cream-300 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-maroon-600 dark:text-cream-400" />
                  {selectedEvent.details.client_phone}
                </span>
              </div>
              <div className="text-right space-y-1">
                <StatusBadge status={selectedEvent.details.order_status} />
                {selectedEvent.details.is_late && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] block animate-pulse">
                    🔴 OVERDUE / LATE
                  </span>
                )}
              </div>
            </div>

            {/* Dates & Schedule Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-cream-100 dark:bg-maroon-900 border border-cream-300 dark:border-maroon-800 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 block uppercase">Delivery Schedule</span>
                <span className="font-bold text-maroon-900 dark:text-cream-100">
                  {selectedEvent.details.delivery_date ? new Date(selectedEvent.details.delivery_date).toLocaleDateString() : 'N/A'} ({selectedEvent.details.delivery_time})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 block uppercase">Production Date</span>
                <span className="font-bold text-maroon-900 dark:text-cream-100">
                  {selectedEvent.details.production_date ? new Date(selectedEvent.details.production_date).toLocaleDateString() : 'Unscheduled'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-muted dark:text-cream-300/70 block uppercase">Assigned Baker</span>
                <span className="font-bold text-maroon-900 dark:text-cream-100 flex items-center gap-1">
                  👨‍🍳 {selectedEvent.details.assigned_baker || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Items summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-maroon-900 dark:text-cream-200">Ordered Items Summary:</h4>
              <div className="p-3 bg-cream-200 dark:bg-maroon-800 rounded-2xl border border-cream-300 dark:border-maroon-700">
                <p className="font-semibold text-charcoal dark:text-cream-100">{selectedEvent.details.items_summary}</p>
                {selectedEvent.details.special_instructions && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mt-1">
                    ⚠️ Special Instructions: {selectedEvent.details.special_instructions}
                  </p>
                )}
              </div>
            </div>

            {/* Delivery address */}
            <div className="p-3 bg-cream-200 dark:bg-maroon-800 rounded-2xl space-y-1">
              <span className="font-bold text-maroon-900 dark:text-cream-200 block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Delivery Address / Venue:
              </span>
              <p className="text-charcoal-muted dark:text-cream-300 font-medium">{selectedEvent.details.delivery_address}</p>
            </div>

            {/* Total Amount & Payment */}
            <div className="flex items-center justify-between pt-2 border-t border-cream-300 dark:border-maroon-800 font-bold">
              <div>
                <span>Total Amount:</span>
                <span className="text-base font-extrabold text-maroon-950 dark:text-cream-100 ml-2">
                  ₹{selectedEvent.details.final_amount}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-cream-300 dark:bg-maroon-700">
                Payment: {selectedEvent.details.payment_status}
              </span>
            </div>

            {/* Quick Status Advance Actions */}
            {hasPermission('ORDERS_STATUS_UPDATE') && (
              <div className="pt-2 space-y-1 border-t border-cream-300 dark:border-maroon-800">
                <span className="font-bold text-charcoal-muted dark:text-cream-300/80 block">Advance Order Status:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => handleUpdateOrderStatus('Confirmed')} className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 font-bold text-[11px]">Confirm</button>
                  <button onClick={() => handleUpdateOrderStatus('Preparing')} className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px]">Preparing</button>
                  <button onClick={() => handleUpdateOrderStatus('Baking')} className="px-2.5 py-1 rounded-xl bg-orange-100 text-orange-900 font-bold text-[11px]">Baking</button>
                  <button onClick={() => handleUpdateOrderStatus('Ready')} className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-[11px]">Mark Ready</button>
                  <button onClick={() => handleUpdateOrderStatus('Delivered')} className="px-2.5 py-1 rounded-xl bg-teal-100 text-teal-900 font-bold text-[11px]">Mark Delivered</button>
                </div>
              </div>
            )}

            {/* Modal Quick Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-300 dark:border-maroon-800">
              <button
                onClick={() => {
                  setOrderModalOpen(false);
                  router.push(`/admin/orders?search=${encodeURIComponent(selectedEvent.details.order_number)}`);
                }}
                className="px-4 py-2 bg-maroon-800 text-cream-100 rounded-xl font-bold hover:bg-maroon-900 flex items-center gap-1"
              >
                <span>Full Order Management Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------------------------------------------------
          3. STOCK QUICK DETAIL POPUP
         ------------------------------------------------------------- */}
      <Modal
        isOpen={stockDetailModalOpen}
        onClose={() => setStockDetailModalOpen(false)}
        title={selectedEvent ? `Stock Activity: ${selectedEvent.details?.ingredient_name}` : 'Stock Event'}
        maxWidth="sm"
      >
        {selectedEvent && selectedEvent.details && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/60 rounded-2xl border border-yellow-300 dark:border-yellow-700/80 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-base text-yellow-950 dark:text-yellow-100">{selectedEvent.details.ingredient_name}</span>
                <span className="px-2 py-0.5 rounded-lg bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 text-[10px] uppercase tracking-wider font-extrabold">
                  {selectedEvent.details.transaction_type}
                </span>
              </div>

              <div className="text-lg font-black text-maroon-950 dark:text-cream-100">
                Quantity: {selectedEvent.details.quantity_str} {selectedEvent.details.unit}
              </div>

              <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800 flex items-center justify-between text-xs font-semibold">
                <span>Unit Cost: ₹{selectedEvent.details.unit_cost}/{selectedEvent.details.unit}</span>
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300">Total Valuation: ₹{selectedEvent.details.total_value}</span>
              </div>
            </div>

            {selectedEvent.details.supplier && (
              <div className="p-3 bg-cream-200 dark:bg-maroon-800 rounded-xl">
                <span className="font-bold block">Supplier: {selectedEvent.details.supplier}</span>
              </div>
            )}

            {selectedEvent.details.notes && (
              <div className="p-3 bg-cream-200 dark:bg-maroon-800 rounded-xl">
                <span className="font-bold block">Notes:</span>
                <p className="text-charcoal-muted dark:text-cream-300">{selectedEvent.details.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-cream-300 dark:border-maroon-800">
              <button
                onClick={() => {
                  setStockDetailModalOpen(false);
                  router.push('/admin/inventory');
                }}
                className="px-4 py-2 bg-maroon-800 text-cream-100 rounded-xl font-bold flex items-center gap-1.5"
              >
                <span>View Full Inventory Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------------------------------------------------
          4. CREATE STOCK UPDATE MODAL (CONNECTED TO INVENTORY API)
         ------------------------------------------------------------- */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="Record Stock Activity / Transaction"
        maxWidth="md"
      >
        <form onSubmit={handleSaveStockUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Select Ingredient / Raw Material *</label>
            <select
              value={stockForm.ingredient_id}
              onChange={(e) => setStockForm({ ...stockForm, ingredient_id: e.target.value })}
              required
              className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
            >
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.category}) - Current Stock: {i.quantity} {i.unit} (@ ₹{i.unit_cost}/{i.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Transaction Type *</label>
              <select
                value={stockForm.type}
                onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
              >
                <option value="PURCHASE">PURCHASE (+ Stock Addition)</option>
                <option value="PRODUCTION_CONSUMPTION">CONSUMPTION (- Used in Kitchen)</option>
                <option value="WASTAGE">WASTAGE (- Damaged/Expired)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (+/- Physical Count)</option>
                <option value="RETURN">RETURN (- Supplier Return)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Quantity Change (+ or -) *</label>
              <input
                type="number"
                step="0.001"
                value={stockForm.quantity_change}
                onChange={(e) => setStockForm({ ...stockForm, quantity_change: e.target.value })}
                placeholder="e.g. 10 or -2.5"
                required
                className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Unit Cost at Time (₹ per unit, Optional)</label>
            <input
              type="number"
              step="0.01"
              value={stockForm.unit_cost_at_time}
              onChange={(e) => setStockForm({ ...stockForm, unit_cost_at_time: e.target.value })}
              placeholder="Leave blank to use ingredient default cost"
              className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Transaction Notes / Supplier / Reference</label>
            <textarea
              value={stockForm.notes}
              onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              placeholder="e.g. Purchase invoice #1024 or wedding batch consumption"
              rows={2}
              className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-300 dark:border-maroon-800">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-2 bg-cream-300 dark:bg-maroon-800 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700"
            >
              Save Stock Update
            </button>
          </div>
        </form>
      </Modal>

      {/* -------------------------------------------------------------
          5. CUSTOM NOTE MODAL (CREATE / EDIT / DELETE)
         ------------------------------------------------------------- */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={noteForm.id ? 'Edit Operational Note' : 'Add New Operational Note'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1">Title *</label>
            <input
              type="text"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              placeholder="e.g. Buy whipping cream or Call wedding client"
              required
              className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Description / Checklist</label>
            <textarea
              value={noteForm.description}
              onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
              placeholder="Need 3 kg whipping cream before Saturday wedding orders..."
              rows={3}
              className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Date *</label>
              <input
                type="date"
                value={noteForm.date}
                onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })}
                required
                className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Time (Optional)</label>
              <input
                type="time"
                value={noteForm.time}
                onChange={(e) => setNoteForm({ ...noteForm, time: e.target.value, all_day: false })}
                className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Priority</label>
              <select
                value={noteForm.priority}
                onChange={(e) => setNoteForm({ ...noteForm, priority: e.target.value })}
                className="w-full p-2.5 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl font-bold"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Card Color</label>
              <input
                type="color"
                value={noteForm.color}
                onChange={(e) => setNoteForm({ ...noteForm, color: e.target.value })}
                className="w-full h-10 p-1 bg-cream-200 dark:bg-maroon-800 border border-cream-300 dark:border-maroon-700 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          {noteForm.id && (
            <div className="flex items-center gap-2 p-3 bg-cream-200 dark:bg-maroon-800 rounded-xl">
              <input
                type="checkbox"
                id="note-completed"
                checked={noteForm.is_completed}
                onChange={(e) => setNoteForm({ ...noteForm, is_completed: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="note-completed" className="font-bold text-xs cursor-pointer">
                Mark Note as Completed
              </label>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-cream-300 dark:border-maroon-800">
            {noteForm.id ? (
              <button
                type="button"
                onClick={handleDeleteNote}
                className="px-3 py-2 bg-rose-600 text-white font-bold rounded-xl flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Note
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 bg-cream-300 dark:bg-maroon-800 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800"
              >
                {noteForm.id ? 'Save Changes' : 'Create Note'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* -------------------------------------------------------------
          6. RESCHEDULE CONFIRMATION MODAL
         ------------------------------------------------------------- */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={cancelReschedule}
        title="Confirm Event Reschedule"
        maxWidth="sm"
      >
        {pendingDropInfo && (
          <div className="space-y-4 text-xs">
            <p className="font-semibold text-charcoal dark:text-cream-100">
              Are you sure you want to move <span className="font-bold text-maroon-900 dark:text-cream-100">{pendingDropInfo.event.title}</span> to{' '}
              <span className="font-bold text-maroon-900 dark:text-cream-100">{pendingDropInfo.event.start.toLocaleDateString()}</span>?
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
              ⚠️ This will update the underlying database record and create a security audit log entry.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-300 dark:border-maroon-800">
              <button
                onClick={cancelReschedule}
                className="px-4 py-2 bg-cream-300 dark:bg-maroon-800 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                className="px-4 py-2 bg-maroon-800 text-cream-100 font-bold rounded-xl hover:bg-maroon-900"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ProtectedRoute>
  );
}
