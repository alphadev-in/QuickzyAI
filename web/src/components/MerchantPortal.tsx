'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Store, CheckCircle, Clock, ShieldCheck, RefreshCw, KeyRound, Sparkles } from 'lucide-react';

export const MerchantPortal: React.FC = () => {
  const {
    merchants,
    selectedMerchantId,
    setSelectedMerchantId,
    activeTrip,
    verifyWaypointHandshake,
  } = useApp();

  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [tokenCounter, setTokenCounter] = useState<number>(101);

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  // Find relevant waypoint for this merchant
  const merchantWaypoint = activeTrip?.waypoints.find(
    (wp) => wp.merchantId === currentMerchant.id && wp.type === 'pickup'
  );

  const isCompleted = merchantWaypoint?.status === 'completed';

  // Dynamic rotating QR token
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTokenCounter((c) => c + 1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dynamicQrPayload = `QZK-AUTH-TOKEN-STORE-${currentMerchant.id.toUpperCase()}-${tokenCounter}`;
  const dynamicPin = `${((tokenCounter * 71) % 9000) + 1000}`;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Top Selector: Choose Merchant Tablet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900 p-4 rounded-2xl border border-neutral-800 gap-4">
        <div>
          <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
            Store Staff POS Terminal
          </span>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span>Store Counter Dashboard</span>
          </h2>
        </div>

        {/* Switch Store */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-neutral-400">Viewing Store:</label>
          <select
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(e.target.value)}
            className="bg-neutral-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Order Handshake Card */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
        <div className="p-6 sm:p-8 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                Order Fulfillment Stage
              </span>
              <span className="text-xs text-neutral-400">Order ID #SUB-{currentMerchant.id.slice(6, 11).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2">{currentMerchant.name}</h1>
            <p className="text-xs text-neutral-400 mt-1">{currentMerchant.address}</p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isCompleted ? 'Handed Over to Driver' : 'Awaiting Driver Handshake'}</span>
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Order Details & Freshness Rules */}
          <div className="md:col-span-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
                Items Packed for Collection
              </h3>
              <div className="bg-neutral-800/60 rounded-2xl p-4 border border-neutral-700/50 space-y-2">
                <p className="text-sm font-semibold text-white">
                  {merchantWaypoint?.itemsSummary || '1x Freshly Prepared Order Batch'}
                </p>
                <div className="flex items-center space-x-4 text-xs text-neutral-400 pt-2 border-t border-neutral-700/60">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Packed 4 mins ago</span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Bags Tamper-Sealed</span>
                </div>
              </div>
            </div>

            {/* Cold Chain Instruction for Merchant */}
            {merchantWaypoint?.hasColdChain && (
              <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>COLD-CHAIN COMPLIANCE REQUIRED</span>
                </div>
                <p className="text-xs text-cyan-200/80 leading-relaxed">
                  Raw meats and chilled items must remain inside store refrigeration until the Quickzy driver arrives with their thermal bag.
                </p>
              </div>
            )}

            {/* Simulated Handshake Action */}
            {!isCompleted ? (
              <div className="space-y-2">
                <p className="text-xs text-neutral-400">Simulate Driver Pickup in Store:</p>
                <button
                  onClick={() => {
                    if (merchantWaypoint) {
                      verifyWaypointHandshake(merchantWaypoint.id, true);
                    }
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulate Instant QR Scan by Driver</span>
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 flex items-center space-x-3 text-emerald-400">
                <CheckCircle className="w-6 h-6 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Driver Handshake Complete!</p>
                  <p className="text-neutral-400">
                    Handed over to Marco Bellini (E-Cargo Bike #04).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive QR Display for Tablet */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-neutral-950/60 rounded-3xl p-6 border border-neutral-800/80 text-center">
            {isCompleted ? (
              <div className="py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">QR Code Redeemed</h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Cryptographic verification token validated and burned. Order in transit.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-400 font-medium mb-3">
                  Present this QR code to the driver:
                </p>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/40 ring-4 ring-emerald-500/30">
                  <QRCodeSVG value={dynamicQrPayload} size={180} level="H" />
                </div>

                {/* Rotating Timer */}
                <div className="w-full max-w-[200px] mt-4 space-y-1">
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-1000"
                      style={{ width: `${(secondsRemaining / 60) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="flex items-center space-x-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Auto-rotating</span>
                    </span>
                    <span>{secondsRemaining}s</span>
                  </div>
                </div>

                {/* Backup PIN */}
                <div className="mt-4 pt-4 border-t border-neutral-800 w-full flex items-center justify-center space-x-2 text-xs">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-neutral-400">Backup PIN:</span>
                  <span className="font-mono font-bold text-white tracking-widest text-sm bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                    {dynamicPin}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
