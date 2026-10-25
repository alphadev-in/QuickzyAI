/**
 * Free UK driving distance and drive time between two postcodes.
 *
 * - Geocoding: postcodes.io (free, no key) turns a postcode into latitude/longitude.
 * - Routing:   OSRM public demo server gives the road distance and duration.
 *
 * Caveat: the OSRM demo server is shared and rate-limited with no SLA. It suits
 * booking-volume traffic, but self-host OSRM or switch providers before heavy production use.
 */

const POSTCODES_IO_BASE = 'https://api.postcodes.io/postcodes';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const METERS_PER_MILE = 1609.344;
const REQUEST_TIMEOUT_MS = 8000;
const COORD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface UKDrivingDistance {
  /** Road distance in miles, 2 dp. Null when no driving route exists. */
  distanceMiles: number | null;
  /** Drive time in minutes, nearest whole minute. Null when no driving route exists. */
  durationMinutes: number | null;
  routeFound: boolean;
}

/** Postcode is not recognised by postcodes.io (HTTP 404) */
export class PostcodeNotFoundError extends Error {
  constructor(postcode: string) {
    super(`Postcode "${postcode}" was not recognised. Check it and try again.`);
    this.name = 'PostcodeNotFoundError';
  }
}

const coordCache = new Map<string, { value: LatLng; expiresAt: number }>();

/** Converts a UK postcode into latitude/longitude using postcodes.io */
export async function geocodePostcode(postcode: string): Promise<LatLng> {
  const key = postcode.trim().toUpperCase();

  const cached = coordCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const res = await fetch(`${POSTCODES_IO_BASE}/${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 404) throw new PostcodeNotFoundError(key);
  if (!res.ok) throw new Error(`Postcode lookup failed for "${key}" (HTTP ${res.status})`);

  const json = (await res.json()) as { result: { latitude: number; longitude: number } | null };
  if (!json.result) throw new PostcodeNotFoundError(key);

  const value = { lat: json.result.latitude, lng: json.result.longitude };
  coordCache.set(key, { value, expiresAt: Date.now() + COORD_CACHE_TTL_MS });
  return value;
}

/**
 * Road distance and drive time between two UK postcodes.
 * Both postcodes are geocoded concurrently. OSRM expects coordinates as longitude,latitude.
 *
 * Throws PostcodeNotFoundError for unknown postcodes and Error for service failures.
 * Returns routeFound: false when OSRM finds no driving route (for example between islands).
 */
export async function getUKDrivingDistance(postcode1: string, postcode2: string): Promise<UKDrivingDistance> {
  const [from, to] = await Promise.all([geocodePostcode(postcode1), geocodePostcode(postcode2)]);

  const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

  // OSRM answers 400 with code "NoRoute" when the points are not connected by road
  const json = (await res.json().catch(() => ({}))) as {
    code?: string;
    routes?: { distance: number; duration: number }[];
  };

  if (json.code === 'NoRoute' || (res.ok && json.code === 'Ok' && !json.routes?.length)) {
    return { distanceMiles: null, durationMinutes: null, routeFound: false };
  }
  if (!res.ok || json.code !== 'Ok' || !json.routes?.[0]) {
    throw new Error(`Routing service error (HTTP ${res.status}${json.code ? `, ${json.code}` : ''})`);
  }

  const route = json.routes[0];
  return {
    distanceMiles: Math.round((route.distance / METERS_PER_MILE) * 100) / 100,
    durationMinutes: Math.round(route.duration / 60),
    routeFound: true,
  };
}
