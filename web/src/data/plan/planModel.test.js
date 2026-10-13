import { describe, expect, it } from 'vitest';
import {
  advanceDay,
  normalizePlan,
  setItemStatus,
  shiftPlannedItems,
} from './planModel.js';

describe('shiftPlannedItems', () => {
  it('bumps planned items from fromDay onward', () => {
    const plan = normalizePlan({
      items: [
        { id: 'a', dayNumber: 22, status: 'done', resourceIds: [] },
        { id: 'b', dayNumber: 23, status: 'planned', resourceIds: [] },
        { id: 'c', dayNumber: 24, status: 'planned', resourceIds: [] },
      ],
    });
    const next = shiftPlannedItems(plan, 23, 1);
    expect(next.items.find((i) => i.id === 'a').dayNumber).toBe(22);
    expect(next.items.find((i) => i.id === 'b').dayNumber).toBe(24);
    expect(next.items.find((i) => i.id === 'c').dayNumber).toBe(25);
  });
});

describe('setItemStatus', () => {
  it('marks done without shifting by default', () => {
    const plan = normalizePlan({
      items: [
        { id: 'a', dayNumber: 23, status: 'planned', resourceIds: ['r1'] },
        { id: 'b', dayNumber: 23, status: 'planned', resourceIds: ['r2'] },
      ],
    });
    const next = setItemStatus(plan, 'a', 'done');
    expect(next.items.find((i) => i.id === 'a').status).toBe('done');
    expect(next.items.find((i) => i.id === 'b').dayNumber).toBe(23);
  });

  it('can shift remaining planned when done', () => {
    const plan = normalizePlan({
      items: [
        { id: 'a', dayNumber: 23, status: 'planned', resourceIds: [] },
        { id: 'b', dayNumber: 23, status: 'planned', resourceIds: [] },
        { id: 'c', dayNumber: 24, status: 'planned', resourceIds: [] },
      ],
    });
    const next = setItemStatus(plan, 'a', 'done', { shiftRemaining: true });
    expect(next.items.find((i) => i.id === 'a').status).toBe('done');
    expect(next.items.find((i) => i.id === 'b').dayNumber).toBe(24);
    expect(next.items.find((i) => i.id === 'c').dayNumber).toBe(25);
  });

  it('shifts remaining when skipped with shiftRemaining', () => {
    const plan = normalizePlan({
      items: [
        { id: 'a', dayNumber: 23, status: 'planned', resourceIds: [] },
        { id: 'b', dayNumber: 23, status: 'planned', resourceIds: [] },
      ],
    });
    const next = setItemStatus(plan, 'a', 'skipped', { shiftRemaining: true });
    expect(next.items.find((i) => i.id === 'a').status).toBe('skipped');
    expect(next.items.find((i) => i.id === 'b').dayNumber).toBe(24);
  });
});

describe('advanceDay', () => {
  it('shifts the day queue forward', () => {
    const plan = normalizePlan({
      items: [{ id: 'a', dayNumber: 23, status: 'planned', resourceIds: [] }],
    });
    expect(advanceDay(plan, 23).items[0].dayNumber).toBe(24);
  });
});
