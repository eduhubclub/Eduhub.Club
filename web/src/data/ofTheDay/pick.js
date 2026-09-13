import { catalogFor, findCatalogItem } from './catalogs/index';
import { hashKey } from './dateKey';
import { fetchCc0Image } from './media';
import { readDayPicks, readTeacherItems, setDayPick } from './storage';
import { OF_THE_DAY_TYPES } from './types';
import { loadOfTheDayWord, pickWordIdForDate, reshuffleWordId } from './word';

function orderedIds(list, dateKey, type) {
  if (!list.length) return [];
  const start = hashKey(`${dateKey}:${type}`) % list.length;
  return list.slice(start).concat(list.slice(0, start)).map((item) => item.id);
}

function defaultId(type, dateKey, teacherItems) {
  if (type === 'word') return pickWordIdForDate(dateKey);
  const ids = orderedIds(catalogFor(type, teacherItems), dateKey, type);
  return ids[0] || null;
}

/**
 * Resolve catalog id for a type on a date (teacher override wins).
 * @param {string} type
 * @param {string} dateKey
 */
export function resolvePickId(type, dateKey) {
  const overrides = readDayPicks(dateKey);
  if (overrides[type]) return overrides[type];
  return defaultId(type, dateKey, readTeacherItems());
}

/**
 * Next catalog id for reshuffle (skips current).
 * @param {string} type
 * @param {string} dateKey
 */
export function nextPickId(type, dateKey) {
  const teacherItems = readTeacherItems();
  const current = resolvePickId(type, dateKey);
  if (type === 'word') return reshuffleWordId(dateKey, current);
  const ids = orderedIds(catalogFor(type, teacherItems), dateKey, type);
  if (ids.length < 2) return current;
  const idx = Math.max(0, ids.indexOf(current));
  return ids[(idx + 1) % ids.length];
}

/**
 * @param {string} type
 * @param {string} dateKey
 */
export function reshuffleType(type, dateKey) {
  const id = nextPickId(type, dateKey);
  if (id) setDayPick(dateKey, type, id);
  return id;
}

/**
 * Hydrate a catalog row (async for Word / Art / Animal images).
 * @param {string} type
 * @param {string} dateKey
 */
export async function loadTypeItem(type, dateKey) {
  const id = resolvePickId(type, dateKey);
  if (type === 'word') {
    return loadOfTheDayWord({ dateKey, wordId: id });
  }
  const item = findCatalogItem(id, readTeacherItems());
  if (!item) return null;
  if ((type === 'art' || type === 'animal') && !item.imageSrc && item.searchQuery) {
    const pic = await fetchCc0Image(item.searchQuery);
    if (pic) {
      return {
        ...item,
        imageSrc: pic.thumb,
        imageAttribution: `${pic.license}${pic.title ? ` · ${pic.title}` : ''}`,
        imageSourceUrl: pic.sourceUrl,
      };
    }
  }
  return item;
}

/**
 * @param {string} dateKey
 */
export async function loadTodayItems(dateKey) {
  const entries = await Promise.all(
    OF_THE_DAY_TYPES.map(async (type) => [type, await loadTypeItem(type, dateKey)]),
  );
  return Object.fromEntries(entries);
}

/**
 * Today + upcoming days for one type (type-tab week preview).
 * @param {string} type
 * @param {string[]} dateKeys
 */
export async function loadTypeRange(type, dateKeys) {
  const keys = Array.isArray(dateKeys) ? dateKeys : [];
  return Promise.all(
    keys.map(async (dateKey) => ({
      dateKey,
      item: await loadTypeItem(type, dateKey),
    })),
  );
}
