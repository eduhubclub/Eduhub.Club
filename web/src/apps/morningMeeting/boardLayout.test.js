import { describe, expect, it } from 'vitest';
import {
  contentMinSpan,
  effectiveRect,
  fitBoardLayout,
  hasCollision,
  packPins,
  rectsOverlap,
  seedSpan,
} from './boardLayout';

describe('boardLayout', () => {
  it('seeds S square, M, L, and Banner spans', () => {
    expect(seedSpan({ size: 's' })).toEqual({ w: 2, h: 2 });
    expect(seedSpan({ size: 'm', orientation: 'horizontal' })).toEqual({ w: 4, h: 2 });
    expect(seedSpan({ size: 'l' })).toEqual({ w: 6, h: 3 });
    expect(seedSpan({ size: 'banner' })).toEqual({ w: 12, h: 1 });
  });

  it('fits text cards to copy; image makes a square min', () => {
    const short = contentMinSpan({
      type: 'message',
      props: { text: 'Hi' },
    });
    expect(short.w).toBeGreaterThanOrEqual(1);
    expect(short.h).toBeGreaterThanOrEqual(2);
    expect(short.w).toBeLessThan(12);

    const long = contentMinSpan({
      type: 'message',
      props: {
        text: 'Welcome to morning meeting. Hang up your backpack and begin your work quietly.',
      },
    });
    expect(long.w * long.h).toBeGreaterThan(short.w * short.h);

    const withImage = contentMinSpan({
      type: 'custom',
      props: { text: 'Photo day', imageSrc: 'https://example.com/a.png' },
    });
    expect(withImage.w).toBe(withImage.h);
    expect(withImage.w).toBeGreaterThanOrEqual(4);
  });

  it('cannot effective-shrink a text card below content min', () => {
    const pin = {
      type: 'message',
      props: { text: 'Line one\nLine two\nLine three\nLine four' },
      layout: { col: 0, row: 0, w: 1, h: 1 },
    };
    const min = contentMinSpan(pin);
    const eff = effectiveRect(pin);
    expect(eff.w).toBeGreaterThanOrEqual(min.w);
    expect(eff.h).toBeGreaterThanOrEqual(min.h);
  });

  it('gives Today a min that fits weekday and date', () => {
    const min = contentMinSpan({ type: 'date', size: 'm' });
    expect(min.w).toBeGreaterThanOrEqual(3);
    expect(min.h).toBeGreaterThanOrEqual(3);
    const eff = effectiveRect({
      type: 'date',
      layout: { col: 0, row: 0, w: 2, h: 2 },
    });
    expect(eff.w).toBeGreaterThanOrEqual(min.w);
    expect(eff.h).toBeGreaterThanOrEqual(min.h);
  });

  it('packs three mediums using stored or seeded layouts', () => {
    const pins = [
      { id: 'a', size: 'm', type: 'timer' },
      { id: 'b', size: 'm', type: 'timer' },
      { id: 'c', size: 'm', type: 'timer' },
    ];
    const { placements } = packPins(pins);
    expect(placements).toHaveLength(3);
    expect(placements[0].col).toBe(0);
    expect(placements[1].col).toBeGreaterThan(placements[0].col);
  });

  it('keeps teacher box when larger than content min', () => {
    const pin = {
      id: 'd',
      type: 'date',
      size: 'l',
      layout: { col: 0, row: 0, w: 6, h: 8 },
    };
    expect(effectiveRect(pin, {})).toMatchObject({ w: 6, h: 8 });
  });

  it('detects collisions and respects exclude id', () => {
    const a = { id: 'a', col: 0, row: 0, w: 4, h: 2 };
    const b = { id: 'b', col: 2, row: 0, w: 4, h: 2 };
    expect(rectsOverlap(a, b)).toBe(true);
    expect(hasCollision([a, b], { col: 2, row: 0, w: 4, h: 2 }, 'b')).toBe(true);
    expect(hasCollision([a], { col: 4, row: 0, w: 4, h: 2 }, 'x')).toBe(false);
  });

  it('fits a short board and centers vertically when there is spare height', () => {
    const pins = [
      { id: 'a', type: 'timer', layout: { col: 0, row: 0, w: 3, h: 3 } },
      { id: 'b', type: 'timer', layout: { col: 3, row: 0, w: 3, h: 3 } },
    ];
    const tall = fitBoardLayout({ pins, width: 960, height: 800 });
    expect(tall.cellW * tall.scale).toBeGreaterThanOrEqual(52 - 0.5);
    expect(tall.overflows).toBe(false);
    expect(tall.offsetY).toBeGreaterThan(0);
  });

  it('does not scale cells below the readable floor', () => {
    const pins = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      type: 'date',
      layout: { col: 0, row: i * 4, w: 4, h: 4 },
    }));
    const cramped = fitBoardLayout({ pins, width: 400, height: 200 });
    expect(cramped.cellW * cramped.scale).toBeGreaterThanOrEqual(52 - 0.5);
    expect(cramped.overflows).toBe(true);
  });
});
