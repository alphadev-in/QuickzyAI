'use client';

import React, { useEffect, useState } from 'react';
import {
  BookingType,
  TimeSlotType,
  AddressItem,
  CustomerRecord,
  QuickzyOrder,
  ParcelPricingConfig,
  DEFAULT_PRICING_CONFIG,
  PaymentMethod,
  calculateDeliveryPrice,
  evaluateSameDayCutoff,
  isValidLondonPostcode,
} from '@/types/delivery';
import { createOrder, fetchPricingConfig } from '@/lib/orderService';
import { fetchRouteMiles } from '@/lib/routeMiles';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import {
  Pill,
  Utensils,
  Package,
  Clock,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Users,
  ShoppingBasket,
} from 'lucide-react';

interface SingleBookingFormProps {
  userId: string;
  userEmail: string;
  displayName?: string;
  role: 'customer' | 'client' | 'admin' | 'driver';
  savedAddresses: AddressItem[];
  customers: CustomerRecord[];
  creditBalancePence: number;
  onOpenAddressBook: (mode: 'pickup' | 'dropoff') => void;
  onOrdersCreated: (orders: QuickzyOrder[]) => void;
  onCreditChanged: () => void;
  selectedPickupAddress?: AddressItem | null;
  selectedDropoffAddress?: AddressItem | null;
  /** Delivery stream locked to this user's profile (business clients). Admin can override. */
  profileDeliveryStream?: string | null;
}

// One job in the basket. Miles and price are fixed when the job is added.
interface BasketItem {
  key: string;
  type: BookingType;
  pickupLine1: string;
  pickupPostcode: string;
  dropoffLine1: string;
  dropoffPostcode: string;
  timeSlot: TimeSlotType;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  contentsDescription: string;
  isRestricted: boolean;
  restrictedCategory: string;
  estimatedMiles: number;
  basePence: number;
  distancePence: number;
  totalPence: number;
}

const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const SingleBookingForm: React.FC<SingleBookingFormProps> = ({
  userId,
  userEmail,
  displayName,
  role,
  savedAddresses,
  customers,
  creditBalancePence,
  onOpenAddressBook,
  onOrdersCreated,
  onCreditChanged,
  selectedPickupAddress,
  selectedDropoffAddress,
  profileDeliveryStream,
}) => {
  // Business clients are locked to their profile stream (set at signup).
  const isBusinessClient = role === 'client';
  const lockedStream: BookingType | null =
    isBusinessClient && profileDeliveryStream ? (profileDeliveryStream as BookingType) : null;

  const [bookingType, setBookingType] = useState<BookingType>(
    lockedStream || (profileDeliveryStream as BookingType) || 'parcel'
  );

  useEffect(() => {
    if (lockedStream) setBookingType(lockedStream);
  }, [lockedStream]);

  // Current job fields
  const [pickupLine1, setPickupLine1] = useState(selectedPickupAddress?.line1 || 'Quickzy London Hub, 142 Upper St');
  const [pickupPostcode, setPickupPostcode] = useState(selectedPickupAddress?.postcode || 'N1 1QP');
  const [dropoffLine1, setDropoffLine1] = useState(selectedDropoffAddress?.line1 || 'Flat 12, 10 Downing Street');
  const [dropoffPostcode, setDropoffPostcode] = useState(selectedDropoffAddress?.postcode || 'SW1A 2AA');
  const [customerId, setCustomerId] = useState('');

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

  const [weightKg, setWeightKg] = useState(1.5);
  const [lengthCm, setLengthCm] = useState(25);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(15);
  const [contentsDescription, setContentsDescription] = useState('Urgent London Package');
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictedCategory, setRestrictedCategory] = useState('Medicines & Therapeutics');
  const [timeSlot, setTimeSlot] = useState<TimeSlotType>('same_day_asap');

  const [cutoffInfo, setCutoffInfo] = useState({
    isCutoffExceeded: false,
    effectiveDeliveryDate: 'Today',
    cutoffMessage: 'Eligible for Same-Day delivery today before 20:00.',
  });

  const [pricingConfig, setPricingConfig] = useState<ParcelPricingConfig>(DEFAULT_PRICING_CONFIG);

  // Basket & checkout state
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paidOrders, setPaidOrders] = useState<QuickzyOrder[] | null>(null);
  const [isCreatingOrders, setIsCreatingOrders] = useState(false);

  useEffect(() => {
    setCutoffInfo(evaluateSameDayCutoff());
    fetchPricingConfig().then((cfg) => {
      if (cfg) setPricingConfig(cfg);
    });
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const applyCustomerAddress = (addressId: string) => {
    const addr = selectedCustomer?.addresses.find((a) => a.id === addressId);
    if (addr) {
      setDropoffLine1(addr.line1);
      setDropoffPostcode(addr.postcode);
    }
  };

  const resetJobFields = () => {
    setDropoffLine1('');
    setDropoffPostcode('');
    setCustomerId('');
    setContentsDescription(bookingType === 'pharmacy' ? '' : 'Urgent London Package');
    setIsRestricted(false);
  };

  // Calculate road miles for this job, then price it on base + per-mile only
  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidLondonPostcode(pickupPostcode)) {
      setErrorMessage(`Pickup postcode '${pickupPostcode}' is outside Greater London.`);
      return;
    }
    if (!isValidLondonPostcode(dropoffPostcode)) {
      setErrorMessage(`Dropoff postcode '${dropoffPostcode}' is outside Greater London.`);
      return;
    }

    setIsAddingJob(true);
    try {
      const [route] = await fetchRouteMiles([
        { pickupPostcode: pickupPostcode.trim(), dropoffPostcode: dropoffPostcode.trim() },
      ]);
      if (route?.miles == null) {
        setErrorMessage(route?.error || 'Could not calculate the route distance.');
        return;
      }

      const quote = calculateDeliveryPrice({ type: bookingType, estimatedMiles: route.miles }, pricingConfig);

      setBasket((prev) => [
        ...prev,
        {
          key: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: bookingType,
          pickupLine1,
          pickupPostcode: pickupPostcode.trim().toUpperCase(),
          dropoffLine1,
          dropoffPostcode: dropoffPostcode.trim().toUpperCase(),
          timeSlot,
          weightKg,
          lengthCm,
          widthCm,
          heightCm,
          contentsDescription,
          isRestricted,
          restrictedCategory,
          estimatedMiles: quote.estimatedMiles,
          basePence: quote.baseFeePence,
          distancePence: quote.distanceFeePence,
          totalPence: quote.totalPence,
        },
      ]);
      resetJobFields();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not add this job.');
    } finally {
      setIsAddingJob(false);
    }
  };

  const removeJob = (key: string) => setBasket((prev) => prev.filter((j) => j.key !== key));

  const basketTotalPence = basket.reduce((sum, j) => sum + j.totalPence, 0);

  // Runs after the payment has succeeded (card or credit). Creates one order per basket job.
  const handlePaid = async (payment: { method: PaymentMethod; reference: string }) => {
    setIsCreatingOrders(true);
    setErrorMessage('');
    try {
      const created: QuickzyOrder[] = [];
      for (const job of basket) {
        const order = await createOrder(
          userId,
          userEmail,
          role,
          {
            type: job.type,
            pickupAddress: { line1: job.pickupLine1, postcode: job.pickupPostcode, city: 'London' },
            dropoffAddress: { line1: job.dropoffLine1, postcode: job.dropoffPostcode, city: 'London' },
            timeSlot: job.timeSlot,
            estimatedMiles: job.estimatedMiles,
            parcel: {
              weightKg: job.weightKg,
              lengthCm: job.lengthCm,
              widthCm: job.widthCm,
              heightCm: job.heightCm,
              contentsDescription: job.contentsDescription,
              isRestricted: job.isRestricted,
              restrictedCategory: job.isRestricted ? job.restrictedCategory : undefined,
            },
          },
          pricingConfig,
          displayName,
          payment
        );
        created.push(order);
      }

      setPaidOrders(created);
      setBasket([]);
      setCheckoutOpen(false);
      onOrdersCreated(created);
      onCreditChanged();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment received but orders could not be created. Contact support with your payment reference.');
    } finally {
      setIsCreatingOrders(false);
    }
  };

  // ---- Success: payment received, driver on the way ----
  if (paidOrders) {
    return (
      <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          Payment Received
        </span>
        <h3 className="text-xl font-black text-white mt-3">
          Your order{paidOrders.length > 1 ? 's are' : ' is'} ready
        </h3>
        <p className="text-sm text-neutral-300 mt-2">
          Our driver will take {paidOrders.length > 1 ? 'your deliveries' : 'your delivery'} and deliver soon.
        </p>

        <div className="bg-neutral-950 rounded-xl p-4 my-6 text-left border border-neutral-800 space-y-2 text-xs">
          {paidOrders.map((o) => (
            <div key={o.id} className="flex justify-between gap-3">
              <span className="font-mono text-neutral-300">#{o.id}</span>
              <span className="text-neutral-400 truncate">
                {o.dropoffAddress.postcode} · {o.estimatedMiles?.toFixed(1)} mi
              </span>
              <span className="font-bold text-emerald-400">£{o.priceGbp.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPaidOrders(null)}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition"
        >
          Book Another Delivery
        </button>
      </div>
    );
  }

  const cutoffBanner = cutoffInfo.isCutoffExceeded;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Instant London Booking</span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              SAME-DAY
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Add one or more deliveries to your basket, then pay once. Priced by road miles.
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
            cutoffBanner
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <div className="text-[11px] leading-tight text-right hidden sm:block">
            <p className="font-bold">{cutoffBanner ? 'Cutoff Exceeded' : 'Active Same-Day'}</p>
            <p className="text-[10px] opacity-80">14:00 GMT Cutoff</p>
          </div>
        </div>
      </div>

      {cutoffBanner && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{cutoffInfo.cutoffMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Stream */}
      <div>
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
            <StreamButton active={bookingType === 'pharmacy'} onClick={() => setBookingType('pharmacy')} icon={<Pill className="w-5 h-5" />} tone="emerald" title="Pharmacy" sub="Prescriptions & Medical" />
          )}
          {(!lockedStream || lockedStream === 'food') && (
            <StreamButton active={bookingType === 'food'} onClick={() => setBookingType('food')} icon={<Utensils className="w-5 h-5" />} tone="orange" title="Food & Groceries" sub="Hot, Chilled, or Fresh" />
          )}
          {(!lockedStream || lockedStream === 'parcel') && (
            <StreamButton active={bookingType === 'parcel'} onClick={() => setBookingType('parcel')} icon={<Package className="w-5 h-5" />} tone="cyan" title="Parcel & Freight" sub="B2B / B2C Rapid Transit" />
          )}
        </div>
      </div>

      {/* 2. Job form */}
      <form onSubmit={handleAddJob} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pickup Address (London)
              </span>
              <button type="button" onClick={() => onOpenAddressBook('pickup')} className="text-[11px] font-semibold text-neutral-400 hover:text-emerald-400 underline">
                Address Book
              </button>
            </div>
            <input type="text" required value={pickupLine1} onChange={(e) => setPickupLine1(e.target.value)} placeholder="Street Address Line 1" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-emerald-500" />
            <input type="text" required value={pickupPostcode} onChange={(e) => setPickupPostcode(e.target.value.toUpperCase())} placeholder="Postcode (e.g. N1 1QP)" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Dropoff */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Drop-off Address (London)
              </span>
              <button type="button" onClick={() => onOpenAddressBook('dropoff')} className="text-[11px] font-semibold text-neutral-400 hover:text-cyan-400 underline">
                Address Book
              </button>
            </div>

            {customers.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  disabled={!selectedCustomer}
                  defaultValue=""
                  onChange={(e) => applyCustomerAddress(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select address…</option>
                  {selectedCustomer?.addresses.map((a) => (
                    <option key={a.id} value={a.id}>{a.label || 'Address'} · {a.postcode}</option>
                  ))}
                </select>
              </div>
            )}

            <input type="text" required value={dropoffLine1} onChange={(e) => setDropoffLine1(e.target.value)} placeholder="Street Address Line 1" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-cyan-500" />
            <input type="text" required value={dropoffPostcode} onChange={(e) => setDropoffPostcode(e.target.value.toUpperCase())} placeholder="Postcode (e.g. SW1A 2AA)" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        {/* 3. Parcel details (weight & dimensions are information only, not charged) */}
        {bookingType !== 'pharmacy' ? (
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">3. Parcel Weight &amp; Dimensions</h4>
              <span className="text-[10px] text-neutral-500">Max 30kg per delivery</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberField label="Weight (kg)" value={weightKg} step="0.1" min="0.1" max="30" onChange={(v) => setWeightKg(v || 0.1)} />
              <NumberField label="Length (cm)" value={lengthCm} min="5" onChange={(v) => setLengthCm(v || 5)} />
              <NumberField label="Width (cm)" value={widthCm} min="5" onChange={(v) => setWidthCm(v || 5)} />
              <NumberField label="Height (cm)" value={heightCm} min="5" onChange={(v) => setHeightCm(v || 5)} />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Contents Description *</label>
              <input type="text" required value={contentsDescription} onChange={(e) => setContentsDescription(e.target.value)} placeholder="e.g. Diagnostic kit, artisan bread loaves, or confidential contracts" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <RestrictedToggle checked={isRestricted} onChange={setIsRestricted} label="Parcel contains regulated or restricted items (Medicines, Lithium Batteries, Fragile Glass)" category={restrictedCategory} onCategory={setRestrictedCategory} />
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">3. Pharmacy Delivery Details</h4>
            </div>
            <p className="text-[11px] text-neutral-400">
              Pharmacy parcels are handled under chain-of-custody protocol. Priced per mile only.
            </p>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Prescription / Contents Description *</label>
              <input type="text" required value={contentsDescription} onChange={(e) => setContentsDescription(e.target.value)} placeholder="e.g. Prescription bag for patient John Smith, NHS ref 12345" className="w-full bg-neutral-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRestricted} onChange={(e) => setIsRestricted(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 w-4 h-4" />
              <span className="text-xs font-semibold text-neutral-200">Contains controlled substances or requires cold-chain</span>
            </label>
          </div>
        )}

        {/* 4. Dispatch speed + add to basket */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Dispatch Speed:</span>
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlotType)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none">
              <option value="same_day_asap">Instant Same-Day ASAP (Within 90 mins)</option>
              <option value="scheduled">Scheduled Evening Slot (18:00 - 21:00)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isAddingJob}
            className="py-2.5 px-5 rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isAddingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{isAddingJob ? 'Calculating miles...' : 'Add Delivery to Basket'}</span>
          </button>
        </div>
      </form>

      {/* 5. Basket */}
      {basket.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBasket className="w-4 h-4 text-emerald-400" /> Basket ({basket.length})
          </h4>
          <div className="space-y-2">
            {basket.map((job, i) => (
              <div key={job.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">
                    {i + 1}. {job.pickupPostcode} → {job.dropoffPostcode}
                  </p>
                  <p className="text-neutral-400 truncate">
                    {job.type.toUpperCase()} · {job.estimatedMiles.toFixed(2)} mi · Base {formatGbp(job.basePence)} + Distance {formatGbp(job.distancePence)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-emerald-400">{formatGbp(job.totalPence)}</span>
                  <button type="button" onClick={() => removeJob(job.key)} className="text-neutral-500 hover:text-red-400" aria-label="Remove delivery">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-400">Basket total</span>
            <span className="text-2xl font-black text-emerald-400">{formatGbp(basketTotalPence)}</span>
          </div>

          {!checkoutOpen ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              disabled={isCreatingOrders}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-sm transition shadow-lg shadow-emerald-500/20"
            >
              Confirm &amp; Pay {formatGbp(basketTotalPence)}
            </button>
          ) : (
            <div className="space-y-3">
              {isCreatingOrders ? (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-300 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Payment received. Creating your orders...
                </div>
              ) : (
                <CheckoutPanel
                  amountPence={basketTotalPence}
                  description={`Quickzy London delivery x${basket.length}`}
                  customerEmail={userEmail}
                  purpose="order"
                  creditBalancePence={creditBalancePence}
                  onPaid={handlePaid}
                />
              )}
              {!isCreatingOrders && (
                <button type="button" onClick={() => setCheckoutOpen(false)} className="text-[11px] text-neutral-400 hover:text-white underline">
                  Back to basket
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {customers.length === 0 && (
        <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Add customers in the Customers tab to pick drop-off addresses faster.
        </p>
      )}
    </div>
  );
};

const StreamButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone: 'emerald' | 'orange' | 'cyan';
  title: string;
  sub: string;
}> = ({ active, onClick, icon, tone, title, sub }) => {
  const toneClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
        active
          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${toneClasses}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] opacity-70">{sub}</p>
      </div>
    </button>
  );
};

const NumberField: React.FC<{
  label: string;
  value: number;
  step?: string;
  min: string;
  max?: string;
  onChange: (v: number) => void;
}> = ({ label, value, step, min, max, onChange }) => (
  <div>
    <label className="text-[11px] text-neutral-400 block mb-1">{label}</label>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
    />
  </div>
);

const RestrictedToggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  category: string;
  onCategory: (v: string) => void;
}> = ({ checked, onChange, label, category, onCategory }) => (
  <div className="pt-2 border-t border-neutral-800/80">
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 w-4 h-4" />
      <span className="text-xs font-semibold text-neutral-200">{label}</span>
    </label>
    {checked && (
      <div className="mt-3 pl-6">
        <label className="text-[11px] text-neutral-400 block mb-1">Regulated Category</label>
        <select value={category} onChange={(e) => onCategory(e.target.value)} className="w-full sm:w-1/2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
          <option value="Medicines & Therapeutics">Medicines &amp; Prescription Therapeutics</option>
          <option value="Lithium Ion Batteries">Lithium Ion Batteries / Electronics</option>
          <option value="Clinical Samples">Clinical Diagnostic Samples</option>
          <option value="High-Value Fragile">High-Value Fine Fragile</option>
        </select>
      </div>
    )}
  </div>
);
