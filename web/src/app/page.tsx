'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppProvider } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  Lock,
  UserCheck,
  MapPin,
  CalendarCheck,
  FileSpreadsheet,
  Activity,
  LogOut,
} from 'lucide-react';

type MainTab = 'index' | 'booking' | 'bulk' | 'tracking' | 'storefront' | 'merchant' | 'driver' | 'dispatch';

function MainApplicationContent() {
  const [activeTab, setActiveTab] = useState<MainTab>('index');
  const [currentUser, setCurrentUser] = useState<{
    uid?: string;
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

  // Real Firebase Auth listener: users start as unauthenticated visitors on index page
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const cleanEmail = firebaseUser.email.toLowerCase();
        let role: UserRole = cleanEmail === 'prajapatikaranc@gmail.com' ? 'admin' : 'customer';
        let companyName: string | undefined = undefined;
        let displayName = firebaseUser.displayName || cleanEmail.split('@')[0];

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || role;
            companyName = data.companyName || undefined;
            displayName = data.name || displayName;
          }
        } catch (e) {
          console.warn('Could not read user profile from firestore:', e);
        }

        const sessionUser = {
          uid: firebaseUser.uid,
          email: cleanEmail,
          role,
          name: displayName,
          companyName,
        };

        setCurrentUser(sessionUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('quickzy_user_session', JSON.stringify(sessionUser));
        }
      } else {
        // Fallback to local session if explicitly logged in
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('quickzy_user_session');
          if (stored) {
            try {
              setCurrentUser(JSON.parse(stored));
            } catch {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    if (!currentUser) {
      setSavedAddresses([]);
      setOrders([]);
      return;
    }
    const addrs = await fetchUserAddresses(currentUser.email);
    setSavedAddresses(addrs);

    const ords = await fetchAllOrders(currentUser.email, currentUser.role);
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

  const handleSignOutUser = async () => {
    try {
      await signOut(auth);
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quickzy_user_session');
    }
    setCurrentUser(null);
    setOrders([]);
    setSavedAddresses([]);
    setActiveTab('index');
  };

  // Guard for Instant Booking, Bulk, and Tracking: Requires login
  const requireLoginForTab = (targetTab: MainTab) => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddressBook={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setAddressSelectionMode(null);
            setIsAddressBookOpen(true);
          }
        }}
        currentUser={currentUser}
        activeTab={activeTab === 'index' ? 'booking' : (activeTab as any)}
        setActiveTab={(tab) => {
          if (tab === 'booking' || tab === 'bulk' || tab === 'tracking') {
            requireLoginForTab(tab);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Index Showcase (Visible when in index tab or when user explores platform) */}
      {activeTab === 'index' && (
        <div className="space-y-12 pb-12">
          {/* Hero Section */}
          <section className="relative overflow-hidden border-b border-neutral-900 bg-gradient-to-b from-neutral-900/60 via-neutral-950 to-neutral-950 py-16 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

            <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>London&apos;s Dedicated Same-Day Rapid Logistics Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Point-to-Point London Courier for{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Pharmacy, Food & Parcels
                </span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                Single instant booking, bulk CSV manifests with transaction guarantee, and real-time fleet dispatch across all Greater London boroughs.
              </p>

              {/* Primary Call to Action */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentUser ? (
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Go to Instant London Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Book Courier</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <Link
                      href="/signup"
                      className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold text-xs transition"
                    >
                      Create Free Account
                    </Link>
                  </>
                )}
              </div>

              {/* Three Stream Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 text-left">
                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Pharmacy & Medical</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Priority delivery for prescriptions, clinical diagnostic samples, and regulated healthcare packages with dedicated handling.
                  </p>
                </div>

                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Food & Groceries</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Insulated cold-chain bags and rapid dispatch for local bakeries, butchers, deli items, and prepared meals across London.
                  </p>
                </div>

                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Parcels & Bulk B2B</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Same-day London parcel courier with single-transaction CSV manifest imports and automated 14:00 GMT cutoff tracking.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How Quickzy Works Section */}
          <section className="max-w-5xl mx-auto px-4 text-center space-y-8">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Operating Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Streamlined Same-Day London Dispatch
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400">01. Authenticate</span>
                <p className="text-xs font-bold text-white">Sign In or Register</p>
                <p className="text-[11px] text-neutral-400">
                  Secure Firebase Authentication stores all your London addresses and orders in Firestore.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400">02. Configure</span>
                <p className="text-xs font-bold text-white">Choose Stream & Route</p>
                <p className="text-[11px] text-neutral-400">
                  Select Pharmacy, Food, or Parcel. Enter London postcodes with instant geocoding checks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400">03. Automated Price</span>
                <p className="text-xs font-bold text-white">Distance & Dimensions</p>
                <p className="text-[11px] text-neutral-400">
                  Dynamic price calculation with 14:00 GMT cutoff verification for same-day delivery.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400">04. Live Fleet</span>
                <p className="text-xs font-bold text-white">Track & Invoicing</p>
                <p className="text-[11px] text-neutral-400">
                  Follow real-time progress from collection to doorstep with automated invoicing.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Authenticated Dashboard / Workspaces */}
      {activeTab !== 'index' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
          {/* User Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Logged in as:</span>
              <span className="font-extrabold text-white font-mono">{currentUser?.email}</span>
              <span className="font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                {currentUser?.role}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('index')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              >
                Back to Home Page
              </button>
              <button
                onClick={handleSignOutUser}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation for Logged-In Users */}
          <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'booking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Instant London Booking</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'bulk'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Importer</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'tracking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>My Orders & Tracking</span>
            </button>
          </div>

          {/* Booking View */}
          {activeTab === 'booking' && (
            <SingleBookingForm
              userId={currentUser?.email || 'authenticated_user'}
              userEmail={currentUser?.email || 'user@quickzy.co.uk'}
              role={currentUser?.role || 'customer'}
              savedAddresses={savedAddresses}
              onOpenAddressBook={handleOpenAddressBookForSelection}
              onOrderCreated={handleOrderCreated}
              selectedPickupAddress={selectedPickup}
              selectedDropoffAddress={selectedDropoff}
            />
          )}

          {/* Bulk CSV View */}
          {activeTab === 'bulk' && (
            <BulkParcelBooking
              clientId={currentUser?.email || 'client_account'}
              clientEmail={currentUser?.email || 'client@quickzy.co.uk'}
              onBulkCompleted={(newOrders) => {
                setOrders((prev) => [...newOrders, ...prev]);
                setActiveTab('tracking');
              }}
            />
          )}

          {/* Tracking View */}
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
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          setActiveTab('booking');
        }}
        onLogout={handleSignOutUser}
      />

      {/* Address Book Modal */}
      {currentUser && (
        <AddressBookModal
          isOpen={isAddressBookOpen}
          onClose={() => {
            setIsAddressBookOpen(false);
            setAddressSelectionMode(null);
          }}
          userId={currentUser.email}
          savedAddresses={savedAddresses}
          onSelectAddress={handleSelectAddress}
          selectionMode={addressSelectionMode}
          onRefreshAddresses={loadData}
        />
      )}

      {/* Dedicated Global Footer */}
      <Footer currentUser={currentUser} />
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
