import { NextRequest, NextResponse } from 'next/server';
import { calculateDeliveryPrice, evaluateSameDayCutoff, isValidLondonPostcode } from '@/types/delivery';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, weightKg, lengthCm, widthCm, heightCm, isRestricted, pickupPostcode, dropoffPostcode } = body;

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
      weightKg: Number(weightKg) || 1,
      lengthCm: Number(lengthCm) || 10,
      widthCm: Number(widthCm) || 10,
      heightCm: Number(heightCm) || 10,
      isRestricted: Boolean(isRestricted),
      estimatedMiles: 4.2, // simulated London zone distance
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
