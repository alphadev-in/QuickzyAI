import Stripe from 'stripe';

// Server-only. STRIPE_SECRET_KEY comes from the environment:
// Firebase App Hosting (Settings > Environment) in production, web/.env.local in local dev.
let stripeClient: Stripe | null = null;

export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeConfigError';
  }
}

// Returns the secret key, or throws a readable error if it is missing or the wrong type
export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new StripeConfigError(
      'Card payments are not configured: STRIPE_SECRET_KEY is missing. Add it under Settings > Environment in Firebase App Hosting (or web/.env.local for local dev), then redeploy.'
    );
  }
  if (key.startsWith('pk_')) {
    throw new StripeConfigError(
      'STRIPE_SECRET_KEY holds a publishable key (pk_...). Use the secret key (sk_...) from the Stripe dashboard here; the publishable key belongs in NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.'
    );
  }
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    throw new StripeConfigError('STRIPE_SECRET_KEY is not a valid Stripe secret key (expected sk_test_... or sk_live_...).');
  }
  return key;
}

export function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const MIN_PAYMENT_PENCE = 50;
export const MAX_PAYMENT_PENCE = 1_000_000;
