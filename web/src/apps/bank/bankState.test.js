import { describe, expect, it } from 'vitest';
import {
  flattenTransactions,
  makeTransaction,
  transactionSortKey,
} from './bankState.js';

describe('transactionSortKey', () => {
  it('prefers at, then parses timestamp ids', () => {
    expect(transactionSortKey({ at: 50, id: 'tx-1' })).toBe(50);
    expect(transactionSortKey({ id: 'tx-1700000000000-ab' })).toBe(1700000000000);
    expect(transactionSortKey({ id: 'tx-student-1' })).toBe(0);
  });
});

describe('flattenTransactions', () => {
  it('lists live Store txs above seeded ledger ids', () => {
    const storeTx = makeTransaction({
      description: 'Store: Lunch',
      amount: 100,
      type: 'deduct',
      at: 1_800_000_000_000,
    });
    const accounts = {
      s1: {
        transactions: [
          storeTx,
          {
            id: 'tx-s1-1',
            date: 'Today',
            description: 'Class Store Purchase',
            amount: 15,
            type: 'deduct',
          },
        ],
      },
    };
    const rows = flattenTransactions(accounts, {
      s1: { id: 's1', firstName: 'Sor', lastName: 'Juana' },
    });
    expect(rows[0].description).toBe('Store: Lunch');
    expect(rows[0].amount).toBe(100);
  });
});
