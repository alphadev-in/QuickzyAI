import { NextRequest, NextResponse } from 'next/server';
import { isValidLondonPostcode } from '@/types/delivery';
import { estimateRoadMiles, LatLng } from '@/lib/distance';

const POSTCODES_IO_BULK = 'https://api.postcodes.io/postcodes';
const MAX_PAIRS = 500;
const BULK_LIMIT = 100;

interface PostcodePair {
  pickupPostcode: string;
  dropoffPostcode: string;
}

// Geocode a list of postcodes in batches of 100 (postcodes.io bulk limit)
async function geocodePostcodes(postcodes: string[]): Promise<Map<string, LatLng>> {
  const coords = new Map<string, LatLng>();

  for (let i = 0; i < postcodes.length; i += BULK_LIMIT) {
    const batch = postcodes.slice(i, i + BULK_LIMIT);
    const res = await fetch(POSTCODES_IO_BULK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: batch }),
    });
    if (!res.ok) throw new Error(`Postcode lookup failed (HTTP ${res.status})`);

    const json = (await res.json()) as { result: { query: string; result: { latitude: number; longitude: number } | null }[] };
    for (const item of json.result) {
      if (item.result) {
        coords.set(item.query.toUpperCase(), { lat: item.result.latitude, lng: item.result.longitude });
      }
    }
  }

  return coords;
}

// POST { pairs: [{ pickupPostcode, dropoffPostcode }] } -> { results: [{ miles | null, error? }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pairs: PostcodePair[] = Array.isArray(body?.pairs) ? body.pairs : [];

    if (pairs.length === 0) {
      return NextResponse.json({ error: 'Provide at least one postcode pair' }, { status: 400 });
    }
    if (pairs.length > MAX_PAIRS) {
      return NextResponse.json({ error: `Maximum ${MAX_PAIRS} pairs per request` }, { status: 400 });
    }

    const normalise = (pc: unknown) => (typeof pc === 'string' ? pc.trim().toUpperCase() : '');
    const allPostcodes = new Set<string>();
    for (const p of pairs) {
      const pickup = normalise(p.pickupPostcode);
      const dropoff = normalise(p.dropoffPostcode);
      if (isValidLondonPostcode(pickup)) allPostcodes.add(pickup);
      if (isValidLondonPostcode(dropoff)) allPostcodes.add(dropoff);
    }

    const coords = await geocodePostcodes([...allPostcodes]);

    const results = pairs.map((p) => {
      const pickup = normalise(p.pickupPostcode);
      const dropoff = normalise(p.dropoffPostcode);

      if (!isValidLondonPostcode(pickup)) return { miles: null, error: `Pickup postcode '${pickup}' is not in London` };
      if (!isValidLondonPostcode(dropoff)) return { miles: null, error: `Dropoff postcode '${dropoff}' is not in London` };

      const from = coords.get(pickup);
      const to = coords.get(dropoff);
      if (!from || !to) return { miles: null, error: 'Postcode could not be located' };

      return { miles: estimateRoadMiles(from, to), error: undefined };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Distance lookup failed' }, { status: 500 });
  }
}
