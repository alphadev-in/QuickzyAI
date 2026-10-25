import { NextRequest, NextResponse } from 'next/server';
import { isValidLondonPostcode } from '@/types/delivery';
import { estimateRoadMiles, withRouteBuffer } from '@/lib/distance';
import {
  getUKDrivingDistance,
  geocodePostcode,
  PostcodeNotFoundError,
} from '@/lib/ukDrivingDistance';

const MAX_PAIRS = 500;
// Keep concurrent requests low: the OSRM demo server is shared and rate-limited
const CONCURRENCY = 4;

interface PostcodePair {
  pickupPostcode: string;
  dropoffPostcode: string;
}

export interface RouteResult {
  miles: number | null;
  durationMinutes?: number | null;
  /** 'osrm' = real driving route, 'estimate' = straight-line fallback when routing was unavailable */
  source?: 'osrm' | 'estimate';
  error?: string;
}

const normalise = (pc: unknown) => (typeof pc === 'string' ? pc.trim().toUpperCase() : '');

// Measures one pair: real driving distance first, straight-line estimate if the routing service is down
async function measurePair(pickup: string, dropoff: string): Promise<RouteResult> {
  if (!isValidLondonPostcode(pickup)) return { miles: null, error: `Pickup postcode '${pickup}' is not in London` };
  if (!isValidLondonPostcode(dropoff)) return { miles: null, error: `Dropoff postcode '${dropoff}' is not in London` };

  try {
    const route = await getUKDrivingDistance(pickup, dropoff);
    if (!route.routeFound || route.distanceMiles == null) {
      return { miles: null, error: 'No driving route found between these postcodes' };
    }
    return { miles: withRouteBuffer(route.distanceMiles), durationMinutes: route.durationMinutes, source: 'osrm' };
  } catch (err) {
    if (err instanceof PostcodeNotFoundError) return { miles: null, error: err.message };

    // Routing unavailable: fall back to a straight-line estimate so bookings can continue
    try {
      const [from, to] = await Promise.all([geocodePostcode(pickup), geocodePostcode(dropoff)]);
      return { miles: withRouteBuffer(estimateRoadMiles(from, to)), durationMinutes: null, source: 'estimate' };
    } catch (fallbackErr: any) {
      return { miles: null, error: fallbackErr.message || 'Postcode could not be located' };
    }
  }
}

// Runs async work over items with a fixed number of workers, keeping order
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// POST { pairs: [{ pickupPostcode, dropoffPostcode }] } -> { results: [{ miles, durationMinutes, source, error? }] }
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

    // Identical pairs (common in bulk manifests) are measured once
    const unique = new Map<string, { pickup: string; dropoff: string }>();
    const keys = pairs.map((p) => {
      const pickup = normalise(p.pickupPostcode);
      const dropoff = normalise(p.dropoffPostcode);
      const key = `${pickup}|${dropoff}`;
      if (!unique.has(key)) unique.set(key, { pickup, dropoff });
      return key;
    });

    const measured = new Map<string, RouteResult>();
    const entries = [...unique.entries()];
    const outcomes = await mapWithConcurrency(entries, CONCURRENCY, ([, p]) => measurePair(p.pickup, p.dropoff));
    entries.forEach(([key], i) => measured.set(key, outcomes[i]));

    const results = keys.map((key) => measured.get(key) as RouteResult);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Distance lookup failed' }, { status: 500 });
  }
}
