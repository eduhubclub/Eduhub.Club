/** Default quick-select presets for whole-class timers. */
export const DEFAULT_WHOLE_CLASS_PRESETS = [
  { id: 'p1', label: '30 sec', min: 0.5 },
  { id: 'p2', label: '1 min', min: 1 },
  { id: 'p3', label: '2 min', min: 2 },
  { id: 'p4', label: '5 min', min: 5 },
  { id: 'p5', label: '10 min', min: 10 },
  { id: 'p6', label: '15 min', min: 15 },
];

/** Fallback city list when no Google Maps API key is configured. */
export const WORLD_CITIES = [
  { name: 'Los Angeles', tz: 'America/Los_Angeles', country: 'USA' },
  { name: 'New York', tz: 'America/New_York', country: 'USA' },
  { name: 'London', tz: 'Europe/London', country: 'UK' },
  { name: 'Dubai', tz: 'Asia/Dubai', country: 'UAE' },
  { name: 'Tokyo', tz: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Sydney', tz: 'Australia/Sydney', country: 'Australia' },
  { name: 'Paris', tz: 'Europe/Paris', country: 'France' },
  { name: 'Berlin', tz: 'Europe/Berlin', country: 'Germany' },
  { name: 'Chicago', tz: 'America/Chicago', country: 'USA' },
  { name: 'Denver', tz: 'America/Denver', country: 'USA' },
];

export const DEFAULT_WORLD_CLOCKS = [
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { name: 'New York', tz: 'America/New_York' },
  { name: 'London', tz: 'Europe/London' },
  { name: 'Dubai', tz: 'Asia/Dubai' },
  { name: 'Tokyo', tz: 'Asia/Tokyo' },
  { name: 'Sydney', tz: 'Australia/Sydney' },
];

/** Set in env when Google Maps Geocoding + Time Zone APIs are enabled. */
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
