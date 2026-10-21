'use client';

import React, { useState, useEffect } from 'react';
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

type MainTab = 'storefront' | 'booking' | 'bulk' | 'tracking' | 'merchant' | 'driver' | 'dispatch';

function MainApplicationContent() {
  const [activeTab, setActiveTab] = useState<MainTab>('booking');
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    role: UserRole;
    name: string;
    companyName?: string;
  } | null>({
    email: 'karan@quickzy.co.uk',
    role: 'customer',
    name: 'Karan Prajapati',
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [addressSelectionMode, setAddressSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);

  const [selectedPickup, setSelectedPickup] = useState<AddressItem | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<AddressItem | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [orders, setOrders] = useState<QuickzyOrder[]>([]);

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Navigation Breadcrumbs / Quick Switcher for Demonstrating Roles */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Current Role Mode:</span>
            <span className="font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {currentUser?.role || 'Guest'}
            </span>
            {currentUser?.companyName && (
              <span className="text-neutral-400 hidden sm:inline">({currentUser.companyName})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Switch Demo Role:</span>
            <button
              onClick={() =>
                setCurrentUser({
                  email: 'customer@london.co.uk',
                  role: 'customer',
                  name: 'Alice Customer',
                })
              }
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentUser?.role === 'customer'
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
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
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentUser?.role === 'client'
                  ? 'bg-cyan-500 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Client (Bulk)
            </button>
            <button
              onClick={() =>
                setCurrentUser({
                  email: 'admin@quickzy.co.uk',
                  role: 'admin',
                  name: 'Fleet Dispatcher #1',
                })
              }
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              Admin / Dispatch
            </button>
          </div>
        </div>

        {/* View Router */}
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
        onLogin={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
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

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 space-y-1 mt-10">
        <p>© 2026 Quickzy (quickzy.co.uk) • Ultra-Local Same-Day Logistics & Pharmacy/Food/Parcel Fleet</p>
        <p className="text-[11px] text-emerald-400/80 font-medium">Serving All London Boroughs with Live Firestore Sync 🇬🇧</p>
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
