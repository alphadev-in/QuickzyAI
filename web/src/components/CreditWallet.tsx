'use client';

import React, { useState } from 'react';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import { addCredit } from '@/lib/creditService';
import { Wallet, Plus, CheckCircle2 } from 'lucide-react';

interface CreditWalletProps {
  customerEmail: string;
  balancePence: number;
  onChanged: () => void;
}

const PRESETS_PENCE = [2000, 5000, 10000];
const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const CreditWallet: React.FC<CreditWalletProps> = ({ customerEmail, balancePence, onChanged }) => {
  const [topUpPence, setTopUpPence] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const handleTopUpPaid = async ({ reference, amountPence }: { reference: string; amountPence: number }) => {
    await addCredit(customerEmail, amountPence, reference);
    setJustAdded(amountPence);
    setTopUpPence(null);
    onChanged();
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-bold">Credit balance</p>
            <p className="text-lg font-black text-white">{formatGbp(balancePence)}</p>
          </div>
        </div>

        {topUpPence === null && (
          <div className="flex flex-wrap gap-2">
            {PRESETS_PENCE.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setJustAdded(null);
                  setTopUpPence(p);
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Buy {formatGbp(p)}
              </button>
            ))}
          </div>
        )}
      </div>

      {justAdded !== null && topUpPence === null && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> {formatGbp(justAdded)} added to your credit.
        </p>
      )}

      {topUpPence !== null && (
        <div className="space-y-3">
          <CheckoutPanel
            amountPence={topUpPence}
            description="Quickzy credit top-up"
            customerEmail={customerEmail}
            purpose="credit_topup"
            allowCredit={false}
            payLabel={`Pay ${formatGbp(topUpPence)} for credit`}
            onPaid={handleTopUpPaid}
          />
          <button type="button" onClick={() => setTopUpPence(null)} className="text-[11px] text-neutral-400 hover:text-white underline">
            Cancel top-up
          </button>
        </div>
      )}
    </div>
  );
};
