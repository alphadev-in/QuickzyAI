import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

// POST { paymentIntentId, customerEmail, expectedAmountPence }
// Confirms with Stripe that the PaymentIntent succeeded, belongs to this customer,
// and covers the amount being booked. Orders are only created after this returns paid.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentIntentId = String(body?.paymentIntentId || '');
    const customerEmail = String(body?.customerEmail || '').trim().toLowerCase();
    const expectedAmountPence = Number(body?.expectedAmountPence);

    if (!paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });
    }

    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    const belongsToCustomer = intent.metadata?.customerEmail === customerEmail;
    const succeeded = intent.status === 'succeeded';
    const covers = (intent.amount_received ?? 0) >= expectedAmountPence;

    if (!succeeded || !belongsToCustomer || !covers) {
      return NextResponse.json(
        { paid: false, error: 'Payment has not been completed for this booking' },
        { status: 402 }
      );
    }

    return NextResponse.json({
      paid: true,
      paymentIntentId: intent.id,
      amountPence: intent.amount_received,
      purpose: intent.metadata?.purpose || 'order',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
