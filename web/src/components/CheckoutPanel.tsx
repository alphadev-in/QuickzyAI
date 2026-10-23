'use client';

import React, { useMemo, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PaymentMethod } from '@/types/delivery';
import { spendCredit } from '@/lib/creditService';
import { CreditCard, Wallet, Loader2, ShieldAlert, Lock } from 'lucide-react';

export interface PaidResult {
  method: PaymentMethod;
  reference: string;
  amountPence: number;
}

interface CheckoutPanelProps {
  amountPence: number;
  description: string;
  customerEmail: string;
  /** 'order' pays for bookings; 'credit_topup' buys credit for the account balance. */
  purpose: 'order' | 'credit_topup';
  /** Current credit balance. When omitted or allowCredit is false, only card payment is offered. */
  creditBalancePence?: number;
  allowCredit?: boolean;
  disabled?: boolean;
  payLabel?: string;
  onPaid: (result: PaidResult) => Promise<void> | void;
}

// Publishable key is safe in the browser. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in web/.env.local.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!publishableKey) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  amountPence,
  description,
  customerEmail,
  purpose,
  creditBalancePence,
  allowCredit = true,
  disabled,
  payLabel,
  onPaid,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canUseCredit = allowCredit && purpose === 'order' && creditBalancePence !== undefined;
  const hasEnoughCredit = canUseCredit && (creditBalancePence as number) >= amountPence;
  const stripe = useMemo(() => getStripePromise(), []);

  const startCardPayment = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/v1/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPence, customerEmail, purpose, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not start card payment');
      setClientSecret(json.clientSecret);
      setPaymentIntentId(json.paymentIntentId);
    } catch (err: any) {
      setError(err.message || 'Could not start card payment');
    } finally {
      setBusy(false);
    }
  };

  const payWithCredit = async () => {
    setError('');
    setBusy(true);
    try {
      const reference = `CREDIT-${Date.now().toString(36).toUpperCase()}`;
      await spendCredit(customerEmail, amountPence, reference);
      await onPaid({ method: 'credit', reference, amountPence });
    } catch (err: any) {
      setError(err.message || 'Credit payment failed');
    } finally {
      setBusy(false);
    }
  };

  if (!publishableKey) {
    return (
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Card payments are not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to web/.env.local, then restart the dev server.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!clientSecret ? (
        <div className="flex flex-col sm:flex-row gap-2">
          {canUseCredit && (
            <button
              type="button"
              disabled={busy || disabled || !hasEnoughCredit}
              onClick={payWithCredit}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition"
            >
              <Wallet className="w-4 h-4" />
              <span>
                {hasEnoughCredit
                  ? `Pay ${formatGbp(amountPence)} from credit`
                  : `Credit balance ${formatGbp(creditBalancePence as number)} (not enough)`}
              </span>
            </button>
          )}
          <button
            type="button"
            disabled={busy || disabled}
            onClick={startCardPayment}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span>{payLabel || `Pay ${formatGbp(amountPence)} by card`}</span>
          </button>
        </div>
      ) : (
        stripe && (
          <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: 'night' } }}>
            <CardPaymentForm
              amountPence={amountPence}
              customerEmail={customerEmail}
              paymentIntentId={paymentIntentId as string}
              onCancel={() => {
                setClientSecret(null);
                setPaymentIntentId(null);
              }}
              onPaid={async (reference) => {
                setBusy(true);
                try {
                  await onPaid({ method: 'stripe', reference, amountPence });
                } finally {
                  setBusy(false);
                }
              }}
              onError={setError}
            />
          </Elements>
        )
      )}

      <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Card details are handled by Stripe and never touch Quickzy servers.
      </p>
    </div>
  );
};

interface CardPaymentFormProps {
  amountPence: number;
  customerEmail: string;
  paymentIntentId: string;
  onCancel: () => void;
  onPaid: (reference: string) => Promise<void> | void;
  onError: (message: string) => void;
}

const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  amountPence,
  customerEmail,
  paymentIntentId,
  onCancel,
  onPaid,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Card payment was declined');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status !== 'succeeded') {
      onError(`Payment status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
      setSubmitting(false);
      return;
    }

    // Server-side check that the payment really succeeded for this customer and amount
    const res = await fetch('/api/v1/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, customerEmail, expectedAmountPence: amountPence }),
    });
    const json = await res.json();
    if (!res.ok || !json.paid) {
      onError(json.error || 'Payment could not be verified');
      setSubmitting(false);
      return;
    }

    await onPaid(paymentIntentId);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleConfirm} className="space-y-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
      <PaymentElement />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? 'Processing...' : `Confirm & Pay ${formatGbp(amountPence)}`}</span>
        </button>
      </div>
    </form>
  );
};
