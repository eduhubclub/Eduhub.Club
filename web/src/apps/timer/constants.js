/** Default quick-select presets for whole-class timers. */
export const DEFAULT_WHOLE_CLASS_PRESETS = [
  { id: 'p1', label: '30 sec', min: 0.5 },
  { id: 'p2', label: '1 min', min: 1 },
  { id: 'p3', label: '2 min', min: 2 },
  { id: 'p4', label: '5 min', min: 5 },
  { id: 'p5', label: '10 min', min: 10 },
  { id: 'p6', label: '15 min', min: 15 },
];

/**
 * Curated classroom-friendly cities (label + IANA zone + map coordinates).
 * Used first in search; Intl zones fill in everything else offline.
 */
export const WORLD_CITIES = [
  { name: 'Los Angeles', tz: 'America/Los_Angeles', country: 'USA', lat: 34.05, lng: -118.24 },
  { name: 'New York', tz: 'America/New_York', country: 'USA', lat: 40.71, lng: -74.01 },
  { name: 'Chicago', tz: 'America/Chicago', country: 'USA', lat: 41.88, lng: -87.63 },
  { name: 'Denver', tz: 'America/Denver', country: 'USA', lat: 39.74, lng: -104.99 },
  { name: 'Phoenix', tz: 'America/Phoenix', country: 'USA', lat: 33.45, lng: -112.07 },
  { name: 'Anchorage', tz: 'America/Anchorage', country: 'USA', lat: 61.22, lng: -149.9 },
  { name: 'Honolulu', tz: 'Pacific/Honolulu', country: 'USA', lat: 21.31, lng: -157.86 },
  { name: 'Toronto', tz: 'America/Toronto', country: 'Canada', lat: 43.65, lng: -79.38 },
  { name: 'Vancouver', tz: 'America/Vancouver', country: 'Canada', lat: 49.28, lng: -123.12 },
  { name: 'Mexico City', tz: 'America/Mexico_City', country: 'Mexico', lat: 19.43, lng: -99.13 },
  { name: 'Santiago', tz: 'America/Santiago', country: 'Chile', lat: -33.45, lng: -70.67 },
  { name: 'São Paulo', tz: 'America/Sao_Paulo', country: 'Brazil', lat: -23.55, lng: -46.63 },
  { name: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', country: 'Argentina', lat: -34.6, lng: -58.38 },
  { name: 'Lima', tz: 'America/Lima', country: 'Peru', lat: -12.05, lng: -77.04 },
  { name: 'Bogotá', tz: 'America/Bogota', country: 'Colombia', lat: 4.71, lng: -74.07 },
  { name: 'London', tz: 'Europe/London', country: 'UK', lat: 51.51, lng: -0.13 },
  { name: 'Dublin', tz: 'Europe/Dublin', country: 'Ireland', lat: 53.35, lng: -6.26 },
  { name: 'Paris', tz: 'Europe/Paris', country: 'France', lat: 48.86, lng: 2.35 },
  { name: 'Berlin', tz: 'Europe/Berlin', country: 'Germany', lat: 52.52, lng: 13.4 },
  { name: 'Madrid', tz: 'Europe/Madrid', country: 'Spain', lat: 40.42, lng: -3.7 },
  { name: 'Rome', tz: 'Europe/Rome', country: 'Italy', lat: 41.9, lng: 12.5 },
  { name: 'Amsterdam', tz: 'Europe/Amsterdam', country: 'Netherlands', lat: 52.37, lng: 4.9 },
  { name: 'Stockholm', tz: 'Europe/Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07 },
  { name: 'Warsaw', tz: 'Europe/Warsaw', country: 'Poland', lat: 52.23, lng: 21.01 },
  { name: 'Athens', tz: 'Europe/Athens', country: 'Greece', lat: 37.98, lng: 23.73 },
  { name: 'Istanbul', tz: 'Europe/Istanbul', country: 'Türkiye', lat: 41.01, lng: 28.98 },
  { name: 'Moscow', tz: 'Europe/Moscow', country: 'Russia', lat: 55.76, lng: 37.62 },
  { name: 'Accra', tz: 'Africa/Accra', country: 'Ghana', lat: 5.56, lng: -0.2 },
  { name: 'Dakar', tz: 'Africa/Dakar', country: 'Senegal', lat: 14.72, lng: -17.47 },
  { name: 'Casablanca', tz: 'Africa/Casablanca', country: 'Morocco', lat: 33.57, lng: -7.59 },
  { name: 'Lagos', tz: 'Africa/Lagos', country: 'Nigeria', lat: 6.52, lng: 3.38 },
  { name: 'Kinshasa', tz: 'Africa/Kinshasa', country: 'DR Congo', lat: -4.33, lng: 15.31 },
  { name: 'Cairo', tz: 'Africa/Cairo', country: 'Egypt', lat: 30.04, lng: 31.24 },
  { name: 'Johannesburg', tz: 'Africa/Johannesburg', country: 'South Africa', lat: -26.2, lng: 28.05 },
  { name: 'Nairobi', tz: 'Africa/Nairobi', country: 'Kenya', lat: -1.29, lng: 36.82 },
  { name: 'Addis Ababa', tz: 'Africa/Addis_Ababa', country: 'Ethiopia', lat: 9.03, lng: 38.74 },
  { name: 'Dubai', tz: 'Asia/Dubai', country: 'UAE', lat: 25.2, lng: 55.27 },
  { name: 'Riyadh', tz: 'Asia/Riyadh', country: 'Saudi Arabia', lat: 24.71, lng: 46.68 },
  { name: 'Tehran', tz: 'Asia/Tehran', country: 'Iran', lat: 35.69, lng: 51.39 },
  { name: 'Karachi', tz: 'Asia/Karachi', country: 'Pakistan', lat: 24.86, lng: 67.01 },
  { name: 'Delhi', tz: 'Asia/Kolkata', country: 'India', lat: 28.61, lng: 77.21 },
  { name: 'Mumbai', tz: 'Asia/Kolkata', country: 'India', lat: 19.08, lng: 72.88 },
  { name: 'Dhaka', tz: 'Asia/Dhaka', country: 'Bangladesh', lat: 23.81, lng: 90.41 },
  { name: 'Bangkok', tz: 'Asia/Bangkok', country: 'Thailand', lat: 13.76, lng: 100.5 },
  { name: 'Ho Chi Minh City', tz: 'Asia/Ho_Chi_Minh', country: 'Vietnam', lat: 10.82, lng: 106.63 },
  { name: 'Jakarta', tz: 'Asia/Jakarta', country: 'Indonesia', lat: -6.21, lng: 106.85 },
  { name: 'Singapore', tz: 'Asia/Singapore', country: 'Singapore', lat: 1.35, lng: 103.82 },
  { name: 'Manila', tz: 'Asia/Manila', country: 'Philippines', lat: 14.6, lng: 120.98 },
  { name: 'Hong Kong', tz: 'Asia/Hong_Kong', country: 'China', lat: 22.32, lng: 114.17 },
  { name: 'Shanghai', tz: 'Asia/Shanghai', country: 'China', lat: 31.23, lng: 121.47 },
  { name: 'Beijing', tz: 'Asia/Shanghai', country: 'China', lat: 39.9, lng: 116.4 },
  { name: 'Taipei', tz: 'Asia/Taipei', country: 'Taiwan', lat: 25.03, lng: 121.57 },
  { name: 'Seoul', tz: 'Asia/Seoul', country: 'South Korea', lat: 37.57, lng: 126.98 },
  { name: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan', lat: 35.68, lng: 139.69 },
  { name: 'Sydney', tz: 'Australia/Sydney', country: 'Australia', lat: -33.87, lng: 151.21 },
  { name: 'Melbourne', tz: 'Australia/Melbourne', country: 'Australia', lat: -37.81, lng: 144.96 },
  { name: 'Perth', tz: 'Australia/Perth', country: 'Australia', lat: -31.95, lng: 115.86 },
  { name: 'Nouméa', tz: 'Pacific/Noumea', country: 'New Caledonia', lat: -22.28, lng: 166.46 },
  { name: 'Auckland', tz: 'Pacific/Auckland', country: 'New Zealand', lat: -36.85, lng: 174.76 },
  { name: 'Fiji', tz: 'Pacific/Fiji', country: 'Fiji', lat: -18.14, lng: 178.44 },
];

const DEFAULT_WORLD_CLOCK_NAMES = [
  'Honolulu', // UTC−10
  'Anchorage', // UTC−9
  'Los Angeles', // UTC−8
  'Denver', // UTC−7
  'Chicago', // UTC−6
  'New York', // UTC−5
  'Santiago', // UTC−4
  'São Paulo', // UTC−3
  'Accra', // UTC±0 — West Africa (GMT year-round)
  'London', // UTC±0 — Europe
  'Lagos', // UTC+1 — West Africa
  'Paris', // UTC+1 — Europe
  'Cairo', // UTC+2 — North Africa
  'Johannesburg', // UTC+2 — Southern Africa
  'Nairobi', // UTC+3 — East Africa
  'Moscow', // UTC+3 — Europe
  'Tehran', // UTC+3:30
  'Dubai', // UTC+4
  'Karachi', // UTC+5
  'Delhi', // UTC+5:30
  'Dhaka', // UTC+6
  'Bangkok', // UTC+7
  'Shanghai', // UTC+8
  'Tokyo', // UTC+9
  'Sydney', // UTC+10
  'Nouméa', // UTC+11
  'Auckland', // UTC+12
];

/**
 * Default board: major cities west → east, with African hubs for Africa’s
 * main offsets so learners can compare hometowns across the continent.
 */
export const DEFAULT_WORLD_CLOCKS = DEFAULT_WORLD_CLOCK_NAMES.map((name) => {
  const city = WORLD_CITIES.find((c) => c.name === name);
  return {
    name: city.name,
    tz: city.tz,
    lat: city.lat,
    lng: city.lng,
  };
});

/** Set in env when Google Maps Geocoding + Time Zone APIs are enabled. */
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/** Attach map coordinates when a clock was added without lat/lng. */
export function withCityCoords(clock) {
  if (
    clock &&
    Number.isFinite(clock.lat) &&
    Number.isFinite(clock.lng)
  ) {
    return clock;
  }
  const byName = WORLD_CITIES.find(
    (c) => c.name.toLowerCase() === String(clock?.name || '').toLowerCase(),
  );
  if (byName) {
    return { ...clock, lat: byName.lat, lng: byName.lng, tz: clock.tz || byName.tz };
  }
  const byTz = WORLD_CITIES.find((c) => c.tz === clock?.tz);
  if (byTz) {
    return { ...clock, lat: byTz.lat, lng: byTz.lng };
  }
  return clock;
}

/** Equirectangular % placement for map pins (lng −180…180, lat −90…90). */
export function latLngToMapPercent(lat, lng) {
  return {
    left: ((Number(lng) + 180) / 360) * 100,
    top: ((90 - Number(lat)) / 180) * 100,
  };
}

/** Pretty label from an IANA id like Asia/Shanghai → Shanghai. */
function labelFromTimeZoneId(tz) {
  const parts = String(tz).split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts
    .slice(0, -1)
    .join(' · ')
    .replace(/_/g, ' ');
  return { city, region: region || 'Worldwide' };
}

/**
 * Offline search index: curated cities + every IANA zone the browser knows.
 * Prefer curated rows when the same tz appears twice (nicer classroom labels).
 */
export function getSearchableWorldLocations() {
  const byKey = new Map();

  for (const city of WORLD_CITIES) {
    byKey.set(`curated:${city.name.toLowerCase()}`, {
      ...city,
      isFallback: true,
    });
  }

  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    for (const tz of Intl.supportedValuesOf('timeZone')) {
      if (!tz || tz.startsWith('Etc/')) continue;
      const { city, region } = labelFromTimeZoneId(tz);
      const key = `tz:${tz}`;
      if (byKey.has(key)) continue;
      const curatedHit = WORLD_CITIES.some(
        (c) => c.tz === tz && c.name.toLowerCase() === city.toLowerCase(),
      );
      if (curatedHit) continue;
      byKey.set(key, {
        name: city,
        country: region,
        tz,
        isFallback: true,
      });
    }
  }

  return [...byKey.values()];
}

/** Case-insensitive city / country / timezone search for the add-clock modal. */
export function searchWorldLocations(query, { excludeNames = [] } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const excluded = new Set(excludeNames.map((n) => String(n).toLowerCase()));
  return getSearchableWorldLocations()
    .filter((loc) => {
      if (excluded.has(loc.name.toLowerCase())) return false;
      const hay = `${loc.name} ${loc.country || ''} ${loc.tz || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 40);
}
