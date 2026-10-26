'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

// Minimal typing for the non-standard install event (not in lib.dom)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'quickzy_install_dismissed';

// Registers the service worker and offers "Add to Home Screen" (Android/Chrome via prompt, iOS via a hint)
export const PwaRegister: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker registration failed:', err));
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const wasDismissed = localStorage.getItem(DISMISS_KEY) === '1';
    setDismissed(standalone || wasDismissed);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos && !standalone) setShowIosHint(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (dismissed || (!installEvent && !showIosHint)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setInstallEvent(null);
  };

  return (
    <div className="fixed left-3 right-3 bottom-20 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 z-50 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 animate-fade-in-up">
      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        {installEvent ? <Download className="w-4 h-4" /> : <Share className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">Add Quickzy to your home screen</p>
        <p className="text-[11px] text-neutral-400">
          {installEvent ? 'Open bookings and deliveries in one tap.' : 'Tap Share, then "Add to Home Screen".'}
        </p>
      </div>
      {installEvent && (
        <button type="button" onClick={install} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black shrink-0">
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-neutral-500 hover:text-white shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
