import { describe, expect, it } from 'vitest';
import {
  buildPaperSheet,
  countPrimitivesOfKind,
  fitGridCount,
  LINED_HEADING_IN,
  LINED_MARGIN_IN,
} from './paperGeometry.js';
import { pagePoints, DEFAULT_SPACING_IN, PT_PER_IN } from './paperModel.js';

describe('pagePoints', () => {
  it('is Letter 8.5×11 portrait and swaps for landscape', () => {
    const p = pagePoints('portrait');
    expect(p.width).toBeCloseTo(8.5 * 72);
    expect(p.height).toBeCloseTo(11 * 72);
    const l = pagePoints('landscape');
    expect(l.width).toBe(p.height);
    expect(l.height).toBe(p.width);
  });
});

describe('buildPaperSheet', () => {
  it('draws blue rules and a red margin on lined paper', () => {
    const sheet = buildPaperSheet({
      type: 'lined',
      spacingIn: DEFAULT_SPACING_IN.lined,
      header: false,
    });
    const lines = sheet.primitives.filter((p) => p.kind === 'line');
    expect(lines.length).toBeGreaterThan(10);
    expect(lines.some((l) => l.stroke === '#2563eb')).toBe(true);
    expect(lines.some((l) => l.stroke === '#991b1b')).toBe(true);
    const rules = lines.filter((l) => l.stroke === '#2563eb');
    const margins = lines.filter((l) => l.stroke === '#991b1b');
    const heading = LINED_HEADING_IN * PT_PER_IN;
    const leftX = LINED_MARGIN_IN * PT_PER_IN;
    expect(rules.some((l) => l.x1 === 0 && l.x2 === sheet.width)).toBe(true);
    expect(rules.every((l) => l.y1 < sheet.height - 0.05)).toBe(true);
    expect(rules.every((l) => l.y1 >= heading - 0.05)).toBe(true);
    expect(margins).toHaveLength(2);
    expect(margins[0].x1).toBeCloseTo(leftX);
    expect(margins[0].y1).toBeCloseTo(0);
    expect(margins[0].y2).toBeCloseTo(sheet.height);
    expect(margins[1].x1).toBeCloseTo(sheet.width - leftX);
    expect(margins[1].opacity).toBe(0.5);
  });

  it('left-aligns Name and Date on non-lined headers', () => {
    const marginIn = 0.5;
    const sheet = buildPaperSheet({ type: 'calendar', header: true, marginIn });
    const m = marginIn * PT_PER_IN;
    const name = sheet.primitives.find((p) => p.kind === 'text' && p.text === 'Name');
    const date = sheet.primitives.find((p) => p.kind === 'text' && p.text === 'Date');
    expect(name.x).toBeCloseTo(m);
    expect(date.x).toBeCloseTo(m);
    expect(date.y).toBeGreaterThan(name.y);
  });

  it('keeps a quarter inch under the header, then centers leftover', () => {
    const marginIn = 0.5;
    const sheet = buildPaperSheet({ type: 'grid', header: true, marginIn });
    const m = marginIn * PT_PER_IN;
    const date = sheet.primitives.find((p) => p.kind === 'text' && p.text === 'Date');
    const dateLine = sheet.primitives.find(
      (p) =>
        p.kind === 'line' &&
        Math.abs(p.y1 - p.y2) < 0.01 &&
        Math.abs(p.y1 - (date.y + 4)) < 1,
    );
    const contentTop = dateLine.y1 + 0.25 * PT_PER_IN;
    const gridHoriz = sheet.primitives.filter(
      (p) =>
        p.kind === 'line' &&
        Math.abs(p.y1 - p.y2) < 0.01 &&
        p.x2 - p.x1 > 400 &&
        p.y1 >= contentTop - 0.05,
    );
    const ys = [...new Set(gridHoriz.map((l) => l.y1))].sort((a, b) => a - b);
    const contentBottom = sheet.height - m;
    expect(ys[0]).toBeGreaterThanOrEqual(contentTop - 0.05);
    expect(ys[0] - contentTop).toBeCloseTo(contentBottom - ys[ys.length - 1]);
  });

  it('draws grid cells at the requested inch size, centered', () => {
    const spacingIn = 1;
    const marginIn = 0.5;
    const sheet = buildPaperSheet({
      type: 'grid',
      spacingIn,
      marginIn,
      header: false,
    });
    const m = marginIn * PT_PER_IN;
    const step = spacingIn * PT_PER_IN;
    const verts = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.x1 - p.x2) < 0.01,
    );
    const horiz = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.y1 - p.y2) < 0.01,
    );
    const xs = [...new Set(verts.map((l) => l.x1))].sort((a, b) => a - b);
    const ys = [...new Set(horiz.map((l) => l.y1))].sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBeCloseTo(step);
    expect(xs[0] - m).toBeCloseTo(sheet.width - m - xs[xs.length - 1]);
    expect(ys[0] - m).toBeCloseTo(sheet.height - m - ys[ys.length - 1]);
  });

  it('picks a whole number of grid cells', () => {
    expect(fitGridCount(100, 13)).toBe(8);
    expect(fitGridCount(100, 13, 5)).toBe(10);
  });

  it('tints rules with a custom ink color', () => {
    const sheet = buildPaperSheet({
      type: 'grid',
      inkColor: '#047857',
      ink: 'medium',
      header: false,
    });
    const lines = sheet.primitives.filter((p) => p.kind === 'line');
    expect(lines.some((l) => l.stroke === '#047857')).toBe(true);
  });

  it('adds a name/date header when enabled', () => {
    const on = buildPaperSheet({ type: 'blank', header: true });
    const off = buildPaperSheet({ type: 'blank', header: false });
    expect(countPrimitivesOfKind(on, 'text')).toBeGreaterThan(0);
    expect(countPrimitivesOfKind(off, 'text')).toBe(0);
  });

  it('boxes handwriting rows', () => {
    const sheet = buildPaperSheet({ type: 'handwriting', header: false });
    expect(countPrimitivesOfKind(sheet, 'rect')).toBeGreaterThan(0);
  });

  it('centers handwriting when it does not fill the page', () => {
    const marginIn = 0.25;
    const sheet = buildPaperSheet({
      type: 'handwriting',
      spacingIn: 0.75,
      marginIn,
      header: false,
    });
    const m = marginIn * PT_PER_IN;
    const boxes = sheet.primitives.filter((p) => p.kind === 'rect');
    const ys = boxes.map((b) => b.y).sort((a, b) => a - b);
    const first = ys[0];
    const last = ys[ys.length - 1] + boxes[0].h;
    expect(first - m).toBeCloseTo(sheet.height - m - last, 0);
  });

  it('aligns isometric verticals and adds top/bottom borders', () => {
    const spacingIn = 0.28;
    const marginIn = 0.75;
    const sheet = buildPaperSheet({
      type: 'isometric',
      spacingIn,
      marginIn,
      header: false,
    });
    const m = marginIn * PT_PER_IN;
    const step = spacingIn * PT_PER_IN;
    const verts = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.x1 - p.x2) < 0.01,
    );
    const horiz = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.y1 - p.y2) < 0.01,
    );
    const xs = [...new Set(verts.map((l) => l.x1))].sort((a, b) => a - b);
    const ys = [...new Set(horiz.map((l) => l.y1))].sort((a, b) => a - b);
    expect(xs.length).toBeGreaterThan(2);
    expect(xs[1] - xs[0]).toBeCloseTo(step);
    expect(xs[0] - m).toBeCloseTo(sheet.width - m - xs[xs.length - 1]);
    expect(ys).toHaveLength(2);
    expect(ys[0] - m).toBeCloseTo(sheet.height - m - ys[1]);
  });

  it('builds story paper with a drawing box and lined writing', () => {
    const marginIn = 0.5;
    const sheet = buildPaperSheet({
      type: 'story',
      spacingIn: 0.34,
      storyBox: 'medium',
      marginIn,
      header: false,
      inkColor: '#2563eb',
    });
    const m = marginIn * PT_PER_IN;
    const boxes = sheet.primitives.filter((p) => p.kind === 'rect');
    expect(boxes.length).toBe(1);
    expect(boxes[0].x).toBeCloseTo(m);
    expect(boxes[0].w).toBeCloseTo(sheet.width - 2 * m);
    const rules = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.y1 - p.y2) < 0.01 && p.stroke === '#2563eb',
    );
    const margins = sheet.primitives.filter(
      (p) => p.kind === 'line' && Math.abs(p.x1 - p.x2) < 0.01 && p.stroke === '#991b1b',
    );
    expect(rules.length).toBeGreaterThan(3);
    expect(margins.length).toBe(2);
    expect(Math.min(...rules.map((l) => l.y1))).toBeGreaterThan(
      boxes[0].y + boxes[0].h + 0.3 * PT_PER_IN,
    );
    // Writing rules share the picture’s side margins and meet the bottom margin.
    expect(rules[0].x1).toBeCloseTo(m);
    expect(rules[0].x2).toBeCloseTo(sheet.width - m);
    const lastY = Math.max(...rules.map((l) => l.y1));
    expect(lastY).toBeCloseTo(sheet.height - m, 5);
    expect(Math.max(...margins.map((l) => l.y2))).toBeCloseTo(lastY, 5);
  });

  it('draws bolder x and y axes on graph paper', () => {
    for (const spacingIn of [0.125, 0.28, 0.5]) {
      const sheet = buildPaperSheet({
        type: 'graph',
        spacingIn,
        marginIn: 0.5,
        header: true,
        strokePt: 1,
      });
      const step = spacingIn * 72;
      const verts = sheet.primitives.filter(
        (p) => p.kind === 'line' && Math.abs(p.x1 - p.x2) < 0.01,
      );
      const horiz = sheet.primitives.filter(
        (p) => p.kind === 'line' && Math.abs(p.y1 - p.y2) < 0.01,
      );
      const maxV = Math.max(...verts.map((l) => l.width));
      const maxH = Math.max(...horiz.map((l) => l.width));
      expect(maxV).toBeGreaterThan(1.5);
      expect(maxH).toBeGreaterThan(1.5);
      const boldV = verts.filter((l) => l.width === maxV);
      const boldH = horiz.filter((l) => l.width === maxH);
      expect(boldV).toHaveLength(1);
      expect(boldH).toHaveLength(1);
      const gridLeft = Math.min(...horiz.map((l) => l.x1));
      const gridRight = Math.max(...horiz.map((l) => l.x2));
      const gridTop = Math.min(...verts.map((l) => l.y1));
      const gridBottom = Math.max(...verts.map((l) => l.y2));
      // Axis on nearest center grid line (within half a cell when count is odd).
      expect(Math.abs(boldV[0].x1 - (gridLeft + gridRight) / 2)).toBeLessThan(step * 0.51);
      expect(Math.abs(boldH[0].y1 - (gridTop + gridBottom) / 2)).toBeLessThan(step * 0.51);
      // Grid uses the full content height to within one cell.
      const contentBottom = sheet.height - 0.5 * 72;
      expect(gridBottom).toBeGreaterThan(contentBottom - step);
    }
  });

  it('builds each paper type without throwing', () => {
    const types = [
      'lined',
      'primary',
      'handwriting',
      'boxes',
      'dots',
      'grid',
      'graph',
      'isometric',
      'hex',
      'story',
      'cornell',
      'calendar',
      'numberLine',
      'music',
      'blank',
    ];
    for (const type of types) {
      const sheet = buildPaperSheet({ type, header: false });
      expect(sheet.width).toBeGreaterThan(0);
      expect(Array.isArray(sheet.primitives)).toBe(true);
    }
  });

  it('builds a blank monthly calendar grid', () => {
    const sheet = buildPaperSheet({
      type: 'calendar',
      header: false,
      marginIn: 0.5,
    });
    const cells = sheet.primitives.filter((p) => p.kind === 'rect');
    const labels = sheet.primitives.filter((p) => p.kind === 'text');
    expect(cells).toHaveLength(42);
    expect(labels.some((t) => t.text === 'Month')).toBe(true);
    expect(labels.filter((t) => t.text === 'S')).toHaveLength(2);
  });

  it('draws instructions above the pattern', () => {
    const sheet = buildPaperSheet({
      type: 'grid',
      header: false,
      marginIn: 0.5,
      instructionsEnabled: true,
      instructions: 'Write three facts about frogs.',
    });
    const note = sheet.primitives.find(
      (p) => p.kind === 'text' && p.text.includes('frogs'),
    );
    expect(note).toBeTruthy();
    const gridLines = sheet.primitives.filter((p) => p.kind === 'line');
    const topGrid = Math.min(...gridLines.map((l) => Math.min(l.y1, l.y2)));
    expect(note.y).toBeLessThan(topGrid);
  });

  it('sits lined instructions on the blue rules and wraps at the red margin', () => {
    const sheet = buildPaperSheet({
      type: 'lined',
      header: true,
      instructionsEnabled: true,
      instructions:
        'Here are your directions. They are very well written and will amaze your friends?',
    });
    const m = LINED_MARGIN_IN * PT_PER_IN;
    const rules = sheet.primitives
      .filter(
        (p) =>
          p.kind === 'line' &&
          Math.abs(p.y1 - p.y2) < 0.01 &&
          p.x1 === 0,
      )
      .sort((a, b) => a.y1 - b.y1);
    const notes = sheet.primitives.filter(
      (p) =>
        p.kind === 'text' &&
        p.text !== 'Name' &&
        p.text !== 'Date',
    );
    expect(notes.length).toBeGreaterThan(1);
    for (const note of notes) {
      expect(note.x).toBeCloseTo(m + 12);
      const nearest = rules.reduce((best, rule) =>
        Math.abs(rule.y1 - (note.y + 3)) < Math.abs(best.y1 - (note.y + 3))
          ? rule
          : best,
      );
      expect(Math.abs(nearest.y1 - (note.y + 3))).toBeLessThan(0.5);
    }
    // First rule keeps Name/Date; directions start on the next rule.
    expect(Math.min(...notes.map((n) => n.y))).toBeGreaterThan(rules[0].y1 - 1);
  });
});
