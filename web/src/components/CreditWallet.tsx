'use client';

import React, { useState } from 'react';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import { addCredit } from '@/lib/creditService';
import { Wallet, Plus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

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

const PRESETS_PENCE = [2000, 5000, 10000];
const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const CreditWallet: React.FC<CreditWalletProps> = ({ customerEmail, balancePence, onChanged }) => {
  const [topUpPence, setTopUpPence] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [pendingError, setPendingError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const choosePreset = (p: number) => {
    setJustAdded(null);
    setTopUpPence(p);
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
    setTopUpPence(null);
    await applyTopUp({ reference, creditPence });
  };

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

      {topUpPence !== null && (
        <div className="space-y-3 animate-fade-in-up">
          <CheckoutPanel
            amountPence={topUpPence}
            description="Quickzy credit top-up"
            customerEmail={customerEmail}
            purpose="credit_topup"
            payLabel={`Pay ${formatGbp(topUpPence)} by card for ${formatGbp(topUpPence)} credit`}
            onPaid={handleTopUpPaid}
          />
          <button
            type="button"
            onClick={() => setTopUpPence(null)}
            className="text-[11px] text-neutral-400 hover:text-white underline"
          >
            Cancel top-up
          </button>
        </div>
      )}
    </div>
  );
};
