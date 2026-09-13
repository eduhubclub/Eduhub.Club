import { describe, expect, it } from 'vitest';
import {
  LAB_CAPACITY_CELL_PX,
  LAB_CELL_PX,
  LAB_COLS,
  LAB_GAP_PX,
  LAB_REFERENCE_STAGE,
  labAbsoluteMaxPins,
  labAcceptsPins,
  labCanAddPin,
  labCapacityBySize,
  labFitBoard,
  labFindFirstFit,
  labGetRect,
  labHasCollision,
  labMaxPinsForUniformSize,
  labPackPins,
  labSeedSpan,
} from './boardLayoutLab';

describe('boardLayoutLab', () => {
  it('seeds S/M/L/Banner spans and swaps axes when vertical', () => {
    expect(labSeedSpan({ size: 's' })).toEqual({ w: 4, h: 4 });
    expect(labSeedSpan({ size: 'm' })).toEqual({ w: 6, h: 4 });
    expect(labSeedSpan({ size: 'l' })).toEqual({ w: 12, h: 8 });
    expect(labSeedSpan({ size: 'banner' })).toEqual({ w: 12, h: 4 });
    expect(labSeedSpan({ size: 'm', orientation: 'vertical' })).toEqual({
      w: 4,
      h: 6,
    });
    expect(labSeedSpan({ size: 'l', orientation: 'vertical' })).toEqual({
      w: 8,
      h: 12,
    });
    expect(labSeedSpan({ size: 'banner', orientation: 'vertical' })).toEqual({
      w: 4,
      h: 12,
    });
    expect(labSeedSpan({ size: 's', orientation: 'vertical' })).toEqual({
      w: 4,
      h: 4,
    });
  });

  it('packs without content mins and uses stored layout when free', () => {
    const pins = [
      { id: 'a', size: 'm', layout: { col: 0, row: 0, w: 4, h: 2 } },
      { id: 'b', size: 's', layout: { col: 4, row: 0, w: 2, h: 2 } },
    ];
    const { placements } = labPackPins(pins);
    expect(placements).toEqual([
      { id: 'a', col: 0, row: 0, w: 4, h: 2 },
      { id: 'b', col: 4, row: 0, w: 2, h: 2 },
    ]);
  });

  it('refits when stored layout collides', () => {
    const pins = [
      { id: 'a', size: 'm', layout: { col: 0, row: 0, w: 4, h: 2 } },
      { id: 'b', size: 'm', layout: { col: 0, row: 0, w: 4, h: 2 } },
    ];
    const { placements } = labPackPins(pins);
    expect(placements[0]).toMatchObject({ id: 'a', col: 0, row: 0 });
    expect(placements[1].id).toBe('b');
    expect(placements[1].col !== 0 || placements[1].row !== 0).toBe(true);
  });

  it('fills the stage width and height (no horizontal compression)', () => {
    const pins = [
      { id: 'a', size: 'banner', layout: { col: 0, row: 0, w: 12, h: 4 } },
      { id: 'b', size: 'm', layout: { col: 0, row: 4, w: 6, h: 4 } },
    ];
    const fit = labFitBoard({ pins, width: 960, height: 640 });
    expect(fit.scale).toBe(1);
    expect(fit.cols).toBe(LAB_COLS);
    expect(fit.overflows).toBe(false);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe(0);
    expect(fit.boardW).toBeCloseTo(960, 0);
    expect(fit.boardH).toBeCloseTo(640, 0);
    expect(fit.cellW).toBeCloseTo((960 - LAB_GAP_PX * 11) / LAB_COLS, 5);
    expect(fit.cellH).toBeGreaterThan(0);
  });

  it('still fills a tight stage with no scroll', () => {
    const pins = [
      { id: 'a', size: 'l', layout: { col: 0, row: 0, w: 12, h: 8 } },
      { id: 'b', size: 'l', layout: { col: 0, row: 8, w: 12, h: 8 } },
    ];
    const fit = labFitBoard({ pins, width: 200, height: 100 });
    expect(fit.overflows).toBe(false);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe(0);
    expect(fit.boardW).toBeCloseTo(200, 0);
    expect(fit.boardH).toBeCloseTo(100, 0);
    expect(fit.overCapacity).toBe(true);
    expect(Math.min(fit.cellW, fit.cellH)).toBeLessThan(LAB_CAPACITY_CELL_PX);
    expect(fit.scale).toBe(1);
  });

  it('computes uniform S/M/L/Banner capacity and prefers more small cards', () => {
    const caps = labCapacityBySize(
      LAB_REFERENCE_STAGE.width,
      LAB_REFERENCE_STAGE.height,
    );
    expect(caps.s).toBeGreaterThan(0);
    expect(caps.m).toBeGreaterThan(0);
    expect(caps.l).toBeGreaterThan(0);
    expect(caps.banner).toBeGreaterThan(0);
    expect(caps.s).toBeGreaterThanOrEqual(caps.m);
    expect(caps.m).toBeGreaterThanOrEqual(caps.l);
    expect(labMaxPinsForUniformSize('s')).toBe(caps.s);
    expect(labAbsoluteMaxPins()).toBe(
      Math.max(caps.s, caps.m, caps.l, caps.banner),
    );
  });

  it('blocks adds past fit or absolute ceiling', () => {
    const absolute = labAbsoluteMaxPins(2000, 2000);
    const pins = Array.from({ length: absolute }, (_, i) => ({
      id: `p${i}`,
      type: 'custom',
      size: 's',
      layout: { col: (i % 6) * 2, row: Math.floor(i / 6) * 2, w: 2, h: 2 },
    }));
    expect(labAcceptsPins(pins, 2000, 2000).ok).toBe(true);
    expect(labCanAddPin(pins, { type: 'custom', size: 's' }, 2000, 2000)).toMatchObject({
      ok: false,
      reason: 'max',
    });

    const tall = [
      { id: 'x', type: 'custom', size: 'l', layout: { col: 0, row: 0, w: 6, h: 3 } },
      { id: 'y', type: 'custom', size: 'l', layout: { col: 6, row: 0, w: 6, h: 3 } },
      { id: 'z', type: 'custom', size: 'l', layout: { col: 0, row: 3, w: 6, h: 3 } },
      { id: 'w', type: 'custom', size: 'l', layout: { col: 6, row: 3, w: 6, h: 3 } },
      { id: 'v', type: 'custom', size: 'l', layout: { col: 0, row: 6, w: 6, h: 3 } },
    ];
    expect(
      labAcceptsPins(tall, LAB_REFERENCE_STAGE.width, 200, {
        cellPx: LAB_CAPACITY_CELL_PX,
      }).ok,
    ).toBe(false);
  });

  it('blocks duplicate built-in types when adding', () => {
    const pins = [
      { id: 'a', type: 'date', size: 'm', layout: { col: 0, row: 0, w: 4, h: 2 } },
    ];
    expect(labCanAddPin(pins, { type: 'date', size: 'm' }, 2000, 2000)).toMatchObject({
      ok: false,
      reason: 'duplicate',
    });
    expect(labCanAddPin(pins, { type: 'timer', size: 's' }, 2000, 2000).ok).toBe(true);
  });

  it('rejects colliding candidates', () => {
    const occupied = [{ id: 'a', col: 0, row: 0, w: 4, h: 2 }];
    expect(labHasCollision(occupied, { col: 2, row: 0, w: 2, h: 2 }, 'b')).toBe(
      true,
    );
    expect(labHasCollision(occupied, { col: 4, row: 0, w: 2, h: 2 }, 'b')).toBe(
      false,
    );
  });

  it('findFirstFit and getRect helpers', () => {
    const first = labFindFirstFit([], 4, 2);
    expect(first).toEqual({ col: 0, row: 0, w: 4, h: 2 });
    expect(labGetRect({ size: 's' })).toEqual({ col: 0, row: 0, w: 4, h: 4 });
    expect(labGetRect({ layout: { col: 3, row: 1, w: 2, h: 2 } })).toEqual({
      col: 3,
      row: 1,
      w: 2,
      h: 2,
    });
  });
});
