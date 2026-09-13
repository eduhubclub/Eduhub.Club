import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
} from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

/** @typedef {{ place: string, lat: number, lon: number, unit: 'f' | 'c' }} WeatherProps */

const FETCH_MS = 12_000;

/**
 * @param {unknown} props
 * @returns {WeatherProps}
 */
export function normalizeWeatherProps(props) {
  const raw = props && typeof props === 'object' ? props : {};
  const unit = raw.unit === 'c' ? 'c' : 'f';
  const latRaw = raw.lat;
  const lonRaw = raw.lon;
  const lat = latRaw == null || latRaw === '' ? NaN : Number(latRaw);
  const lon = lonRaw == null || lonRaw === '' ? NaN : Number(lonRaw);
  return {
    place: typeof raw.place === 'string' ? raw.place.trim() : '',
    lat: Number.isFinite(lat) ? lat : NaN,
    lon: Number.isFinite(lon) ? lon : NaN,
    unit,
  };
}

/**
 * Open-Meteo WMO weather code → label + icon.
 * @param {number} code
 */
export function weatherFromCode(code) {
  const n = Number(code);
  if (n === 0) return { label: 'Clear', Icon: Sun };
  if (n === 1 || n === 2) return { label: 'Partly cloudy', Icon: CloudSun };
  if (n === 3) return { label: 'Cloudy', Icon: Cloud };
  if (n === 45 || n === 48) return { label: 'Foggy', Icon: CloudFog };
  if (n >= 51 && n <= 67) return { label: 'Rain', Icon: CloudRain };
  if (n >= 71 && n <= 77) return { label: 'Snow', Icon: CloudSnow };
  if (n >= 80 && n <= 82) return { label: 'Showers', Icon: CloudRain };
  if (n >= 85 && n <= 86) return { label: 'Snow showers', Icon: CloudSnow };
  if (n >= 95) return { label: 'Thunderstorm', Icon: CloudLightning };
  return { label: 'Windy', Icon: Wind };
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function weatherErrorMessage(err) {
  const name = err && typeof err === 'object' ? String(err.name || '') : '';
  const msg = err && typeof err === 'object' ? String(err.message || '') : String(err || '');
  const lower = msg.toLowerCase();
  if (
    name === 'TimeoutError' ||
    name === 'AbortError' ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  ) {
    return 'Weather took too long. Check the place in Edit board, then try again.';
  }
  if (lower.includes('place not found') || lower.includes('not found')) {
    return 'Place not found. Try a city name in Edit board.';
  }
  if (lower.includes('add a place') || lower.includes('no place')) {
    return 'Add a city in Edit board to show weather.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Could not reach weather service. Check the network and try again.';
  }
  return msg || 'Could not load weather.';
}

/**
 * @param {string} url
 * @param {number} [ms]
 */
async function fetchJson(url, ms = FETCH_MS) {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('Weather request failed');
    return await res.json();
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error('Timeout');
      err.name = 'TimeoutError';
      throw err;
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * @param {string} query
 * @returns {Promise<{ place: string, lat: number, lon: number } | null>}
 */
export async function geocodePlace(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  const hit = Array.isArray(data?.results) ? data.results[0] : null;
  if (!hit) return null;
  const parts = [hit.name, hit.admin1, hit.country_code].filter(Boolean);
  return {
    place: parts.join(', '),
    lat: Number(hit.latitude),
    lon: Number(hit.longitude),
  };
}

/**
 * @param {{ lat: number, lon: number, unit: 'f' | 'c' }} args
 */
export async function fetchCurrentWeather({ lat, lon, unit }) {
  const tempUnit = unit === 'c' ? 'celsius' : 'fahrenheit';
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=mph&timezone=auto`;
  const data = await fetchJson(url);
  const current = data?.current;
  if (!current) throw new Error('No current weather');
  return {
    temp: Number(current.temperature_2m),
    code: Number(current.weather_code),
    wind: Number(current.wind_speed_10m),
  };
}

/**
 * Live local weather for the morning board (Open-Meteo, no API key).
 * Requires a place set in Edit board — device geolocation is not used (often times out on panels).
 */
export function WeatherWidget({ theme, pin }) {
  const cfg = normalizeWeatherProps(pin?.props);
  const [status, setStatus] = useState(/** @type {'idle' | 'loading' | 'ready' | 'error'} */ ('idle'));
  const [error, setError] = useState('');
  const [place, setPlace] = useState(cfg.place);
  const [temp, setTemp] = useState(/** @type {number | null} */ (null));
  const [code, setCode] = useState(0);
  const [wind, setWind] = useState(/** @type {number | null} */ (null));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError('');
      try {
        let lat = cfg.lat;
        let lon = cfg.lon;
        let label = cfg.place;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          if (!cfg.place) {
            throw new Error('Add a place in Edit board');
          }
          const geo = await geocodePlace(cfg.place);
          if (!geo) throw new Error('Place not found');
          lat = geo.lat;
          lon = geo.lon;
          label = geo.place;
        }

        const weather = await fetchCurrentWeather({
          lat,
          lon,
          unit: cfg.unit,
        });
        if (cancelled) return;
        setPlace(label);
        setTemp(weather.temp);
        setCode(weather.code);
        setWind(weather.wind);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(weatherErrorMessage(e));
      }
    }

    load();
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [cfg.place, cfg.lat, cfg.lon, cfg.unit]);

  const { label, Icon } = weatherFromCode(code);
  const unitLabel = cfg.unit === 'c' ? 'C' : 'F';

  return (
    <WidgetShell theme={theme} title="Weather" icon={CloudSun} pin={pin}>
      {status === 'loading' || status === 'idle' ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>Loading weather…</p>
      ) : status === 'error' ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{error}</p>
      ) : (
        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`inline-flex rounded-lg p-1.5 shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
            >
              <Icon size={22} />
            </span>
            <p
              className={`font-semibold text-3xl sm:text-4xl tabular-nums leading-none ${theme.colorOnSurface}`}
            >
              {temp == null || Number.isNaN(temp) ? '—' : `${Math.round(temp)}°`}
              <span className={`${TYPE.labelMd} ml-0.5 align-top opacity-70`}>{unitLabel}</span>
            </p>
          </div>
          <p className={`${TYPE.titleSm} leading-snug ${theme.colorOnSurface}`}>{label}</p>
          {place ? (
            <p className={`${TYPE.bodySm} truncate ${theme.colorOnSurfaceVariant}`}>{place}</p>
          ) : null}
          {wind != null && !Number.isNaN(wind) ? (
            <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
              Wind {Math.round(wind)} mph
            </p>
          ) : null}
        </div>
      )}
    </WidgetShell>
  );
}
