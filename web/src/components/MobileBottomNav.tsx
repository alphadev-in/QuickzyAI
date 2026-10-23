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
        { id: 'driver', label: 'Console', icon: <Bike className="w-5 h-5" />, action: () => setActiveTab('driver') },
        { id: 'tracking', label: 'Deliveries', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
        { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
      ];
    }

    if (isClient) {
      return [
        { id: 'booking', label: 'Book', icon: <Package className="w-5 h-5" />, action: () => setActiveTab('booking') },
        { id: 'tracking', label: 'My Orders', icon: <Activity className="w-5 h-5" />, action: () => setActiveTab('tracking') },
        { id: 'addresses', label: 'Addresses', icon: <span className="text-base">📍</span>, action: onOpenAddressBook },
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
      { id: 'addresses', label: 'Addresses', icon: <span className="text-base">📍</span>, action: onOpenAddressBook },
      { id: 'profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" />, action: onOpenAuth },
    ];
  };

  const items = navItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-2 py-1.5 transition-colors duration-200"
      style={{
        background: 'var(--header-bg, rgba(9, 9, 11, 0.95))',
        borderColor: 'var(--header-border, rgba(255, 255, 255, 0.08))',
      }}
    >
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer select-none ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
