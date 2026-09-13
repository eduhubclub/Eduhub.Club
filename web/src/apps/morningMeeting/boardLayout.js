/**
 * Morning Meeting board — teacher-authored snap grid.
 * Size presets are a request; content mins win. Stage scales uniformly and centers vertically.
 */

export const BOARD_COLS = 12;
export const BOARD_GAP_PX = 10;
/** Extra empty rows shown in the arrange playground. */
export const BOARD_PLAYGROUND_ROWS = 12;

/** Minimum cell size before we treat the board as needing scale-down (readability floor). */
export const MIN_CELL_PX = 28;
/** After fit/scale, cells must stay at least this large or content will clip. */
export const MIN_READABLE_CELL_PX = 52;


/**
 * Seed span from size (+ optional orientation for M).
 * S = Small card seed (square preference); content mins still win for text cards.
 * Banner = full width × 1 row.
 */
export function seedSpan(pin) {
  const size =
    pin?.size === 's' || pin?.size === 'l' || pin?.size === 'banner' ? pin.size : 'm';
  const vertical = pin?.orientation === 'vertical';
  if (size === 'banner') return { w: 12, h: 1 };
  if (size === 's') return { w: 2, h: 2 };
  if (size === 'l') return { w: 6, h: 3 };
  if (vertical) return { w: 3, h: 2 };
  return { w: 4, h: 2 };
}

/** @deprecated Use seedSpan — kept for callers expecting { cols, rows }. */
export function pinSpan(pin) {
  const { w, h } = seedSpan(pin);
  return { cols: w, rows: h };
}

/**
 * Content-driven minimum footprint in grid units. Size request cannot go below this.
 *
 * Small cards (`message`, `custom`): min fits text; with an image the min is square.
 *
 * @param {{ type?: string, size?: string, props?: Record<string, unknown> }} pin
 * @param {{ rosterCount?: number }} [ctx]
 * @returns {{ w: number, h: number }}
 */
export function contentMinSpan(pin, ctx = {}) {
  const rosterCount = Math.max(0, Number(ctx.rosterCount) || 0);
  const type = pin?.type || '';
  const props = pin?.props && typeof pin.props === 'object' ? pin.props : {};

  if (type === 'message') {
    return textCardContentMin({
      text: props.text,
      hasImage: Boolean(String(props.imageSrc || '').trim()),
      emptyMin: { w: 4, h: 2 },
    });
  }

  if (type === 'custom') {
    const hasImage = Boolean(String(props.imageSrc || '').trim());
    const hasStudent = Boolean(String(props.studentId || '').trim());
    const base = textCardContentMin({
      text: props.text,
      hasImage,
      emptyMin: { w: 3, h: 2 },
    });
    if (!hasImage && hasStudent) {
      return { w: base.w, h: Math.min(TEXT_CARD_MAX_H, base.h + 1) };
    }
    if (hasImage && hasStudent) {
      const side = Math.min(BOARD_COLS, Math.max(base.w, base.h, IMAGE_SQUARE_FLOOR));
      return { w: side, h: side };
    }
    return base;
  }

  if (type === 'attendance' || type === 'lunch') {
    if (rosterCount <= 0) return { w: 6, h: 2 };
    const w = Math.min(12, Math.max(6, 4 + Math.ceil(rosterCount / 12) * 2));
    const perRow = 5;
    const h = Math.max(3, Math.ceil(rosterCount / perRow) + 1);
    return { w, h };
  }

  if (type === 'jobs') {
    return { w: 3, h: Math.max(2, Math.min(6, 2 + Math.ceil(rosterCount / 10))) };
  }

  if (type === 'date') {
    // Weekday (titleLg) + date line only.
    const min = textCardContentMin({
      text: 'Wednesday\nSeptember 30, 2026',
      emptyMin: { w: 4, h: 3 },
    });
    // Extra row for large weekday type.
    return { w: min.w, h: Math.min(TEXT_CARD_MAX_H, Math.max(3, min.h + 1)) };
  }

  if (type === 'novelty') {
    const n = Math.max(1, Math.min(6, Number(ctx.funDayCount) || 2));
    // titleMd lines + chrome; ~2 grid rows per observance for leading + accent.
    const lines = Array.from({ length: n }, (_, i) => `Observance title ${i + 1}`).join('\n');
    const min = textCardContentMin({
      text: lines,
      emptyMin: { w: 4, h: 3 },
    });
    return { w: min.w, h: Math.min(TEXT_CARD_MAX_H, Math.max(min.h, 2 + n * 2)) };
  }

  if (type === 'timer') {
    return { w: 3, h: 3 };
  }

  if (type === 'weather') {
    return textCardContentMin({
      text: '72°\nPartly cloudy\nAustin, TX\nWind 8 mph',
      emptyMin: { w: 3, h: 3 },
    });
  }

  return { w: 2, h: 2 };
}

/** Approx chars per grid column for board body text. */
const CHARS_PER_COL = 7;
const TEXT_CARD_MAX_H = 8;
const IMAGE_SQUARE_FLOOR = 4;

/**
 * Min footprint for a Small card (Instructions / Custom).
 * Text-only: fits copy width and height. With an image: square large enough for both.
 */
export function textCardContentMin({
  text = '',
  hasImage = false,
  emptyMin = { w: 3, h: 2 },
} = {}) {
  const body = String(text || '').trim();
  const emptyW = Math.max(1, emptyMin.w || 3);
  const emptyH = Math.max(1, emptyMin.h || 2);

  if (!body && !hasImage) {
    return { w: emptyW, h: emptyH };
  }

  const rawLines = body ? body.split(/\r?\n/) : [];
  const longestLine = Math.max(0, ...rawLines.map((l) => l.length));

  let w = Math.max(emptyW, Math.min(BOARD_COLS, Math.ceil(Math.max(longestLine, 1) / CHARS_PER_COL)));
  // Long single-paragraph copy: widen so height stays readable.
  if (rawLines.length <= 1 && body.length > CHARS_PER_COL * emptyW) {
    const prefer = Math.ceil(Math.sqrt(body.length / CHARS_PER_COL) * 1.35);
    w = Math.max(w, Math.min(BOARD_COLS, Math.max(emptyW, prefer)));
  }

  const charsPerLine = Math.max(CHARS_PER_COL, w * CHARS_PER_COL);
  let contentLines = 0;
  for (const line of rawLines) {
    contentLines += Math.max(1, Math.ceil(line.length / charsPerLine));
  }
  if (!body) contentLines = 0;

  // +1 row for WidgetShell chrome (title bar).
  let h = Math.max(emptyH, 1 + Math.max(contentLines, body ? 1 : 0));
  h = Math.min(TEXT_CARD_MAX_H, h);

  if (hasImage) {
    const side = Math.min(BOARD_COLS, Math.max(w, h, IMAGE_SQUARE_FLOOR));
    return { w: side, h: side };
  }
  return { w, h };
}

/**
 * Raise a requested rect to the pin’s content minimum (hard floor).
 * @param {{ type?: string, size?: string, props?: object, layout?: object }} pin
 * @param {{ col: number, row: number, w: number, h: number }} rect
 * @param {{ rosterCount?: number }} [ctx]
 */
export function clampRectToContentMin(pin, rect, ctx = {}) {
  const base = normalizeRect(rect) || { col: 0, row: 0, w: 1, h: 1 };
  const min = contentMinSpan(pin, ctx);
  const w = Math.min(BOARD_COLS, Math.max(base.w, min.w));
  const h = Math.max(base.h, min.h);
  const col = Math.min(Math.max(0, base.col), Math.max(0, BOARD_COLS - w));
  const row = Math.max(0, base.row);
  return { col, row, w, h };
}

/**
 * @param {{ col?: number, row?: number, w?: number, h?: number, cols?: number, rows?: number } | null | undefined} raw
 * @returns {{ col: number, row: number, w: number, h: number } | null}
 */
export function normalizeRect(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const col = Math.max(0, Math.floor(Number(raw.col)));
  const row = Math.max(0, Math.floor(Number(raw.row)));
  const w = Math.max(1, Math.floor(Number(raw.w ?? raw.cols)));
  const h = Math.max(1, Math.floor(Number(raw.h ?? raw.rows)));
  if (!Number.isFinite(col) || !Number.isFinite(row) || !Number.isFinite(w) || !Number.isFinite(h)) {
    return null;
  }
  const clampedW = Math.min(w, BOARD_COLS);
  const clampedCol = Math.min(col, Math.max(0, BOARD_COLS - clampedW));
  return { col: clampedCol, row, w: clampedW, h };
}

/**
 * Teacher-requested rect (stored layout or size seed) — may be below content min.
 * @param {{ layout?: object, size?: string, orientation?: string }} pin
 * @returns {{ col: number, row: number, w: number, h: number }}
 */
export function getPinRect(pin) {
  const fromLayout = normalizeRect(pin?.layout);
  if (fromLayout) return fromLayout;
  const { w, h } = seedSpan(pin);
  return { col: 0, row: 0, w, h };
}

/**
 * Effective rect: max(request, contentMin). Content wins when the request is too small.
 * @param {{ layout?: object, size?: string, orientation?: string, type?: string, props?: object }} pin
 * @param {{ rosterCount?: number }} [ctx]
 */
export function effectiveRect(pin, ctx = {}) {
  const req = getPinRect(pin);
  return clampRectToContentMin(pin, req, ctx);
}

/**
 * @param {{ col: number, row: number, w: number, h: number }} a
 * @param {{ col: number, row: number, w: number, h: number }} b
 */
export function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return !(
    a.col + a.w <= b.col ||
    b.col + b.w <= a.col ||
    a.row + a.h <= b.row ||
    b.row + b.h <= a.row
  );
}

/**
 * @param {Array<{ id?: string, col: number, row: number, w: number, h: number }>} rects
 * @param {{ col: number, row: number, w: number, h: number }} candidate
 * @param {string | null} [excludeId]
 */
export function hasCollision(rects, candidate, excludeId = null) {
  if (!candidate) return true;
  if (candidate.col < 0 || candidate.row < 0) return true;
  if (candidate.col + candidate.w > BOARD_COLS) return true;
  for (const r of rects) {
    if (!r) continue;
    if (excludeId != null && r.id === excludeId) continue;
    if (rectsOverlap(r, candidate)) return true;
  }
  return false;
}

function ensureGridRows(grid, rowCount) {
  while (grid.length < rowCount) {
    grid.push(Array(BOARD_COLS).fill(false));
  }
}

function cellFree(grid, col, row, w, h) {
  if (col < 0 || row < 0 || col + w > BOARD_COLS) return false;
  ensureGridRows(grid, row + h);
  for (let r = row; r < row + h; r += 1) {
    for (let c = col; c < col + w; c += 1) {
      if (grid[r][c]) return false;
    }
  }
  return true;
}

function markGrid(grid, col, row, w, h) {
  ensureGridRows(grid, row + h);
  for (let r = row; r < row + h; r += 1) {
    for (let c = col; c < col + w; c += 1) {
      grid[r][c] = true;
    }
  }
}

/**
 * Find first free slot for a w×h block.
 * @returns {{ col: number, row: number, w: number, h: number } | null}
 */
export function findFirstFit(occupiedRects, w, h, maxRows = 200) {
  const grid = [];
  for (const r of occupiedRects) {
    if (!r) continue;
    markGrid(grid, r.col, r.row, r.w, r.h);
  }
  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col <= BOARD_COLS - w; col += 1) {
      if (cellFree(grid, col, row, w, h)) {
        return { col, row, w, h };
      }
    }
  }
  return null;
}

/**
 * Pack pins using effective (content-aware) rects for placement.
 * @param {Array<{ id: string, layout?: object, size?: string, orientation?: string }>} pins
 * @param {{ rosterCount?: number }} [ctx]
 */
export function packAssignLayouts(pins, ctx = {}) {
  const list = Array.isArray(pins) ? pins : [];
  /** @type {boolean[][]} */
  const grid = [];
  /** @type {Array<{ id: string, col: number, row: number, w: number, h: number }>} */
  const placements = [];
  /** @type {typeof list} */
  const nextPins = [];

  for (const pin of list) {
    if (!pin?.id) continue;
    const desired = effectiveRect(pin, ctx);
    let rect = null;
    if (cellFree(grid, desired.col, desired.row, desired.w, desired.h)) {
      rect = desired;
    } else {
      const occupied = placements.map((p) => ({
        col: p.col,
        row: p.row,
        w: p.w,
        h: p.h,
      }));
      rect = findFirstFit(occupied, desired.w, desired.h) || {
        col: 0,
        row: placements.reduce((m, p) => Math.max(m, p.row + p.h), 0),
        w: desired.w,
        h: desired.h,
      };
      if (rect.col + rect.w > BOARD_COLS) {
        rect = { ...rect, col: 0, w: Math.min(desired.w, BOARD_COLS) };
      }
    }
    markGrid(grid, rect.col, rect.row, rect.w, rect.h);
    placements.push({ id: pin.id, ...rect });
    const stored = normalizeRect(pin.layout) || {
      col: rect.col,
      row: rect.row,
      ...seedSpan(pin),
    };
    nextPins.push({ ...pin, layout: stored });
  }

  let rows = Math.max(1, grid.length);
  while (rows > 1) {
    const last = grid[rows - 1];
    if (last?.some(Boolean)) break;
    rows -= 1;
  }

  /** @type {Array<{ col: number, row: number }>} */
  const emptyCells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < BOARD_COLS; c += 1) {
      if (!grid[r]?.[c]) emptyCells.push({ col: c, row: r });
    }
  }

  return { pins: nextPins, placements, rows, emptyCells };
}

/**
 * @param {Array<{ id: string, layout?: object, size?: string, orientation?: string }>} pins
 * @param {{ rosterCount?: number }} [ctx]
 */
export function packPins(pins, ctx = {}) {
  const { placements, rows, emptyCells } = packAssignLayouts(pins, ctx);
  return { placements, rows, emptyCells };
}

/**
 * Fit effective rects into a stage.
 * Sizes cells from width, then scales to fit — but never below MIN_READABLE_CELL_PX,
 * otherwise content mins in grid units are meaningless and WidgetShell clips text.
 * @param {{
 *   pins: Array<{ id: string, layout?: object, size?: string, orientation?: string }>,
 *   width: number,
 *   height: number,
 *   gap?: number,
 *   rosterCount?: number,
 *   funDayCount?: number,
 * }} args
 */
export function fitBoardLayout({
  pins,
  width,
  height,
  gap = BOARD_GAP_PX,
  rosterCount = 0,
  funDayCount = 0,
}) {
  const stageW = Math.max(1, Number(width) || 1);
  const stageH = Math.max(1, Number(height) || 1);
  const packed = packPins(pins, { rosterCount, funDayCount });
  const rowCount = Math.max(1, packed.rows);
  const colCount = BOARD_COLS;
  const gapX = gap * (colCount - 1);
  const gapY = gap * Math.max(0, rowCount - 1);

  let cell = (stageW - gapX) / colCount;
  if (cell < MIN_CELL_PX) cell = MIN_CELL_PX;

  const boardW = cell * colCount + gapX;
  const boardH = cell * rowCount + gapY;

  // Fit when possible. Never shrink cells below readable size (that caused clipping).
  let scale = Math.min(1, stageW / boardW, stageH / boardH);
  const minScale = MIN_READABLE_CELL_PX / cell;
  if (scale < minScale) {
    scale = minScale;
  }

  const scaledW = boardW * scale;
  const scaledH = boardH * scale;
  const overflows = scaledW > stageW + 0.5 || scaledH > stageH + 0.5;
  const offsetX = overflows ? 0 : Math.max(0, (stageW - scaledW) / 2);
  const offsetY = overflows ? 0 : Math.max(0, (stageH - scaledH) / 2);

  return {
    placements: packed.placements.map((p) => ({
      id: p.id,
      col: p.col,
      row: p.row,
      cols: p.w,
      rows: p.h,
      w: p.w,
      h: p.h,
    })),
    emptyCells: packed.emptyCells,
    rows: rowCount,
    cols: colCount,
    cellW: cell,
    cellH: cell,
    gap,
    scale,
    boardW,
    boardH,
    offsetX,
    offsetY,
    overflows,
  };
}

/**
 * @param {{ col: number, row: number, w?: number, h?: number, cols?: number, rows?: number }} p
 * @param {{ cellW: number, cellH: number, gap: number }} layout
 */
export function rectToPixels(p, layout) {
  const w = p.w ?? p.cols ?? 1;
  const h = p.h ?? p.rows ?? 1;
  const { cellW, cellH, gap } = layout;
  return {
    left: p.col * (cellW + gap),
    top: p.row * (cellH + gap),
    width: w * cellW + Math.max(0, w - 1) * gap,
    height: h * cellH + Math.max(0, h - 1) * gap,
  };
}

/**
 * @param {{ col: number, row: number, cols?: number, rows?: number, w?: number, h?: number }} p
 */
export function placementStyle(p) {
  const cols = p.cols ?? p.w ?? 1;
  const rows = p.rows ?? p.h ?? 1;
  return {
    gridColumn: `${p.col + 1} / span ${cols}`,
    gridRow: `${p.row + 1} / span ${rows}`,
  };
}

/**
 * Snap a pixel point to grid cell indices given cell size + gap.
 */
export function snapToCell(px, cell, gap) {
  const stride = cell + gap;
  return Math.max(0, Math.round(px / stride));
}
