'use client';

import React, { useState } from 'react';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import { addCredit } from '@/lib/creditService';
import { Wallet, Plus, CheckCircle2, Ticket, Loader2, AlertCircle } from 'lucide-react';

interface CreditWalletProps {
  customerEmail: string;
  balancePence: number;
  onChanged: () => void;
}

// A card payment that succeeded but whose credit could not be saved yet. Retrying is safe:
// the credit write is keyed by the Stripe PaymentIntent id, so it cannot be applied twice.
interface PendingTopUp {
  reference: string;
  creditPence: number;
}

interface CouponQuote {
  creditPence: number;
  discountPence: number;
  chargePence: number;
  label?: string;
  promotionCode?: string;
}

const PRESETS_PENCE = [2000, 5000, 10000];
const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const CreditWallet: React.FC<CreditWalletProps> = ({ customerEmail, balancePence, onChanged }) => {
  const [topUpPence, setTopUpPence] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [pendingError, setPendingError] = useState('');
  const [retrying, setRetrying] = useState(false);

  // Coupon: entered once, previewed against the chosen credit amount, applied on the server at payment
  const [codeInput, setCodeInput] = useState('');
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);

  const previewCoupon = async (creditPence: number, code: string) => {
    setCheckingCode(true);
    setCouponError('');
    try {
      const res = await fetch('/api/v1/payments/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditPence, code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'That code could not be applied');
      setQuote({ ...json.quote, promotionCode: code });
    } catch (err: any) {
      setQuote(null);
      setCouponError(err.message || 'That code could not be applied');
    } finally {
      setCheckingCode(false);
    }
  };

  const choosePreset = (p: number) => {
    setJustAdded(null);
    setTopUpPence(p);
    // Re-check any code already entered against the newly chosen amount
    if (codeInput.trim()) previewCoupon(p, codeInput.trim());
    else setQuote(null);
  };

  const clearCoupon = () => {
    setCodeInput('');
    setQuote(null);
    setCouponError('');
  };

  // Saves the credit for a paid top-up. On failure the payment is kept as pending, with a retry,
  // so the customer is never left on a spinner after paying.
  const applyTopUp = async (pending: PendingTopUp) => {
    setRetrying(true);
    setPendingError('');
    try {
      await addCredit(customerEmail, pending.creditPence, pending.reference);
      setPendingTopUp(null);
      setJustAdded(pending.creditPence);
      onChanged();
    } catch (err: any) {
      setPendingTopUp(pending);
      setPendingError(err?.message || 'Credit could not be saved');
    } finally {
      setRetrying(false);
    }
  };

  const handleTopUpPaid = async ({ reference, creditPence }: { reference: string; creditPence: number }) => {
    // Credit granted is the face value, even when the customer paid less with a coupon
    setTopUpPence(null);
    clearCoupon();
    await applyTopUp({ reference, creditPence });
  };

  const couponActive = quote && topUpPence !== null && quote.creditPence === topUpPence;
  const chargePence = couponActive ? quote.chargePence : topUpPence ?? 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-bob">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-bold">Credit balance</p>
            <p className="text-lg font-black text-white">{formatGbp(balancePence)}</p>
          </div>
        </div>

        {topUpPence === null && (
          <div className="flex flex-wrap gap-2 stagger">
            {PRESETS_PENCE.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => choosePreset(p)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1 transition active:scale-95"
              >
                <Plus className="w-3 h-3" /> Buy {formatGbp(p)}
              </button>
            ))}
          </div>
        )}
      </div>

      {pendingTopUp && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-scale-in">
          <div className="flex items-start gap-1.5 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Payment received for {formatGbp(pendingTopUp.creditPence)} credit, but it has not been added yet.
              {pendingError && <span className="block text-amber-200/80 mt-0.5">{pendingError}</span>}
            </span>
          </div>
          <button
            type="button"
            disabled={retrying}
            onClick={() => applyTopUp(pendingTopUp)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black flex items-center justify-center gap-2 disabled:opacity-40 transition"
          >
            {retrying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Retry adding credit
          </button>
        </div>
      )}

      {justAdded !== null && topUpPence === null && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-scale-in">
          <CheckCircle2 className="w-3.5 h-3.5" /> {formatGbp(justAdded)} added to your credit.
        </p>
      )}

      {topUpPence === null && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Ticket className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase());
                setCouponError('');
              }}
              placeholder="Coupon code"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <p className="text-[11px] text-neutral-500 self-center">Enter a code, then choose an amount to buy.</p>
        </div>
      )}

      {topUpPence !== null && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Ticket className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setCouponError('');
                }}
                placeholder="Coupon code (optional)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="button"
              disabled={checkingCode || !codeInput.trim()}
              onClick={() => previewCoupon(topUpPence, codeInput.trim())}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 disabled:opacity-40 flex items-center justify-center gap-2 transition"
            >
              {checkingCode && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply
            </button>
            {quote && (
              <button type="button" onClick={clearCoupon} className="text-[11px] text-neutral-400 hover:text-white underline self-center">
                Remove
              </button>
            )}
          </div>

          {couponError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 animate-scale-in">
              <AlertCircle className="w-3.5 h-3.5" /> {couponError}
            </p>
          )}

          {couponActive && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between animate-scale-in">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> {quote.label} applied
              </span>
              <span className="text-neutral-300">
                Credit {formatGbp(topUpPence)} · you pay <span className="font-black text-emerald-400">{formatGbp(quote.chargePence)}</span>
              </span>
            </div>
          )}

          <CheckoutPanel
            amountPence={topUpPence}
            description="Quickzy credit top-up"
            customerEmail={customerEmail}
            purpose="credit_topup"
            promotionCode={couponActive ? quote.promotionCode : undefined}
            payLabel={`Pay ${formatGbp(chargePence)} by card for ${formatGbp(topUpPence)} credit`}
            onPaid={handleTopUpPaid}
          />
          <button
            type="button"
            onClick={() => {
              setTopUpPence(null);
              clearCoupon();
            }}
            className="text-[11px] text-neutral-400 hover:text-white underline"
          >
            Cancel top-up
          </button>
        </div>
      )}
    </div>
  );
};
