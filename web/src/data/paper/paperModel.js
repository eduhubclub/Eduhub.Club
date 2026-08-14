/**
 * Edu.Paper — Letter sheet settings, ink, and type catalog.
 * Units: inches for spacing/margins; PDF points (72pt = 1in) at draw time.
 */

import { contrastRatio, relativeLuminance, WCAG } from '../../shared/colorContrast';
import { PRIMARY_DARK_HEX, PRIMARY_KEYS } from '../../shared/theme';

export const PT_PER_IN = 72;
export const LETTER_IN = { width: 8.5, height: 11 };

/** Printable page sizes (portrait inches). */
export const PAPER_SIZES = [
  { id: 'letter', label: 'Letter', widthIn: 8.5, heightIn: 11, hint: '8.5 × 11 in' },
  { id: 'legal', label: 'Legal', widthIn: 8.5, heightIn: 14, hint: '8.5 × 14 in' },
  { id: 'tabloid', label: 'Tabloid', widthIn: 11, heightIn: 17, hint: '11 × 17 in' },
  { id: 'a4', label: 'A4', widthIn: 210 / 25.4, heightIn: 297 / 25.4, hint: '210 × 297 mm' },
];

export function paperSizeById(id) {
  return PAPER_SIZES.find((s) => s.id === id) || PAPER_SIZES[0];
}

export const PAPER_TYPES = [
  { id: 'lined', label: 'Lined' },
  { id: 'primary', label: 'Primary' },
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'graph', label: 'Graph' },
  { id: 'isometric', label: 'Isometric' },
  { id: 'hex', label: 'Hex' },
  { id: 'story', label: 'Story' },
  { id: 'cornell', label: 'Cornell' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'numberLine', label: 'Number line' },
  { id: 'music', label: 'Music' },
  { id: 'blank', label: 'Blank' },
];

export const INK_LEVELS = ['light', 'medium', 'dark'];

/**
 * Print-safe ruling: ≥ 4.5:1 on white, and blue vs red differ in grayscale.
 * Reds are darker than blues so the margin still reads after a B&W copy.
 */
export const INK = {
  light: {
    rule: '#2563eb',
    margin: '#991b1b',
    mid: '#be123c',
    mono: '#475569',
  },
  medium: {
    rule: '#1d4ed8',
    margin: '#7f1d1d',
    mid: '#9f1239',
    mono: '#334155',
  },
  dark: {
    rule: '#1e40af',
    margin: '#450a0a',
    mid: '#881337',
    mono: '#0f172a',
  },
};

/** Soft gray for tracing overlays — intentionally below AA on white. */
export const TRACING_INK_COLOR = '#d1d5db';

/** Brand primary 800s + slate; black & tracing lead for quick picks. */
export const PAPER_INK_PALETTE = [
  '#000000',
  TRACING_INK_COLOR,
  ...PRIMARY_KEYS.map((key) => PRIMARY_DARK_HEX[key]),
  '#1e293b',
];

export function isTracingInk(hex) {
  return normalizeHex(hex) === TRACING_INK_COLOR;
}

/** Classic notebook: lighter blue rules + red margin. */
export const NOTEBOOK_INK = {
  id: 'notebook',
  rule: INK.light.rule,
  margin: INK.light.margin,
  mid: INK.light.mid,
  mono: INK.light.mono,
  label: 'Blue & red',
};

/** Default seed for most paper types. Lined uses notebook blue/red instead. */
export const DEFAULT_INK_COLOR = '#000000';

export function defaultInkForType(type) {
  return type === 'lined' ? NOTEBOOK_INK.rule : DEFAULT_INK_COLOR;
}
export const DEFAULT_SPACING_IN = {
  lined: 0.34,
  primary: 0.72,
  handwriting: 0.68,
  boxes: 0.48,
  dots: 0.25,
  grid: 0.25,
  graph: 0.125,
  isometric: 0.28,
  hex: 0.3,
  story: 0.34,
  cornell: 0.32,
  calendar: 0.34,
  numberLine: 0.22,
  music: 0.14,
  blank: 0.34,
};

/** Story picture box sizes (independent of writing-line spacing). */
export const STORY_BOX_SIZES = [
  { id: 'big', label: 'Big' },
  { id: 'medium', label: 'Medium' },
  { id: 'small', label: 'Small' },
];
/** Fraction of content height for the drawing box. */
export const STORY_BOX_RATIO = {
  big: 0.55,
  medium: 0.4,
  small: 0.24,
};
/** Gap between drawing box and first writing line. */
export const STORY_GAP_IN = 0.4;

export function normalizeStoryBox(value) {
  if (value === 'big' || value === 'medium' || value === 'small') return value;
  // Legacy: picture size was stored in spacingIn snaps.
  if (value === 0.75 || value === '0.75') return 'big';
  if (value === 0.25 || value === '0.25') return 'small';
  return 'medium';
}

export function pagePoints(orientation, pageSize = 'letter') {
  const size = paperSizeById(pageSize);
  const w = size.widthIn * PT_PER_IN;
  const h = size.heightIn * PT_PER_IN;
  return orientation === 'landscape'
    ? { width: h, height: w }
    : { width: w, height: h };
}

export function defaultPaperSettings() {
  return {
    type: 'lined',
    orientation: 'portrait',
    spacingIn: DEFAULT_SPACING_IN.lined,
    marginIn: 0.5,
    strokePt: 0.9,
    ink: 'medium',
    inkColor: defaultInkForType('lined'),
    header: true,
    instructionsEnabled: false,
    instructions: '',
    storyBox: 'medium',
    pageSize: 'letter',
    pages: 1,
  };
}

export function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/** Common classroom ruling sizes (inches). */
export const SPACING_SNAPS_IN = [
  0.125, 0.2, 0.25, 0.28, 0.34, 0.375, 0.5, 0.625, 0.75, 1,
];
export const SPACING_SNAP_LABELS = {
  0.125: '1/8 in',
  0.2: '5 mm',
  0.25: '1/4 in',
  0.28: 'College',
  0.34: 'Wide',
  0.375: '3/8 in',
  0.5: '1/2 in',
  0.625: '5/8 in',
  0.75: '3/4 in',
  1: '1 in',
};

export const MARGIN_SNAPS_IN = [0.25, 0.5, 0.75, 1, 1.25];
export const MARGIN_SNAP_LABELS = {
  0.25: '1/4 in',
  0.5: '1/2 in',
  0.75: '3/4 in',
  1: '1 in',
  1.25: '1 1/4 in',
};

export const STROKE_SNAPS_PT = [0.5, 0.75, 0.9, 1, 1.5, 2];
export const STROKE_SNAP_LABELS = {
  0.5: 'Hairline',
  0.75: 'Fine',
  0.9: 'Medium',
  1: '1 pt',
  1.5: 'Bold',
  2: 'Heavy',
};

/**
 * Stick to the nearest common size when the slider is close enough.
 */
export function snapToStops(value, stops, radius) {
  if (!Array.isArray(stops) || !stops.length || !Number.isFinite(value)) {
    return value;
  }
  let best = value;
  let bestDist = radius;
  for (const stop of stops) {
    const d = Math.abs(stop - value);
    if (d <= bestDist) {
      bestDist = d;
      best = stop;
    }
  }
  return best;
}

export function labelForSnap(value, labels) {
  if (!labels) return '';
  for (const [raw, label] of Object.entries(labels)) {
    if (Math.abs(Number(raw) - value) < 0.001) return label;
  }
  return '';
}

export function normalizePaperSettings(raw) {
  const base = defaultPaperSettings();
  const s = raw && typeof raw === 'object' ? raw : {};
  const type = PAPER_TYPES.some((t) => t.id === s.type) ? s.type : base.type;
  const orientation = s.orientation === 'landscape' ? 'landscape' : 'portrait';
  const ink = INK_LEVELS.includes(s.ink) ? s.ink : base.ink;
  const pageSize = PAPER_SIZES.some((p) => p.id === s.pageSize) ? s.pageSize : base.pageSize;

  let spacingIn = clamp(s.spacingIn ?? DEFAULT_SPACING_IN[type], 0.1, 1);
  let storyBox = normalizeStoryBox(s.storyBox ?? base.storyBox);
  // Legacy: story picture size lived in spacingIn (0.25 / 0.5 / 0.75).
  if (type === 'story' && s.storyBox == null && [0.25, 0.5, 0.75].some((v) => Math.abs(spacingIn - v) < 0.001)) {
    storyBox = normalizeStoryBox(spacingIn);
    spacingIn = DEFAULT_SPACING_IN.story;
  }

  return {
    type,
    orientation,
    spacingIn,
    marginIn: clamp(s.marginIn ?? base.marginIn, 0.2, 1.5),
    strokePt: clamp(s.strokePt ?? base.strokePt, 0.35, 2.6),
    ink,
    inkColor: resolveInkColor(
      s.inkColor != null && String(s.inkColor).trim() !== ''
        ? s.inkColor
        : defaultInkForType(type),
    ),
    header: s.header !== false,
    instructionsEnabled: Boolean(s.instructionsEnabled),
    instructions: String(s.instructions ?? '')
      .replace(/\r\n/g, '\n')
      .slice(0, 400),
    storyBox,
    pageSize,
    pages: Math.round(clamp(s.pages ?? 1, 1, 12)),
  };
}

export function normalizeHex(hex) {
  const raw = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split('')
      .map((c) => c + c)
      .join('')}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return '';
}

function mixHex(hex, towardHex, t) {
  const a = hexToRgb01(hex);
  const b = hexToRgb01(towardHex);
  const mix = (x, y) => Math.round((x * (1 - t) + y * t) * 255);
  const to = (n) => n.toString(16).padStart(2, '0');
  return `#${to(mix(a.r, b.r))}${to(mix(a.g, b.g))}${to(mix(a.b, b.b))}`;
}

/** Light / medium / dark shade of a custom ruling color. */
export function shadeInkHex(hex, level) {
  const seed = normalizeHex(hex) || DEFAULT_INK_COLOR;
  if (isTracingInk(seed)) {
    if (level === 'light') return mixHex(seed, '#ffffff', 0.35);
    if (level === 'dark') return mixHex(seed, '#94a3b8', 0.35);
    return seed;
  }
  if (level === 'light') return ensurePrintSafeInk(mixHex(seed, '#ffffff', 0.22));
  if (level === 'dark') return mixHex(seed, '#000000', 0.28);
  return ensurePrintSafeInk(seed);
}

/** How this ink looks on a grayscale copier. */
export function toPrintGrayHex(hex) {
  const y = Math.round(Math.min(1, Math.max(0, relativeLuminance(hex))) * 255);
  const h = y.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

export function isPrintSafeInk(hex) {
  const n = normalizeHex(hex);
  if (!n) return false;
  return contrastRatio(n, '#ffffff') >= WCAG.textAA;
}

/** Darken toward black until the stroke holds AA on white paper. */
export function ensurePrintSafeInk(hex) {
  const seed = normalizeHex(hex);
  if (!seed) return '';
  if (isTracingInk(seed)) return seed;
  if (isPrintSafeInk(seed)) return seed;
  for (let t = 0.08; t <= 0.92; t += 0.04) {
    const next = mixHex(seed, '#000000', t);
    if (isPrintSafeInk(next)) return next;
  }
  return '#000000';
}

function resolveInkColor(hex) {
  const seed = normalizeHex(hex);
  if (isTracingInk(seed)) return seed;
  return ensurePrintSafeInk(hex) || DEFAULT_INK_COLOR;
}

export function inkFor(settings) {
  const tone = INK[settings?.ink] || INK.medium;
  const seed =
    normalizeHex(settings?.inkColor) ||
    defaultInkForType(settings?.type);
  if (seed === normalizeHex(NOTEBOOK_INK.rule)) {
    return {
      rule: NOTEBOOK_INK.rule,
      margin: NOTEBOOK_INK.margin,
      mid: NOTEBOOK_INK.mid,
      mono: NOTEBOOK_INK.mono,
    };
  }
  if (isTracingInk(seed)) {
    const rule = shadeInkHex(seed, settings?.ink || 'medium');
    return { rule, margin: rule, mid: rule, mono: rule };
  }
  const rule = shadeInkHex(seed, settings?.ink || 'medium');
  return {
    rule,
    margin: tone.margin,
    mid: tone.mid,
    mono: rule,
  };
}

export function hexToRgb01(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}
