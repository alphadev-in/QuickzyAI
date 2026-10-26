'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { AGE_RESTRICTION_MIN_AGE, ageOnDate } from '@/types/delivery';
import { compressImageToDataUrl, getCurrentPosition } from '@/lib/media';
import { auth, db } from '@/lib/firebase';
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
  Bell,
  BellRing,
  Power,
} from 'lucide-react';
import { QuickzyOrder, OrderStatus, DriverNotification } from '@/types/delivery';
import {
  updateOrderStatus,
  subscribeToDriverNotifications,
  markNotificationRead,
  setDriverAvailability,
  updateDriverLocation,
} from '@/lib/orderService';

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
  const [proofDob, setProofDob] = useState('');
  const [proofError, setProofError] = useState('');
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [coldChecklist, setColdChecklist] = useState({
    thermalBagReady: false,
    icePackActive: false,
    sealIntact: false,
  });
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');

  // Live in-app notifications sent by dispatch when this driver is assigned an order
  useEffect(() => {
    if (!currentUserEmail) return;
    return subscribeToDriverNotifications(currentUserEmail, setNotifications);
  }, [currentUserEmail]);

  // Availability lives on the driver's user profile, so read it once the Firebase user is known
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.();
      if (!user) return;
      unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        setIsAvailable(snap.data()?.isAvailable !== false);
      });
    });
    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const toggleAvailability = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setAvailabilityError('Your sign-in has expired. Sign in again to change your availability.');
      return;
    }
    setAvailabilityError('');
    try {
      await setDriverAvailability(uid, !isAvailable);
    } catch (err: any) {
      setAvailabilityError(err?.message || 'Could not update availability');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = async (n: DriverNotification) => {
    if (!n.read) await markNotificationRead(n.id);
  };

  // Filter orders genuinely assigned to this specific driver
  // Only show orders where driver email matches OR driver name contains driver's username
  // Do NOT show all out_for_delivery orders — those belong to whoever was assigned
  const driverParcels = currentUserEmail
    ? assignedOrders.filter(
        (o) =>
          o.assignedDriverEmail === currentUserEmail ||
          (o.assignedDriverName &&
            o.assignedDriverName.toLowerCase().includes(currentUserEmail.split('@')[0].toLowerCase()))
      )
    : [];

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
    const order = deliveryProofModalOrder;
    setProofError('');

    if (!proofPhotoData) {
      setProofError('Take or upload a photo of the parcel at the delivery location before confirming.');
      return;
    }

    // Age-restricted: the DOB the driver reads from ID must be old enough and match the customer's
    let ageCheckUpdate: Record<string, unknown> | undefined;
    if (order.ageCheck) {
      const driverAge = proofDob ? ageOnDate(proofDob) : NaN;
      if (!proofDob || Number.isNaN(driverAge)) {
        setProofError('Enter the recipient date of birth from their ID.');
        return;
      }
      if (driverAge < order.ageCheck.minAge) {
        setProofError(`Recipient is under ${order.ageCheck.minAge}. Do not hand over this item.`);
        return;
      }
      if (proofDob !== order.ageCheck.customerDob) {
        setProofError("The date of birth does not match the one the customer gave at booking. Do not hand over this item.");
        return;
      }
      ageCheckUpdate = {
        ageCheck: {
          ...order.ageCheck,
          verifiedAt: new Date().toISOString(),
          verifiedByEmail: currentUserEmail || null,
          verifiedDob: proofDob,
          verifiedAge: driverAge,
        },
      };
    }

    setIsSubmittingProof(true);
    try {
      const position = await getCurrentPosition();
      await updateOrderStatus(order.id, 'delivered', {
        driverName: currentUserEmail ? currentUserEmail.split('@')[0] : 'Quickzy Courier',
        driverEmail: currentUserEmail,
        proofOfDeliveryPhoto: proofPhotoData,
        handoverNotes: handoverNotes.trim() || 'Package handed over and verified.',
        location: `${order.dropoffAddress?.line1 || 'Destination'}, ${order.dropoffAddress?.postcode || ''}`,
        extra: {
          deliveryProof: { ...(position ? { lat: position.lat, lng: position.lng } : {}), capturedAt: new Date().toISOString() },
          ...ageCheckUpdate,
        },
      });
    } catch (err: any) {
      setProofError(err?.message || 'Delivery could not be saved. Check your connection and try again.');
      return;
    } finally {
      setIsSubmittingProof(false);
    }

    setDeliveryProofModalOrder(null);
    setProofPhotoData('');
    setProofDob('');
    if (onRefreshOrders) onRefreshOrders();
  };

  // Live location: while sharing, the position is written onto the driver's active orders (throttled)
  const activeOrderIds = driverParcels
    .filter((o) => o.status === 'collected' || o.status === 'out_for_delivery')
    .map((o) => o.id);
  const activeOrderKey = activeOrderIds.join(',');

  useEffect(() => {
    if (!sharingLocation) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('This device cannot share location.');
      setSharingLocation(false);
      return;
    }
    let lastWrite = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastWrite < 15000) return;
        lastWrite = now;
        const ids = activeOrderKey ? activeOrderKey.split(',') : [];
        if (ids.length === 0) return;
        updateDriverLocation(ids, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }).catch((err) => setLocationError(err?.message || 'Could not share location'));
      },
      (err) => {
        setLocationError(err.message || 'Location permission was denied');
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharingLocation, activeOrderKey]);

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
                {driverParcels.length > 0 ? 'ACTIVE DISPATCH ASSIGNMENT' : 'COURIER STANDBY'}
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                {driverParcels.length > 0 ? `${driverParcels.length} Active Delivery ${driverParcels.length > 1 ? 'Jobs' : 'Job'}` : 'Awaiting Area Allocation'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{currentUserEmail || 'London Courier'}</h2>
            <p className="text-xs text-neutral-400">
              {driverParcels.length > 0
                ? `${driverParcels.length} live assigned order(s) ready for collection / delivery.`
                : 'No active orders assigned yet. Orders will appear here once allocated by dispatch.'}
            </p>
          </div>
        </div>
      </div>

      {/* Availability and dispatch notifications */}
      <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Availability</p>
            <p className="text-sm text-white">
              {isAvailable ? 'You are available for dispatch.' : 'You are off duty. Dispatch will not assign you new orders.'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              isAvailable
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isAvailable ? 'Go off duty' : 'Go available'}
          </button>
        </div>
        {availabilityError && <p className="text-xs text-red-400">{availabilityError}</p>}

        <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Live location</p>
            <p className="text-sm text-white">
              {sharingLocation
                ? activeOrderIds.length > 0
                  ? `Sharing with ${activeOrderIds.length} active order(s). Updates about every 15 seconds.`
                  : 'Sharing is on. It will update when you have an active order.'
                : 'Off. Turn this on while you are out so the customer can see your progress.'}
            </p>
            {locationError && <p className="text-xs text-red-400 mt-1">{locationError}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              setLocationError('');
              setSharingLocation((v) => !v);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              sharingLocation ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950'
            }`}
          >
            {sharingLocation ? 'Stop sharing' : 'Share my location'}
          </button>
        </div>

        <div className="pt-4 border-t border-neutral-800 space-y-2">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            {unreadCount > 0 ? <BellRing className="w-3.5 h-3.5 text-amber-400" /> : <Bell className="w-3.5 h-3.5" />}
            Notifications {unreadCount > 0 && <span className="text-amber-400">({unreadCount} new)</span>}
          </p>
          {notifications.length === 0 ? (
            <p className="text-xs text-neutral-500">No notifications yet. You will be alerted here when an order is assigned to you.</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                  n.read ? 'bg-neutral-950 border-neutral-800 text-neutral-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                }`}
              >
                <span className="font-bold block">{n.title}</span>
                <span className="block mt-0.5">{n.message}</span>
                <span className="block mt-1 text-[10px] text-neutral-500">{new Date(n.createdAt).toLocaleString('en-GB')}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Empty State when no assigned orders */}
      {driverParcels.length === 0 && (!activeTrip || activeTrip.waypoints.length === 0) && (
        <div className="bg-neutral-900/60 rounded-3xl p-10 border border-neutral-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">No Assigned Orders Yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Your courier console is in live standby mode. When the admin or dispatch assigns London orders by postcode area, they will appear here live with pickup and delivery details.
          </p>
        </div>
      )}

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
                    <p className="text-xs text-neutral-300 font-medium">Photo of the parcel at the delivery location (required)</p>
                    <div className="flex justify-center gap-2 pt-1">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[11px]">
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setProofError('');
                            try {
                              setProofPhotoData(await compressImageToDataUrl(file));
                            } catch (err: any) {
                              setProofError(err?.message || 'Could not read that photo');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Age check for age-restricted items */}
              {deliveryProofModalOrder.ageCheck && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <p className="text-xs font-bold text-amber-300">
                    Age-restricted item. Check the recipient&apos;s ID and enter their date of birth. They must be {AGE_RESTRICTION_MIN_AGE} or over.
                  </p>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={proofDob}
                    onChange={(e) => setProofDob(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {proofError && <p className="text-xs text-red-400">{proofError}</p>}

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
