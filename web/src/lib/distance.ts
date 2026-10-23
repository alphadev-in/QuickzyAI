// Road-distance estimate between two London postcodes.
// Postcodes are geocoded server-side (postcodes.io, no API key) and the straight-line
// distance is scaled by a road detour factor, which is close enough for per-mile pricing.

export const ROAD_DETOUR_FACTOR = 1.3;

const EARTH_RADIUS_MILES = 3958.8;

export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateRoadMiles(a: LatLng, b: LatLng): number {
  return Math.round(haversineMiles(a, b) * ROAD_DETOUR_FACTOR * 100) / 100;
}
