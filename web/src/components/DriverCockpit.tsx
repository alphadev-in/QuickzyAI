'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Snowflake,
  QrCode,
  MapPin,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const DriverCockpit: React.FC = () => {
  const { activeTrip, verifyWaypointHandshake, setActiveRole, setSelectedMerchantId } = useApp();

  const [activeModalWaypointId, setActiveModalWaypointId] = useState<string | null>(null);
  const [coldChecklist, setColdChecklist] = useState({
    thermalBagReady: false,
    icePackActive: false,
    sealIntact: false,
  });

  if (!activeTrip) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
          <Bike className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Delivery Trips</h2>
        <p className="text-sm text-neutral-400">
          Go to the Storefront or Route Batcher to dispatch a neighborhood delivery.
        </p>
        <button
          onClick={() => setActiveRole('customer')}
          className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-xl font-bold text-xs"
        >
          Go to Storefront
        </button>
      </div>
    );
  }

  const currentWp = activeTrip.waypoints[activeTrip.currentWaypointIndex];
  const isTripCompleted = activeTrip.status === 'completed';

  const handleOpenScanner = (waypointId: string) => {
    setActiveModalWaypointId(waypointId);
    setColdChecklist({ thermalBagReady: false, icePackActive: false, sealIntact: false });
  };

  const handleConfirmPickup = () => {
    if (!activeModalWaypointId) return;
    verifyWaypointHandshake(activeModalWaypointId, true);
    setActiveModalWaypointId(null);
  };

  const isColdSafetySatisfied =
    coldChecklist.thermalBagReady && coldChecklist.icePackActive && coldChecklist.sealIntact;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Trip Header Status */}
      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {activeTrip.id}
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                {activeTrip.driverVehicle}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{activeTrip.driverName}</h2>
            <p className="text-xs text-neutral-400">
              Assigned Route: {activeTrip.waypoints.length} Waypoints ({activeTrip.totalDistanceKm} km total)
            </p>
          </div>
        </div>

        {/* Cold-Chain Transit Timer Box */}
        <div className="bg-cyan-950/50 border border-cyan-800/80 rounded-2xl p-3 flex items-center space-x-3">
          <Snowflake className="w-6 h-6 text-cyan-400 animate-spin" />
          <div className="text-xs">
            <p className="text-cyan-400 font-bold">Cold-Chain SLA Cap</p>
            <p className="text-white font-mono font-bold">25:00 max in transit</p>
          </div>
        </div>
      </div>

      {/* Sequential Route Waypoints */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
          Waypoint Sequence (Optimized Corridor Order)
        </h3>

        <div className="space-y-3">
          {activeTrip.waypoints.map((wp, index) => {
            const isCurrent = activeTrip.currentWaypointIndex === index && !isTripCompleted;
            const isCompleted = wp.status === 'completed';

            return (
              <div
                key={wp.id}
                className={`rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? 'bg-neutral-900 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : isCompleted
                    ? 'bg-neutral-900/40 border-neutral-800/60 opacity-60'
                    : 'bg-neutral-900/60 border-neutral-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-emerald-500 text-neutral-950 font-black'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            wp.type === 'pickup'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {wp.type}
                        </span>

                        <h4 className="text-base font-bold text-white">{wp.locationName}</h4>

                        {wp.hasColdChain && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded">
                            <Snowflake className="w-2.5 h-2.5" />
                            <span>COLD-CHAIN</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-400 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span>{wp.address}</span>
                      </p>

                      <p className="text-xs text-neutral-300 font-medium pt-1">
                        📦 {wp.itemsSummary}
                      </p>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="sm:self-center shrink-0">
                    {isCompleted ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </span>
                    ) : isCurrent ? (
                      <div className="flex items-center space-x-2">
                        {wp.merchantId && (
                          <button
                            onClick={() => {
                              setSelectedMerchantId(wp.merchantId!);
                              setActiveRole('merchant');
                            }}
                            className="text-[11px] text-neutral-400 hover:text-white px-2 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500"
                          >
                            View Tablet
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenScanner(wp.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>{wp.type === 'pickup' ? 'Scan Merchant QR' : 'Confirm Dropoff'}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 font-medium">Queued</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver Handshake & Cold-Chain Checklist Modal */}
      {activeModalWaypointId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Instant QR Pickup Verification</h3>
              </div>
              <button
                onClick={() => setActiveModalWaypointId(null)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Simulated In-App Scanner View */}
            <div className="relative rounded-2xl overflow-hidden bg-neutral-950 p-6 text-center border border-neutral-800 space-y-3">
              <div className="w-32 h-32 mx-auto border-2 border-emerald-400 rounded-2xl relative flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">SCANNING...</span>
              </div>
              <p className="text-xs text-neutral-400">
                Align the merchant's tablet QR code within the frame to verify handover.
              </p>
            </div>

            {/* Mandatory Cold-Chain Checklist */}
            {currentWp?.hasColdChain && (
              <div className="space-y-3 bg-cyan-950/30 border border-cyan-800/60 rounded-2xl p-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>MANDATORY COLD-CHAIN CONFIRMATION</span>
                </div>
                <p className="text-[11px] text-cyan-200/70">
                  Perishable safety guidelines require confirming thermal preservation before completing pickup:
                </p>

                <div className="space-y-2 pt-1 text-xs text-neutral-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coldChecklist.thermalBagReady}
                      onChange={(e) =>
                        setColdChecklist({ ...coldChecklist, thermalBagReady: e.target.checked })
                      }
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>Thermal insulation courier bag inspected and clean</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coldChecklist.icePackActive}
                      onChange={(e) =>
                        setColdChecklist({ ...coldChecklist, icePackActive: e.target.checked })
                      }
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>Frozen gel cool-packs active inside the compartment</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coldChecklist.sealIntact}
                      onChange={(e) =>
                        setColdChecklist({ ...coldChecklist, sealIntact: e.target.checked })
                      }
                      className="accent-emerald-500 w-4 h-4 rounded"
                    />
                    <span>Store freshness tamper-proof seal confirmed intact</span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                disabled={currentWp?.hasColdChain && !isColdSafetySatisfied}
                onClick={handleConfirmPickup}
                className={`w-full py-3.5 px-4 rounded-xl text-neutral-950 font-bold text-xs flex items-center justify-center space-x-2 transition ${
                  currentWp?.hasColdChain && !isColdSafetySatisfied
                    ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Token & Complete Waypoint</span>
              </button>

              {currentWp?.hasColdChain && !isColdSafetySatisfied && (
                <p className="text-[11px] text-amber-400 text-center flex items-center justify-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Check all 3 cold-chain food safety items above to unlock pickup</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
