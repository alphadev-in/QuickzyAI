import { NextRequest, NextResponse } from 'next/server';
import { calculateDeliveryPrice, evaluateSameDayCutoff, isValidLondonPostcode } from '@/types/delivery';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, estimatedMiles, pickupPostcode, dropoffPostcode } = body;

    const miles = Number(estimatedMiles);
    if (!Number.isFinite(miles) || miles <= 0) {
      return NextResponse.json({ error: 'estimatedMiles is required (see /api/v1/distance)' }, { status: 400 });
    }

    if (pickupPostcode && !isValidLondonPostcode(pickupPostcode)) {
      return NextResponse.json(
        { error: `Pickup postcode '${pickupPostcode}' is outside Greater London coverage.` },
        { status: 400 }
      );
    }

    if (dropoffPostcode && !isValidLondonPostcode(dropoffPostcode)) {
      return NextResponse.json(
        { error: `Dropoff postcode '${dropoffPostcode}' is outside Greater London coverage.` },
        { status: 400 }
      );
    }

    const cutoff = evaluateSameDayCutoff();
    const pricing = calculateDeliveryPrice({
      type: type || 'parcel',
      estimatedMiles: miles,
    });

    return NextResponse.json({
      success: true,
      pricing,
      cutoff,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
