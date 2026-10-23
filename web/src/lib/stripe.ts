import Stripe from 'stripe';

// Server-only. Reads STRIPE_SECRET_KEY from web/.env.local (never exposed to the browser).
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to web/.env.local and restart the server.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const MIN_PAYMENT_PENCE = 50;
export const MAX_PAYMENT_PENCE = 1_000_000;
