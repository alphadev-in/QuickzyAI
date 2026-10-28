'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { ConsentChoice, clearConsent, getConsent, setConsent } from '@/lib/consent';
import { startAnalytics } from '@/lib/analytics';

// Footer button dispatches this to reopen the choice
export const COOKIE_SETTINGS_EVENT = 'quickzy:cookie-settings';

// GDPR cookie banner. Accept or reject is equally prominent; analytics only starts on accept.
export const CookieConsent: React.FC = () => {
  const [choice, setChoice] = useState<ConsentChoice | null | undefined>(undefined);

  useEffect(() => {
    const existing = getConsent();
    setChoice(existing);
    if (existing === 'accepted') startAnalytics();

    const reopen = () => {
      clearConsent();
      setChoice(null);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (next: ConsentChoice) => {
    setConsent(next);
    setChoice(next);
    if (next === 'accepted') startAnalytics();
  };

  // Not shown until the stored choice is read, to avoid a flash on returning visitors
  if (choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed left-3 right-3 bottom-24 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[28rem] z-[60] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-4 space-y-3 animate-fade-in-up"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Cookie className="w-4 h-4" />
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          We use essential cookies to run bookings and sign-in. With your permission we also use Firebase Analytics to
          understand how the site is used. See our{' '}
          <Link href="/privacy" className="text-emerald-400 underline">privacy policy</Link>.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide('rejected')}
          className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition"
        >
          Reject analytics
        </button>
        <button
          type="button"
          onClick={() => decide('accepted')}
          className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-neutral-950 transition"
        >
          Accept all
        </button>
      </div>
    </div>
  );
};
