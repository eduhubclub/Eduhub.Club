/**
 * Build draw primitives for a Letter sheet (SVG y-down, points).
 */

import {
  PT_PER_IN,
  STORY_BOX_RATIO,
  STORY_GAP_IN,
  inkFor,
  pagePoints,
  normalizePaperSettings,
  normalizeStoryBox,
} from './paperModel';

function line(x1, y1, x2, y2, stroke, width, dash, opacity) {
  const p = { kind: 'line', x1, y1, x2, y2, stroke, width };
  if (dash) p.dash = dash;
  if (opacity != null && opacity < 1) p.opacity = opacity;
  return p;
}

function rect(x, y, w, h, stroke, width, fill) {
  const p = { kind: 'rect', x, y, w, h, stroke, width };
  if (fill) p.fill = fill;
  return p;
}

function circle(cx, cy, r, stroke, width) {
  return { kind: 'circle', cx, cy, r, stroke, width };
}

function text(x, y, value, size, fill, anchor) {
  const p = { kind: 'text', x, y, text: value, size, fill };
  if (anchor) p.anchor = anchor;
  return p;
}

/** Name/Date sit in the heading, just to the right of the red margin. */
const HEADER_TOP_IN = 0.4;
const HEADER_AFTER_MARGIN_PT = 12;

function headerBlock(width, margin, colors, stroke) {
  const y = HEADER_TOP_IN * PT_PER_IN;
  const label = 12;
  const gap = 10;
  const nameX = margin;
  const lineEnd = width - margin;
  const nameLineY = y + 14;
  const dateLineY = nameLineY + 22;
  return [
    text(nameX, y + 10, 'Name', label, colors.mono),
    line(nameX + 42, nameLineY, lineEnd, nameLineY, colors.mono, stroke),
    text(nameX, dateLineY - 4, 'Date', label, colors.mono),
    line(nameX + 36, dateLineY, lineEnd, dateLineY, colors.mono, stroke),
    { headerBottom: dateLineY + gap, headerLineY: dateLineY },
  ];
}

function contentTop(width, margin, header, colors, stroke) {
  if (!header) return { y: margin, extras: [], headerLineY: null };
  const parts = headerBlock(width, margin, colors, stroke);
  const meta = parts.pop();
  return { y: meta.headerBottom, extras: parts, headerLineY: meta.headerLineY };
}

/** Name/Date sit on a ruling line (no extra underline). */
function headerOnRule(width, margin, colors, ruleY) {
  const label = 12;
  const nameX = margin + HEADER_AFTER_MARGIN_PT;
  const dateW = Math.min(160, width * 0.28);
  const dateX = width - Math.max(margin, 36) - dateW;
  const baseline = ruleY - 3;
  return [
    text(nameX, baseline, 'Name', label, colors.mono),
    text(dateX, baseline, 'Date', label, colors.mono),
  ];
}

function wrapInstructionLines(raw, maxWidth, fontSize, maxLines = 6) {
  const textValue = String(raw || '').trim();
  if (!textValue) return [];
  const maxChars = Math.max(12, Math.floor(maxWidth / (fontSize * 0.52)));
  const lines = [];
  for (const paragraph of textValue.split('\n')) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let cur = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${cur} ${words[i]}`;
      if (next.length <= maxChars) cur = next;
      else {
        lines.push(cur);
        cur = words[i];
      }
    }
    lines.push(cur);
  }
  return lines.slice(0, maxLines);
}

/** Teacher directions drawn above the ruling / pattern block. */
function instructionBlock(width, margin, colors, top, raw) {
  const size = 11;
  const leading = size * 1.35;
  const lines = wrapInstructionLines(raw, width - 2 * margin, size);
  if (!lines.length) return { primitives: [], bottom: top };
  const gapAfter = 10;
  const primitives = lines.map((lineText, i) =>
    text(margin, top + size + i * leading, lineText, size, colors.mono),
  );
  const bottom = top + lines.length * leading + gapAfter;
  return { primitives, bottom };
}

/**
 * Lined-only: sit directions on successive blue rules, wrapping before the
 * right red margin.
 */
function linedInstructionsOnRules(width, m, colors, ruleYs, raw, startIndex) {
  const size = 11;
  const x0 = m + HEADER_AFTER_MARGIN_PT;
  const maxW = Math.max(40, width - m - x0);
  const available = Math.max(0, ruleYs.length - startIndex);
  const lines = wrapInstructionLines(raw, maxW, size, available);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const y = ruleYs[startIndex + i];
    if (y == null || !lines[i]) continue;
    out.push(text(x0, y - 3, lines[i], size, colors.mono));
  }
  return out;
}

/** Classic filler-paper heading — blank band, red margin still runs through it. */
export const LINED_HEADING_IN = 1.5;
/** Classic notebook red line — 1 inch from each edge. */
export const LINED_MARGIN_IN = 1;

/** Classic notebook: blue rules full-bleed; solid left + half-opacity right margin. */
function lined(width, height, m, spacing, stroke, colors, top, opts = {}) {
  const out = [];
  const y0 = Math.max(0, top);
  const innerH = height - y0;
  const rows = fitGridCount(innerH, spacing);
  const dy = innerH / rows;
  const marginY0 = opts.marginFromTop ? 0 : y0;
  const mw = stroke * 1.35;
  out.push(line(m, marginY0, m, height, colors.margin, mw));
  out.push(line(width - m, marginY0, width - m, height, colors.margin, mw, undefined, 0.5));
  const ruleYs = [];
  for (let j = 0; j < rows; j += 1) {
    const y = y0 + j * dy;
    ruleYs.push(y);
    out.push(line(0, y, width, y, colors.rule, stroke));
  }
  return { primitives: out, ruleYs };
}

/** Headline + dashed midline + baseline (primary / D’Nealian). */
function primarySets(width, height, m, spacing, stroke, colors, top, dashedMid, boxed) {
  const out = [];
  const setH = spacing;
  const gap = spacing * 0.22;
  const step = setH + gap;
  const innerH = height - m - top;
  const count = Math.max(1, Math.floor((innerH + 0.5) / step));
  const blockH = count * setH + Math.max(0, count - 1) * gap;
  const { y0: startY } = centeredOrigin(width, height, m, top, width - 2 * m, blockH);
  for (let i = 0; i < count; i += 1) {
    const y0 = startY + i * step;
    const mid = y0 + setH / 2;
    const base = y0 + setH;
    if (boxed) {
      out.push(rect(m, y0, width - 2 * m, setH, colors.mono, stroke));
    }
    out.push(line(m, y0, width - m, y0, colors.margin, stroke));
    out.push(
      line(
        m,
        mid,
        width - m,
        mid,
        colors.mid,
        stroke * 0.85,
        dashedMid ? [3.2, 2.6] : [1.6, 2.2],
      ),
    );
    out.push(line(m, base, width - m, base, colors.rule, stroke));
  }
  return out;
}

/**
 * Integer cell count so first/last lines land on the content edges.
 * Optional `majorEvery` keeps graph-paper majors on those edges.
 */
export function fitGridCount(span, spacing, majorEvery = 0) {
  const step = Math.max(1, spacing);
  const raw = Math.max(1, Math.round(span / step));
  if (!majorEvery || majorEvery < 2) return raw;
  const lo = Math.max(majorEvery, Math.floor(raw / majorEvery) * majorEvery);
  const hi = Math.max(majorEvery, Math.ceil(raw / majorEvery) * majorEvery);
  return Math.abs(span / lo - step) <= Math.abs(span / hi - step) ? lo : hi;
}

function exactCellCount(span, spacing) {
  return Math.max(1, Math.floor((span + 0.01) / Math.max(1, spacing)));
}

/** Center a block inside the content box (margins + header top). */
function centeredOrigin(width, height, m, top, blockW, blockH) {
  const innerW = width - 2 * m;
  const innerH = height - m - top;
  return {
    x0: m + Math.max(0, (innerW - blockW) / 2),
    y0: top + Math.max(0, (innerH - blockH) / 2),
  };
}

function dots(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const r = Math.max(0.55, stroke * 0.55);
  const step = Math.max(1, spacing);
  const cols = exactCellCount(width - 2 * m, step);
  const rows = exactCellCount(height - m - top, step);
  const { x0, y0 } = centeredOrigin(width, height, m, top, cols * step, rows * step);
  for (let j = 0; j <= rows; j += 1) {
    const y = y0 + j * step;
    for (let i = 0; i <= cols; i += 1) {
      out.push(circle(x0 + i * step, y, r, colors.mono, stroke * 0.4));
    }
  }
  return out;
}

function grid(width, height, m, spacing, stroke, colors, top, majorEvery = 0, drawAxes = false) {
  const out = [];
  const step = Math.max(1, spacing);
  const cols = exactCellCount(width - 2 * m, step);
  const rows = exactCellCount(height - m - top, step);
  const gridW = cols * step;
  const gridH = rows * step;
  const { x0, y0 } = centeredOrigin(width, height, m, top, gridW, gridH);
  // Nearest grid line to center (exact when count is even).
  const axisI = Math.floor(cols / 2);
  const axisJ = Math.floor(rows / 2);
  for (let i = 0; i <= cols; i += 1) {
    if (drawAxes && i === axisI) continue;
    let w = stroke;
    if (majorEvery && i % majorEvery === 0) w = stroke * 1.5;
    out.push(line(x0 + i * step, y0, x0 + i * step, y0 + gridH, colors.mono, w));
  }
  for (let j = 0; j <= rows; j += 1) {
    if (drawAxes && j === axisJ) continue;
    let w = stroke;
    if (majorEvery && j % majorEvery === 0) w = stroke * 1.5;
    out.push(line(x0, y0 + j * step, x0 + gridW, y0 + j * step, colors.mono, w));
  }
  // Axes last so they stay visible over the grid.
  if (drawAxes) {
    const aw = stroke * 2.6;
    out.push(line(x0 + axisI * step, y0, x0 + axisI * step, y0 + gridH, colors.mono, aw));
    out.push(line(x0, y0 + axisJ * step, x0 + gridW, y0 + axisJ * step, colors.mono, aw));
  }
  return out;
}

/** Clip a segment to an axis-aligned rectangle; null if fully outside. */
function clipSegmentToRect(x1, y1, x2, y2, minX, minY, maxX, maxY) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edge = (p, q) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!edge(-dx, x1 - minX)) return null;
  if (!edge(dx, maxX - x1)) return null;
  if (!edge(-dy, y1 - minY)) return null;
  if (!edge(dy, maxY - y1)) return null;
  if (t1 < t0) return null;
  return {
    x1: x1 + t0 * dx,
    y1: y1 + t0 * dy,
    x2: x1 + t1 * dx,
    y2: y1 + t1 * dy,
  };
}

/**
 * Classic isometric sketch paper: verticals + ±30° diagonals.
 * Cell size is exact; leftover is centered; top/bottom borders close the block.
 */
function isometric(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const dx = Math.max(1, spacing);
  // tan(30°) so diagonals hit every vertical × row lattice point
  const dy = dx / Math.sqrt(3);
  const slope = 1 / Math.sqrt(3);
  const innerW = width - 2 * m;
  const innerH = height - m - top;
  const cols = exactCellCount(innerW, dx);
  const rows = exactCellCount(innerH, dy);
  const gridW = cols * dx;
  const gridH = rows * dy;
  const { x0, y0 } = centeredOrigin(width, height, m, top, gridW, gridH);
  const x1 = x0 + gridW;
  const y1 = y0 + gridH;

  const pushSeg = (xa, ya, xb, yb) => {
    const seg = clipSegmentToRect(xa, ya, xb, yb, x0, y0, x1, y1);
    if (!seg) return;
    if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) < 0.4) return;
    out.push(line(seg.x1, seg.y1, seg.x2, seg.y2, colors.mono, stroke));
  };

  // Top & bottom borders
  out.push(line(x0, y0, x1, y0, colors.mono, stroke));
  out.push(line(x0, y1, x1, y1, colors.mono, stroke));

  // Verticals (includes left/right edges)
  for (let i = 0; i <= cols; i += 1) {
    const x = x0 + i * dx;
    out.push(line(x, y0, x, y1, colors.mono, stroke));
  }

  // ±30° diagonals through the lattice
  for (let j = -cols - 1; j <= rows + cols + 1; j += 1) {
    const yL = y0 + j * dy;
    pushSeg(x0, yL, x1, yL + slope * (x1 - x0));
    pushSeg(x0, yL, x1, yL - slope * (x1 - x0));
  }

  return out;
}

function hexGrid(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const r = spacing * 0.55;
  const w = r * Math.sqrt(3);
  const h = r * 1.5;
  const innerW = width - 2 * m;
  const innerH = height - m - top;
  const centers = [];
  let row = 0;
  for (let cy = r; cy + r <= innerH + 0.01; cy += h) {
    const odd = row % 2 === 1;
    const xStart = (odd ? w / 2 : 0) + w / 2;
    for (let cx = xStart; cx + r <= innerW + 0.01; cx += w) {
      centers.push([cx, cy]);
    }
    row += 1;
  }
  if (!centers.length) return out;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [cx, cy] of centers) {
    minX = Math.min(minX, cx - w / 2);
    maxX = Math.max(maxX, cx + w / 2);
    minY = Math.min(minY, cy - r);
    maxY = Math.max(maxY, cy + r);
  }
  const ox = m + (innerW - (maxX - minX)) / 2 - minX;
  const oy = top + (innerH - (maxY - minY)) / 2 - minY;
  for (const [cx, cy] of centers) {
    const pts = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 180) * (60 * i - 30);
      pts.push([cx + ox + r * Math.cos(a), cy + oy + r * Math.sin(a)]);
    }
    for (let i = 0; i < 6; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % 6];
      out.push(line(a[0], a[1], b[0], b[1], colors.mono, stroke));
    }
  }
  return out;
}

/**
 * Story paper: drawing box (big → medium → small) + lined writing below.
 * Picture and writing share the same side margins; rules meet the red margins
 * and the bottom margin line.
 */
function story(width, height, m, spacingIn, storyBox, stroke, colors, top) {
  const out = [];
  const avail = height - m - top;
  const gap = STORY_GAP_IN * PT_PER_IN;
  const lineStep = Math.max(1, spacingIn * PT_PER_IN);
  const boxId = normalizeStoryBox(storyBox);
  const ratio = STORY_BOX_RATIO[boxId] ?? STORY_BOX_RATIO.medium;
  const boxH = Math.max(
    lineStep * 2,
    Math.min(avail * ratio, avail - gap - lineStep * 3),
  );
  out.push(rect(m, top, width - 2 * m, boxH, colors.rule, stroke * 1.2));

  const writeTop = top + boxH + gap;
  const writeBottom = height - m;
  const span = Math.max(lineStep, writeBottom - writeTop);
  // First rule on writeTop, last rule on writeBottom so margins meet the block.
  const gaps = Math.max(1, Math.round(span / lineStep));
  const dy = span / gaps;
  const mw = stroke * 1.35;
  out.push(line(m, writeTop, m, writeBottom, colors.margin, mw));
  out.push(
    line(width - m, writeTop, width - m, writeBottom, colors.margin, mw, undefined, 0.5),
  );
  for (let i = 0; i <= gaps; i += 1) {
    const y = writeTop + i * dy;
    out.push(line(m, y, width - m, y, colors.rule, stroke));
  }
  return out;
}

function cornell(width, height, m, spacing, stroke, colors, top) {
  const cueW = Math.min(width * 0.32, 2.5 * PT_PER_IN);
  const step = Math.max(1, spacing);
  const preferredSummaryH = Math.min((height - m - top) * 0.18, 1.6 * PT_PER_IN);
  const preferredSumY = height - m - preferredSummaryH;
  // Snap summary bar up onto the ruling grid so leftover space never sits under the notes.
  const gridK = Math.max(2, Math.floor((preferredSumY - top) / step));
  const sumY = top + gridK * step;
  const splitX = m + cueW;
  const out = [
    line(splitX, top, splitX, sumY, colors.mono, stroke * 1.3),
    line(m, sumY, width - m, sumY, colors.mono, stroke * 1.3),
    text(m + 4, sumY + 12, 'Summary', 8, colors.mono),
  ];
  for (let y = top + step; y < sumY - 0.5; y += step) {
    out.push(line(splitX, y, width - m, y, colors.rule, stroke));
  }
  return out;
}

function numberLines(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const inner = width - 2 * m;
  const ticks = Math.max(8, Math.round(inner / (spacing * PT_PER_IN * 0.35)));
  const pitch = spacing * 3.2;
  const count = Math.max(1, Math.floor((height - m - top) / pitch));
  const blockH = count * pitch;
  const { y0: startY } = centeredOrigin(width, height, m, top, inner, blockH);
  for (let i = 0; i < count; i += 1) {
    const y = startY + pitch * (i + 0.5);
    out.push(line(m, y, width - m, y, colors.mono, stroke * 1.2));
    const n = Math.max(10, ticks);
    for (let t = 0; t <= n; t += 1) {
      const x = m + (inner * t) / n;
      const major = t % 5 === 0;
      const h = major ? 10 : 5;
      out.push(line(x, y - h, x, y + h, colors.mono, major ? stroke * 1.2 : stroke));
    }
  }
  return out;
}

function music(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const staffH = spacing * 4;
  const gap = spacing * 3.2;
  const pitch = staffH + gap;
  const pad = 8;
  const innerH = height - m - top - pad;
  const count = Math.max(1, Math.floor((innerH + gap) / pitch));
  const blockH = count * staffH + Math.max(0, count - 1) * gap;
  const { y0: startY } = centeredOrigin(
    width,
    height,
    m,
    top + pad,
    width - 2 * m,
    blockH,
  );
  for (let s = 0; s < count; s += 1) {
    const y0 = startY + s * pitch;
    for (let i = 0; i < 5; i += 1) {
      const y = y0 + i * spacing;
      out.push(line(m, y, width - m, y, colors.mono, stroke));
    }
  }
  return out;
}

function boxes(width, height, m, spacing, stroke, colors, top) {
  const out = [];
  const size = Math.max(18, spacing);
  const rowGap = size * 0.35;
  const cols = exactCellCount(width - 2 * m, size);
  const pitch = size + rowGap;
  const rows = Math.max(1, Math.floor((height - m - top + 0.01) / pitch));
  const blockW = cols * size;
  const blockH = rows * size + Math.max(0, rows - 1) * rowGap;
  const { x0, y0 } = centeredOrigin(width, height, m, top, blockW, blockH);
  for (let r = 0; r < rows; r += 1) {
    const y = y0 + r * pitch;
    for (let c = 0; c < cols; c += 1) {
      out.push(rect(x0 + c * size, y, size, size, colors.mono, stroke));
    }
  }
  return out;
}

/** Blank monthly planner: title line, weekday headers, 7×6 day cells. */
const CAL_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function calendar(width, height, m, stroke, colors, top) {
  const out = [];
  const innerW = width - 2 * m;
  const titleH = 28;
  const headH = 22;
  const titleY = top + 18;
  out.push(text(m, titleY, 'Month', 12, colors.mono));
  out.push(line(m + 48, titleY + 2, width - m, titleY + 2, colors.mono, stroke));

  const gridTop = top + titleH + 8;
  const gridBottom = height - m;
  const gridH = Math.max(headH + 40, gridBottom - gridTop);
  const cols = 7;
  const rows = 6;
  const cellW = innerW / cols;
  const bodyH = gridH - headH;
  const cellH = bodyH / rows;

  for (let c = 0; c < cols; c += 1) {
    const cx = m + (c + 0.5) * cellW;
    out.push(text(cx, gridTop + 15, CAL_WEEKDAYS[c], 10, colors.mono, 'middle'));
  }
  out.push(line(m, gridTop + headH, width - m, gridTop + headH, colors.mono, stroke * 1.2));

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = m + c * cellW;
      const y = gridTop + headH + r * cellH;
      out.push(rect(x, y, cellW, cellH, colors.mono, stroke));
    }
  }
  return out;
}

/**
 * @param {object} rawSettings
 * @returns {{ width: number, height: number, primitives: object[] }}
 */
export function buildPaperSheet(rawSettings) {
  const settings = normalizePaperSettings(rawSettings);
  const { width, height } = pagePoints(settings.orientation, settings.pageSize);
  const m =
    (settings.type === 'lined' ? LINED_MARGIN_IN : settings.marginIn) *
    PT_PER_IN;
  const spacing = settings.spacingIn * PT_PER_IN;
  const stroke = settings.strokePt;
  const colors = inkFor(settings);
  const linedType = settings.type === 'lined';
  const { y: top, extras: headerExtras, headerLineY } = contentTop(
    width,
    m,
    settings.header && !linedType,
    colors,
    stroke,
  );
  let extras = headerExtras;
  let patternTop =
    settings.header && headerLineY != null
      ? headerLineY + 0.25 * PT_PER_IN
      : top;

  if (
    !linedType &&
    settings.instructionsEnabled &&
    String(settings.instructions || '').trim()
  ) {
    const block = instructionBlock(
      width,
      m,
      colors,
      patternTop,
      settings.instructions,
    );
    extras = [...extras, ...block.primitives];
    patternTop = block.bottom;
  }

  const contentTopY = patternTop;

  let body = [];
  switch (settings.type) {
    case 'primary':
      body = primarySets(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
        true,
      );
      break;
    case 'handwriting':
      body = primarySets(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
        true,
        true,
      );
      break;
    case 'dots':
      body = dots(width, height, m, spacing, stroke, colors, contentTopY);
      break;
    case 'grid':
      body = grid(width, height, m, spacing, stroke, colors, contentTopY, 0);
      break;
    case 'graph':
      body = grid(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
        5,
        true,
      );
      break;
    case 'isometric':
      body = isometric(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
      );
      break;
    case 'hex':
      body = hexGrid(width, height, m, spacing, stroke, colors, contentTopY);
      break;
    case 'story':
      body = story(
        width,
        height,
        m,
        settings.spacingIn,
        settings.storyBox,
        stroke,
        colors,
        contentTopY,
      );
      break;
    case 'cornell':
      body = cornell(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
      );
      break;
    case 'numberLine':
      body = numberLines(
        width,
        height,
        m,
        spacing,
        stroke,
        colors,
        contentTopY,
      );
      break;
    case 'music':
      body = music(width, height, m, spacing, stroke, colors, contentTopY);
      break;
    case 'boxes':
      body = boxes(width, height, m, spacing, stroke, colors, contentTopY);
      break;
    case 'calendar':
      body = calendar(width, height, m, stroke, colors, contentTopY);
      break;
    case 'blank':
      body = [];
      break;
    case 'lined':
    default: {
      const heading = LINED_HEADING_IN * PT_PER_IN;
      const y0 = Math.max(heading, contentTopY);
      const linedSheet = lined(width, height, m, spacing, stroke, colors, y0, {
        marginFromTop: true,
      });
      body = linedSheet.primitives;
      if (settings.header) {
        extras = [
          ...extras,
          ...headerOnRule(width, m, colors, linedSheet.ruleYs[0] ?? y0),
        ];
      }
      if (
        settings.instructionsEnabled &&
        String(settings.instructions || '').trim()
      ) {
        const start = settings.header ? 1 : 0;
        extras = [
          ...extras,
          ...linedInstructionsOnRules(
            width,
            m,
            colors,
            linedSheet.ruleYs,
            settings.instructions,
            start,
          ),
        ];
      }
      break;
    }
  }

  return {
    width,
    height,
    settings,
    primitives: [...extras, ...body],
  };
}

export function countPrimitivesOfKind(sheet, kind) {
  return (sheet.primitives || []).filter((p) => p.kind === kind).length;
}
