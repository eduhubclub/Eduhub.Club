import { imageLooksAdult, readDictionaryAge } from './ageFilter';
import { normalizeLookup } from './spellingBank';

const STORAGE_KEY = 'eduHub.dictionary.images';

/**
 * @typedef {{ url: string, thumb: string, title: string, license: string, sourceUrl: string }} DictionaryImage
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

function remember(word, value) {
  const cache = readCache();
  cache[word] = value;
  writeCache(cache);
  return value;
}

function skipAdultImage(title, extra = '') {
  return readDictionaryAge() !== 'all' && imageLooksAdult(title, extra);
}

function openverseTags(row) {
  const tags = Array.isArray(row?.tags) ? row.tags : [];
  return tags.map((tag) => (typeof tag === 'string' ? tag : tag?.name || '')).join(' ');
}

function pickOpenverse(results) {
  const rows = Array.isArray(results) ? results : [];
  for (const row of rows) {
    const thumb = String(row?.thumbnail || row?.url || '').trim();
    const url = String(row?.url || thumb).trim();
    if (!thumb && !url) continue;
    const title = String(row?.title || '').trim() || 'Public domain image';
    if (skipAdultImage(title, openverseTags(row))) continue;
    const license = String(row?.license || 'cc0').toUpperCase().replace('_', '-');
    return {
      url,
      thumb: thumb || url,
      title,
      license: license === 'PDM' ? 'Public Domain' : license,
      sourceUrl: String(row?.foreign_landing_url || row?.license_url || url).trim(),
    };
  }
  return null;
}

async function fromOpenverse(word) {
  const queries = [word, `${word} illustration`];
  for (const q of queries) {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm&page_size=5`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const hit = pickOpenverse(data?.results);
    if (hit) return hit;
  }
  return null;
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
    const title =
      String(page.title || '').replace(/^File:/, '').trim() || 'Wikimedia Commons';
    if (skipAdultImage(title)) continue;
    return {
      url,
      thumb: thumb || url,
      title,
      license: /cc0/i.test(license) ? 'CC0' : 'Public Domain',
      sourceUrl: String(info.descriptionshorturl || info.descriptionurl || url).trim(),
    };
  }
  return null;
}

async function fromCommons(word) {
  const search = encodeURIComponent(`${word} filetype:bitmap`);
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    `&generator=search&gsrnamespace=6&gsrsearch=${search}&gsrlimit=10` +
    '&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=400';
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return pickCommons(data?.query?.pages);
}

/**
 * One public-domain picture for `word`. Cached in localStorage.
 * @param {string} raw
 * @returns {Promise<DictionaryImage | null>}
 */
export async function fetchWordImage(raw) {
  const word = normalizeLookup(raw);
  if (!word) return null;
  const cache = readCache();
  if (Object.prototype.hasOwnProperty.call(cache, word)) {
    const cached = cache[word];
    if (cached && skipAdultImage(cached.title)) return null;
    return cached;
  }

  try {
    const openverse = await fromOpenverse(word);
    if (openverse) return remember(word, openverse);
  } catch {
    /* fall through */
  }

  try {
    const commons = await fromCommons(word);
    if (commons) return remember(word, commons);
  } catch {
    /* fall through */
  }

  return remember(word, null);
}
