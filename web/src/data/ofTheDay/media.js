/**
 * CC0 / public-domain images via Openverse, then Wikimedia Commons
 * (same approach as Dictionary).
 */

const STORAGE_KEY = 'eduHub.ofTheDay.images';

/**
 * @typedef {{ url: string, thumb: string, title: string, license: string, sourceUrl: string }} OfTheDayImage
 */

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

function remember(query, value) {
  const cache = readCache();
  cache[query] = value;
  writeCache(cache);
  return value;
}

function isPublicDomainLicense(name) {
  const n = String(name || '').toLowerCase();
  return (
    n.includes('cc0') ||
    n.includes('cc zero') ||
    n.includes('public domain') ||
    n.includes('pdm') ||
    n.includes('pd-')
  );
}

function pickOpenverse(results) {
  const rows = Array.isArray(results) ? results : [];
  for (const row of rows) {
    const thumb = String(row?.thumbnail || row?.url || '').trim();
    const url = String(row?.url || thumb).trim();
    if (!thumb && !url) continue;
    const license = String(row?.license || 'cc0').toUpperCase().replace('_', '-');
    const ok =
      license.includes('CC0') ||
      license === 'PDM' ||
      license.includes('PUBLIC DOMAIN');
    if (!ok) continue;
    return {
      url,
      thumb: thumb || url,
      title: String(row?.title || '').trim() || 'Public domain image',
      license: license === 'PDM' ? 'Public Domain' : license,
      sourceUrl: String(row?.foreign_landing_url || row?.license_url || url).trim(),
    };
  }
  return null;
}

async function fromOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm&page_size=8`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return pickOpenverse(data?.results);
}

function pickCommons(pages) {
  const list = pages && typeof pages === 'object' ? Object.values(pages) : [];
  for (const page of list) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata || {};
    const license = meta.LicenseShortName?.value || meta.UsageTerms?.value || '';
    if (!isPublicDomainLicense(license)) continue;
    const thumb = String(info.thumburl || info.url || '').trim();
    const url = String(info.url || thumb).trim();
    if (!thumb && !url) continue;
    return {
      url,
      thumb: thumb || url,
      title: String(page.title || '').replace(/^File:/, '').trim() || 'Wikimedia Commons',
      license: /cc0/i.test(license) ? 'CC0' : 'Public Domain',
      sourceUrl: String(info.descriptionshorturl || info.descriptionurl || url).trim(),
    };
  }
  return null;
}

async function fromCommons(query) {
  const search = encodeURIComponent(`${query} filetype:bitmap`);
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    `&generator=search&gsrnamespace=6&gsrsearch=${search}&gsrlimit=10` +
    '&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=800';
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return pickCommons(data?.query?.pages);
}

/**
 * @param {string} query
 * @returns {Promise<OfTheDayImage | null>}
 */
export async function fetchCc0Image(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const cache = readCache();
  if (Object.prototype.hasOwnProperty.call(cache, q)) return cache[q];

  try {
    const openverse = await fromOpenverse(q);
    if (openverse) return remember(q, openverse);
  } catch {
    /* fall through */
  }

  try {
    const commons = await fromCommons(q);
    if (commons) return remember(q, commons);
  } catch {
    /* fall through */
  }

  return remember(q, null);
}
