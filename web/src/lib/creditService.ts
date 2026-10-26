import { collection, doc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';

// Prepaid credit balance per customer, stored at customer_credit/{email}.
// Every movement is also written to credit_ledger for audit.
// NOTE: balance changes are made from the browser under the Firestore rules. Before production,
// move top-up crediting to a Stripe webhook running with the Firebase Admin SDK.

const CREDIT_COLLECTION = 'customer_credit';
const LEDGER_COLLECTION = 'credit_ledger';

// Firestore rules only allow writes when the signed-in Firebase user matches the customer.
// A session restored from localStorage without Firebase Auth gets permission-denied, so check first.
function requireSignedInCustomer(email: string): string {
  const owner = email.toLowerCase();
  const signedIn = auth.currentUser?.email?.toLowerCase();
  if (!signedIn || signedIn !== owner) {
    throw new Error('Your sign-in has expired. Please sign in again, then retry.');
  }
  return owner;
}

export async function getCreditBalancePence(email: string): Promise<number> {
  const snap = await getDoc(doc(db, CREDIT_COLLECTION, email.toLowerCase()));
  return snap.exists() ? Number(snap.data().balancePence) || 0 : 0;
}

// Idempotent: the ledger entry id is derived from the Stripe PaymentIntent id, so retrying a top-up
// that already went through returns the current balance and does not credit twice.
export async function addCredit(email: string, amountPence: number, reference: string): Promise<number> {
  const owner = requireSignedInCustomer(email);
  const balanceRef = doc(db, CREDIT_COLLECTION, owner);
  const ledgerRef = doc(db, LEDGER_COLLECTION, `topup_${reference}`);

  return runTransaction(db, async (tx) => {
    const ledgerSnap = await tx.get(ledgerRef);
    const balanceSnap = await tx.get(balanceRef);
    const current = balanceSnap.exists() ? Number(balanceSnap.data().balancePence) || 0 : 0;
    if (ledgerSnap.exists()) {
      return current;
    }
    const next = current + amountPence;
    const now = new Date().toISOString();

    tx.set(balanceRef, { ownerEmail: owner, balancePence: next, updatedAt: now });
    tx.set(ledgerRef, {
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
  const owner = requireSignedInCustomer(email);
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

// Admin only: manually adds credit to any customer or company account for testing or goodwill.
// Firestore rules allow this only for the admin account. The ledger entry records the note and the admin.
export async function adminGrantCredit(targetEmail: string, amountPence: number, note: string): Promise<number> {
  const owner = targetEmail.trim().toLowerCase();
  const adminEmail = auth.currentUser?.email?.toLowerCase();
  if (!adminEmail) {
    throw new Error('Your admin sign-in has expired. Sign in again, then retry.');
  }
  if (!owner.includes('@')) {
    throw new Error('Enter the account email the credit should go to.');
  }
  if (!Number.isInteger(amountPence) || amountPence <= 0) {
    throw new Error('Amount must be a positive number of pence.');
  }
  const balanceRef = doc(db, CREDIT_COLLECTION, owner);
  const ledgerRef = doc(collection(db, LEDGER_COLLECTION));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(balanceRef);
    const current = snap.exists() ? Number(snap.data().balancePence) || 0 : 0;
    const next = current + amountPence;
    const now = new Date().toISOString();

    tx.set(balanceRef, { ownerEmail: owner, balancePence: next, updatedAt: now });
    tx.set(ledgerRef, {
      ownerEmail: owner,
      deltaPence: amountPence,
      balanceAfterPence: next,
      reason: 'Manual credit by admin',
      reference: note.trim() || 'Admin adjustment',
      createdBy: adminEmail,
      createdAt: now,
    });
    return next;
  });
}
