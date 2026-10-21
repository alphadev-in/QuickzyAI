'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Menu,
  X,
  ShieldCheck,
  Lock,
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
  const { cart } = useApp();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: HeaderProps['activeTab']) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleTabClick('booking')}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 font-black text-xl text-neutral-950 animate-float">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">Quickzy</span>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full tracking-wide">
                  LONDON 🇬🇧
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 hidden sm:block">Aelius Venture Limited Logistics</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-800/80 shadow-inner">
            <button
              onClick={() => handleTabClick('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'booking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Book Courier</span>
            </button>

            <button
              onClick={() => handleTabClick('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bulk'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV</span>
            </button>

            <button
              onClick={() => handleTabClick('tracking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'tracking'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tracking</span>
            </button>

            <button
              onClick={() => handleTabClick('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'storefront'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Stores</span>
              {totalItems > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-neutral-950 text-white rounded-full text-[10px]">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dispatch'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Fleet Batcher</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddressBook}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 border border-neutral-700/60 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Address Book</span>
            </button>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin</span>
            </Link>

            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">
                {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-800 bg-neutral-900/98 px-4 py-4 space-y-2 backdrop-blur-xl animate-in slide-in-from-top-2">
          <button
            onClick={() => handleTabClick('booking')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
              activeTab === 'booking' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-300 bg-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              <span>Book Courier (Pharmacy, Food, Parcel)</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-black/20">Active</span>
          </button>

          <button
            onClick={() => handleTabClick('bulk')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
              activeTab === 'bulk' ? 'bg-cyan-500 text-neutral-950' : 'text-neutral-300 bg-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk CSV Importer (Atomic Transaction)</span>
            </div>
          </button>

          <button
            onClick={() => handleTabClick('tracking')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
              activeTab === 'tracking' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-300 bg-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Order Status & Tracking</span>
            </div>
          </button>

          <button
            onClick={() => handleTabClick('storefront')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
              activeTab === 'storefront' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-300 bg-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>High-Street Independent Stores</span>
            </div>
            {totalItems > 0 && <span className="bg-emerald-500 text-black px-2 py-0.5 rounded-full">{totalItems}</span>}
          </button>

          <button
            onClick={() => handleTabClick('dispatch')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold ${
              activeTab === 'dispatch' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-300 bg-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>Fleet Dispatch Cockpit</span>
            </div>
          </button>

          <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2 text-center text-xs">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 rounded-xl bg-neutral-800 text-white font-bold"
            >
              Sign Up
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-500/30"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
