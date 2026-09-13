import { describe, expect, it, beforeEach } from 'vitest';
import {
  addPin,
  defaultPins,
  ensureBoard,
  movePin,
  readBoard,
  removePin,
  reorderPin,
  setBoardBackground,
  setPinLayout,
  setPinOrientation,
  setPinSize,
  updatePin,
} from './morningMeetingStorage';
import { contentMinSpan } from './boardLayout';

describe('morningMeetingStorage', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('seeds default pins with layouts on first ensure', () => {
    const board = ensureBoard('c1');
    expect(board.pins.length).toBe(defaultPins().length);
    expect(board.pins.map((p) => p.type)).toEqual([
      'date',
      'novelty',
      'message',
      'attendance',
      'lunch',
    ]);
    expect(board.pins.every((p) => p.layout && p.layout.w >= 1)).toBe(true);
    expect(board.pins.find((p) => p.type === 'message')?.size).toBe('s');
    expect(ensureBoard('c1').pins.length).toBe(board.pins.length);
  });

  it('adds, resizes, updates message, and removes pins', () => {
    ensureBoard('c1');
    const withJobs = addPin('c1', { type: 'jobs', size: 'm' });
    const job = withJobs.pins.find((p) => p.type === 'jobs');
    expect(job).toBeTruthy();
    expect(job.layout).toBeTruthy();

    setPinSize('c1', job.id, 'l');
    expect(readBoard('c1').pins.find((p) => p.id === job.id)?.size).toBe('l');
    expect(readBoard('c1').pins.find((p) => p.id === job.id)?.layout?.w).toBe(6);

    const message = readBoard('c1').pins.find((p) => p.type === 'message');
    updatePin('c1', message.id, { props: { text: 'Line up quietly.' } });
    expect(readBoard('c1').pins.find((p) => p.id === message.id)?.props.text).toBe(
      'Line up quietly.',
    );

    removePin('c1', job.id);
    expect(readBoard('c1').pins.some((p) => p.id === job.id)).toBe(false);
  });

  it('re-seeds size only before layout is customized', () => {
    ensureBoard('c1');
    const date = readBoard('c1').pins.find((p) => p.type === 'date');
    setPinSize('c1', date.id, 's');
    const afterS = readBoard('c1').pins.find((p) => p.id === date.id);
    const min = contentMinSpan(afterS);
    expect(afterS?.layout?.w).toBeGreaterThanOrEqual(min.w);
    expect(afterS?.layout?.h).toBeGreaterThanOrEqual(min.h);

    setPinLayout('c1', date.id, { col: 1, row: 0, w: 5, h: 4 });
    expect(readBoard('c1').pins.find((p) => p.id === date.id)?.layoutCustomized).toBe(true);

    setPinSize('c1', date.id, 'banner');
    const after = readBoard('c1').pins.find((p) => p.id === date.id);
    expect(after?.size).toBe('banner');
    expect(after?.layout).toMatchObject({ col: 1, row: 0, w: 5, h: 4 });
  });

  it('clamps message layout to text content min (cannot override floor)', () => {
    ensureBoard('c1');
    const message = readBoard('c1').pins.find((p) => p.type === 'message');
    updatePin('c1', message.id, {
      props: {
        text: 'Hang up backpacks.\nStart morning work.\nBe ready for the rug.',
      },
    });
    const pin = readBoard('c1').pins.find((p) => p.id === message.id);
    const min = contentMinSpan(pin);
    setPinLayout('c1', message.id, { col: 0, row: 0, w: 1, h: 1 });
    const stored = readBoard('c1').pins.find((p) => p.id === message.id)?.layout;
    expect(stored?.w).toBeGreaterThanOrEqual(min.w);
    expect(stored?.h).toBeGreaterThanOrEqual(min.h);
  });

  it('allows only one pin per built-in widget type', () => {
    ensureBoard('c1');
    const before = readBoard('c1').pins.length;
    addPin('c1', { type: 'date', size: 'm' });
    expect(readBoard('c1').pins.filter((p) => p.type === 'date')).toHaveLength(1);
    expect(readBoard('c1').pins.length).toBe(before);
  });

  it('allows multiple custom cards and persists background', () => {
    ensureBoard('c1');
    addPin('c1', { type: 'custom', size: 'm', props: { title: 'Schedule' } });
    addPin('c1', {
      type: 'custom',
      size: 'm',
      props: { title: 'Photo', studentId: 'stu-1' },
    });
    const customs = readBoard('c1').pins.filter((p) => p.type === 'custom');
    expect(customs).toHaveLength(2);
    expect(customs[1].props.studentId).toBe('stu-1');

    setPinOrientation('c1', customs[1].id, 'vertical');
    expect(readBoard('c1').pins.find((p) => p.id === customs[1].id)?.orientation).toBe(
      'vertical',
    );

    setBoardBackground('c1', 'https://example.com/bg.jpg');
    expect(readBoard('c1').backgroundSrc).toBe('https://example.com/bg.jpg');

    const message = readBoard('c1').pins.find((p) => p.type === 'message');
    updatePin('c1', message.id, { props: { imageSrc: 'https://example.com/a.png' } });
    expect(readBoard('c1').pins.find((p) => p.id === message.id)?.props.imageSrc).toBe(
      'https://example.com/a.png',
    );
    expect(readBoard('c1').backgroundSrc).toBe('https://example.com/bg.jpg');
  });

  it('reorders pins', () => {
    ensureBoard('c1');
    const list = readBoard('c1').pins;
    const first = list[0];
    const second = list[1];
    reorderPin('c1', second.id, first.id);
    expect(readBoard('c1').pins[0].id).toBe(second.id);
    movePin('c1', second.id, 1);
    expect(readBoard('c1').pins[1].id).toBe(second.id);
  });
});
