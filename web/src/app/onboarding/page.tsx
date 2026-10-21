'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { saveAddress } from '@/lib/orderService';
import { isValidLondonPostcode } from '@/types/delivery';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [street, setStreet] = useState('');
  const [postcode, setPostcode] = useState('');
  const [label, setLabel] = useState('Home');
  const [stream, setStream] = useState<'pharmacy' | 'food' | 'parcel'>('parcel');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveDefaultAddress = async () => {
    setErrorMsg('');
    const formatted = postcode.trim().toUpperCase();
    if (!isValidLondonPostcode(formatted)) {
      setErrorMsg(`'${formatted}' is outside Greater London. Please enter a valid London postcode.`);
      return;
    }

    try {
      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('quickzy_user_session') : null;
      const user = userRaw ? JSON.parse(userRaw) : { email: 'user@quickzy.co.uk' };

      await saveAddress(user.email, {
        line1: street || '142 Upper Street',
        city: 'London',
        postcode: formatted,
        label,
      });

      setStep(2);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save address');
    }
  };

  const handleFinish = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-neutral-950 flex items-center justify-center font-black text-sm">
              Q
            </div>
            <span className="font-bold text-sm text-white">Quickzy Fleet Onboarding</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : ''}`}>Step 1: Address</span>
            <span>➔</span>
            <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : ''}`}>Step 2: Stream</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass-panel relative">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Step 1 of 2
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                  Save Your Primary London Hub
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Validate your home, dispensary, restaurant, or business office postcode.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Street Line 1</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. 142 Upper Street, Islington"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1 font-semibold">London Postcode</label>
                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      placeholder="e.g. N1 1QP"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1 font-semibold">Location Label</label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Home">Home Doorstep</option>
                      <option value="Office">Corporate Office</option>
                      <option value="Store">Retail Branch</option>
                      <option value="Hub">Logistics Hub</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Skip for Now
                </button>
                <button
                  type="button"
                  onClick={handleSaveDefaultAddress}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>Save Address & Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Step 2 of 2
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
                  <Package className="w-6 h-6 text-cyan-400" />
                  Choose Primary Delivery Stream
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  You can book any stream at any time from your main dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStream('pharmacy')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    stream === 'pharmacy'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">Pharmacy</p>
                  <p className="text-[10px] opacity-70 mt-1">Prescription deliveries & medical supplies</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStream('food')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    stream === 'food'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">Food</p>
                  <p className="text-[10px] opacity-70 mt-1">Hot, fresh & cold-chain meal transit</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStream('parcel')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    stream === 'parcel'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">Parcel</p>
                  <p className="text-[10px] opacity-70 mt-1">Same-day courier & bulk CSV orders</p>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Same-Day Cutoff Policy</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Orders placed before <strong>14:00 GMT</strong> qualify for same-day rapid delivery across Greater London. Orders submitted after 14:00 GMT automatically reserve morning slots for the following day.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <span>Launch Quickzy Dashboard</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
