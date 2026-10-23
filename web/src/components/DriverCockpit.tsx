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
  Package,
  Camera,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import { QuickzyOrder, OrderStatus } from '@/types/delivery';
import { updateOrderStatus } from '@/lib/orderService';

interface DriverCockpitProps {
  currentUserEmail?: string;
  assignedOrders?: QuickzyOrder[];
  onRefreshOrders?: () => void;
}

export const DriverCockpit: React.FC<DriverCockpitProps> = ({
  currentUserEmail,
  assignedOrders = [],
  onRefreshOrders,
}) => {
  const { activeTrip, verifyWaypointHandshake, setActiveRole, setSelectedMerchantId } = useApp();

  const [activeModalWaypointId, setActiveModalWaypointId] = useState<string | null>(null);
  const [deliveryProofModalOrder, setDeliveryProofModalOrder] = useState<QuickzyOrder | null>(null);
  const [proofPhotoData, setProofPhotoData] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('Left with recipient at doorstep.');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [coldChecklist, setColdChecklist] = useState({
    thermalBagReady: false,
    icePackActive: false,
    sealIntact: false,
  });

  // Filter orders assigned to this driver or active London parcel orders
  const driverParcels = assignedOrders.filter(
    (o) =>
      o.assignedDriverEmail === currentUserEmail ||
      (o.assignedDriverName && currentUserEmail && o.assignedDriverName.toLowerCase().includes(currentUserEmail.split('@')[0].toLowerCase())) ||
      o.status === 'out_for_delivery' ||
      o.status === 'collected'
  );

  const handleDriverStatusUpdate = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus, {
      driverName: currentUserEmail ? currentUserEmail.split('@')[0] : 'Quickzy Courier',
      driverEmail: currentUserEmail,
    });
    if (onRefreshOrders) onRefreshOrders();
  };

  const handleCompleteDeliveryWithProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryProofModalOrder) return;
    setIsSubmittingProof(true);

    await updateOrderStatus(deliveryProofModalOrder.id, 'delivered', {
      driverName: currentUserEmail ? currentUserEmail.split('@')[0] : 'Quickzy Courier',
      driverEmail: currentUserEmail,
      proofOfDeliveryPhoto: proofPhotoData || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
      handoverNotes: handoverNotes.trim() || 'Package handed over and verified.',
      location: `${deliveryProofModalOrder.dropoffAddress?.line1 || 'Destination'}, ${deliveryProofModalOrder.dropoffAddress?.postcode || ''}`,
    });

    setIsSubmittingProof(false);
    setDeliveryProofModalOrder(null);
    setProofPhotoData('');
    if (onRefreshOrders) onRefreshOrders();
  };

  const currentWp = activeTrip ? activeTrip.waypoints[activeTrip.currentWaypointIndex] : null;
  const isTripCompleted = activeTrip ? activeTrip.status === 'completed' : false;

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
                {activeTrip?.id || 'ACTIVE COURIER FLEET'}
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                {activeTrip?.driverVehicle || 'E-Cargo Bike & Rapid Van'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{activeTrip?.driverName || currentUserEmail || 'London Courier'}</h2>
            <p className="text-xs text-neutral-400">
              Assigned Route: {activeTrip?.waypoints.length || 0} Waypoints ({activeTrip?.totalDistanceKm || 0} km total)
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Real Firestore Parcels */}
      {driverParcels.length > 0 && (
        <div className="bg-neutral-900 rounded-3xl p-6 border border-emerald-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Assigned London Parcels ({driverParcels.length})</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              LIVE DISPATCH
            </span>
          </div>

          <div className="space-y-2.5">
            {driverParcels.map((parcel) => (
              <div
                key={parcel.id}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{parcel.id}</span>
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {parcel.type}
                    </span>
                    <span className="text-emerald-400 font-bold">£{parcel.priceGbp.toFixed(2)}</span>
                  </div>
                  <p className="text-neutral-400 mt-1">
                    <strong className="text-neutral-300">Pickup:</strong> {parcel.pickupAddress.line1} ({parcel.pickupAddress.postcode}) ➔{' '}
                    <strong className="text-neutral-300">Dropoff:</strong> {parcel.dropoffAddress.line1} ({parcel.dropoffAddress.postcode})
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {parcel.status === 'collected' && (
                    <button
                      onClick={() => handleDriverStatusUpdate(parcel.id, 'out_for_delivery')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs"
                    >
                      Start Delivery
                    </button>
                  )}
                  {parcel.status === 'out_for_delivery' && (
                    <button
                      onClick={() => setDeliveryProofModalOrder(parcel)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Complete with Photo Proof</span>
                    </button>
                  )}
                  {parcel.status === 'delivered' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                      </span>
                      {parcel.proofOfDeliveryPhoto && (
                        <span className="text-[10px] text-cyan-400 font-mono">Photo Proof Saved</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sequential Route Waypoints */}
      {activeTrip && activeTrip.waypoints && activeTrip.waypoints.length > 0 && (
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
      )}

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
                Align the merchant&apos;s tablet QR code within the frame to verify handover.
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

      {/* Proof of Delivery Photo & Handover Modal */}
      {deliveryProofModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="border rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-5"
            style={{
              background: 'var(--surface, #18181b)',
              borderColor: 'var(--card-border)',
              color: 'var(--foreground)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Proof of Handover & Delivery</h3>
                  <p className="text-xs text-neutral-400 font-mono">Order #{deliveryProofModalOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryProofModalOrder(null)}
                className="text-neutral-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteDeliveryWithProof} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Destination</span>
                <p className="font-bold text-neutral-200">
                  {deliveryProofModalOrder.dropoffAddress.line1}, {deliveryProofModalOrder.dropoffAddress.postcode}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Stream: <span className="uppercase text-emerald-400 font-bold">{deliveryProofModalOrder.type}</span>
                </p>
              </div>

              {/* Photo Upload / Camera Capture Simulator */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5 flex items-center justify-between">
                  <span>Photo of Doorstep / Handover</span>
                  <span className="text-emerald-400 font-normal text-[11px] flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" /> Required for Compliance
                  </span>
                </label>

                {proofPhotoData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 max-h-48">
                    <img src={proofPhotoData} alt="Proof" className="w-full object-cover max-h-48" />
                    <button
                      type="button"
                      onClick={() => setProofPhotoData('')}
                      className="absolute top-2 right-2 bg-neutral-900/90 text-red-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/50 rounded-2xl p-4 text-center space-y-2 transition bg-neutral-950/40">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-neutral-300 font-medium">Capture or upload photo of delivery location</p>
                    <div className="flex justify-center gap-2 pt-1">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[11px]">
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => setProofPhotoData(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setProofPhotoData(
                            'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-bold text-[11px] border border-emerald-500/30"
                      >
                        Use Sample Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Handover notes */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Handover Notes / Recipient Identity</label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Handed directly to pharmacist / Reception desk signed"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryProofModalOrder(null)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingProof ? 'Saving...' : 'Confirm Delivery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
