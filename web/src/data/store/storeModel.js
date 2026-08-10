import { DEMO_STORE_IMAGES } from './demoStoreImages';

/**
 * Edu.Store — item shape, wallet resolution, demo seed catalog.
 */

export const STORE_CURRENCIES = ['bank', 'points', 'both'];
export const STORE_INVENTORY_MODES = ['unlimited', 'limited', 'oneOff'];
export const STORE_VISIBILITY = ['private', 'public'];

export const DEFAULT_STORE_SETTINGS = {
  connectBank: true,
  connectBehavior: true,
  studentSelfServe: false,
  requireApproval: false,
};

export function newStoreItemId() {
  return `store-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeStoreSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    connectBank:
      typeof s.connectBank === 'boolean'
        ? s.connectBank
        : DEFAULT_STORE_SETTINGS.connectBank,
    connectBehavior:
      typeof s.connectBehavior === 'boolean'
        ? s.connectBehavior
        : DEFAULT_STORE_SETTINGS.connectBehavior,
    studentSelfServe:
      typeof s.studentSelfServe === 'boolean'
        ? s.studentSelfServe
        : DEFAULT_STORE_SETTINGS.studentSelfServe,
    requireApproval:
      typeof s.requireApproval === 'boolean'
        ? s.requireApproval
        : DEFAULT_STORE_SETTINGS.requireApproval,
  };
}

export function normalizeStoreItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  const name = String(raw.name || '').trim();
  if (!id || !name) return null;

  const inventoryMode = STORE_INVENTORY_MODES.includes(raw.inventoryMode)
    ? raw.inventoryMode
    : 'unlimited';
  let stock = Math.max(0, Math.floor(Number(raw.stock) || 0));
  if (inventoryMode === 'oneOff') stock = Math.min(stock || 1, 1);
  if (inventoryMode === 'unlimited') stock = 0;

  const currency = STORE_CURRENCIES.includes(raw.currency)
    ? raw.currency
    : 'bank';
  const visibility = STORE_VISIBILITY.includes(raw.visibility)
    ? raw.visibility
    : 'private';

  const imageDataUrl =
    typeof raw.imageDataUrl === 'string' && raw.imageDataUrl.startsWith('data:')
      ? raw.imageDataUrl
      : '';
  let imageUrl =
    typeof raw.imageUrl === 'string' && raw.imageUrl.trim()
      ? raw.imageUrl.trim()
      : '';
  if (!imageDataUrl && !imageUrl && DEMO_STORE_IMAGES[id]) {
    imageUrl = DEMO_STORE_IMAGES[id];
  }

  return {
    id,
    name,
    description: String(raw.description || '').trim(),
    imageDataUrl,
    imageUrl,
    price: Math.max(0, Math.round(Number(raw.price) || 0)),
    currency,
    inventoryMode,
    stock,
    allowRepurchase: Boolean(raw.allowRepurchase),
    visibility,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

/**
 * Single-wallet charge rule (never bank + points together).
 * `itemCurrency: 'both'` means either wallet is allowed — pass `preferredWallet`
 * when the teacher/student picks one at redeem time.
 * @returns {'bank'|'points'|null}
 */
export function resolveStoreWallet({
  connectBank,
  connectBehavior,
  syncToBank,
  itemCurrency,
  preferredWallet = null,
}) {
  if (syncToBank && connectBank) return 'bank';
  if (connectBank && !connectBehavior) return 'bank';
  if (connectBehavior && !connectBank) return 'points';
  if (connectBank && connectBehavior) {
    if (itemCurrency === 'points') return 'points';
    if (itemCurrency === 'both') {
      if (preferredWallet === 'points' || preferredWallet === 'bank') {
        return preferredWallet;
      }
      return null;
    }
    return 'bank';
  }
  return null;
}

/** True when item can be paid with either connected wallet. */
export function itemAllowsEitherWallet(itemCurrency) {
  return itemCurrency === 'both';
}

export function formatStorePrice(item, wallet = null) {
  const n = Math.max(0, Number(item?.price) || 0);
  if (wallet === 'points') return `${n} pt${n === 1 ? '' : 's'}`;
  if (wallet === 'bank') return `$${n}`;
  if (item?.currency === 'both' || item?.currency === 'points') {
    if (item?.currency === 'both') {
      return `$${n} / ${n} pt${n === 1 ? '' : 's'}`;
    }
    return `${n} pt${n === 1 ? '' : 's'}`;
  }
  return `$${n}`;
}

/** Built-in sample catalog when demo data is on / first open empty. */
export function seedStoreCatalogItems() {
  const now = Date.now();
  return [
    normalizeStoreItem({
      id: 'demo-store-pencil',
      name: 'Fancy Pencil',
      description: 'A sparkly pencil from the treasure box.',
      imageUrl: DEMO_STORE_IMAGES['demo-store-pencil'],
      price: 3,
      currency: 'bank',
      inventoryMode: 'unlimited',
      allowRepurchase: true,
      visibility: 'private',
      createdAt: now,
      updatedAt: now,
    }),
    normalizeStoreItem({
      id: 'demo-store-chair',
      name: 'Teacher Chair (1 week)',
      description: 'Sit in the teacher chair for one week.',
      imageUrl: DEMO_STORE_IMAGES['demo-store-chair'],
      price: 25,
      currency: 'bank',
      inventoryMode: 'limited',
      stock: 1,
      allowRepurchase: false,
      visibility: 'private',
      createdAt: now,
      updatedAt: now,
    }),
    normalizeStoreItem({
      id: 'demo-store-lunch',
      name: 'Lunch with Teacher',
      description: 'One-time lunch buddy pass.',
      imageUrl: DEMO_STORE_IMAGES['demo-store-lunch'],
      price: 40,
      currency: 'points',
      inventoryMode: 'oneOff',
      stock: 1,
      allowRepurchase: false,
      visibility: 'private',
      createdAt: now,
      updatedAt: now,
    }),
    normalizeStoreItem({
      id: 'demo-store-hat',
      name: 'Hat Day Pass',
      description: 'Wear a hat in class tomorrow.',
      imageUrl: DEMO_STORE_IMAGES['demo-store-hat'],
      price: 5,
      currency: 'points',
      inventoryMode: 'unlimited',
      allowRepurchase: true,
      visibility: 'public',
      createdAt: now,
      updatedAt: now,
    }),
  ].filter(Boolean);
}
