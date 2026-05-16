/**
 * Fetches a driving route between two [lat, lng] points using OpenRouteService.
 * Falls back to a straight line if the API key is not configured or on error.
 *
 * Set NEXT_PUBLIC_ORS_API_KEY in .env.local to enable real routing.
 * Free tier: 2,000 requests/day — https://openrouteservice.org
 */

// In-memory cache: "lat1,lng1->lat2,lng2" → route coordinates
const routeCache = new Map<string, [number, number][]>();

function cacheKey(start: [number, number], end: [number, number]): string {
  // Round to 4 decimal places (~11m precision) to improve cache hit rate
  return `${start[0].toFixed(4)},${start[1].toFixed(4)}->${end[0].toFixed(4)},${end[1].toFixed(4)}`;
}

export async function getRoute(
  start: [number, number],
  end: [number, number]
): Promise<[number, number][]> {
  const key = cacheKey(start, end);

  // Return cached result if available
  if (routeCache.has(key)) {
    return routeCache.get(key)!;
  }

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;

  if (!apiKey) {
    // Fallback: straight dashed line between the two points
    return [start, end];
  }

  try {
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`,
      { headers: { Accept: 'application/json, application/geo+json' } }
    );

    if (!res.ok) throw new Error(`ORS error: ${res.status}`);

    const data = await res.json();
    const coords: [number, number][] = data.features[0].geometry.coordinates.map(
      ([lng, lat]: number[]) => [lat, lng] as [number, number]
    );

    // Cache and return
    routeCache.set(key, coords);
    return coords;
  } catch (err) {
    console.warn('[SupplySync] ORS routing failed, using straight line:', err);
    const fallback: [number, number][] = [start, end];
    routeCache.set(key, fallback);
    return fallback;
  }
}
