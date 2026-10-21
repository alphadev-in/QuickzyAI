'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  ShoppingBag,
  Store,
  Bike,
  Compass,
  Sparkles,
  CalendarCheck,
  FileSpreadsheet,
  Activity,
  UserCheck,
  MapPin,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddressBook: () => void;
  currentUser: { email: string; role: string; name: string } | null;
  activeTab: 'storefront' | 'booking' | 'bulk' | 'tracking' | 'merchant' | 'driver' | 'dispatch';
  setActiveTab: (tab: 'storefront' | 'booking' | 'bulk' | 'tracking' | 'merchant' | 'driver' | 'dispatch') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenAddressBook,
  currentUser,
  activeTab,
  setActiveTab,
}) => {
  const { cart, hasColdChainInCart } = useApp();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('booking')}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-xl text-neutral-950">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">Quickzy</span>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full tracking-wide">
                  LONDON ONLY 🇬🇧
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Pharmacy, Food & Parcel Rapid Courier</p>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'booking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Book Courier</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'bulk'
                  ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tracking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Order Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'storefront'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>High-Street Stores</span>
              {totalItems > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-neutral-950 text-white rounded-full text-[10px]">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dispatch'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Dispatch Cockpit</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAddressBook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 border border-neutral-700/60 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Address Book</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {currentUser ? (
                  <span className="capitalize">{currentUser.name.split(' ')[0]} ({currentUser.role})</span>
                ) : (
                  'Sign In / Register'
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
