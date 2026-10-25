// Browser helper: asks the server for road miles between pickup and dropoff postcodes.

export interface PostcodePairInput {
  pickupPostcode: string;
  dropoffPostcode: string;
}

export interface RouteMilesResult {
  miles: number | null;
  durationMinutes?: number | null;
  source?: 'osrm' | 'estimate';
  error?: string;
}

export async function fetchRouteMiles(pairs: PostcodePairInput[]): Promise<RouteMilesResult[]> {
  if (pairs.length === 0) return [];

  const res = await fetch('/api/v1/distance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairs }),
  });
  const json = await res.json();
  if (!res.ok || !json.results) {
    throw new Error(json.error || 'Could not calculate route distance');
  }
  return json.results as RouteMilesResult[];
}
