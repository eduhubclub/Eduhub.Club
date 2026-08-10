/**
 * Resolve a Store catalog image for a Bank ledger row.
 */

import { resolveStoreItemImageSrc } from '../../data/store/demoStoreImages';
import { readCatalog } from '../../data/store/storeStorage';

export function isStoreBankTx(tx) {
  return Boolean(tx?.storeItemId) || String(tx?.description || '').startsWith('Store:');
}

export function resolveStoreBankTxImage(tx) {
  if (!isStoreBankTx(tx)) return '';
  if (tx.imageSrc) return tx.imageSrc;

  const catalog = readCatalog();
  if (tx.storeItemId) {
    const byId = catalog.find((item) => String(item.id) === String(tx.storeItemId));
    const src = resolveStoreItemImageSrc(byId);
    if (src) return src;
  }

  const name = String(tx.description || '')
    .replace(/^Store:\s*/i, '')
    .trim();
  if (!name) return '';
  const byName = catalog.find(
    (item) => String(item.name || '').toLowerCase() === name.toLowerCase(),
  );
  return resolveStoreItemImageSrc(byName);
}
