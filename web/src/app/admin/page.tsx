'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  PlusCircle,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  FileText,
  User,
  Users,
  LogOut,
  Loader2,
  Lock,
  Building2,
  MapPin,
  Send,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { QuickzyOrder, OrderStatus, evaluateSameDayCutoff, ParcelPricingConfig, DEFAULT_PRICING_CONFIG } from '@/types/delivery';
import { fetchAllOrders, updateOrderStatus, createOrder, fetchPricingConfig, savePricingConfig, assignOrderToDriver } from '@/lib/orderService';
import { adminGrantCredit, getCreditBalancePence } from '@/lib/creditService';
import { fetchRouteMiles } from '@/lib/routeMiles';

const ADMIN_AUTHORIZED_EMAIL = 'prajapatikaranc@gmail.com';

interface UserRecord {
  uid: string;
  email: string;
  name?: string;
  role: 'customer' | 'client' | 'driver' | 'admin';
  isAvailable?: boolean;
  companyName?: string;
  deliveryStream?: string;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Login form for admin
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Navigation tabs: 'orders' | 'by_location' | 'users' | 'drivers' | 'businesses' | 'pharmone' | 'pricing'
  const [activeTab, setActiveTab] = useState<'orders' | 'by_location' | 'users' | 'drivers' | 'businesses' | 'pharmone' | 'pricing' | 'credit'>('orders');

  // Manual credit grants for testing bookings
  const [creditEmail, setCreditEmail] = useState('');
  const [creditPounds, setCreditPounds] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditBusy, setCreditBusy] = useState(false);
  const [creditMessage, setCreditMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditMessage(null);
    const pounds = Number(creditPounds);
    const pence = Math.round(pounds * 100);
    if (!Number.isFinite(pounds) || pence <= 0 || pence > 1_000_000) {
      setCreditMessage({ ok: false, text: 'Enter an amount between £0.01 and £10,000.' });
      return;
    }
    setCreditBusy(true);
    try {
      const newBalance = await adminGrantCredit(creditEmail, pence, creditNote);
      setCreditMessage({
        ok: true,
        text: `Added £${pounds.toFixed(2)} to ${creditEmail.trim().toLowerCase()}. New balance £${(newBalance / 100).toFixed(2)}.`,
      });
      setCreditPounds('');
      setCreditNote('');
    } catch (err: any) {
      setCreditMessage({ ok: false, text: err?.message || 'Could not add credit' });
    } finally {
      setCreditBusy(false);
    }
  };

  const handleCheckBalance = async () => {
    setCreditMessage(null);
    if (!creditEmail.includes('@')) {
      setCreditMessage({ ok: false, text: 'Enter an account email first.' });
      return;
    }
    try {
      const bal = await getCreditBalancePence(creditEmail);
      setCreditMessage({ ok: true, text: `Current balance for ${creditEmail.trim().toLowerCase()}: £${(bal / 100).toFixed(2)}.` });
    } catch (err: any) {
      setCreditMessage({ ok: false, text: err?.message || 'Could not read balance' });
    }
  };

  // Orders and Dashboard state
  const [orders, setOrders] = useState<QuickzyOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderType, setNewOrderType] = useState<'pharmacy' | 'food' | 'parcel'>('parcel');
  const [newPickup, setNewPickup] = useState('Central London Hub, 100 Fleet St');
  const [newPickupPostcode, setNewPickupPostcode] = useState('EC4A 2AB');
  const [newDropoff, setNewDropoff] = useState('Mayfair Medical HQ, 14 Curzon St');
  const [newDropoffPostcode, setNewDropoffPostcode] = useState('W1J 5HN');
  const [newWeight, setNewWeight] = useState(2.0);
  const [newDesc, setNewDesc] = useState('Urgent Admin Dispatch Consignment');
  const [isRestricted, setIsRestricted] = useState(false);

  // Users data from Firestore
  const [registeredUsers, setRegisteredUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Driver Assignment state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignDriverUid, setAssignDriverUid] = useState('');
  const [dispatchError, setDispatchError] = useState('');

  // Bulk assignment by location
  const [bulkDriverUid, setBulkDriverUid] = useState('');
  const [assigningArea, setAssigningArea] = useState<string | null>(null);
  const [bulkAssigningLoading, setBulkAssigningLoading] = useState(false);

  // Pricing Configuration
  const [pricingConfig, setPricingConfig] = useState<ParcelPricingConfig>(DEFAULT_PRICING_CONFIG);
  const [pricingSaved, setPricingSaved] = useState(false);

  // Expanded location accordions
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setCurrentUserEmail(user.email.toLowerCase());
        if (user.email.toLowerCase() === ADMIN_AUTHORIZED_EMAIL) {
          loadOrders();
          loadUsers();
        }
      } else {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('quickzy_user_session');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.email) {
                setCurrentUserEmail(parsed.email.toLowerCase());
                if (parsed.email.toLowerCase() === ADMIN_AUTHORIZED_EMAIL) {
                  loadOrders();
                  loadUsers();
                }
              }
            } catch {}
          }
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const loadOrders = async () => {
    const list = await fetchAllOrders(ADMIN_AUTHORIZED_EMAIL, 'admin');
    setOrders(list);
    const pcfg = await fetchPricingConfig();
    setPricingConfig(pcfg);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'users'));
        const uList: UserRecord[] = [];
        snap.forEach((docSnap) => {
          uList.push(docSnap.data() as UserRecord);
        });
        setRegisteredUsers(uList);
      }
    } catch (e) {
      console.error('Error loading users from Firestore:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaved(false);
    await savePricingConfig(pricingConfig);
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2500);
  };

  const handleAssignDriver = async (orderId: string) => {
    const driver = toDriverProfile(assignDriverUid);
    if (!driver) return;
    setDispatchError('');
    try {
      await assignOrderToDriver({ id: orderId }, driver);
    } catch (err: any) {
      setDispatchError(err?.message || 'Could not assign driver');
      return;
    }
    setAssigningOrderId(null);
    setAssignDriverUid('');
    loadOrders();
  };

  // Bulk Assign All Orders in an Area to a Driver
  const handleBulkAssignLocation = async (area: string, orderIds: string[]) => {
    const driver = toDriverProfile(bulkDriverUid);
    if (!driver || orderIds.length === 0) return;
    setBulkAssigningLoading(true);
    setDispatchError('');

    try {
      for (const oid of orderIds) {
        await assignOrderToDriver(
          { id: oid },
          driver,
          `Admin bulk-assigned area [${area}] (${orderIds.length} parcels) to courier ${driver.name || driver.email}.`
        );
      }
      setAssigningArea(null);
      setBulkDriverUid('');
      await loadOrders();
    } catch (err: any) {
      setDispatchError(err?.message || 'Bulk assignment stopped part way. Check the orders list before retrying.');
      await loadOrders();
    } finally {
      setBulkAssigningLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      if (cleanEmail !== ADMIN_AUTHORIZED_EMAIL) {
        setLoginError(`Access Denied: Only ${ADMIN_AUTHORIZED_EMAIL} has administrative privileges.`);
        setLoginLoading(false);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, cleanEmail, loginPassword);
      setCurrentUserEmail(cred.user.email?.toLowerCase() || cleanEmail);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'quickzy_user_session',
          JSON.stringify({
            email: cleanEmail,
            role: 'admin',
            name: cred.user.displayName || 'Admin',
          })
        );
      }
      loadOrders();
      loadUsers();
    } catch (err: any) {
      console.error('Admin Sign-in error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid password for prajapatikaranc@gmail.com';
      }
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quickzy_user_session');
    }
    setCurrentUserEmail(null);
    setOrders([]);
    setRegisteredUsers([]);
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus, 'Fleet Unit #Admin-Priority-London');
    loadOrders();
  };

  const handleCreateOrderAsAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const [route] = await fetchRouteMiles([
      { pickupPostcode: newPickupPostcode.trim(), dropoffPostcode: newDropoffPostcode.trim() },
    ]);
    if (route?.miles == null) {
      alert(route?.error || 'Could not calculate route distance');
      return;
    }
    await createOrder('admin_override', ADMIN_AUTHORIZED_EMAIL, 'admin', {
      type: newOrderType,
      estimatedMiles: route.miles,
      pickupAddress: {
        line1: newPickup,
        postcode: newPickupPostcode.toUpperCase(),
        city: 'London',
        label: 'Admin Hub',
      },
      dropoffAddress: {
        line1: newDropoff,
        postcode: newDropoffPostcode.toUpperCase(),
        city: 'London',
        label: 'Admin Priority Dropoff',
      },
      timeSlot: 'same_day_asap',
      parcel: {
        weightKg: newWeight,
        lengthCm: 25,
        widthCm: 20,
        heightCm: 15,
        contentsDescription: newDesc,
        isRestricted,
        restrictedCategory: isRestricted ? 'Prescription Medicine' : undefined,
      },
    }, pricingConfig, 'Admin Karan');

    setIsCreatingOrder(false);
    loadOrders();
  };

  // CSV Export
  const handleExportOrdersCsv = () => {
    const headers = ['Order ID', 'Stream', 'Sender Email', 'Pickup Address', 'Pickup Postcode', 'Dropoff Address', 'Dropoff Postcode', 'Price GBP', 'Status', 'Driver Name', 'Driver Email', 'Created At'];
    const rows = orders.map((o) => [
      o.id,
      o.type,
      o.userEmail || o.userId,
      `"${(o.pickupAddress?.line1 || '').replace(/"/g, '""')}"`,
      o.pickupAddress?.postcode || '',
      `"${(o.dropoffAddress?.line1 || '').replace(/"/g, '""')}"`,
      o.dropoffAddress?.postcode || '',
      (o.priceGbp || 0).toFixed(2),
      o.status,
      `"${(o.assignedDriverName || '').replace(/"/g, '""')}"`,
      o.assignedDriverEmail || '',
      o.createdAt || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickzy_orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isAuthorized = currentUserEmail === ADMIN_AUTHORIZED_EMAIL;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o) return false;
      const q = (search || '').toLowerCase();
      const orderId = (o.id || '').toLowerCase();
      const pk = (o.pickupAddress?.postcode || '').toLowerCase();
      const dp = (o.dropoffAddress?.postcode || '').toLowerCase();
      const uEmail = (o.userEmail || o.userId || '').toLowerCase();
      const dName = (o.assignedDriverName || '').toLowerCase();

      const matchesSearch =
        !q ||
        orderId.includes(q) ||
        pk.includes(q) ||
        dp.includes(q) ||
        uEmail.includes(q) ||
        dName.includes(q);

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Group orders by location (outward postcode area, e.g. EC1, W1, SW1, SE1)
  const ordersByLocation = useMemo(() => {
    const map: Record<string, QuickzyOrder[]> = {};
    filteredOrders.forEach((o) => {
      const rawPostcode = o.pickupAddress?.postcode?.trim().toUpperCase() || 'UNKNOWN';
      const outcode = rawPostcode.split(' ')[0] || rawPostcode;
      if (!map[outcode]) map[outcode] = [];
      map[outcode].push(o);
    });
    return map;
  }, [filteredOrders]);

  const driversList = useMemo(() => {
    return registeredUsers.filter((u) => u.role === 'driver');
  }, [registeredUsers]);

  // Only drivers who have not switched themselves off can be dispatched to
  const availableDrivers = useMemo(() => driversList.filter((d) => d.isAvailable !== false), [driversList]);

  const toDriverProfile = (uid: string) => {
    const driver = availableDrivers.find((d) => d.uid === uid);
    return driver ? { uid: driver.uid, email: driver.email, name: driver.name, isAvailable: driver.isAvailable } : null;
  };


  const businessesList = useMemo(() => {
    return registeredUsers.filter((u) => u.role === 'client');
  }, [registeredUsers]);

  const regularUsersList = useMemo(() => {
    return registeredUsers.filter((u) => u.role === 'customer');
  }, [registeredUsers]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.priceGbp || 0), 0);
  const activeDeliveries = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1 text-emerald-400" />
            <div className="h-9 w-32 overflow-hidden flex items-center justify-start">
              <img src="/logo.png" alt="Quickzy" className="h-full w-auto object-contain object-left" />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              Admin Gateway
            </span>
            {isAuthorized && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                  {ADMIN_AUTHORIZED_EMAIL}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {!isAuthorized ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">Protected Admin Console</h1>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                This administration interface is restricted. You must be authenticated as{' '}
                <strong className="text-red-400 font-mono">{ADMIN_AUTHORIZED_EMAIL}</strong> to access live Firestore fleet records and dispatch tools.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-3.5 bg-neutral-900/90 p-6 sm:p-8 rounded-3xl border border-neutral-800 glass-panel text-left">
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Admin Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="prajapatikaranc@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize as Super Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stats Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Firestore Fleet Dispatch Console
                  </h1>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    LIVE FIRESTORE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Live Dispatch Management • Authenticated: <span className="text-white font-mono">{ADMIN_AUTHORIZED_EMAIL}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportOrdersCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition"
                  title="Export live orders to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export Orders CSV</span>
                </button>

                <button
                  onClick={() => setIsCreatingOrder(!isCreatingOrder)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-neutral-950 font-black text-xs hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Direct Order</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Total Orders</p>
                <p className="text-xl font-black text-white mt-1">{orders.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Active Deliveries</p>
                <p className="text-xl font-black text-cyan-400 mt-1">{activeDeliveries}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Registered Users</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{registeredUsers.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Available Drivers</p>
                <p className="text-xl font-black text-amber-400 mt-1">{availableDrivers.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase font-bold text-neutral-400">Total Revenue</p>
                <p className="text-xl font-black text-emerald-400 mt-1">£{totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'orders'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders ({filteredOrders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('by_location')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'by_location'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Orders by Location ({Object.keys(ordersByLocation).length} Areas)</span>
              </button>

              <button
                onClick={() => setActiveTab('drivers')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'drivers'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Drivers ({driversList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('businesses')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'businesses'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Businesses ({businessesList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'users'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>All Users ({registeredUsers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('pharmone')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'pharmone'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>PharmOne Connect</span>
              </button>

              <button
                onClick={() => setActiveTab('credit')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'credit'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Credit</span>
              </button>

              <button
                onClick={() => setActiveTab('pricing')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'pricing'
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pricing Metrics</span>
              </button>
            </div>

            {/* TAB: PRICING CONFIG */}
            {activeTab === 'credit' && (
              <div className="max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" /> Add credit manually
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Adds credit to any customer or company account without taking a payment. Use it to test bookings.
                    Every grant is written to the credit ledger with your admin email.
                  </p>
                </div>

                <form onSubmit={handleManualCredit} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Account email (customer or company)"
                    value={creditEmail}
                    onChange={(e) => setCreditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">£</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="Amount"
                        value={creditPounds}
                        onChange={(e) => setCreditPounds(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckBalance}
                      className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200"
                    >
                      Check balance
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Note (e.g. Test credit for UAT)"
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={creditBusy}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {creditBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Add credit
                  </button>
                </form>

                {creditMessage && (
                  <p className={`text-xs ${creditMessage.ok ? 'text-emerald-400' : 'text-red-400'}`}>{creditMessage.text}</p>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      London Parcel & Booking Pricing Metrics
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Set base fee, mileage rate, and surcharge metrics used across all user bookings in Firestore.
                    </p>
                  </div>
                  {pricingSaved && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Firestore!
                    </span>
                  )}
                </div>

                <form onSubmit={handleSavePricing} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block font-semibold">Base Fee (£)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={(pricingConfig.baseFeePence / 100).toFixed(2)}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          baseFeePence: Math.round(parseFloat(e.target.value || '0') * 100),
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block font-semibold">Per Mile (£)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={(pricingConfig.perMilePence / 100).toFixed(2)}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          perMilePence: Math.round(parseFloat(e.target.value || '0') * 100),
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1 flex flex-col justify-end">
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer"
                    >
                      Save Metrics
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: PHARMONE CONNECT */}
            {activeTab === 'pharmone' && (
              <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>PharmOne Connection Integration</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                          pharmone.co.uk
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Pharmacy businesses can bridge with PharmOne to automatically share orders, sync delivery payloads, and track deliveries end-to-end.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Direct Firebase Backend Bridge</span>
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      PharmOne is also developed with a Firebase backend. Connecting both apps allows real-time collection syncing: when a prescription order is confirmed on PharmOne, it dispatches instantly to Quickzy London Fleet.
                    </p>
                    <div className="pt-2 text-xs font-mono bg-neutral-900 p-3 rounded-xl border border-neutral-800 text-neutral-300 space-y-1">
                      <p className="text-emerald-400 font-bold">// Sync Status</p>
                      <p>Bridge URL: <span className="text-cyan-400">https://pharmone.co.uk/api/dispatch</span></p>
                      <p>Protocol: <span className="text-neutral-400">Firebase Firestore Cloud Functions Cross-App Sync</span></p>
                      <p>Status: <span className="text-emerald-400 font-bold">READY TO CONNECT</span></p>
                    </div>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Shared Pharmacy Orders ({orders.filter(o => o.type === 'pharmacy').length})</span>
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      All pharmacy deliveries are secured under cold-chain / chain-of-custody protocols and delivered within a 10-mile radius across London.
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {orders.filter(o => o.type === 'pharmacy').length === 0 ? (
                        <p className="text-xs text-neutral-500 italic p-3 bg-neutral-900 rounded-xl">No pharmacy orders currently pending dispatch.</p>
                      ) : (
                        orders.filter(o => o.type === 'pharmacy').map(o => (
                          <div key={o.id} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs flex justify-between items-center">
                            <div>
                              <span className="font-mono font-bold text-white">#{o.id}</span>
                              <span className="text-neutral-400 ml-2 font-mono text-[11px]">{o.pickupAddress?.postcode} ➔ {o.dropoffAddress?.postcode}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                              {o.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ALL USERS */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">
                    All Registered Accounts ({registeredUsers.length})
                  </h3>
                  <button
                    onClick={loadUsers}
                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded-lg"
                  >
                    Refresh Users
                  </button>
                </div>

                <div className="overflow-x-auto border border-neutral-800 rounded-2xl bg-neutral-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Company</th>
                        <th className="p-3.5">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
                      {registeredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-neutral-500">
                            {usersLoading ? 'Loading users from Firestore...' : 'No users registered yet.'}
                          </td>
                        </tr>
                      ) : (
                        registeredUsers.map((u, i) => (
                          <tr key={u.uid || i} className="hover:bg-neutral-900/60 transition">
                            <td className="p-3.5 font-bold text-white">{u.name || 'N/A'}</td>
                            <td className="p-3.5 font-mono text-neutral-300">{u.email}</td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                u.role === 'driver' ? 'bg-amber-500/20 text-amber-300' :
                                u.role === 'client' ? 'bg-purple-500/20 text-purple-300' :
                                u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 text-neutral-400">{u.companyName || '—'}</td>
                            <td className="p-3.5 font-mono text-[11px] text-neutral-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: DRIVERS */}
            {activeTab === 'drivers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Registered Drivers ({driversList.length})
                    </h3>
                    <p className="text-xs text-neutral-400">Drivers receive orders assigned by location in their cockpit.</p>
                  </div>
                  <button
                    onClick={loadUsers}
                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded-lg"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driversList.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                      No drivers registered in Firestore yet. When a user registers with role &quot;driver&quot;, they appear here.
                    </div>
                  ) : (
                    driversList.map((d, i) => {
                      const driverOrders = orders.filter(o => o.assignedDriverEmail === d.email || (o.assignedDriverName && o.assignedDriverName.includes(d.name || '-')));
                      return (
                        <div key={d.uid || i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">{d.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              d.isAvailable === false
                                ? 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {d.isAvailable === false ? 'Off duty' : 'Available'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-400">{d.email}</p>
                          <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs">
                            <span className="text-neutral-400">Assigned Orders:</span>
                            <span className="font-bold text-cyan-400">{driverOrders.length}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: BUSINESSES */}
            {activeTab === 'businesses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Registered Business Clients ({businessesList.length})
                    </h3>
                    <p className="text-xs text-neutral-400">Commercial accounts utilizing Bulk Parcel CSV Importer & Scheduled pickups.</p>
                  </div>
                  <button
                    onClick={loadUsers}
                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded-lg"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessesList.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                      No business accounts registered yet.
                    </div>
                  ) : (
                    businessesList.map((b, i) => {
                      const businessOrders = orders.filter(o => o.userEmail === b.email || o.userId === b.uid);
                      return (
                        <div key={b.uid || i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">{b.companyName || b.name}</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30 uppercase">
                              {b.deliveryStream || 'Business'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-400">{b.email}</p>
                          <div className="pt-2 border-t border-neutral-800 flex justify-between text-xs">
                            <span className="text-neutral-400">Total Bookings:</span>
                            <span className="font-bold text-emerald-400">{businessOrders.length}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: ORDERS BY LOCATION WITH BULK DRIVER ASSIGNMENT */}
            {activeTab === 'by_location' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Orders Grouped by London Outward Postcode ({Object.keys(ordersByLocation).length} Hubs)</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Assign whole bulk groups of orders in an area directly to a driver in one click.
                    </p>
                  </div>
                </div>

                {/* Bulk Assignment Modal / Drawer */}
                {assigningArea && (
                  <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        Bulk Assign All Orders in Area [{assigningArea}] ({ordersByLocation[assigningArea]?.length || 0} orders):
                      </h4>
                      <button
                        onClick={() => setAssigningArea(null)}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={bulkDriverUid}
                        onChange={(e) => setBulkDriverUid(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white min-w-[220px]"
                      >
                        <option value="">{availableDrivers.length ? 'Select an available driver' : 'No drivers available'}</option>
                        {availableDrivers.map((d) => (
                          <option key={d.uid} value={d.uid}>
                            {d.name || d.email} ({d.email})
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={bulkAssigningLoading || !bulkDriverUid}
                        onClick={() => handleBulkAssignLocation(assigningArea, (ordersByLocation[assigningArea] || []).map(o => o.id))}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-2 disabled:opacity-40 transition"
                      >
                        {bulkAssigningLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Assign Entire Area to Driver</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {Object.keys(ordersByLocation).length === 0 ? (
                    <div className="p-8 text-center bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                      No orders found to group by location.
                    </div>
                  ) : (
                    Object.entries(ordersByLocation).map(([area, areaOrders]) => {
                      const isExpanded = expandedLocations[area] ?? true;
                      const pendingCount = areaOrders.filter(o => o.status === 'booked' || o.status === 'collected').length;
                      return (
                        <div key={area} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/90">
                            <button
                              onClick={() => setExpandedLocations(prev => ({ ...prev, [area]: !isExpanded }))}
                              className="flex items-center gap-3 text-left"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-neutral-500" />
                              )}
                              <div>
                                <span className="font-mono font-black text-white text-base">
                                  Area {area}
                                </span>
                                <span className="text-xs text-neutral-400 ml-2">
                                  ({areaOrders.length} {areaOrders.length === 1 ? 'Order' : 'Orders'})
                                </span>
                              </div>
                            </button>

                            <div className="flex items-center gap-2">
                              {pendingCount > 0 && (
                                <button
                                  onClick={() => {
                                    setAssigningArea(area);
                                    setBulkDriverUid('');
                                    setDispatchError('');
                                  }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Bulk Assign ({pendingCount} pending)</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-neutral-800/80 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase">
                                  <tr>
                                    <th className="p-2.5">Order ID</th>
                                    <th className="p-2.5">Type</th>
                                    <th className="p-2.5">Pickup</th>
                                    <th className="p-2.5">Drop-off</th>
                                    <th className="p-2.5">Status</th>
                                    <th className="p-2.5">Driver</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                                  {areaOrders.map(o => (
                                    <tr key={o.id} className="hover:bg-neutral-950/40">
                                      <td className="p-2.5 font-mono font-bold text-white">{o.id}</td>
                                      <td className="p-2.5 uppercase font-mono text-[10px] text-cyan-400">{o.type}</td>
                                      <td className="p-2.5 font-mono text-[11px] text-emerald-400">{o.pickupAddress?.postcode}</td>
                                      <td className="p-2.5 font-mono text-[11px] text-cyan-400">{o.dropoffAddress?.postcode}</td>
                                      <td className="p-2.5">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                          o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                                          o.status === 'out_for_delivery' ? 'bg-cyan-500/20 text-cyan-400' :
                                          'bg-amber-500/20 text-amber-300'
                                        }`}>
                                          {o.status.replace(/_/g, ' ')}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-neutral-400 font-mono text-[11px]">
                                        {o.assignedDriverName || 'Unassigned'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: MAIN ORDERS TABLE */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Create Order Drawer */}
                {isCreatingOrder && (
                  <form
                    onSubmit={handleCreateOrderAsAdmin}
                    className="bg-neutral-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        Admin Direct Dispatch Creator (Stores Directly in Firestore)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCreatingOrder(false)}
                        className="text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Stream</label>
                        <select
                          value={newOrderType}
                          onChange={(e) => setNewOrderType(e.target.value as any)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="pharmacy">Pharmacy</option>
                          <option value="food">Food</option>
                          <option value="parcel">Parcel</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Pickup Postcode</label>
                        <input
                          type="text"
                          required
                          value={newPickupPostcode}
                          onChange={(e) => setNewPickupPostcode(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Dropoff Postcode</label>
                        <input
                          type="text"
                          required
                          value={newDropoffPostcode}
                          onChange={(e) => setNewDropoffPostcode(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Pickup Line 1</label>
                        <input
                          type="text"
                          required
                          value={newPickup}
                          onChange={(e) => setNewPickup(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Dropoff Line 1</label>
                        <input
                          type="text"
                          required
                          value={newDropoff}
                          onChange={(e) => setNewDropoff(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newWeight}
                          onChange={(e) => setNewWeight(parseFloat(e.target.value) || 1)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-neutral-400 block mb-1">Contents Description</label>
                        <input
                          type="text"
                          required
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                        <input
                          type="checkbox"
                          checked={isRestricted}
                          onChange={(e) => setIsRestricted(e.target.checked)}
                          className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 w-4 h-4"
                        />
                        <span>Requires Restricted Compliance Handling</span>
                      </label>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs cursor-pointer"
                      >
                        Confirm Dispatch
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by Order ID, postcode, sender..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Filter className="w-3.5 h-3.5 text-neutral-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="booked">Booked</option>
                      <option value="collected">Collected</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Real Orders Table from Firestore */}
                <div className="overflow-x-auto border border-neutral-800 rounded-2xl bg-neutral-900/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Stream</th>
                        <th className="p-3.5">Sender</th>
                        <th className="p-3.5">Pickup ➔ Dropoff</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-900/60 transition">
                          <td className="p-3.5 font-mono font-bold text-white">{order.id}</td>
                          <td className="p-3.5">
                            <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-200">
                              {order.type}
                            </span>
                          </td>
                          <td className="p-3.5 text-neutral-400 font-mono text-[11px]">{order.userEmail || order.userId}</td>
                          <td className="p-3.5 font-mono text-[11px]">
                            <span className="text-emerald-400">{order.pickupAddress?.postcode || 'N/A'}</span>
                            <span className="text-neutral-500 mx-1.5">➔</span>
                            <span className="text-cyan-400">{order.dropoffAddress?.postcode || 'N/A'}</span>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">£{order.priceGbp?.toFixed(2) || '0.00'}</td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : order.status === 'out_for_delivery'
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {order.status === 'booked' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(order.id, 'collected')}
                                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-bold"
                                  >
                                    Collect
                                  </button>
                                  <button
                                    onClick={() => setAssigningOrderId(order.id)}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-bold"
                                  >
                                    Assign Driver
                                  </button>
                                </>
                              )}
                              {order.status === 'collected' && (
                                <>
                                  <button
                                    onClick={() => setAssigningOrderId(order.id)}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-bold"
                                  >
                                    Assign Driver
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                                    className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-[10px] font-bold"
                                  >
                                    Dispatch
                                  </button>
                                </>
                              )}
                              {order.status === 'out_for_delivery' && (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'delivered')}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded text-[10px] font-bold"
                                >
                                  Deliver
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Done
                                </span>
                              )}
                              {order.assignedDriverName && (
                                <span className="text-[9px] text-neutral-400 block font-mono">
                                  Driver: {order.assignedDriverName}
                                </span>
                              )}
                              {order.driverLocation && (
                                <a
                                  href={`https://www.google.com/maps?q=${order.driverLocation.lat},${order.driverLocation.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-cyan-400 hover:underline block font-mono"
                                >
                                  Live location {new Date(order.driverLocation.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Driver Assignment Modal */}
                  {assigningOrderId && (
                    <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                      <div className="text-xs">
                        <span className="font-bold text-white">Assign Driver to Order #{assigningOrderId}:</span>
                        <p className="text-[11px] text-neutral-400">The driver is notified in their dashboard once assigned.</p>
                        {dispatchError && <p className="text-[11px] text-red-400 mt-1">{dispatchError}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <select
                        value={assignDriverUid}
                        onChange={(e) => setAssignDriverUid(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white min-w-[220px]"
                      >
                        <option value="">{availableDrivers.length ? 'Select an available driver' : 'No drivers available'}</option>
                        {availableDrivers.map((d) => (
                          <option key={d.uid} value={d.uid}>
                            {d.name || d.email} ({d.email})
                          </option>
                        ))}
                      </select>
                        <button
                          disabled={!assignDriverUid}
                          onClick={() => handleAssignDriver(assigningOrderId)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs disabled:opacity-40"
                        >
                          Assign & Dispatch
                        </button>
                        <button
                          onClick={() => setAssigningOrderId(null)}
                          className="px-2 py-1.5 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredOrders.length === 0 && (
                    <div className="p-8 text-center text-xs text-neutral-500">
                      No orders found in Firestore. Orders created by users will appear here live.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 space-y-1 mt-10">
        <p>© 2026 Quickzy • London Dispatcher & Fleet Management System.</p>
        <p className="text-[11px] text-neutral-400">Strictly Authorized Personnel Access Only: prajapatikaranc@gmail.com</p>
      </footer>
    </div>
  );
}
