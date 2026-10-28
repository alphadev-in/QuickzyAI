import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, MAX_PAYMENT_PENCE, MIN_PAYMENT_PENCE } from '@/lib/stripe';

// POST { amountPence, customerEmail, purpose, description }
// - purpose 'order': amountPence is the booking total, charged in full.
// - purpose 'credit_topup': amountPence is the credit to buy, charged in full.
// Card only is set in the Stripe Dashboard, not in code.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amountPence = Number(body?.amountPence);
    const customerEmail = String(body?.customerEmail || '').trim().toLowerCase();
    const purpose = body?.purpose === 'credit_topup' ? 'credit_topup' : 'order';
    const description = String(body?.description || 'Quickzy London delivery').slice(0, 200);

    if (!Number.isInteger(amountPence) || amountPence < MIN_PAYMENT_PENCE || amountPence > MAX_PAYMENT_PENCE) {
      return NextResponse.json(
        { error: `Amount must be a whole number of pence between ${MIN_PAYMENT_PENCE} and ${MAX_PAYMENT_PENCE}` },
        { status: 400 }
      );
    }
    if (!customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A signed-in customer email is required' }, { status: 400 });
    }

    // Payment methods come from the Stripe Dashboard (Settings > Payment methods). Keep only Card
    // enabled there for card-only checkout. Redirect-based methods are excluded so the card form
    // completes inline.
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      description,
      receipt_email: customerEmail,
      metadata: {
        customerEmail,
        purpose,
        creditPence: purpose === 'credit_topup' ? String(amountPence) : '',
      },
    };
    const intent = await getStripe().paymentIntents.create(params);

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      chargePence: amountPence,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not start payment' }, { status: 500 });
  }
}
