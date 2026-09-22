import { peterRabbitClassic } from './peterRabbit';

/**
 * Classics available in Type a Classic.
 * Add new titles as modules and push them here — progress keys by classic.id.
 */
export const CLASSICS_CATALOG = [peterRabbitClassic];

export function getClassic(id) {
  return CLASSICS_CATALOG.find((c) => c.id === id) || null;
}

export function classicPageCount(classic) {
  return classic?.pages?.length || 0;
}

export function classicCharCount(classic) {
  if (!classic?.pages) return 0;
  return classic.pages.reduce((sum, page) => sum + String(page.text || '').length, 0);
}
