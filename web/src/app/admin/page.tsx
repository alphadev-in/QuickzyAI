'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
} from 'lucide-react';
import { QuickzyOrder, OrderStatus, evaluateSameDayCutoff, ParcelPricingConfig, DEFAULT_PRICING_CONFIG } from '@/types/delivery';
import { fetchAllOrders, updateOrderStatus, createOrder, fetchPricingConfig, savePricingConfig } from '@/lib/orderService';

const ADMIN_AUTHORIZED_EMAIL = 'prajapatikaranc@gmail.com';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Direct login form for admin
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

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

  // Driver Assignment & Pricing Configuration
  const [pricingConfig, setPricingConfig] = useState<ParcelPricingConfig>(DEFAULT_PRICING_CONFIG);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverEmailInput, setDriverEmailInput] = useState('');

  useEffect(() => {
    // Listen to real Firebase Authentication State
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setCurrentUserEmail(user.email.toLowerCase());
        if (user.email.toLowerCase() === ADMIN_AUTHORIZED_EMAIL) {
          loadOrders();
        }
      } else {
        // Fallback check from persistent session
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('quickzy_user_session');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.email) {
                setCurrentUserEmail(parsed.email.toLowerCase());
                if (parsed.email.toLowerCase() === ADMIN_AUTHORIZED_EMAIL) {
                  loadOrders();
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

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaved(false);
    await savePricingConfig(pricingConfig);
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2500);
  };

  const handleAssignDriver = async (orderId: string) => {
    if (!driverNameInput.trim()) return;
    await updateOrderStatus(orderId, 'out_for_delivery', {
      driverName: driverNameInput.trim(),
      driverEmail: driverEmailInput.trim() || undefined,
      details: `Admin assigned courier ${driverNameInput.trim()}${driverEmailInput.trim() ? ` (${driverEmailInput.trim()})` : ''} for rapid London dispatch.`,
    });
    setAssigningOrderId(null);
    setDriverNameInput('');
    setDriverEmailInput('');
    loadOrders();
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
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus, 'Fleet Unit #Admin-Priority-London');
    loadOrders();
  };

  const handleCreateOrderAsAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrder('admin_override', ADMIN_AUTHORIZED_EMAIL, 'admin', {
      type: newOrderType,
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
    });

    setIsCreatingOrder(false);
    loadOrders();
  };

  const isAuthorized = currentUserEmail === ADMIN_AUTHORIZED_EMAIL;

  const filteredOrders = orders.filter((o) => {
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
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quickzy Main</span>
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

              <button
                onClick={() => setIsCreatingOrder(!isCreatingOrder)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-neutral-950 font-black text-xs hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/20 transition self-start sm:self-auto cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Direct Order</span>
              </button>
            </div>

            {/* Pricing Metrics Configurator for Admin */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    London Parcel & Booking Pricing Metrics
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Set base fee, mileage rate, and surcharge metrics used across all user bookings.
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

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 block font-semibold">Weight &gt;2kg/kg (£)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={(pricingConfig.weightPerKgAbove2KgPence / 100).toFixed(2)}
                    onChange={(e) =>
                      setPricingConfig({
                        ...pricingConfig,
                        weightPerKgAbove2KgPence: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 block font-semibold">Volumetric/kg (£)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={(pricingConfig.volumetricRatePence / 100).toFixed(2)}
                    onChange={(e) =>
                      setPricingConfig({
                        ...pricingConfig,
                        volumetricRatePence: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1 flex flex-col justify-end">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
                  >
                    Save Metrics
                  </button>
                </div>
              </form>
            </div>

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
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
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
                  placeholder="Filter by Order ID, postcode, client email..."
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
                    <th className="p-3.5">Sender Email</th>
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
                    <p className="text-[11px] text-neutral-400">Select or type driver name & area dispatch unit.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Driver Name (e.g. Liam Bike #3)"
                      value={driverNameInput}
                      onChange={(e) => setDriverNameInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white"
                    />
                    <input
                      type="email"
                      placeholder="Driver Email (e.g. driver@quickzy.co.uk)"
                      value={driverEmailInput}
                      onChange={(e) => setDriverEmailInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white"
                    />
                    <button
                      onClick={() => handleAssignDriver(assigningOrderId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
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
      </main>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 space-y-1 mt-10">
        <p>© 2026 Quickzy • London Dispatcher & Fleet Management System.</p>
        <p className="text-[11px] text-neutral-400">Strictly Authorized Personnel Access Only: prajapatikaranc@gmail.com</p>
      </footer>
    </div>
  );
}
