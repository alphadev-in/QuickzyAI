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
  weightFeePence: number;
  volumetricFeePence: number;
  restrictedHandlingFeePence: number;
  totalPence: number;
  totalGbp: number;
  estimatedMiles: number;
}

// Same-Day Cutoff Logic: Daily 14:00 (2:00 PM London time)
export const SAME_DAY_CUTOFF_HOUR = 14;

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
  weightPerKgAbove2KgPence: number;
  volumetricRatePence: number;
  restrictedHandlingPence: number;
}

export const DEFAULT_PRICING_CONFIG: ParcelPricingConfig = {
  baseFeePence: 450,
  perMilePence: 120,
  weightPerKgAbove2KgPence: 50,
  volumetricRatePence: 40,
  restrictedHandlingPence: 350,
};

// Calculate delivery price based on London zones / distance and parcel specs
export function calculateDeliveryPrice(
  params: {
    type: BookingType;
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    isRestricted?: boolean;
    estimatedMiles?: number;
  },
  config: ParcelPricingConfig = DEFAULT_PRICING_CONFIG
): PriceQuote {
  const miles = Math.max(1, params.estimatedMiles || 3.5);
  let baseFee = config.baseFeePence;

  if (params.type === 'pharmacy') {
    baseFee = Math.round(config.baseFeePence * 1.2);
  } else if (params.type === 'food') {
    baseFee = Math.round(config.baseFeePence * 0.9);
  }

  // Dynamic distance fee per mile
  const distanceFee = Math.round(miles * config.perMilePence);

  // Weight fee: per kg above 2kg
  const weight = params.weightKg || 1;
  const weightFee = weight > 2 ? Math.round((weight - 2) * config.weightPerKgAbove2KgPence) : 0;

  // Volumetric check: (L x W x H) / 5000
  const l = params.lengthCm || 10;
  const w = params.widthCm || 10;
  const h = params.heightCm || 10;
  const volumetricWeight = (l * w * h) / 5000;
  const volumetricFee = volumetricWeight > 3 ? Math.round((volumetricWeight - 3) * config.volumetricRatePence) : 0;

  // Restricted items verification & compliance fee
  const restrictedHandlingFee = params.isRestricted ? config.restrictedHandlingPence : 0;

  const totalPence = baseFee + distanceFee + weightFee + volumetricFee + restrictedHandlingFee;

  return {
    baseFeePence: baseFee,
    distanceFeePence: distanceFee,
    weightFeePence: weightFee,
    volumetricFeePence: volumetricFee,
    restrictedHandlingFeePence: restrictedHandlingFee,
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
});

export const CreateOrderSchema = z.object({
  type: z.enum(['pharmacy', 'food', 'parcel']),
  pickupAddress: AddressSchema,
  dropoffAddress: AddressSchema,
  timeSlot: z.enum(['same_day_asap', 'scheduled']).default('same_day_asap'),
  scheduledFor: z.string().optional(),
  parcel: ParcelSchema.optional(),
  specialNotes: z.string().optional(),
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
