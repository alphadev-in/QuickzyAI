import { NextRequest, NextResponse } from 'next/server';
import { MAX_PAYMENT_PENCE, MIN_PAYMENT_PENCE } from '@/lib/stripe';
import { PromoError, quoteCreditTopUp } from '@/lib/stripeCoupons';

// POST { creditPence, code } -> preview of what the customer pays for a credit top-up with a coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const creditPence = Number(body?.creditPence);
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    if (!Number.isInteger(creditPence) || creditPence < MIN_PAYMENT_PENCE || creditPence > MAX_PAYMENT_PENCE) {
      return NextResponse.json({ error: 'Choose a valid top-up amount' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: 'Enter a coupon code' }, { status: 400 });
    }

    const quote = await quoteCreditTopUp(creditPence, code);
    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Could not apply coupon' }, { status: 500 });
  }
}
