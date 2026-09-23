import { describe, expect, it, beforeEach } from 'vitest';
import { isValidMood, HEADSPACE_MOODS } from './moods.js';
import {
  clearHeadspaceStorage,
  getPet,
  savePet,
  addEntry,
  shareEntry,
  listEntries,
  listSharedEntries,
  createRequest,
  getRequest,
  cancelRequest,
  submitEntry,
  declineRequest,
  REQUEST_STATUS,
  ENTRY_STATUS,
} from './headspaceStorage.js';

beforeEach(() => {
  clearHeadspaceStorage();
});

describe('moods', () => {
  it('validates known mood ids', () => {
    expect(HEADSPACE_MOODS.length).toBeGreaterThan(0);
    expect(isValidMood('glad')).toBe(true);
    expect(isValidMood('nope')).toBe(false);
  });
});

describe('pets', () => {
  it('saves and loads a pet with eyes and strokes', () => {
    const saved = savePet('c1', 's1', {
      rockId: 'boulder',
      name: 'Rocky',
      eyes: [
        { x: 35, y: 40 },
        { x: 55, y: 42 },
      ],
      strokes: [
        {
          type: 'pen',
          color: '#ef4444',
          size: 4,
          points: [
            { x: 0.1, y: 0.2 },
            { x: 0.3, y: 0.4 },
          ],
        },
      ],
    });
    expect(saved.name).toBe('Rocky');
    expect(saved.eyes).toHaveLength(2);
    expect(getPet('c1', 's1')?.rockId).toBe('boulder');
    expect(getPet('c1', 's1')?.strokes[0].points[0].x).toBeCloseTo(0.1);
  });

  it('clamps eyes to 0–100 and keeps at most two', () => {
    const saved = savePet('c1', 's1', {
      rockId: 'river',
      name: 'Pebble',
      eyes: [
        { x: -10, y: 200 },
        { x: 50, y: 50 },
        { x: 90, y: 90 },
      ],
    });
    expect(saved.eyes).toHaveLength(2);
    expect(saved.eyes[0]).toEqual({ x: 0, y: 100 });
  });
});

describe('entries + sharing', () => {
  it('adds a private entry by default', () => {
    const entry = addEntry('c1', 's1', { mood: 'okay', body: 'Hello rock' });
    expect(entry.status).toBe(ENTRY_STATUS.private);
    expect(listEntries('c1', 's1')).toHaveLength(1);
    expect(listSharedEntries('c1')).toHaveLength(0);
  });

  it('shares an entry to the teacher inbox', () => {
    const entry = addEntry('c1', 's1', { mood: 'glad', body: 'Today was fun' });
    shareEntry('c1', 's1', entry.id);
    expect(listEntries('c1', 's1')[0].status).toBe(ENTRY_STATUS.shared);
    expect(listSharedEntries('c1')).toHaveLength(1);
  });

  it('requires mood and body', () => {
    expect(() => addEntry('c1', 's1', { mood: '', body: 'x' })).toThrow(/mood/);
    expect(() => addEntry('c1', 's1', { mood: 'glad', body: '  ' })).toThrow(/body/);
  });
});

describe('requests', () => {
  it('creates a pending request and cancels it', () => {
    const req = createRequest('c1', 's1', 'Please check in');
    expect(getRequest('c1', 's1')?.status).toBe(REQUEST_STATUS.pending);
    expect(req.note).toBe('Please check in');
    cancelRequest('c1', 's1');
    expect(getRequest('c1', 's1')).toBeNull();
  });

  it('fulfills a pending request when the student sends an entry', () => {
    createRequest('c1', 's1');
    const entry = submitEntry('c1', 's1', {
      mood: 'tired',
      body: 'Long day',
      share: true,
    });
    expect(entry.status).toBe(ENTRY_STATUS.shared);
    expect(entry.requestId).toBeTruthy();
    expect(getRequest('c1', 's1')?.status).toBe(REQUEST_STATUS.fulfilled);
  });

  it('keeps private submit from fulfilling a request', () => {
    createRequest('c1', 's1');
    submitEntry('c1', 's1', { mood: 'mad', body: 'Not sharing yet', share: false });
    expect(getRequest('c1', 's1')?.status).toBe(REQUEST_STATUS.pending);
  });

  it('declines a request', () => {
    createRequest('c1', 's1');
    declineRequest('c1', 's1');
    expect(getRequest('c1', 's1')?.status).toBe(REQUEST_STATUS.declined);
  });
});
