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
export type OrderStatus = 'booked' | 'collected' | 'out_for_delivery' | 'delivered' | 'cancelled';
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
  /** Present when the parcel is age-restricted; delivery needs a passing driver check */
  ageCheck?: AgeCheck;
  /** Latest position shared by the driver while out for delivery */
  driverLocation?: { lat: number; lng: number; accuracy?: number; updatedAt: string };
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
  distanceFeePence: number;
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

export interface ParcelPricingConfig {
  baseFeePence: number;
  perMilePence: number;
}

export const DEFAULT_PRICING_CONFIG: ParcelPricingConfig = {
  baseFeePence: 450,
  perMilePence: 120,
};

// Base + per-mile pricing only. No weight, volumetric or restricted-item surcharges.
export function calculateDeliveryPrice(
  params: {
    type: BookingType;
    estimatedMiles?: number;
  },
  config: ParcelPricingConfig = DEFAULT_PRICING_CONFIG
): PriceQuote {
  const miles = Math.max(1, Math.round((params.estimatedMiles || 1) * 100) / 100);
  let baseFee = config.baseFeePence;

  if (params.type === 'pharmacy') {
    baseFee = Math.round(config.baseFeePence * 1.2);
  } else if (params.type === 'food') {
    baseFee = Math.round(config.baseFeePence * 0.9);
  }

  const distanceFee = Math.round(miles * config.perMilePence);
  const totalPence = baseFee + distanceFee;

  return {
    baseFeePence: baseFee,
    distanceFeePence: distanceFee,
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
