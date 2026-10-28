'use client';

import React from 'react';
import Link from 'next/link';
import { COOKIE_SETTINGS_EVENT } from '@/components/CookieConsent';
import { MapPin, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  currentUser?: { email?: string; role?: string } | null;
}

export const Footer: React.FC<FooterProps> = ({ currentUser }) => {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950/90 text-neutral-400 py-12 px-4 sm:px-6 lg:px-8 mt-16 text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center">
              <div className="h-10 w-36 overflow-hidden flex items-center justify-start">
                <img src="/logo.png" alt="Quickzy" className="h-full w-auto object-contain object-left" />
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ultra-local same-day rapid courier platform serving all 32 London Boroughs & City of London for Pharmacy, Food, and Parcel freight.
            </p>
          </div>

          {/* Column 2: London Coverage Areas */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>London Coverage</span>
            </h4>
            <ul className="space-y-1.5 text-neutral-400 text-xs">
              <li>
                <Link href="/locations/central-london" className="hover:text-emerald-400 transition">
                  Central London (EC, WC)
                </Link>
              </li>
              <li>
                <Link href="/locations/north-london" className="hover:text-emerald-400 transition">
                  North London (N, NW)
                </Link>
              </li>
              <li>
                <Link href="/locations/east-london" className="hover:text-emerald-400 transition">
                  East London (E, Canary Wharf)
                </Link>
              </li>
              <li>
                <Link href="/locations/west-london" className="hover:text-emerald-400 transition">
                  West London (W, SW, Mayfair)
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-emerald-400 font-medium hover:underline">
                  All 32 Boroughs Directory ➔
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Logistics Services */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Services</h4>
            <ul className="space-y-1.5 text-neutral-400 text-xs">
              <li>
                <Link href="/locations/city-of-london/pharmacy" className="hover:text-emerald-400 transition">
                  Same-Day Pharmacy Delivery
                </Link>
              </li>
              <li>
                <Link href="/locations/shoreditch/food" className="hover:text-emerald-400 transition">
                  Cold-Chain Food &amp; Groceries
                </Link>
              </li>
              <li>
                <Link href="/locations/canary-wharf/parcel" className="hover:text-emerald-400 transition">
                  London Parcel Courier &amp; Bulk CSV
                </Link>
              </li>
              <li>
                <Link href="/locations/westminster/delivery" className="hover:text-emerald-400 transition">
                  Same-Day Courier Delivery
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-emerald-400 transition">
                  Fleet Onboarding
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Standards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-1.5 text-neutral-400 text-xs">
              <li>
                <Link href="/faq" className="hover:text-emerald-400 transition">
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
                  className="hover:text-emerald-400 transition text-left"
                >
                  Cookie settings
                </button>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-emerald-400 transition">
                  Register Account
                </Link>
              </li>
              {currentUser?.email?.toLowerCase() === 'prajapatikaranc@gmail.com' && (
                <li>
                  <Link href="/admin" className="text-red-400 hover:text-red-300 font-bold transition">
                    Admin Portal (Authorized)
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Corporate Signature: Exclusively in Footer */}
        <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 text-center sm:text-left">
          <p>© 2026 Quickzy. App managed and operated by <strong className="text-neutral-300">Aelius Venture Limited</strong>.</p>
          <p className="flex items-center justify-center gap-1">
            <span>Built for Rapid London Same-Day Logistics</span>
            <span className="text-emerald-500">🇬🇧</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
