import { NextRequest, NextResponse } from 'next/server';
import { CreateOrderSchema, calculateDeliveryPrice, evaluateSameDayCutoff } from '@/types/delivery';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateOrderSchema.parse(body);
    if (!validated.estimatedMiles) {
      return NextResponse.json({ error: 'estimatedMiles is required (see /api/v1/distance)' }, { status: 400 });
    }

    const cutoff = evaluateSameDayCutoff();
    const quote = calculateDeliveryPrice({
      type: validated.type,
      estimatedMiles: validated.estimatedMiles,
      weightKg: validated.parcel?.weightKg,
    });

    const orderId = `QZK-API-${Date.now().toString(36).toUpperCase()}`;

    const order = {
      id: orderId,
      ...validated,
      status: 'booked',
      isSameDayCutoffExceeded: cutoff.isCutoffExceeded,
      pricePence: quote.totalPence,
      priceGbp: quote.totalGbp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.errors || err.message }, { status: 400 });
  }
}
