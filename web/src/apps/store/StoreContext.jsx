import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addItemToStorefront,
  getStorefrontItems,
  readCatalog,
  readPending,
  readPurchases,
  readStorefrontItemIds,
  removeCatalogItem,
  removeItemFromStorefront,
  upsertCatalogItem,
  writeStorefrontItemIds,
  ensureDemoClassStorefront,
  STORE_CATALOG_UPDATED_EVENT,
  STORE_PENDING_UPDATED_EVENT,
  STORE_PURCHASES_UPDATED_EVENT,
  STORE_STOREFRONT_UPDATED_EVENT,
} from '../../data/store/storeStorage';
import {
  readStoreSettings,
  writeStoreSettings,
  STORE_SETTINGS_UPDATED_EVENT,
} from '../../data/store/storeSettings';
import {
  approvePendingRedeem,
  denyPendingRedeem,
  redeemStoreItem,
} from '../../data/store/redeem';
import { newStoreItemId, normalizeStoreItem } from '../../data/store/storeModel';

const StoreContext = createContext(null);

export function StoreProvider({ roster, classId, children }) {
  const [catalog, setCatalog] = useState(readCatalog);
  const [storefrontIds, setStorefrontIds] = useState(() =>
    readStorefrontItemIds(classId),
  );
  const [pending, setPending] = useState(() => readPending(classId));
  const [purchases, setPurchases] = useState(() => readPurchases(classId));
  const [settings, setSettings] = useState(readStoreSettings);

  useEffect(() => {
    ensureDemoClassStorefront(classId);
    setStorefrontIds(readStorefrontItemIds(classId));
    setPending(readPending(classId));
    setPurchases(readPurchases(classId));
  }, [classId]);

  useEffect(() => {
    const refreshCatalog = () => setCatalog(readCatalog());
    const refreshSettings = () => setSettings(readStoreSettings());
    const refreshFront = () => setStorefrontIds(readStorefrontItemIds(classId));
    const refreshPending = () => setPending(readPending(classId));
    const refreshPurchases = () => setPurchases(readPurchases(classId));

    window.addEventListener(STORE_CATALOG_UPDATED_EVENT, refreshCatalog);
    window.addEventListener(STORE_SETTINGS_UPDATED_EVENT, refreshSettings);
    window.addEventListener(STORE_STOREFRONT_UPDATED_EVENT, refreshFront);
    window.addEventListener(STORE_PENDING_UPDATED_EVENT, refreshPending);
    window.addEventListener(STORE_PURCHASES_UPDATED_EVENT, refreshPurchases);
    return () => {
      window.removeEventListener(STORE_CATALOG_UPDATED_EVENT, refreshCatalog);
      window.removeEventListener(STORE_SETTINGS_UPDATED_EVENT, refreshSettings);
      window.removeEventListener(STORE_STOREFRONT_UPDATED_EVENT, refreshFront);
      window.removeEventListener(STORE_PENDING_UPDATED_EVENT, refreshPending);
      window.removeEventListener(STORE_PURCHASES_UPDATED_EVENT, refreshPurchases);
    };
  }, [classId]);

  const storefrontItems = useMemo(() => {
    const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
    return storefrontIds.map((id) => byId[id]).filter(Boolean);
  }, [catalog, storefrontIds]);

  const saveItem = useCallback((raw) => {
    const item = normalizeStoreItem({
      ...raw,
      id: raw.id || newStoreItemId(),
      createdAt: raw.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
    if (!item) return null;
    upsertCatalogItem(item);
    setCatalog(readCatalog());
    return item;
  }, []);

  const deleteItem = useCallback((itemId) => {
    removeCatalogItem(itemId);
    setCatalog(readCatalog());
    setStorefrontIds(readStorefrontItemIds(classId));
  }, [classId]);

  const addToClassStorefront = useCallback(
    (itemId) => {
      if (!classId) return;
      setStorefrontIds(addItemToStorefront(classId, itemId));
    },
    [classId],
  );

  const removeFromClassStorefront = useCallback(
    (itemId) => {
      if (!classId) return;
      setStorefrontIds(removeItemFromStorefront(classId, itemId));
    },
    [classId],
  );

  const setClassStorefront = useCallback(
    (itemIds) => {
      if (!classId) return;
      setStorefrontIds(writeStorefrontItemIds(classId, itemIds));
    },
    [classId],
  );

  const updateSettings = useCallback((patch) => {
    setSettings(writeStoreSettings(patch));
  }, []);

  const redeem = useCallback(
    (args) =>
      redeemStoreItem({
        classId,
        roster,
        ...args,
      }),
    [classId, roster],
  );

  const approvePending = useCallback(
    (pendingId) => approvePendingRedeem({ classId, roster, pendingId }),
    [classId, roster],
  );

  const denyPending = useCallback(
    (pendingId) => denyPendingRedeem({ classId, pendingId }),
    [classId],
  );

  const value = useMemo(
    () => ({
      classId,
      roster,
      catalog,
      storefrontItems,
      storefrontIds,
      pending,
      purchases,
      settings,
      saveItem,
      deleteItem,
      addToClassStorefront,
      removeFromClassStorefront,
      setClassStorefront,
      updateSettings,
      redeem,
      approvePending,
      denyPending,
      reloadCatalog: () => setCatalog(readCatalog()),
      // escape hatch for embeds without provider
      getStorefrontItems: () => getStorefrontItems(classId),
    }),
    [
      classId,
      roster,
      catalog,
      storefrontItems,
      storefrontIds,
      pending,
      purchases,
      settings,
      saveItem,
      deleteItem,
      addToClassStorefront,
      removeFromClassStorefront,
      setClassStorefront,
      updateSettings,
      redeem,
      approvePending,
      denyPending,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

/** Optional hook for embeds that may run without StoreProvider. */
export function useStoreOptional() {
  return useContext(StoreContext);
}
