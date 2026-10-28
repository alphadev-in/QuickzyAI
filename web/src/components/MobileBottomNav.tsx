'use client';

import React from 'react';
import {
  CalendarCheck,
  Package,
  Activity,
  Bike,
  Compass,
  UserCircle,
  Home,
  Users,
} from 'lucide-react';
import { UserRole } from '@/types/delivery';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser: { email: string; role: UserRole; name: string } | null;
  onOpenAuth: () => void;
  onOpenAddressBook: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenAddressBook,
}) => {
  const role = currentUser?.role;
  const isDriver = role === 'driver';
  const isClient = role === 'client';
  const isAdmin = role === 'admin';

  // Navigation items based on role
  const navItems = () => {
    if (!currentUser) {
      return [
        { id: 'index', label: 'Home', icon: <Home className="w-5 h-5" />, action: () => setActiveTab('index') },
        { id: 'booking', label: 'Book', icon: <CalendarCheck className="w-5 h-5" />, action: onOpenAuth },
        { id: 'auth', label: 'Sign In', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
      ];
    }

    if (isDriver) {
      return [
        { id: 'driver', label: 'Home', icon: <Bike className="w-5 h-5" />, action: () => setActiveTab('driver') },
        { id: 'tracking', label: 'Deliveries', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
        { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
      ];
    }

    if (isClient) {
      return [
        { id: 'booking', label: 'Book', icon: <Package className="w-5 h-5" />, action: () => setActiveTab('booking') },
        { id: 'tracking', label: 'My Orders', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
        { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" />, action: () => setActiveTab('customers') },
        { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
      ];
    }

    if (isAdmin) {
      return [
        { id: 'booking', label: 'Book', icon: <Package className="w-5 h-5" />, action: () => setActiveTab('booking') },
        { id: 'dispatch', label: 'Dispatch', icon: <Compass className="w-5 h-5" />, action: () => setActiveTab('dispatch') },
        { id: 'driver', label: 'Driver', icon: <Bike className="w-5 h-5" />, action: () => setActiveTab('driver') },
        { id: 'tracking', label: 'Orders', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
        { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
      ];
    }

    // Default Customer
    return [
      { id: 'booking', label: 'Book', icon: <CalendarCheck className="w-5 h-5" />, action: () => setActiveTab('booking') },
      { id: 'tracking', label: 'My Orders', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
      { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" />, action: () => setActiveTab('customers') },
      { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
    ];
  };

  const items = navItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] transition-colors duration-200"
      style={{
        background: 'var(--header-bg, rgba(9, 9, 11, 0.95))',
        borderColor: 'var(--header-border, rgba(255, 255, 255, 0.08))',
      }}
    >
      <nav aria-label="Main navigation" className="grid max-w-md mx-auto gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl transition active:scale-95 cursor-pointer select-none ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
            >
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-emerald-400" />}
              {item.icon}
              <span className="text-[10px] tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
