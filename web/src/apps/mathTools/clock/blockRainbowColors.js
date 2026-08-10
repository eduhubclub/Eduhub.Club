/**
 * Opaque rainbow fills for Blocks face.
 * Hours 12–5 and 6–11: red, orange, yellow, green, blue, purple.
 * Pastel weight still near Tickmarks cream / blue washes — warms get
 * extra chroma so they don’t collapse into one muddy peach.
 */

function hslToRgb(h, s, l) {
  const sat = s / 100;
  const lit = l / 100;
  const a = sat * Math.min(lit, 1 - lit);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = lit - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c);
  };
  return { r: f(0), g: f(8), b: f(4) };
}

function toHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return toHex(r, g, b);
}

/**
 * Six-hue loop: 12–5 and again 6–11.
 * Warms are spaced farther apart than a linear rainbow so pastels stay distinct.
 */
const HOUR_RAINBOW_HUES = {
  red: 2,
  orange: 28,
  amber: 54, // true yellow — was 48 (too close to orange)
  green: 145,
  blue: 215,
  purple: 285,
};

const HOUR_RAINBOW_SEQUENCE = [
  HOUR_RAINBOW_HUES.red,
  HOUR_RAINBOW_HUES.orange,
  HOUR_RAINBOW_HUES.amber,
  HOUR_RAINBOW_HUES.green,
  HOUR_RAINBOW_HUES.blue,
  HOUR_RAINBOW_HUES.purple,
];

/**
 * Soft-fill S/L by hue. Cool hues keep the cream/blue wash weight;
 * warms need more sat (and a touch of L separation) or they muddy together.
 */
function rainbowWash(hue) {
  if (hue < 15) return { s: 64, l: 80 }; // red — slightly deeper so it reads red, not pink
  if (hue < 40) return { s: 72, l: 84 }; // orange — punchier mid
  if (hue < 70) return { s: 74, l: 88 }; // yellow — high sat avoids beige mud
  return { s: 52, l: 86 };
}

/** Alternating minute-cell S/L — wider L gap; warms keep extra chroma. */
function rainbowSlotParams(hue, slot) {
  const even = slot % 2 === 0;
  if (hue < 15) return { s: 58, l: even ? 90 : 74 };
  if (hue < 40) return { s: 66, l: even ? 92 : 76 };
  if (hue < 70) return { s: 68, l: even ? 94 : 78 };
  return { s: 48, l: even ? 92 : 78 };
}

/** Stroke / mark weight — warms a bit more saturated so marks match fills. */
function rainbowStrokeParams(hue) {
  if (hue < 70) return { s: 58, l: 48 };
  return { s: 45, l: 55 };
}

/**
 * Hue for hour 1–12.
 * 12–5: red, orange, yellow, green, blue, purple — then 6–11 repeats.
 * @param {number} hourNum 1–12
 */
export function hourRainbowHue(hourNum) {
  const n = ((hourNum % 12) + 12) % 12; // 12 → 0
  return HOUR_RAINBOW_SEQUENCE[n % 6];
}

/** Soft opaque fill for an hour wedge. */
export function hourRainbowFill(hourNum) {
  const hue = hourRainbowHue(hourNum);
  const { s, l } = rainbowWash(hue);
  return hslToHex(hue, s, l);
}

/** Near-white center stop for radial washes. */
export function sectionRainbowCenter(hue) {
  const { s } = rainbowWash(hue);
  return hslToHex(hue, Math.max(28, s - 28), 96);
}

/** Mid solid for half / quarter disks. */
export function sectionRainbowSolid(hue) {
  const { s, l } = rainbowWash(hue);
  return hslToHex(hue, s, l);
}

/** Alternating light / dark cell of a section hue — wider L gap for contrast. */
export function sectionRainbowSlot(hue, slot) {
  const { s, l } = rainbowSlotParams(hue, slot);
  return hslToHex(hue, s, l);
}

/** Half Hours — warm past vs cool to. */
export const HALF_SECTION_HUES = {
  past: 35,
  to: 220,
};

/** Quarter hours — warm / cool / warm / cool. */
export const QUARTER_SECTION_HUES = [8, 200, 54, 250];

export function halfSectionHue(isPast) {
  return isPast ? HALF_SECTION_HUES.past : HALF_SECTION_HUES.to;
}

/** @param {number} quarterIndex 0–3 */
export function quarterSectionHue(quarterIndex) {
  return QUARTER_SECTION_HUES[((quarterIndex % 4) + 4) % 4];
}

/**
 * Minute cell fill: per-hour, or half/quarter section tone when those overlays are on.
 * @param {number} minuteIndex 0–59
 * @param {{ half?: boolean, quarters?: boolean }} [mode]
 */
export function minuteRainbowFill(minuteIndex, mode = {}) {
  const slot = minuteIndex % 2;
  if (mode.half) {
    return sectionRainbowSlot(halfSectionHue(minuteIndex < 30), slot);
  }
  if (mode.quarters) {
    const q = Math.floor(minuteIndex / 15) % 4;
    return sectionRainbowSlot(quarterSectionHue(q), slot);
  }
  /** Minute 0–4 → hour 12; 5–9 → hour 1; … */
  const hourNum = Math.floor(minuteIndex / 5) === 0 ? 12 : Math.floor(minuteIndex / 5);
  return sectionRainbowSlot(hourRainbowHue(hourNum), slot);
}

/** Backdrop behind hour numeral `num` (1–12) for half / quarter rainbow. */
export function hourSectionBackdrop(num, { half = false, quarters = false } = {}) {
  if (half) {
    const isPast = num === 12 || num <= 6;
    return sectionRainbowSolid(halfSectionHue(isPast));
  }
  if (quarters) {
    const angle = (num % 12) * 30;
    const q = Math.floor(angle / 90) % 4;
    return sectionRainbowSolid(quarterSectionHue(q));
  }
  return hourRainbowFill(num);
}

/** Stroke for the 5-minute / hour mark at angle index 0–11. */
export function hourMarkRainbowStroke(markIndex) {
  const hourNum = markIndex === 0 ? 12 : markIndex;
  const hue = hourRainbowHue(hourNum);
  const { s, l } = rainbowStrokeParams(hue);
  return hslToHex(hue, s, l);
}

/** Divider stroke matching a half / quarter section. */
export function sectionMarkStroke(hue) {
  const { s, l } = rainbowStrokeParams(hue);
  return hslToHex(hue, s, l);
}

/** Hour at a clock angle (0° = 12). */
export function hourNumAtAngle(angleDeg) {
  const n = Math.round(normalizeHourAngle(angleDeg) / 30) % 12;
  return n === 0 ? 12 : n;
}

function normalizeHourAngle(angleDeg) {
  return ((angleDeg % 360) + 360) % 360;
}

function parseHex(hex) {
  const n = String(hex || '').replace('#', '');
  const full =
    n.length === 3
      ? n
          .split('')
          .map((c) => c + c)
          .join('')
      : n;
  if (full.length !== 6) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function mixHex(a, b, t) {
  const A = parseHex(a);
  const B = parseHex(b);
  if (!A || !B) return a;
  const m = (x, y) => Math.round(x + (y - x) * t);
  return toHex(m(A.r, B.r), m(A.g, B.g), m(A.b, B.b));
}

/**
 * Opaque primary + light/dark minute tints for Blocks (non-rainbow).
 * Pastel weight matches former cream / blue hour wedges (PAST_FILL / TO_FILL).
 * @param {string} primaryHex
 */
export function primaryBlockPalette(primaryHex) {
  const base = primaryHex || '#10b981';
  return {
    /** Soft opaque wash — same weight as old cream/blue center */
    solid: mixHex(base, '#ffffff', 0.78),
    /** Lighter minute cell */
    light: mixHex(base, '#ffffff', 0.88),
    /** Darker minute cell */
    dark: mixHex(base, '#ffffff', 0.62),
  };
}
