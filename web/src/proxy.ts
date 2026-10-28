import { NextResponse, type NextRequest } from 'next/server';
import { LONDON_AREAS } from '@/lib/londonServicePages';
import { LONDON_ZONES } from '@/lib/londonZones';

// Unknown /locations slugs must return a real 404. The location pages are partly prerendered, so a
// notFound() inside them would still send a 200 to the first visitor (a soft 404 search engines index).
// This checks the slugs before rendering and rewrites unknown ones to a path that does not exist,
// which Next answers with a genuine 404.
const AREAS = new Set(LONDON_AREAS.map((a) => a.slug));
const ZONES = new Set(Object.keys(LONDON_ZONES));
const SERVICES = new Set(['delivery', 'parcel', 'pharmacy', 'food']);
const NOT_FOUND_PATH = '/__no_such_page/unknown/unknown';

export function proxy(request: NextRequest) {
  const [root, first, second, ...rest] = request.nextUrl.pathname.split('/').filter(Boolean);
  if (root !== 'locations' || !first || rest.length > 0) return NextResponse.next();

  const known = second === undefined ? AREAS.has(first) || ZONES.has(first) : AREAS.has(first) && SERVICES.has(second);
  if (known) return NextResponse.next();

  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
}

export const config = {
  matcher: '/locations/:path*',
};
