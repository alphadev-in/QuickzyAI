'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { SingleBookingForm } from '@/components/SingleBookingForm';
import { BulkParcelBooking } from '@/components/BulkParcelBooking';
import { OrderStatusTracking } from '@/components/OrderStatusTracking';
import { AddressBookModal } from '@/components/AddressBookModal';
import { AuthModal } from '@/components/AuthModal';
import { CustomerStorefront } from '@/components/CustomerStorefront';
import { MerchantPortal } from '@/components/MerchantPortal';
import { DriverCockpit } from '@/components/DriverCockpit';
import { RouteBatcherCockpit } from '@/components/RouteBatcherCockpit';
import { AddressItem, QuickzyOrder, UserRole } from '@/types/delivery';
import { fetchUserAddresses, fetchAllOrders } from '@/lib/orderService';
import {
  Pill,
  Utensils,
  Package,
  ShieldCheck,
  Zap,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

type MainTab = 'storefront' | 'booking' | 'bulk' | 'tracking' | 'merchant' | 'driver' | 'dispatch';

function MainApplicationContent() {
  const [activeTab, setActiveTab] = useState<MainTab>('booking');
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    role: UserRole;
    name: string;
    companyName?: string;
  } | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [addressSelectionMode, setAddressSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);

  const [selectedPickup, setSelectedPickup] = useState<AddressItem | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<AddressItem | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [orders, setOrders] = useState<QuickzyOrder[]>([]);

  useEffect(() => {
    // Check if session exists in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quickzy_user_session');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      } else {
        // Default demo customer user
        setCurrentUser({
          email: 'karan@quickzy.co.uk',
          role: 'customer',
          name: 'Karan Prajapati',
        });
      }
    }
  }, []);

  const loadData = async () => {
    const userId = currentUser ? currentUser.email : 'guest_user';
    const addrs = await fetchUserAddresses(userId);
    setSavedAddresses(addrs);

    const ords = await fetchAllOrders(userId, currentUser?.role);
    setOrders(ords);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenAddressBookForSelection = (mode: 'pickup' | 'dropoff') => {
    setAddressSelectionMode(mode);
    setIsAddressBookOpen(true);
  };

  const handleSelectAddress = (addr: AddressItem, mode: 'pickup' | 'dropoff') => {
    if (mode === 'pickup') {
      setSelectedPickup(addr);
    } else {
      setSelectedDropoff(addr);
    }
  };

  const handleOrderCreated = (newOrder: QuickzyOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setActiveTab('tracking');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddressBook={() => {
          setAddressSelectionMode(null);
          setIsAddressBookOpen(true);
        }}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Hero Welcome Banner with dynamic animations */}
      <section className="relative overflow-hidden border-b border-neutral-900 bg-gradient-to-b from-neutral-900/60 via-neutral-950 to-neutral-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>London&apos;s Fastest Multi-Stream Same-Day Fleet</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Rapid Same-Day Delivery for{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Pharmacy, Food & Parcels
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Managed and operated by <strong className="text-white">Aelius Venture Limited</strong>. Instant single booking, bulk CSV manifests with transaction guarantee, and real-time fleet dispatch across all Greater London boroughs.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => setActiveTab('booking')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Book Courier Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('bulk')}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Business Bulk CSV</span>
              </button>

              <Link
                href="/signup"
                className="px-4 py-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition"
              >
                Register Account
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="p-4 rounded-2xl glass-panel text-left space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>14:00 GMT</span>
              </div>
              <p className="text-[11px] text-neutral-400">Same-Day Cutoff</p>
              <p className="text-xs font-bold text-white">Automated Next-Day Roll</p>
            </div>

            <div className="p-4 rounded-2xl glass-panel text-left space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Compliant</span>
              </div>
              <p className="text-[11px] text-neutral-400">Restricted Freight</p>
              <p className="text-xs font-bold text-white">Medicines & Batteries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Active Role Selector bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Viewing as:</span>
            <span className="font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {currentUser?.role || 'Guest'}
            </span>
            {currentUser?.companyName && (
              <span className="text-neutral-400 font-medium hidden sm:inline">({currentUser.companyName})</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-neutral-400 text-[11px] hidden sm:inline">Switch Role:</span>
            <button
              onClick={() =>
                setCurrentUser({
                  email: 'customer@london.co.uk',
                  role: 'customer',
                  name: 'Alice Customer',
                })
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentUser?.role === 'customer'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() =>
                setCurrentUser({
                  email: 'business@harleystclinic.co.uk',
                  role: 'client',
                  name: 'Harley St Medical',
                  companyName: 'Harley Street Group Ltd',
                })
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentUser?.role === 'client'
                  ? 'bg-cyan-500 text-neutral-950 font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              Client (Bulk)
            </button>
            <Link
              href="/admin"
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
            >
              Admin Portal
            </Link>
          </div>
        </div>

        {/* View Switcher based on active tab */}
        {activeTab === 'booking' && (
          <SingleBookingForm
            userId={currentUser?.email || 'guest_user'}
            userEmail={currentUser?.email || 'guest@quickzy.co.uk'}
            role={currentUser?.role || 'customer'}
            savedAddresses={savedAddresses}
            onOpenAddressBook={handleOpenAddressBookForSelection}
            onOrderCreated={handleOrderCreated}
            selectedPickupAddress={selectedPickup}
            selectedDropoffAddress={selectedDropoff}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkParcelBooking
            clientId={currentUser?.email || 'client_demo'}
            clientEmail={currentUser?.email || 'client@quickzy.co.uk'}
            onBulkCompleted={(newOrders) => {
              setOrders((prev) => [...newOrders, ...prev]);
              setActiveTab('tracking');
            }}
          />
        )}

        {activeTab === 'tracking' && (
          <OrderStatusTracking
            orders={orders}
            currentUserRole={currentUser?.role || 'customer'}
            onRefreshOrders={loadData}
          />
        )}

        {activeTab === 'storefront' && <CustomerStorefront />}
        {activeTab === 'merchant' && <MerchantPortal />}
        {activeTab === 'driver' && <DriverCockpit />}
        {activeTab === 'dispatch' && <RouteBatcherCockpit />}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('quickzy_user_session', JSON.stringify(user));
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('quickzy_user_session');
          }
        }}
      />

      {/* Address Book Modal */}
      <AddressBookModal
        isOpen={isAddressBookOpen}
        onClose={() => {
          setIsAddressBookOpen(false);
          setAddressSelectionMode(null);
        }}
        userId={currentUser?.email || 'guest_user'}
        savedAddresses={savedAddresses}
        onSelectAddress={handleSelectAddress}
        selectionMode={addressSelectionMode}
        onRefreshAddresses={loadData}
      />

      {/* Footer with Aelius Venture Limited Branding & Legal Links */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-10 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-black text-white text-base">Quickzy</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                v2.4
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              App managed and operated by <strong className="text-white">Aelius Venture Limited</strong>.
            </p>
            <p className="text-[11px] text-neutral-500">
              Registered in England & Wales • Rapid Logistics for Pharmacy, Food & Parcels.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <Link href="/privacy" className="hover:text-emerald-400 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-emerald-400 transition">
              Terms of Service
            </Link>
            <Link href="/signup" className="hover:text-emerald-400 transition">
              Create Account
            </Link>
            <Link href="/onboarding" className="hover:text-emerald-400 transition">
              Fleet Onboarding
            </Link>
            <Link href="/admin" className="text-red-400/80 hover:text-red-400 font-semibold transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainApplicationContent />
    </AppProvider>
  );
}
