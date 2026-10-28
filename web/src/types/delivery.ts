import { z } from 'zod';

// Valid London Postcode Areas: E, EC, N, NW, SE, SW, W, WC, plus outer London: BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB
export const LONDON_POSTCODE_REGEX = /^(E|EC|N|NW|SE|SW|W|WC|BR|CR|DA|EN|HA|IG|KT|RM|SM|TW|UB)[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

export function isValidLondonPostcode(postcode: string): boolean {
  if (!postcode) return false;
  const cleaned = postcode.trim().toUpperCase();
  return LONDON_POSTCODE_REGEX.test(cleaned);
}

// Order Types & Roles
export type BookingType = 'pharmacy' | 'food' | 'parcel';
export type UserRole = 'customer' | 'client' | 'admin' | 'driver';
export type OrderStatus = 'booked' | 'collected' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
export type TimeSlotType = 'same_day_asap' | 'scheduled';

// Core Parcel Spec
export interface ParcelDetails {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  contentsDescription: string;
  isRestricted: boolean; // medicines, lithium batteries, dangerous items
  restrictedCategory?: string;
  ageRestricted?: boolean; // alcohol, tobacco, etc: recipient must meet AGE_RESTRICTION_MIN_AGE
  recipientDob?: string; // YYYY-MM-DD, given by the customer at booking
}

export const AGE_RESTRICTION_MIN_AGE = 25;

// Whole years between a YYYY-MM-DD date of birth and a given day
export function ageOnDate(dob: string, on: Date = new Date()): number {
  const [y, m, d] = dob.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  let age = on.getFullYear() - y;
  const birthdayPassed = on.getMonth() + 1 > m || (on.getMonth() + 1 === m && on.getDate() >= d);
  if (!birthdayPassed) age -= 1;
  return age;
}

// Driver's check at delivery: DOB must match the customer's and the person must be old enough
export interface AgeCheck {
  minAge: number;
  customerDob: string;
  verifiedAt?: string;
  verifiedByEmail?: string;
  verifiedDob?: string;
  verifiedAge?: number;
}

// Address Model
export interface AddressItem {
  id: string;
  userId?: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  lat?: number;
  lng?: number;
  label?: string; // 'Home', 'Office', 'HQ', 'Store'
}

// Unified Order Model
// A driver as listed for dispatch. Stored on users/{uid}; isAvailable defaults to available when unset.
export interface DriverProfile {
  uid: string;
  email: string;
  name?: string;
  isAvailable?: boolean;
}

// In-app notification for a driver, stored in notifications/{id}
export interface DriverNotification {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  orderId: string;
  read: boolean;
  createdAt: string;
}

export interface QuickzyOrder {
  id: string;
  userId: string;
  userEmail?: string;
  role: UserRole;
  type: BookingType;
  status: OrderStatus;
  pickupAddress: AddressItem;
  dropoffAddress: AddressItem;
  timeSlot: TimeSlotType;
  scheduledFor?: string; // ISO date string
  isSameDayCutoffExceeded: boolean;
  parcel?: ParcelDetails;
  /** Photo of the parcel taken at booking (compressed JPEG data URL) */
  parcelPhoto?: string;
  /** Present when the parcel is age-restricted; delivery needs a passing driver check */
  ageCheck?: AgeCheck;
  /** Latest position shared by the driver while out for delivery */
  driverLocation?: { lat: number; lng: number; accuracy?: number; updatedAt: string };
  /** Set when the driver could not deliver and returned the parcel to dispatch */
  returnInfo?: { reason: string; notes: string | null; returnedAt: string; returnedByEmail: string | null };
  /** Proof captured at handover */
  deliveryProof?: { lat?: number; lng?: number; capturedAt: string };
  specialNotes?: string;
  pricePence: number;
  priceGbp: number;
  createdAt: string;
  updatedAt: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverEmail?: string;
  invoiceId?: string;
  bulkImportId?: string;
  proofOfDeliveryPhoto?: string;
  handoverNotes?: string;
  deliveredAt?: string;
  activities?: {
    timestamp: string;
    action: string;
    actor: string;
    details?: string;
    location?: string;
  }[];
  notificationAlert?: string;
  estimatedMiles?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
}

// Payments: card via Stripe, or credit balance bought in advance
export type PaymentMethod = 'stripe' | 'credit';

// Customer module: a named customer with one or more saved London addresses
export interface CustomerRecord {
  id: string;
  ownerEmail: string;
  name: string;
  addresses: AddressItem[];
  createdAt: string;
  updatedAt: string;
}

// Bulk Import Record
export interface BulkImportRecord {
  id: string;
  clientId: string;
  filename: string;
  status: 'pending' | 'completed' | 'failed' | 'partial';
  rowCount: number;
  successCount: number;
  errorCount: number;
  errorLog: { row: number; reason: string }[];
  createdAt: string;
}

// Pricing calculation helper
export interface PriceQuote {
  baseFeePence: number;
  weightFeePence: number;
  distanceFeePence: number;
  subtotalPence: number;
  discountPence: number;
  totalPence: number;
  totalGbp: number;
  estimatedMiles: number;
}

// Same-Day Cutoff Logic: Daily 14:00 (2:00 PM London time)
export const SAME_DAY_CUTOFF_HOUR = 14;

// Instant same-day (ASAP) dispatch only covers routes up to this many road miles
export const SAME_DAY_MAX_MILES = 15;

export function evaluateSameDayCutoff(requestedDate?: Date): {
  isCutoffExceeded: boolean;
  effectiveDeliveryDate: string;
  cutoffMessage: string;
} {
  const now = requestedDate || new Date();
  const currentHour = now.getHours();
  const isAfterCutoff = currentHour >= SAME_DAY_CUTOFF_HOUR;

  const targetDate = new Date(now);
  if (isAfterCutoff) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const dateFormatted = targetDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return {
    isCutoffExceeded: isAfterCutoff,
    effectiveDeliveryDate: dateFormatted,
    cutoffMessage: isAfterCutoff
      ? `Same-day cutoff (14:00 GMT) has passed. Order scheduled for tomorrow (${dateFormatted}).`
      : `Eligible for Same-Day delivery today before 20:00.`,
  };
}

// Pricing is set separately for each category. Booking types are the categories.
export type PricingCategory = BookingType;

export const PRICING_CATEGORY_LABELS: Record<PricingCategory, string> = {
  pharmacy: 'Pharmacy',
  food: 'Food & Grocery',
  parcel: 'Parcel & Freight',
};

export interface CategoryPricing {
  basePence: number;
  perKgPence: number;
  perMilePence: number;
  /** Largest parcel accepted for this category; bigger parcels are refused */
  maxWeightKg: number;
  maxLengthCm: number;
  maxWidthCm: number;
  maxHeightCm: number;
  /** Discount applies when the subtotal is above this amount */
  discountThresholdPence: number;
  discountPercent: number;
}

export type ParcelPricingConfig = Record<PricingCategory, CategoryPricing>;

export const DEFAULT_PRICING_CONFIG: ParcelPricingConfig = {
  pharmacy: {
    basePence: 450, perKgPence: 100, perMilePence: 120,
    maxWeightKg: 10, maxLengthCm: 40, maxWidthCm: 30, maxHeightCm: 30,
    discountThresholdPence: 3000, discountPercent: 10,
  },
  food: {
    basePence: 400, perKgPence: 100, perMilePence: 110,
    maxWeightKg: 15, maxLengthCm: 50, maxWidthCm: 40, maxHeightCm: 40,
    discountThresholdPence: 3000, discountPercent: 10,
  },
  parcel: {
    basePence: 450, perKgPence: 150, perMilePence: 120,
    maxWeightKg: 30, maxLengthCm: 100, maxWidthCm: 60, maxHeightCm: 60,
    discountThresholdPence: 3000, discountPercent: 10,
  },
};

const CATEGORY_FIELDS: (keyof CategoryPricing)[] = [
  'basePence', 'perKgPence', 'perMilePence', 'maxWeightKg', 'maxLengthCm', 'maxWidthCm', 'maxHeightCm',
  'discountThresholdPence', 'discountPercent',
];

// Reads the stored settings. Older documents (single base fee and per-mile rate) and missing fields
// fall back to the defaults, so existing installs keep working until an admin saves the new metrics.
export function normalizePricingConfig(raw: unknown): ParcelPricingConfig {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const result = {} as ParcelPricingConfig;
  for (const category of Object.keys(DEFAULT_PRICING_CONFIG) as PricingCategory[]) {
    const fromStore = (source[category] && typeof source[category] === 'object' ? source[category] : {}) as Record<string, unknown>;
    const merged = { ...DEFAULT_PRICING_CONFIG[category] } as CategoryPricing;
    for (const field of CATEGORY_FIELDS) {
      const value = Number(fromStore[field]);
      if (fromStore[field] !== undefined && fromStore[field] !== null && Number.isFinite(value) && value >= 0) {
        merged[field] = value;
      }
    }
    result[category] = merged;
  }
  return result;
}

export interface ParcelMeasure {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

// Returns a message when the parcel is over the category limits, otherwise null
export function validateParcelLimits(
  type: PricingCategory,
  parcel: ParcelMeasure,
  config: ParcelPricingConfig = DEFAULT_PRICING_CONFIG
): string | null {
  const c = config[type];
  const label = PRICING_CATEGORY_LABELS[type];
  if (parcel.weightKg > c.maxWeightKg) return `${label} parcels can weigh up to ${c.maxWeightKg} kg (this one is ${parcel.weightKg} kg).`;
  if (parcel.lengthCm > c.maxLengthCm) return `${label} parcels can be up to ${c.maxLengthCm} cm long.`;
  if (parcel.widthCm > c.maxWidthCm) return `${label} parcels can be up to ${c.maxWidthCm} cm wide.`;
  if (parcel.heightCm > c.maxHeightCm) return `${label} parcels can be up to ${c.maxHeightCm} cm high.`;
  return null;
}

// Price = base + (weight x per kg) + (miles x per mile). If the subtotal is above the category threshold,
// the discount percentage is taken off. Example: 10 kg, 10 miles, base £3, £2/kg, £1/mile = £33 -> £29.70.
export function calculateDeliveryPrice(
  params: {
    type: BookingType;
    estimatedMiles?: number;
    weightKg?: number;
  },
  config: ParcelPricingConfig = DEFAULT_PRICING_CONFIG
): PriceQuote {
  const c = config[params.type];
  const miles = Math.max(1, Math.round((params.estimatedMiles || 1) * 100) / 100);
  const weight = Math.max(0, params.weightKg || 0);

  const baseFee = c.basePence;
  const weightFee = Math.round(weight * c.perKgPence);
  const distanceFee = Math.round(miles * c.perMilePence);
  const subtotal = baseFee + weightFee + distanceFee;
  const discount = subtotal > c.discountThresholdPence ? Math.round((subtotal * c.discountPercent) / 100) : 0;
  const totalPence = subtotal - discount;

  return {
    baseFeePence: baseFee,
    weightFeePence: weightFee,
    distanceFeePence: distanceFee,
    subtotalPence: subtotal,
    discountPence: discount,
    totalPence,
    totalGbp: Number((totalPence / 100).toFixed(2)),
    estimatedMiles: miles,
  };
}

// Zod Validation Schemas
export const AddressSchema = z.object({
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().default('London'),
  postcode: z
    .string()
    .min(5, 'Postcode is required')
    .refine(isValidLondonPostcode, {
      message: 'Must be a valid Greater London postcode (e.g. EC1A 1BB, N1 1QP, SW1A 1AA)',
    }),
  label: z.string().optional(),
});

export const ParcelSchema = z.object({
  weightKg: z.number().positive('Weight must be positive').max(30, 'Max weight is 30kg'),
  lengthCm: z.number().positive('Length must be positive'),
  widthCm: z.number().positive('Width must be positive'),
  heightCm: z.number().positive('Height must be positive'),
  contentsDescription: z.string().min(2, 'Description of contents is required'),
  isRestricted: z.boolean().default(false),
  restrictedCategory: z.string().optional(),
  ageRestricted: z.boolean().default(false),
  recipientDob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Recipient date of birth is required').optional(),
});

export const CreateOrderSchema = z.object({
  type: z.enum(['pharmacy', 'food', 'parcel']),
  pickupAddress: AddressSchema,
  dropoffAddress: AddressSchema,
  timeSlot: z.enum(['same_day_asap', 'scheduled']).default('same_day_asap'),
  scheduledFor: z.string().optional(),
  parcel: ParcelSchema.optional(),
  specialNotes: z.string().optional(),
  estimatedMiles: z.number().positive().max(200).optional(),
});

export const CsvRowSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  pickupLine1: z.string().min(3, 'Pickup address is required'),
  pickupPostcode: z.string().refine(isValidLondonPostcode, { message: 'Invalid London pickup postcode' }),
  dropoffLine1: z.string().min(3, 'Dropoff address is required'),
  dropoffPostcode: z.string().refine(isValidLondonPostcode, { message: 'Invalid London dropoff postcode' }),
  type: z.enum(['pharmacy', 'food', 'parcel']).default('parcel'),
  weightKg: z.coerce.number().positive('Weight must be positive').default(1),
  lengthCm: z.coerce.number().positive().default(20),
  widthCm: z.coerce.number().positive().default(15),
  heightCm: z.coerce.number().positive().default(10),
  contents: z.string().min(1, 'Contents description is required'),
  isRestricted: z.coerce.boolean().default(false),
});
