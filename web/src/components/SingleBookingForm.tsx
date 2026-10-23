'use client';

import React, { useState, useEffect } from 'react';
import {
  BookingType,
  TimeSlotType,
  AddressItem,
  calculateDeliveryPrice,
  evaluateSameDayCutoff,
  isValidLondonPostcode,
  QuickzyOrder,
} from '@/types/delivery';
import { createOrder } from '@/lib/orderService';
import {
  Pill,
  Utensils,
  Package,
  Clock,
  ShieldAlert,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Sparkles,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

interface SingleBookingFormProps {
  userId: string;
  userEmail: string;
  role: 'customer' | 'client' | 'admin' | 'driver';
  savedAddresses: AddressItem[];
  onOpenAddressBook: (mode: 'pickup' | 'dropoff') => void;
  onOrderCreated: (order: QuickzyOrder) => void;
  selectedPickupAddress?: AddressItem | null;
  selectedDropoffAddress?: AddressItem | null;
  /** Delivery stream locked to this user's profile (business clients). Admin can override. */
  profileDeliveryStream?: string | null;
}

export const SingleBookingForm: React.FC<SingleBookingFormProps> = ({
  userId,
  userEmail,
  role,
  savedAddresses,
  onOpenAddressBook,
  onOrderCreated,
  selectedPickupAddress,
  selectedDropoffAddress,
  profileDeliveryStream,
}) => {
  // Booking Type: pharmacy | food | parcel
  // Business clients are locked to their profile stream (set at signup).
  // Only admins can freely switch. Customers can also freely switch.
  const isBusinessClient = role === 'client';

  const lockedStream: BookingType | null =
    isBusinessClient && profileDeliveryStream
      ? (profileDeliveryStream as BookingType)
      : null;

  const [bookingType, setBookingType] = useState<BookingType>(
    lockedStream || (profileDeliveryStream as BookingType) || 'parcel'
  );

  // Sync if profileDeliveryStream changes after mount
  useEffect(() => {
    if (lockedStream) setBookingType(lockedStream);
  }, [lockedStream]);

  // Addresses
  const [pickupLine1, setPickupLine1] = useState(
    selectedPickupAddress?.line1 || 'Quickzy London Hub, 142 Upper St'
  );
  const [pickupPostcode, setPickupPostcode] = useState(selectedPickupAddress?.postcode || 'N1 1QP');

  const [dropoffLine1, setDropoffLine1] = useState(
    selectedDropoffAddress?.line1 || 'Flat 12, 10 Downing Street'
  );
  const [dropoffPostcode, setDropoffPostcode] = useState(selectedDropoffAddress?.postcode || 'SW1A 2AA');

  // Update whenever selected from AddressBook modal
  useEffect(() => {
    if (selectedPickupAddress) {
      setPickupLine1(selectedPickupAddress.line1);
      setPickupPostcode(selectedPickupAddress.postcode);
    }
  }, [selectedPickupAddress]);

  useEffect(() => {
    if (selectedDropoffAddress) {
      setDropoffLine1(selectedDropoffAddress.line1);
      setDropoffPostcode(selectedDropoffAddress.postcode);
    }
  }, [selectedDropoffAddress]);

  // Parcel & Payload Specs
  const [weightKg, setWeightKg] = useState(1.5);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(15);
  const [contentsDescription, setContentsDescription] = useState('Urgent London Package');
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictedCategory, setRestrictedCategory] = useState('Medicines & Therapeutics');

  // Time slot & Cutoff
  const [timeSlot, setTimeSlot] = useState<TimeSlotType>('same_day_asap');
  const [cutoffInfo, setCutoffInfo] = useState<{
    isCutoffExceeded: boolean;
    effectiveDeliveryDate: string;
    cutoffMessage: string;
  }>({
    isCutoffExceeded: false,
    effectiveDeliveryDate: 'Today',
    cutoffMessage: 'Eligible for Same-Day delivery today before 20:00.',
  });

  // Pricing & State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<QuickzyOrder | null>(null);

  useEffect(() => {
    setCutoffInfo(evaluateSameDayCutoff());
  }, []);

  const priceQuote = calculateDeliveryPrice({
    type: bookingType,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    isRestricted,
    estimatedMiles: 4.5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    // London Postcode validation
    if (!isValidLondonPostcode(pickupPostcode)) {
      setErrorMessage(`Pickup postcode '${pickupPostcode}' is outside Greater London.`);
      setIsSubmitting(false);
      return;
    }
    if (!isValidLondonPostcode(dropoffPostcode)) {
      setErrorMessage(`Dropoff postcode '${dropoffPostcode}' is outside Greater London.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const order = await createOrder(userId, userEmail, role, {
        type: bookingType,
        pickupAddress: {
          line1: pickupLine1,
          postcode: pickupPostcode.trim().toUpperCase(),
          city: 'London',
        },
        dropoffAddress: {
          line1: dropoffLine1,
          postcode: dropoffPostcode.trim().toUpperCase(),
          city: 'London',
        },
        timeSlot,
        parcel: {
          weightKg,
          lengthCm,
          widthCm,
          heightCm,
          contentsDescription,
          isRestricted,
          restrictedCategory: isRestricted ? restrictedCategory : undefined,
        },
      });

      setSuccessOrder(order);
      onOrderCreated(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          Booking Confirmed
        </span>
        <h3 className="text-2xl font-black text-white mt-3">Order #{successOrder.id}</h3>
        <p className="text-xs text-neutral-400 mt-1">
          Dispatched to Quickzy London Central Logistics Fleet
        </p>

        <div className="bg-neutral-950 rounded-xl p-4 my-6 text-left border border-neutral-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-400">Delivery Type:</span>
            <span className="font-bold text-white uppercase">{successOrder.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total Paid:</span>
            <span className="font-bold text-emerald-400">£{successOrder.priceGbp.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Status:</span>
            <span className="font-mono text-cyan-400 capitalize">{successOrder.status.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Scheduled:</span>
            <span className="text-neutral-300">{successOrder.scheduledFor}</span>
          </div>
        </div>

        <button
          onClick={() => setSuccessOrder(null)}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
        >
          Book Another Order
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Instant London Booking</span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              SAME-DAY
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Rapid point-to-point courier for Pharmacy, Food & Urgent Parcels across all London Boroughs
          </p>
        </div>

        {/* Same-Day Cutoff Indicator */}
        <div
          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
            cutoffInfo.isCutoffExceeded
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <div className="text-[11px] leading-tight text-right hidden sm:block">
            <p className="font-bold">{cutoffInfo.isCutoffExceeded ? 'Cutoff Exceeded' : 'Active Same-Day'}</p>
            <p className="text-[10px] opacity-80">14:00 GMT Cutoff</p>
          </div>
        </div>
      </div>

      {cutoffInfo.isCutoffExceeded && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{cutoffInfo.cutoffMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Category Switcher */}
      <div className="mt-6">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 block">
          1. Select Delivery Stream
          {lockedStream && (
            <span className="ml-2 text-amber-400 font-normal text-[11px] normal-case tracking-normal">
              Locked to your business profile ({lockedStream}) — contact admin to change
            </span>
          )}
        </label>
        <div className={`grid ${lockedStream ? 'grid-cols-1 max-w-sm' : 'grid-cols-3'} gap-3`}>
          {(!lockedStream || lockedStream === 'pharmacy') && (
            <button
              type="button"
              onClick={() => setBookingType('pharmacy')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                bookingType === 'pharmacy'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Pharmacy</p>
                <p className="text-[10px] opacity-70">Prescriptions & Medical</p>
              </div>
            </button>
          )}

          {(!lockedStream || lockedStream === 'food') && (
            <button
              type="button"
              onClick={() => setBookingType('food')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                bookingType === 'food'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Food & Groceries</p>
                <p className="text-[10px] opacity-70">Hot, Chilled, or Fresh</p>
              </div>
            </button>
          )}

          {(!lockedStream || lockedStream === 'parcel') && (
            <button
              type="button"
              onClick={() => setBookingType('parcel')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                bookingType === 'parcel'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Parcel & Freight</p>
                <p className="text-[10px] opacity-70">B2B / B2C Rapid Transit</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 2. Route & Address Book */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Pickup Address (London)
            </span>
            <button
              type="button"
              onClick={() => onOpenAddressBook('pickup')}
              className="text-[11px] font-semibold text-neutral-400 hover:text-emerald-400 underline"
            >
              Address Book
            </button>
          </div>
          <input
            type="text"
            required
            value={pickupLine1}
            onChange={(e) => setPickupLine1(e.target.value)}
            placeholder="Street Address Line 1"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            required
            value={pickupPostcode}
            onChange={(e) => setPickupPostcode(e.target.value.toUpperCase())}
            placeholder="Postcode (e.g. N1 1QP)"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Dropoff */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Drop-off Address (London)
            </span>
            <button
              type="button"
              onClick={() => onOpenAddressBook('dropoff')}
              className="text-[11px] font-semibold text-neutral-400 hover:text-cyan-400 underline"
            >
              Address Book
            </button>
          </div>
          <input
            type="text"
            required
            value={dropoffLine1}
            onChange={(e) => setDropoffLine1(e.target.value)}
            placeholder="Street Address Line 1"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            required
            value={dropoffPostcode}
            onChange={(e) => setDropoffPostcode(e.target.value.toUpperCase())}
            placeholder="Postcode (e.g. SW1A 2AA)"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* 3. Parcel Dimensions & Weight & Restricted Items */}
      <div className="mt-6 bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            3. Parcel Weight & Dimensions
          </h4>
          <span className="text-[10px] text-neutral-500">Max 30kg per delivery</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="30"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.1)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Length (cm)</label>
            <input
              type="number"
              min="5"
              value={lengthCm}
              onChange={(e) => setLengthCm(parseInt(e.target.value) || 5)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Width (cm)</label>
            <input
              type="number"
              min="5"
              value={widthCm}
              onChange={(e) => setWidthCm(parseInt(e.target.value) || 5)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Height (cm)</label>
            <input
              type="number"
              min="5"
              value={heightCm}
              onChange={(e) => setHeightCm(parseInt(e.target.value) || 5)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-neutral-400 block mb-1">Contents Description *</label>
          <input
            type="text"
            required
            value={contentsDescription}
            onChange={(e) => setContentsDescription(e.target.value)}
            placeholder="e.g. Diagnostic kit, artisan bread loaves, or confidential contracts"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Restricted Items Flag */}
        <div className="pt-2 border-t border-neutral-800/80">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRestricted}
              onChange={(e) => setIsRestricted(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 w-4 h-4"
            />
            <span className="text-xs font-semibold text-neutral-200">
              Parcel contains regulated or restricted items (Medicines, Lithium Batteries, Fragile Glass)
            </span>
          </label>

          {isRestricted && (
            <div className="mt-3 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Regulated Category</label>
                <select
                  value={restrictedCategory}
                  onChange={(e) => setRestrictedCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Medicines & Therapeutics">Medicines & Prescription Therapeutics</option>
                  <option value="Lithium Ion Batteries">Lithium Ion Batteries / Electronics</option>
                  <option value="Clinical Samples">Clinical Diagnostic Samples</option>
                  <option value="High-Value Fragile">High-Value Fine Fragile</option>
                </select>
              </div>
              <p className="text-[11px] text-emerald-400/90 self-center">
                ✓ Special compliance dispatch bag and verification protocol enabled (+£3.50 handling).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Time Slot & Summary Pricing */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Dispatch Speed:</span>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value as TimeSlotType)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="same_day_asap">Instant Same-Day ASAP (Within 90 mins)</option>
              <option value="scheduled">Scheduled Evening Slot (18:00 - 21:00)</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
            <span>Base: £{(priceQuote.baseFeePence / 100).toFixed(2)}</span>
            <span>•</span>
            <span>Distance: £{(priceQuote.distanceFeePence / 100).toFixed(2)}</span>
            {priceQuote.weightFeePence > 0 && (
              <>
                <span>•</span>
                <span>Weight: £{(priceQuote.weightFeePence / 100).toFixed(2)}</span>
              </>
            )}
            {priceQuote.restrictedHandlingFeePence > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400">Restricted Handling: £3.50</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-neutral-400">Total Price</p>
            <p className="text-2xl font-black text-emerald-400">£{priceQuote.totalGbp.toFixed(2)}</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isSubmitting ? 'Confirming...' : 'Book & Pay'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};
