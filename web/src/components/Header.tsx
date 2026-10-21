'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ShoppingBag, Store, Bike, Compass, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { cart, activeRole, setActiveRole, cartMerchantIds, hasColdChainInCart } = useApp();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
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
              <p className="text-[11px] text-neutral-400">London High-Street Collective & Rapid Delivery</p>
            </div>
          </div>

          {/* Interactive Role Switcher */}
          <div className="flex items-center bg-neutral-800 p-1 rounded-xl border border-neutral-700/60 shadow-inner">
            <button
              onClick={() => setActiveRole('customer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === 'customer'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
              {totalItems > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-neutral-950 text-white rounded-full text-[10px]">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveRole('merchant')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === 'merchant'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Merchant Tablet (QR)</span>
            </button>

            <button
              onClick={() => setActiveRole('driver')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === 'driver'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Driver Cockpit</span>
            </button>

            <button
              onClick={() => setActiveRole('dispatch')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRole === 'dispatch'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Route Batcher</span>
            </button>
          </div>

          {/* Quick Metrics Badge */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {hasColdChainInCart && (
              <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-1 rounded-md">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>Cold-Chain Monitored</span>
              </span>
            )}
            <div className="text-right">
              <p className="text-neutral-400">Stores in Basket</p>
              <p className="font-bold text-white">{cartMerchantIds.length} high-street merchants</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
