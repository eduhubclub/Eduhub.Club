import {
  DASHBOARD_WIDGETS,
  MAX_DASHBOARD_WIDGETS,
  isWidgetAvailable,
} from './registry';

const STORAGE_KEY = 'eduHub.dashboardPinnedWidgets';

const DEFAULT_PINNED = ['wheel-of-names'];

function sanitizePinnedIds(ids) {
  if (!Array.isArray(ids)) return [...DEFAULT_PINNED];
  const seen = new Set();
  const next = [];
  for (const id of ids) {
    if (typeof id !== 'string' || seen.has(id)) continue;
    if (!isWidgetAvailable(id)) continue;
    seen.add(id);
    next.push(id);
    if (next.length >= MAX_DASHBOARD_WIDGETS) break;
  }
  return next.length > 0 ? next : [...DEFAULT_PINNED];
}

export function loadPinnedWidgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_PINNED];
    return sanitizePinnedIds(JSON.parse(raw));
  } catch {
    return [...DEFAULT_PINNED];
  }
}

export function savePinnedWidgets(ids) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sanitizePinnedIds(ids))
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Available catalog widgets not yet pinned. */
export function getUnpinnedAvailableWidgets(pinnedIds) {
  const pinned = new Set(pinnedIds);
  return DASHBOARD_WIDGETS.filter(
    (w) => w.available && w.Component && !pinned.has(w.id)
  );
}
