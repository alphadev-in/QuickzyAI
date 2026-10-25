import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, MAX_PAYMENT_PENCE, MIN_PAYMENT_PENCE } from '@/lib/stripe';
import { PromoError, quoteCreditTopUp } from '@/lib/stripeCoupons';

// POST { amountPence, customerEmail, purpose, description, promotionCode? }
// - purpose 'order': amountPence is the booking total, charged in full.
// - purpose 'credit_topup': amountPence is the credit to buy; the coupon (if any) is applied here,
//   so the card charge is computed on the server, never taken from the browser.
// Card only: payment_method_types is fixed to ['card'].
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amountPence = Number(body?.amountPence);
    const customerEmail = String(body?.customerEmail || '').trim().toLowerCase();
    const purpose = body?.purpose === 'credit_topup' ? 'credit_topup' : 'order';
    const description = String(body?.description || 'Quickzy London delivery').slice(0, 200);
    const promotionCode = typeof body?.promotionCode === 'string' ? body.promotionCode.trim() : '';

    if (!Number.isInteger(amountPence) || amountPence < MIN_PAYMENT_PENCE || amountPence > MAX_PAYMENT_PENCE) {
      return NextResponse.json(
        { error: `Amount must be a whole number of pence between ${MIN_PAYMENT_PENCE} and ${MAX_PAYMENT_PENCE}` },
        { status: 400 }
      );
    }
    if (!customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A signed-in customer email is required' }, { status: 400 });
    }
    if (promotionCode && purpose !== 'credit_topup') {
      return NextResponse.json({ error: 'Coupons can only be used when buying credit' }, { status: 400 });
    }

    // Coupon discount is recalculated here from Stripe, so the charge is always server-decided
    const quote = purpose === 'credit_topup' ? await quoteCreditTopUp(amountPence, promotionCode) : null;
    const chargePence = quote ? quote.chargePence : amountPence;

    // payment_method_types restricts the intent to cards. It is in the Stripe API but missing from
    // this SDK version's typings, hence the explicit intersection type below.
    const params: Stripe.PaymentIntentCreateParams & { payment_method_types: string[] } = {
      amount: chargePence,
      currency: 'gbp',
      payment_method_types: ['card'],
      description,
      receipt_email: customerEmail,
      metadata: {
        customerEmail,
        purpose,
        creditPence: quote ? String(amountPence) : '',
        promotionCodeId: quote?.promotionCodeId || '',
        discountPence: quote ? String(quote.discountPence) : '0',
      },
    };
    const intent = await getStripe().paymentIntents.create(params);

    return NextResponse.json({
      success: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      chargePence,
      discountPence: quote?.discountPence ?? 0,
    });
  } catch (error: any) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Could not start payment' }, { status: 500 });
  }
}
