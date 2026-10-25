'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Bike,
  Compass,
  CalendarCheck,
  Activity,
  Menu,
  X,
  Lock,
  Sun,
  Moon,
  UserCircle,
  ChevronDown,
  Package,
  Users,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAddressBook: () => void;
  currentUser: { email: string; role: string; name: string; companyName?: string } | null;
  /** Shown in the profile menu. Omit to hide the balance row. */
  creditBalancePence?: number;
  onSignOut?: () => void;
  activeTab: 'storefront' | 'booking' | 'bulk' | 'customers' | 'tracking' | 'merchant' | 'driver' | 'dispatch';
  setActiveTab: (tab: 'storefront' | 'booking' | 'bulk' | 'customers' | 'tracking' | 'merchant' | 'driver' | 'dispatch') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenAddressBook,
  currentUser,
  creditBalancePence,
  onSignOut,
  activeTab,
  setActiveTab,
}) => {
  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'Q';

  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleTabClick = (tab: HeaderProps['activeTab']) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  const role = currentUser?.role;

  // Role helpers
  const isCustomer = role === 'customer';
  const isClient = role === 'client';
  const isDriver = role === 'driver';
  const isAdmin = role === 'admin';

  // Build nav tabs based on role
  // - driver: Driver Console only
  // - customer: Book Courier, My Orders
  // - client (business): Book Couriers (includes Bulk CSV internally), My Orders
  // - admin: Book Couriers, Fleet Dispatch (includes Bulk internally), My Orders, Driver Console
  const navTabs = () => {
    if (!currentUser) return [];
    if (isDriver) {
      return [
        { id: 'driver', label: 'Driver Console', icon: <Bike className="w-3.5 h-3.5" />, color: 'amber' },
        { id: 'tracking', label: 'My Deliveries', icon: <Activity className="w-3.5 h-3.5" />, color: 'emerald' },
      ];
    }
    if (isClient) {
      return [
        { id: 'booking', label: 'Book Couriers', icon: <Package className="w-3.5 h-3.5" />, color: 'emerald' },
        { id: 'customers', label: 'Customers', icon: <Users className="w-3.5 h-3.5" />, color: 'emerald' },
        { id: 'tracking', label: 'My Orders', icon: <Activity className="w-3.5 h-3.5" />, color: 'emerald' },
      ];
    }
    if (isAdmin) {
      return [
        { id: 'booking', label: 'Book Couriers', icon: <Package className="w-3.5 h-3.5" />, color: 'emerald' },
        { id: 'customers', label: 'Customers', icon: <Users className="w-3.5 h-3.5" />, color: 'emerald' },
        { id: 'dispatch', label: 'Fleet Dispatch', icon: <Compass className="w-3.5 h-3.5" />, color: 'emerald' },
        { id: 'driver', label: 'Driver Console', icon: <Bike className="w-3.5 h-3.5" />, color: 'amber' },
        { id: 'tracking', label: 'My Orders', icon: <Activity className="w-3.5 h-3.5" />, color: 'emerald' },
      ];
    }
    // customer
    return [
      { id: 'booking', label: 'Book Courier', icon: <CalendarCheck className="w-3.5 h-3.5" />, color: 'emerald' },
      { id: 'customers', label: 'Customers', icon: <Users className="w-3.5 h-3.5" />, color: 'emerald' },
      { id: 'tracking', label: 'My Orders', icon: <Activity className="w-3.5 h-3.5" />, color: 'emerald' },
    ];
  };

  const tabs = navTabs();

  const tabClass = (id: string, color: string) => {
    const isActive = activeTab === id;
    if (!isActive) return 'text-neutral-400 hover:text-white hover:bg-neutral-800/60';
    if (color === 'amber') return 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold';
    if (color === 'cyan') return 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20 font-bold';
    return 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold';
  };

  const mobileBtnClass = (id: string, color: string) => {
    const isActive = activeTab === id;
    if (!isActive) return 'text-neutral-300 bg-neutral-950';
    if (color === 'amber') return 'bg-amber-500 text-neutral-950';
    if (color === 'cyan') return 'bg-cyan-500 text-neutral-950';
    return 'bg-emerald-500 text-neutral-950';
  };

  return (
    <header className="sticky top-0 z-50 border-b transition-colors"
      style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo */}
          <div
            onClick={() => !currentUser ? undefined : handleTabClick('booking')}
            className={`flex items-center ${currentUser ? 'cursor-pointer' : 'cursor-default'} select-none py-1`}
          >
            <div className="relative h-11 w-36 sm:w-44 flex items-center justify-start overflow-hidden">
              <img
                src="/logo.png"
                alt="Quickzy"
                className="h-full w-auto object-contain object-left hover:scale-[1.03] transition-transform duration-200"
              />
            </div>
          </div>

          {/* Desktop Navigation — shown only when logged in */}
          {currentUser && tabs.length > 0 && (
            <nav className="hidden lg:flex items-center bg-neutral-950/80 p-1.5 rounded-2xl border border-neutral-800/80 shadow-inner">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${tabClass(tab.id, tab.color)}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-cyan-500" />}
            </button>

            {/* Admin badge — only for admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            {/* Profile / Sign-in button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="max-w-[80px] truncate hidden sm:block">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-xl overflow-hidden animate-fade-slide z-50"
                    style={{ background: 'var(--surface, #18181b)', borderColor: 'var(--card-border)' }}>
                    <div className="px-3.5 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--card-border)' }}>
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                        {initials(currentUser.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-200 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-neutral-400 font-mono truncate">{currentUser.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {currentUser.role}
                          </span>
                          {currentUser.companyName && (
                            <span className="text-[10px] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full bg-cyan-500/10 truncate max-w-[120px]">
                              {currentUser.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {creditBalancePence !== undefined && (
                      <div className="px-3.5 py-2.5 border-b flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-neutral-400">Credit balance</span>
                        <span className="font-black text-cyan-400">£{(creditBalancePence / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { onOpenAuth(); setProfileOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800/60 transition flex items-center gap-2"
                      >
                        <UserCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Manage Profile
                      </button>
                      {currentUser && (
                        <button
                          onClick={() => { onOpenAddressBook(); setProfileOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800/60 transition flex items-center gap-2"
                        >
                          <span className="text-emerald-400">📍</span>
                          Address Book
                        </button>
                      )}
                      {onSignOut && (
                        <button
                          onClick={() => { setProfileOpen(false); onSignOut(); }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition flex items-center gap-2 border-t mt-1 pt-2.5"
                          style={{ borderColor: 'var(--card-border)' }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer lg:hidden border-t px-4 py-4 space-y-2 backdrop-blur-xl animate-fade-slide"
          style={{ borderColor: 'var(--header-border)', background: 'var(--header-bg)' }}>
          {/* Theme toggle row */}
          <div className="flex items-center justify-between pb-2 border-b text-xs" style={{ borderColor: 'var(--card-border)' }}>
            <span className="text-neutral-400">Appearance</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-800 text-xs text-neutral-200"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {currentUser ? (
            <>
              {/* User info row */}
              <div className="px-3 py-2 rounded-xl bg-neutral-900/60 text-xs">
                <p className="font-bold text-neutral-200">{currentUser.name}</p>
                <p className="text-neutral-400 font-mono text-[11px]">{currentUser.email}</p>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mt-1 inline-block">
                  {currentUser.role}
                </span>
              </div>

              {/* Role-based tabs */}
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold ${mobileBtnClass(tab.id, tab.color)}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}

              {/* Profile & Address book */}
              <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--card-border)' }}>
                <button
                  onClick={() => { onOpenAddressBook(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-bold"
                >
                  📍 Address Book
                </button>
                <button
                  onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                >
                  Profile
                </button>
              </div>

              {onSignOut && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onSignOut(); }}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-500/30 text-xs block"
                >
                  Admin Portal
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="py-2 text-center text-xs text-neutral-400">
                Sign in to access courier booking and tracking.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs"
                >
                  Sign In
                </button>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-white font-bold text-xs text-center"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Overlay to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
};
