import { describe, expect, it } from 'vitest';
import { resolveStoreWallet, normalizeStoreItem } from './storeModel';

describe('storeModel', () => {
  it('resolves wallet from connections and sync', () => {
    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: true,
        syncToBank: true,
        itemCurrency: 'points',
      }),
    ).toBe('bank');

    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: false,
        syncToBank: false,
        itemCurrency: 'points',
      }),
    ).toBe('bank');

    expect(
      resolveStoreWallet({
        connectBank: false,
        connectBehavior: true,
        syncToBank: false,
        itemCurrency: 'bank',
      }),
    ).toBe('points');

    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: true,
        syncToBank: false,
        itemCurrency: 'points',
      }),
    ).toBe('points');

    expect(
      resolveStoreWallet({
        connectBank: false,
        connectBehavior: false,
        syncToBank: false,
        itemCurrency: 'bank',
      }),
    ).toBe(null);

    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: true,
        syncToBank: false,
        itemCurrency: 'both',
      }),
    ).toBe(null);

    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: true,
        syncToBank: false,
        itemCurrency: 'both',
        preferredWallet: 'points',
      }),
    ).toBe('points');

    expect(
      resolveStoreWallet({
        connectBank: true,
        connectBehavior: true,
        syncToBank: true,
        itemCurrency: 'both',
        preferredWallet: 'points',
      }),
    ).toBe('bank');
  });

  it('normalizes inventory modes', () => {
    const oneOff = normalizeStoreItem({
      id: 'a',
      name: 'Prize',
      inventoryMode: 'oneOff',
      stock: 9,
      price: 5,
    });
    expect(oneOff.stock).toBe(1);
    expect(oneOff.inventoryMode).toBe('oneOff');
  });
});
