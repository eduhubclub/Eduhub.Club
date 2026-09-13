import { describe, expect, it, beforeEach } from 'vitest';
import { JOKE_CATALOG } from './catalogs/jokes';
import { addDaysToDateKey, hashKey, localDateKey, weekPreviewKeys } from './dateKey';
import { catalogFor } from './catalogs/index';
import { nextPickId, resolvePickId } from './pick';
import {
  addTeacherItem,
  readCommunityItems,
  readDayPicks,
  readTeacherItems,
  saveSet,
  setDayPick,
  setTeacherItemVisibility,
  writeDayPicks,
} from './storage';

describe('ofTheDay', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('ships 365 jokes', () => {
    expect(JOKE_CATALOG).toHaveLength(365);
    expect(new Set(JOKE_CATALOG.map((j) => j.id)).size).toBe(365);
  });

  it('picks the same catalog id for the same day', () => {
    const a = resolvePickId('joke', '2026-08-16');
    const b = resolvePickId('joke', '2026-08-16');
    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).not.toBe(resolvePickId('joke', '2026-08-17'));
  });

  it('reshuffle stores a different joke id', () => {
    const first = resolvePickId('joke', '2026-01-01');
    const next = nextPickId('joke', '2026-01-01');
    expect(next).toBeTruthy();
    expect(next).not.toBe(first);
    setDayPick('2026-01-01', 'joke', next);
    expect(readDayPicks('2026-01-01').joke).toBe(next);
    expect(resolvePickId('joke', '2026-01-01')).toBe(next);
  });

  it('saves and reapplies a teacher set', () => {
    writeDayPicks('2026-08-16', { joke: 'joke-001', fact: 'fact-001' });
    const row = saveSet({ label: 'Open house', picks: readDayPicks('2026-08-16') });
    expect(row.label).toBe('Open house');
    writeDayPicks('2026-08-17', { joke: 'joke-002' });
    writeDayPicks('2026-08-17', row.picks);
    expect(readDayPicks('2026-08-17').joke).toBe('joke-001');
  });

  it('hashes stably and has catalogs for each static type', () => {
    expect(hashKey('a')).toBe(hashKey('a'));
    expect(localDateKey(new Date(2026, 0, 2))).toBe('2026-01-02');
    expect(addDaysToDateKey('2026-08-16', 1)).toBe('2026-08-17');
    expect(addDaysToDateKey('2026-08-30', 2)).toBe('2026-09-01');
    expect(weekPreviewKeys('2026-08-16', 7)).toEqual([
      '2026-08-16',
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
    ]);
    expect(catalogFor('quote').length).toBeGreaterThan(10);
    expect(catalogFor('fact').length).toBeGreaterThan(10);
    expect(catalogFor('song').length).toBeGreaterThan(10);
    expect(catalogFor('art').length).toBeGreaterThan(10);
    expect(catalogFor('animal').length).toBeGreaterThan(10);
  });

  it('puts teacher items at the front of the catalog', () => {
    const item = addTeacherItem({ type: 'joke', title: 'Class pun', body: 'We made it up.' });
    expect(item?.id).toBeTruthy();
    expect(addTeacherItem({ type: 'word', title: 'apple' })).toBeNull();
    const list = catalogFor('joke', readTeacherItems());
    expect(list[0].title).toBe('Class pun');
  });

  it('lists public teacher items in Community', () => {
    addTeacherItem({ type: 'joke', title: 'Private pun', body: 'Keep it.' });
    const pub = addTeacherItem({
      type: 'quote',
      title: 'Class motto',
      body: 'Be kind.',
      visibility: 'public',
    });
    expect(readCommunityItems().map((row) => row.id)).toEqual([pub.id]);
    setTeacherItemVisibility(pub.id, 'private');
    expect(readCommunityItems()).toEqual([]);
  });
});
