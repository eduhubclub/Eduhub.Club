import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance, WCAG } from '../../shared/colorContrast.js';
import {
  INK,
  NOTEBOOK_INK,
  PAPER_INK_PALETTE,
  TRACING_INK_COLOR,
  SPACING_SNAPS_IN,
  defaultInkForType,
  ensurePrintSafeInk,
  inkFor,
  isPrintSafeInk,
  isTracingInk,
  normalizePaperSettings,
  snapToStops,
  toPrintGrayHex,
} from './paperModel.js';

describe('print-safe ink', () => {
  it('keeps every swatch except tracing at least AA on white', () => {
    for (const hex of PAPER_INK_PALETTE) {
      if (isTracingInk(hex)) continue;
      expect(contrastRatio(hex, '#ffffff')).toBeGreaterThanOrEqual(WCAG.textAA);
    }
  });

  it('keeps a light tracing gray without darkening it', () => {
    expect(isPrintSafeInk(TRACING_INK_COLOR)).toBe(false);
    expect(ensurePrintSafeInk(TRACING_INK_COLOR)).toBe(TRACING_INK_COLOR);
    expect(normalizePaperSettings({ inkColor: TRACING_INK_COLOR }).inkColor).toBe(
      TRACING_INK_COLOR,
    );
  });

  it('keeps notebook blue and red readable and distinct in gray', () => {
    for (const level of Object.values(INK)) {
      expect(contrastRatio(level.rule, '#ffffff')).toBeGreaterThanOrEqual(
        WCAG.textAA,
      );
      expect(contrastRatio(level.margin, '#ffffff')).toBeGreaterThanOrEqual(
        WCAG.textAA,
      );
      expect(relativeLuminance(level.rule)).toBeGreaterThan(
        relativeLuminance(level.margin) + 0.04,
      );
    }
  });

  it('darkens a washed-out pick so it still prints', () => {
    expect(isPrintSafeInk('#fbbf24')).toBe(false);
    const safe = ensurePrintSafeInk('#fbbf24');
    expect(isPrintSafeInk(safe)).toBe(true);
  });

  it('maps a color to its copier gray', () => {
    expect(toPrintGrayHex('#000000')).toBe('#000000');
    expect(toPrintGrayHex('#ffffff')).toBe('#ffffff');
  });

  it('snaps a slider to nearby common sizes', () => {
    expect(snapToStops(0.26, SPACING_SNAPS_IN, 0.02)).toBe(0.25);
    expect(snapToStops(0.4, SPACING_SNAPS_IN, 0.02)).toBe(0.4);
  });

  it('migrates legacy story picture size stored in spacingIn', () => {
    const s = normalizePaperSettings({
      type: 'story',
      spacingIn: 0.75,
    });
    expect(s.storyBox).toBe('big');
    expect(s.spacingIn).toBe(0.34);
  });

  it('defaults lined to notebook ink and other types to black', () => {
    expect(defaultInkForType('lined')).toBe(NOTEBOOK_INK.rule);
    expect(defaultInkForType('grid')).toBe('#000000');
    expect(inkFor({ type: 'grid', inkColor: '#000000' }).mono.toLowerCase()).toBe(
      '#000000',
    );
    expect(inkFor({ type: 'lined', inkColor: NOTEBOOK_INK.rule }).margin).toBe(
      NOTEBOOK_INK.margin,
    );
  });

  it('lists black and tracing gray first in the palette', () => {
    expect(PAPER_INK_PALETTE[0].toLowerCase()).toBe('#000000');
    expect(PAPER_INK_PALETTE[1].toLowerCase()).toBe(TRACING_INK_COLOR);
  });
});
