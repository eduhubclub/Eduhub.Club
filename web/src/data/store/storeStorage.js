/**
 * Edu.Store persistence — catalog, class storefronts, pending, purchases.
 */

import {
  normalizeStoreItem,
  seedStoreCatalogItems,
} from './storeModel';

export const CATALOG_KEY = 'eduHub.store.catalog';
export const STOREFRONT_KEY = 'eduHub.store.storefrontByClass';
export const PENDING_KEY = 'eduHub.store.pendingByClass';
export const PURCHASES_KEY = 'eduHub.store.purchasesByClass';

export const STORE_CATALOG_UPDATED_EVENT = 'eduHub.store.catalog.updated';
export const STORE_STOREFRONT_UPDATED_EVENT = 'eduHub.store.storefront.updated';
export const STORE_PENDING_UPDATED_EVENT = 'eduHub.store.pending.updated';
export const STORE_PURCHASES_UPDATED_EVENT = 'eduHub.store.purchases.updated';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function emit(eventName, detail) {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch {
    /* ignore */
  }
}

export function readCatalog() {
  const raw = readJson(CATALOG_KEY, null);
  if (!Array.isArray(raw)) {
    const seeded = seedStoreCatalogItems();
    writeJson(CATALOG_KEY, seeded);
    return seeded;
  }
  return raw.map(normalizeStoreItem).filter(Boolean);
}

export function writeCatalog(items) {
  const list = (items || []).map(normalizeStoreItem).filter(Boolean);
  writeJson(CATALOG_KEY, list);
  emit(STORE_CATALOG_UPDATED_EVENT, { catalog: list });
  return list;
}

export function upsertCatalogItem(item) {
  const nextItem = normalizeStoreItem({
    ...item,
    updatedAt: Date.now(),
  });
  if (!nextItem) return readCatalog();
  const catalog = readCatalog();
  const idx = catalog.findIndex((i) => i.id === nextItem.id);
  if (idx >= 0) catalog[idx] = nextItem;
  else catalog.unshift(nextItem);
  return writeCatalog(catalog);
}

export function removeCatalogItem(itemId) {
  const id = String(itemId);
  const catalog = readCatalog().filter((i) => i.id !== id);
  writeCatalog(catalog);
  // Drop from all class storefronts
  const fronts = readJson(STOREFRONT_KEY, {});
  let changed = false;
  for (const classId of Object.keys(fronts)) {
    const ids = Array.isArray(fronts[classId]?.itemIds)
      ? fronts[classId].itemIds
      : [];
    const filtered = ids.filter((x) => String(x) !== id);
    if (filtered.length !== ids.length) {
      fronts[classId] = { itemIds: filtered };
      changed = true;
    }
  }
  if (changed) {
    writeJson(STOREFRONT_KEY, fronts);
    emit(STORE_STOREFRONT_UPDATED_EVENT, {});
  }
  return catalog;
}

export function readStorefrontItemIds(classId) {
  if (!classId) return [];
  const all = readJson(STOREFRONT_KEY, {});
  const entry = all[String(classId)];
  return Array.isArray(entry?.itemIds) ? entry.itemIds.map(String) : [];
}

export function writeStorefrontItemIds(classId, itemIds) {
  if (!classId) return [];
  const all = readJson(STOREFRONT_KEY, {});
  const ids = [...new Set((itemIds || []).map(String))];
  all[String(classId)] = { itemIds: ids };
  writeJson(STOREFRONT_KEY, all);
  emit(STORE_STOREFRONT_UPDATED_EVENT, { classId: String(classId), itemIds: ids });
  return ids;
}

export function addItemToStorefront(classId, itemId) {
  const ids = readStorefrontItemIds(classId);
  const id = String(itemId);
  if (!ids.includes(id)) ids.push(id);
  return writeStorefrontItemIds(classId, ids);
}

export function removeItemFromStorefront(classId, itemId) {
  const id = String(itemId);
  return writeStorefrontItemIds(
    classId,
    readStorefrontItemIds(classId).filter((x) => x !== id),
  );
}

/** Resolve storefront listings (catalog items on this class). */
export function getStorefrontItems(classId) {
  ensureDemoClassStorefront(classId);
  const catalog = readCatalog();
  const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
  return readStorefrontItemIds(classId)
    .map((id) => byId[id])
    .filter(Boolean);
}

/** First open of Demo Class storefront gets the seed catalog listings. */
export function ensureDemoClassStorefront(classId) {
  if (String(classId) !== 'demo-3rd-grade') return;
  if (readStorefrontItemIds(classId).length) return;
  const catalog = readCatalog();
  if (!catalog.length) return;
  writeStorefrontItemIds(
    classId,
    catalog.map((i) => i.id),
  );
}

export function readPending(classId) {
  if (!classId) return [];
  const all = readJson(PENDING_KEY, {});
  const list = all[String(classId)];
  return Array.isArray(list) ? list : [];
}

export function writePending(classId, list) {
  if (!classId) return [];
  const all = readJson(PENDING_KEY, {});
  all[String(classId)] = Array.isArray(list) ? list : [];
  writeJson(PENDING_KEY, all);
  emit(STORE_PENDING_UPDATED_EVENT, {
    classId: String(classId),
    pending: all[String(classId)],
  });
  return all[String(classId)];
}

export function readPurchases(classId) {
  if (!classId) return [];
  const all = readJson(PURCHASES_KEY, {});
  const list = all[String(classId)];
  return Array.isArray(list) ? list : [];
}

export function writePurchases(classId, list) {
  if (!classId) return [];
  const all = readJson(PURCHASES_KEY, {});
  all[String(classId)] = Array.isArray(list) ? list.slice(0, 500) : [];
  writeJson(PURCHASES_KEY, all);
  emit(STORE_PURCHASES_UPDATED_EVENT, {
    classId: String(classId),
    purchases: all[String(classId)],
  });
  return all[String(classId)];
}

export function studentHasPurchased(classId, studentId, itemId) {
  const sid = String(studentId);
  const iid = String(itemId);
  return readPurchases(classId).some(
    (p) => String(p.studentId) === sid && String(p.itemId) === iid,
  );
}

export function getRemainingStock(item, classId) {
  if (!item || item.inventoryMode === 'unlimited') return Infinity;
  const base = Number(item.stock) || 0;
  const sold = readPurchases(classId).filter(
    (p) => String(p.itemId) === String(item.id),
  ).length;
  return Math.max(0, base - sold);
}
