import { NextRequest, NextResponse } from 'next/server';
import { getStripe, MAX_PAYMENT_PENCE, MIN_PAYMENT_PENCE } from '@/lib/stripe';

// POST { amountPence, customerEmail, purpose: 'order' | 'credit_topup', description }
// Creates a Stripe PaymentIntent and returns its client secret for the browser to confirm.
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

    const intent = await getStripe().paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      description,
      receipt_email: customerEmail,
      metadata: { customerEmail, purpose },
    });

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not start payment' }, { status: 500 });
  }
}
