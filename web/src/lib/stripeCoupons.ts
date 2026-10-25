import { getStripe, MIN_PAYMENT_PENCE } from '@/lib/stripe';

// Coupons for credit top-ups. The customer pays (credit - discount) by card and receives the full
// credit amount. Stripe promotion codes are the source of truth; the discount is recalculated on the
// server for both the preview and the payment, so the browser can't pick its own discount.

/** A code the customer can't use. Shown to them as-is. */
export class PromoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromoError';
  }
}

export interface PromoCoupon {
  percent_off?: number | null;
  amount_off?: number | null;
  currency?: string | null;
}

export interface PromoData {
  id: string;
  code: string;
  active: boolean;
  expires_at?: number | null;
  max_redemptions?: number | null;
  times_redeemed: number;
  restrictions?: { minimum_amount?: number | null; minimum_amount_currency?: string | null };
  coupon: PromoCoupon;
}

export interface CreditTopUpQuote {
  creditPence: number;
  discountPence: number;
  chargePence: number;
  promotionCodeId?: string;
  promotionCode?: string;
  label?: string;
}

/**
 * Pure rules: given a promotion and the credit amount, return the discount and card charge.
 * `nowSeconds` is injected so the expiry rule can be tested.
 */
export function computeCreditCharge(creditPence: number, promo: PromoData, nowSeconds: number): Omit<CreditTopUpQuote, 'creditPence'> {
  if (!promo.active) throw new PromoError('This code is no longer active.');
  if (promo.expires_at && promo.expires_at <= nowSeconds) throw new PromoError('This code has expired.');
  if (promo.max_redemptions != null && promo.times_redeemed >= promo.max_redemptions) {
    throw new PromoError('This code has already been fully used.');
  }

  const minimum = promo.restrictions?.minimum_amount;
  if (minimum && creditPence < minimum) {
    throw new PromoError(`This code needs a top-up of at least £${(minimum / 100).toFixed(2)}.`);
  }

  const coupon = promo.coupon;
  let discountPence = 0;
  if (coupon.percent_off) {
    discountPence = Math.round((creditPence * coupon.percent_off) / 100);
  } else if (coupon.amount_off) {
    if (coupon.currency && coupon.currency.toLowerCase() !== 'gbp') {
      throw new PromoError('This code cannot be used for GBP payments.');
    }
    discountPence = Math.min(coupon.amount_off, creditPence);
  } else {
    throw new PromoError('This code does not give a discount.');
  }

  const chargePence = creditPence - discountPence;
  if (chargePence < MIN_PAYMENT_PENCE) {
    throw new PromoError('This code makes the card payment too small. Choose a larger top-up amount.');
  }

  const label = coupon.percent_off ? `${coupon.percent_off}% off` : `£${((coupon.amount_off || 0) / 100).toFixed(2)} off`;
  return { discountPence, chargePence, label, promotionCodeId: promo.id, promotionCode: promo.code };
}

/** Looks up an active Stripe promotion code by its text (case-insensitive) */
async function fetchPromotion(code: string): Promise<PromoData> {
  const stripe = getStripe();
  const list = await stripe.promotionCodes.list({
    code: code.trim(),
    active: true,
    limit: 1,
    expand: ['data.promotion.coupon'],
  });
  const found = list.data[0] as any;
  if (!found) throw new PromoError('That code is not valid.');

  // Newer Stripe API versions nest the coupon under `promotion`; older ones use `coupon` directly
  const coupon = found.promotion?.coupon ?? found.coupon;
  if (!coupon || typeof coupon === 'string') throw new PromoError('That code is not valid.');

  return {
    id: found.id,
    code: found.code,
    active: found.active,
    expires_at: found.expires_at,
    max_redemptions: found.max_redemptions,
    times_redeemed: found.times_redeemed ?? 0,
    restrictions: found.restrictions,
    coupon,
  };
}

/** Full quote for a top-up: the credit amount plus an optional coupon code */
export async function quoteCreditTopUp(creditPence: number, code?: string): Promise<CreditTopUpQuote> {
  if (!code || !code.trim()) {
    return { creditPence, discountPence: 0, chargePence: creditPence };
  }
  const promo = await fetchPromotion(code);
  const rules = computeCreditCharge(creditPence, promo, Math.floor(Date.now() / 1000));
  return { creditPence, ...rules };
}
