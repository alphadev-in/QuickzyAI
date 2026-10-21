import { NextRequest, NextResponse } from 'next/server';
import { isValidLondonPostcode } from '@/types/delivery';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get('postcode') || '';

  const valid = isValidLondonPostcode(postcode);
  return NextResponse.json({
    postcode: postcode.trim().toUpperCase(),
    isValidLondon: valid,
    zone: valid ? 'Greater London Rapid Delivery Zone' : 'Outside Quickzy Service Area',
  });
}
