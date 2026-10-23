import { collection, doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

// Prepaid credit balance per customer, stored at customer_credit/{email}.
// Every movement is also written to credit_ledger for audit.
// NOTE: balance changes are made from the browser under the Firestore rules. Before production,
// move top-up crediting to a Stripe webhook running with the Firebase Admin SDK.

const CREDIT_COLLECTION = 'customer_credit';
const LEDGER_COLLECTION = 'credit_ledger';

export async function getCreditBalancePence(email: string): Promise<number> {
  const snap = await getDoc(doc(db, CREDIT_COLLECTION, email.toLowerCase()));
  return snap.exists() ? Number(snap.data().balancePence) || 0 : 0;
}

export async function addCredit(email: string, amountPence: number, reference: string): Promise<number> {
  const owner = email.toLowerCase();
  const balanceRef = doc(db, CREDIT_COLLECTION, owner);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(balanceRef);
    const current = snap.exists() ? Number(snap.data().balancePence) || 0 : 0;
    const next = current + amountPence;
    const now = new Date().toISOString();

    tx.set(balanceRef, { ownerEmail: owner, balancePence: next, updatedAt: now });
    tx.set(doc(collection(db, LEDGER_COLLECTION)), {
      ownerEmail: owner,
      deltaPence: amountPence,
      balanceAfterPence: next,
      reason: 'Credit purchase',
      reference,
      createdAt: now,
    });
    return next;
  });
}

export async function spendCredit(email: string, amountPence: number, reference: string): Promise<number> {
  const owner = email.toLowerCase();
  const balanceRef = doc(db, CREDIT_COLLECTION, owner);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(balanceRef);
    const current = snap.exists() ? Number(snap.data().balancePence) || 0 : 0;
    if (current < amountPence) {
      throw new Error(`Not enough credit. Balance £${(current / 100).toFixed(2)}, needed £${(amountPence / 100).toFixed(2)}.`);
    }
    const next = current - amountPence;
    const now = new Date().toISOString();

    tx.set(balanceRef, { ownerEmail: owner, balancePence: next, updatedAt: now });
    tx.set(doc(collection(db, LEDGER_COLLECTION)), {
      ownerEmail: owner,
      deltaPence: -amountPence,
      balanceAfterPence: next,
      reason: 'Booking paid with credit',
      reference,
      createdAt: now,
    });
    return next;
  });
}
