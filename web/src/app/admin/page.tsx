'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { QuickzyOrder, OrderStatus, evaluateSameDayCutoff } from '@/types/delivery';
import { fetchAllOrders, updateOrderStatus, createOrder } from '@/lib/orderService';

const ADMIN_AUTHORIZED_EMAIL = 'prajapatikaranc@gmail.com';

export default function AdminDashboardPage() {
  const [sessionEmail, setSessionEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quickzy_admin_email');
      if (stored) {
        setSessionEmail(stored);
      }
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const list = await fetchAllOrders(undefined, 'admin');
    setOrders(list);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputEmail.trim().toLowerCase();
    setSessionEmail(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quickzy_admin_email', clean);
    }
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

  const isAuthorized = sessionEmail.trim().toLowerCase() === ADMIN_AUTHORIZED_EMAIL;

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.id.toLowerCase().includes(q) ||
      o.pickupAddress.postcode.toLowerCase().includes(q) ||
      o.dropoffAddress.postcode.toLowerCase().includes(q) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.priceGbp || 0), 0);
  const activeDeliveries = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

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
            <span>Back to Main Platform</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              Admin Gateway
            </span>
            {isAuthorized && (
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                {ADMIN_AUTHORIZED_EMAIL}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {!isAuthorized ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">Restricted Admin Access</h1>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                This administrative console can strictly only be accessed by{' '}
                <strong className="text-red-400 font-mono">{ADMIN_AUTHORIZED_EMAIL}</strong>. Other accounts do not have permission to view or manage live fleet operations.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3 bg-neutral-900/80 p-6 rounded-2xl border border-neutral-800">
              <div className="text-left">
                <label className="text-xs text-neutral-400 block mb-1 font-semibold">Enter Authorized Email</label>
                <input
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="prajapatikaranc@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition"
              >
                Authenticate Access
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
                    Fleet Dispatcher & Orders Console
                  </h1>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  System operated by <strong>Aelius Venture Limited</strong> • Authorized Superuser: {ADMIN_AUTHORIZED_EMAIL}
                </p>
              </div>

              <button
                onClick={() => setIsCreatingOrder(!isCreatingOrder)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-neutral-950 font-black text-xs hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/20 transition self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Admin Order</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Total System Orders</span>
                <p className="text-2xl font-black text-white">{orders.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Active Transit Jobs</span>
                <p className="text-2xl font-black text-cyan-400">{activeDeliveries}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Total London Revenue</span>
                <p className="text-2xl font-black text-emerald-400">£{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">Cutoff Standard</span>
                <p className="text-sm font-bold text-neutral-200 mt-1">14:00 GMT Daily</p>
              </div>
            </div>

            {/* Create Order Modal / Drawer for Admin */}
            {isCreatingOrder && (
              <form
                onSubmit={handleCreateOrderAsAdmin}
                className="bg-neutral-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    Admin Direct Dispatch Creator
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
                    <span>Requires Restricted Compliance Handling (Medicines/Batteries)</span>
                  </label>

                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
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

            {/* Orders Management Table */}
            <div className="overflow-x-auto border border-neutral-800 rounded-2xl bg-neutral-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Stream</th>
                    <th className="p-3.5">User / Client</th>
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
                      <td className="p-3.5 text-neutral-400">{order.userEmail || 'Client Account'}</td>
                      <td className="p-3.5 font-mono text-[11px]">
                        <span className="text-emerald-400">{order.pickupAddress.postcode}</span>
                        <span className="text-neutral-500 mx-1.5">➔</span>
                        <span className="text-cyan-400">{order.dropoffAddress.postcode}</span>
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
                        <div className="flex gap-1.5">
                          {order.status === 'booked' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'collected')}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-bold"
                            >
                              Collect
                            </button>
                          )}
                          {order.status === 'collected' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
                              className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-[10px] font-bold"
                            >
                              Dispatch
                            </button>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No orders match your filter criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 space-y-1 mt-10">
        <p>© 2026 Quickzy • App Managed and Operated by <strong>Aelius Venture Limited</strong>. Registered in England & Wales.</p>
        <p className="text-[11px] text-neutral-400">Strictly Authorized Personnel Access Only: prajapatikaranc@gmail.com</p>
      </footer>
    </div>
  );
}
