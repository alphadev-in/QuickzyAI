'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { CustomerStorefront } from '@/components/CustomerStorefront';
import { MerchantPortal } from '@/components/MerchantPortal';
import { DriverCockpit } from '@/components/DriverCockpit';
import { RouteBatcherCockpit } from '@/components/RouteBatcherCockpit';

const MainView: React.FC = () => {
  const { activeRole } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {activeRole === 'customer' && <CustomerStorefront />}
      {activeRole === 'merchant' && <MerchantPortal />}
      {activeRole === 'driver' && <DriverCockpit />}
      {activeRole === 'dispatch' && <RouteBatcherCockpit />}
    </main>
  );
};

export default function Home() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
        <Header />
        <div className="flex-1">
          <MainView />
        </div>
        <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 space-y-1">
          <p>© 2026 Quickzy (quickzy.co.uk) • Ultra-Local Neighborhood Logistics & Multi-Merchant Delivery</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">Currently serving London Boroughs Only 🇬🇧</p>
        </footer>
      </div>
    </AppProvider>
  );
}
