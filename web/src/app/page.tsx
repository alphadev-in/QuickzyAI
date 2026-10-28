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
import { DriverCockpit } from '@/components/DriverCockpit';
import { RouteBatcherCockpit } from '@/components/RouteBatcherCockpit';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CustomerModule } from '@/components/CustomerModule';
import { CreditWallet } from '@/components/CreditWallet';
import { SupportChat } from '@/components/SupportChat';
import { AddressItem, CustomerRecord, QuickzyOrder, UserRole } from '@/types/delivery';
import { fetchUserAddresses, fetchAllOrders } from '@/lib/orderService';
import { fetchCustomers } from '@/lib/customerService';
import { getCreditBalancePence } from '@/lib/creditService';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Pill,
  Utensils,
  Package,
  Sparkles,
  ArrowRight,
  Lock,
  CalendarCheck,
  FileSpreadsheet,
  Activity,
  LogOut,
  Bike,
  Compass,
} from 'lucide-react';

type MainTab = 'index' | 'booking' | 'bulk' | 'customers' | 'tracking' | 'storefront' | 'merchant' | 'driver' | 'dispatch';

// Sub-tabs within Book Couriers for business/admin
type BookingSubTab = 'single' | 'bulk';

function MainApplicationContent() {
  const [activeTab, setActiveTab] = useState<MainTab>('index');
  const [bookingSubTab, setBookingSubTab] = useState<BookingSubTab>('single');

  const [currentUser, setCurrentUser] = useState<{
    uid?: string;
    email: string;
    role: UserRole;
    name: string;
    companyName?: string;
    deliveryStream?: string;
  } | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [addressSelectionMode, setAddressSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);

  const [selectedPickup, setSelectedPickup] = useState<AddressItem | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<AddressItem | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [orders, setOrders] = useState<QuickzyOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [creditBalancePence, setCreditBalancePence] = useState(0);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const cleanEmail = firebaseUser.email.toLowerCase();
        let role: UserRole = cleanEmail === 'prajapatikaranc@gmail.com' ? 'admin' : 'customer';
        let companyName: string | undefined = undefined;
        let displayName = firebaseUser.displayName || cleanEmail.split('@')[0];
        let deliveryStream: string | undefined = undefined;

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || role;
            companyName = data.companyName || undefined;
            displayName = data.name || displayName;
            deliveryStream = data.deliveryStream || undefined;
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
          deliveryStream,
        };

        setCurrentUser(sessionUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('quickzy_user_session', JSON.stringify(sessionUser));
        }
      } else {
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
      setCustomers([]);
      setCreditBalancePence(0);
      return;
    }
    const addrs = await fetchUserAddresses(currentUser.email);
    setSavedAddresses(addrs);

    const ords = await fetchAllOrders(currentUser.email, currentUser.role);
    setOrders(ords);

    try {
      setCustomers(await fetchCustomers(currentUser.email));
    } catch (err) {
      console.warn('Could not load customers:', err);
    }

    try {
      setCreditBalancePence(await getCreditBalancePence(currentUser.email));
    } catch (err) {
      console.warn('Could not load credit balance:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleOpenAddressBookForSelection = (mode: 'pickup' | 'dropoff') => {
    if (!currentUser) { setIsAuthOpen(true); return; }
    setAddressSelectionMode(mode);
    setIsAddressBookOpen(true);
  };

  const handleSelectAddress = (addr: AddressItem, mode: 'pickup' | 'dropoff') => {
    if (mode === 'pickup') setSelectedPickup(addr);
    else setSelectedDropoff(addr);
  };

  // Paid orders stay on the booking screen so the "driver will deliver soon" message is seen
  const handleOrdersCreated = (newOrders: QuickzyOrder[]) => {
    setOrders((prev) => [...newOrders, ...prev]);
  };

  const handleSignOutUser = async () => {
    try { await signOut(auth); } catch {}
    if (typeof window !== 'undefined') localStorage.removeItem('quickzy_user_session');
    setCurrentUser(null);
    setOrders([]);
    setSavedAddresses([]);
    setActiveTab('index');
  };

  // Guard tabs that require login
  const requireLoginForTab = (targetTab: MainTab) => {
    if (!currentUser) setIsAuthOpen(true);
    else setActiveTab(targetTab);
  };

  // When user logs in, direct to appropriate first tab
  const handleLogin = (user: { email: string; role: UserRole; name: string; companyName?: string; deliveryStream?: string }) => {
    setCurrentUser(user as any);
    if (user.role === 'driver') setActiveTab('driver');
    else setActiveTab('booking');
  };

  const role = currentUser?.role;
  const isDriver = role === 'driver';
  const isClient = role === 'client';
  const isAdmin = role === 'admin';
  // Business/admin can see both single + bulk under "Book Couriers"
  const canUseBulk = isClient || isAdmin;

  // The main page wrapper gets light/dark bg
  const pageBg = 'min-h-screen flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950 pb-20 lg:pb-0';

  return (
    <div className={pageBg} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddressBook={() => {
          if (!currentUser) { setIsAuthOpen(true); return; }
          setAddressSelectionMode(null);
          setIsAddressBookOpen(true);
        }}
        currentUser={currentUser}
        creditBalancePence={currentUser ? creditBalancePence : undefined}
        onSignOut={currentUser ? handleSignOutUser : undefined}
        activeTab={activeTab === 'index' || activeTab === 'bulk' ? 'booking' : (activeTab as any)}
        setActiveTab={(tab) => {
          if (tab === 'booking' || tab === 'bulk' || tab === 'tracking') {
            requireLoginForTab(tab);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Landing / Index page */}
      {activeTab === 'index' && (
        <div className="space-y-12 pb-12">
          {/* Hero */}
          <section className="relative overflow-hidden border-b py-16 px-4 sm:px-6 lg:px-8"
            style={{ borderColor: 'var(--card-border)', background: 'linear-gradient(to bottom, rgba(16,185,129,0.04), transparent)' }}>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

            <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>London&apos;s Dedicated Same-Day Rapid Logistics Network</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight"
                style={{ color: 'var(--foreground)' }}>
                Point-to-Point London Courier for{' '}
                <span className="bg-gradient-to-r from-[#3fc060] via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Pharmacy, Food &amp; Parcels
                </span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                Single instant booking, bulk CSV manifests with transaction guarantee, and real-time fleet dispatch across all Greater London boroughs.
              </p>

              {/* CTA */}
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
                      className="px-5 py-3 rounded-xl font-bold text-xs transition"
                      style={{ background: 'var(--surface-2, #18181b)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}
                    >
                      Create Free Account
                    </Link>
                  </>
                )}
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 text-left stagger">
                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Pill className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold">Pharmacy &amp; Medical</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Priority delivery for prescriptions, clinical diagnostic samples, and regulated healthcare packages.
                  </p>
                </div>

                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold">Food &amp; Groceries</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Insulated cold-chain bags and rapid dispatch for local bakeries, butchers, and prepared meals across London.
                  </p>
                </div>

                <div className="p-5 rounded-2xl glass-panel space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold">Parcels &amp; Bulk B2B</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Same-day London parcel courier with single-transaction CSV manifest imports and automated 14:00 GMT cutoff.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="max-w-5xl mx-auto px-4 text-center space-y-8">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Operating Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2" style={{ color: 'var(--foreground)' }}>
                Streamlined Same-Day London Dispatch
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left stagger">
              {[
                { step: '01', title: 'Authenticate', sub: 'Sign In or Register', body: 'Quickzy Cloud Authentication stores all your London addresses and orders securely.' },
                { step: '02', title: 'Configure', sub: 'Choose Stream & Route', body: 'Select Pharmacy, Food, or Parcel. Enter London postcodes with instant geocoding checks.' },
                { step: '03', title: 'Automated Price', sub: 'Distance & Dimensions', body: 'Dynamic price calculation with 14:00 GMT cutoff verification for same-day delivery.' },
                { step: '04', title: 'Live Fleet', sub: 'Track & Invoicing', body: 'Follow real-time progress from collection to doorstep with automated invoicing.' },
              ].map((s) => (
                <div key={s.step} className="p-4 rounded-2xl glass-panel space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">{s.step}. {s.title}</span>
                  <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{s.sub}</p>
                  <p className="text-[11px] text-neutral-400">{s.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Authenticated Dashboard */}
      {activeTab !== 'index' && (
        <main key={activeTab} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6 animate-fade-in-up">
          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel text-xs">
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setActiveTab('index')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              >
                ← Home
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

          {/* Book Couriers — single + optional bulk sub-tabs */}
          {(activeTab === 'booking' || activeTab === 'bulk') && (
            <div className="space-y-4">
              {canUseBulk && (
                <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--card-border)' }}>
                  <button
                    onClick={() => { setActiveTab('booking'); setBookingSubTab('single'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      activeTab === 'booking'
                        ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                        : 'bg-neutral-900 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Instant Booking
                  </button>
                  <button
                    onClick={() => { setActiveTab('bulk'); setBookingSubTab('bulk'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      activeTab === 'bulk'
                        ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                        : 'bg-neutral-900 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Bulk CSV Import
                  </button>
                </div>
              )}

              {currentUser && (
                <CreditWallet
                  customerEmail={currentUser.email}
                  balancePence={creditBalancePence}
                  onChanged={loadData}
                />
              )}

              {activeTab === 'booking' && (
                <SingleBookingForm
                  userId={currentUser?.email || 'authenticated_user'}
                  userEmail={currentUser?.email || 'user@quickzy.co.uk'}
                  displayName={currentUser?.name}
                  role={currentUser?.role || 'customer'}
                  savedAddresses={savedAddresses}
                  customers={customers}
                  creditBalancePence={creditBalancePence}
                  onOpenAddressBook={handleOpenAddressBookForSelection}
                  onOrdersCreated={handleOrdersCreated}
                  onCreditChanged={loadData}
                  selectedPickupAddress={selectedPickup}
                  selectedDropoffAddress={selectedDropoff}
                  profileDeliveryStream={currentUser?.deliveryStream || null}
                />
              )}


              {activeTab === 'bulk' && canUseBulk && (
                <BulkParcelBooking
                  clientId={currentUser?.email || 'client_account'}
                  clientEmail={currentUser?.email || 'client@quickzy.co.uk'}
                  creditBalancePence={creditBalancePence}
                  onBulkCompleted={handleOrdersCreated}
                  onCreditChanged={loadData}
                />
              )}
            </div>
          )}

          {/* Customer module */}
          {activeTab === 'customers' && currentUser && (
            <CustomerModule
              ownerEmail={currentUser.email}
              customers={customers}
              onChanged={loadData}
            />
          )}

          {/* Tracking */}
          {activeTab === 'tracking' && (
            <OrderStatusTracking
              orders={orders}
              currentUserRole={currentUser?.role || 'customer'}
              onRefreshOrders={loadData}
            />
          )}

          {/* Driver Console */}
          {activeTab === 'driver' && (
            <DriverCockpit
              currentUserEmail={currentUser?.email}
              assignedOrders={orders}
              onRefreshOrders={loadData}
            />
          )}

          {/* Fleet Dispatch — admin only, with embedded bulk if needed */}
          {activeTab === 'dispatch' && isAdmin && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--card-border)' }}>
                <button
                  onClick={() => setBookingSubTab('single')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    bookingSubTab !== 'bulk'
                      ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Fleet Dispatch
                </button>
                <button
                  onClick={() => setBookingSubTab('bulk')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    bookingSubTab === 'bulk'
                      ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Bulk CSV Import
                </button>
              </div>

              {bookingSubTab !== 'bulk' ? (
                <RouteBatcherCockpit />
              ) : (
                <BulkParcelBooking
                  clientId={currentUser?.email || 'admin'}
                  clientEmail={currentUser?.email || 'admin@quickzy.co.uk'}
                  creditBalancePence={creditBalancePence}
                  onBulkCompleted={handleOrdersCreated}
                  onCreditChanged={loadData}
                />
              )}
            </div>
          )}
        </main>
      )}

      {/* Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        savedAddresses={savedAddresses}
        onOpenAddressBook={() => {
          if (!currentUser) return;
          setAddressSelectionMode(null);
          setIsAddressBookOpen(true);
        }}
        onLogin={(user) => handleLogin(user as any)}
        onLogout={handleSignOutUser}
      />

      {/* Address Book Modal — only for authenticated users */}
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

      {/* Help chat for customers and drivers; admin answers in the Support tab */}
      {currentUser && currentUser.role !== 'admin' && currentUser.email !== 'prajapatikaranc@gmail.com' && (
        <SupportChat email={currentUser.email} />
      )}

      {/* Footer is for the website; hidden on phones so the app screens stay uncluttered */}
      <div className="hidden lg:block">
        <Footer currentUser={currentUser} />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAddressBook={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setAddressSelectionMode(null);
            setIsAddressBookOpen(true);
          }
        }}
      />
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
