import { JOKE_CATALOG } from './jokes';
import { QUOTE_CATALOG } from './quotes';
import { FACT_CATALOG } from './facts';
import { SONG_CATALOG } from './songs';
import { ART_CATALOG } from './art';
import { ANIMAL_CATALOG } from './animals';
import { OF_THE_DAY_TYPES } from '../types';

const BASE = {
  joke: JOKE_CATALOG,
  quote: QUOTE_CATALOG,
  fact: FACT_CATALOG,
  song: SONG_CATALOG,
  art: ART_CATALOG,
  animal: ANIMAL_CATALOG,
  word: [],
};

/**
 * @param {string} type
 * @param {Array<object>} [teacherItems]
 */
export function catalogFor(type, teacherItems = []) {
  const base = BASE[type] || [];
  const extra = (teacherItems || []).filter((item) => item?.type === type);
  return extra.concat(base);
}

/**
 * @param {string} id
 * @param {Array<object>} [teacherItems]
 */
export function findCatalogItem(id, teacherItems = []) {
  if (!id) return null;
  for (const type of OF_THE_DAY_TYPES) {
    const hit = catalogFor(type, teacherItems).find((item) => item.id === id);
    if (hit) return hit;
  }
  return null;
}

export {
  JOKE_CATALOG,
  QUOTE_CATALOG,
  FACT_CATALOG,
  SONG_CATALOG,
  ART_CATALOG,
  ANIMAL_CATALOG,
};
