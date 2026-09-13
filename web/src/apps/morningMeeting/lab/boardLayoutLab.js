/**
 * Layout Lab — isolated from the live Morning Meeting boardLayout.
 *
 * Rule hierarchy (highest first):
 * 1. No scroll — the whole board must fit a bounded panel stage.
 * 2. Fill the stage — cellW from width, cellH from height (12-col grid spans the frame).
 * 3. Card limit — dynamic by size: pack must fit at LAB_CAPACITY_CELL_PX.
 * 4. Honor teacher rects — stored layout, else size seed (S/M/L/Banner).
 *
 * Preview stage is 16:9. Capacity flags when min(cellW, cellH) drops below the
 * readable floor — remove a card or shrink sizes to restore.
 */

export const LAB_COLS = 12;
export const LAB_GAP_PX = 10;
/** Design reference cell for docs / capacity comparisons. */
export const LAB_CELL_PX = 64;
/** Hard readable floor for capacity — packs must fit at this cell size. */
export const LAB_CAPACITY_CELL_PX = 40;
/** Soft cue alias — same as capacity floor. */
export const LAB_MIN_CELL_PX = LAB_CAPACITY_CELL_PX;
/** Size keys used for uniform capacity tables. */
export const LAB_SIZE_KEYS = /** @type {const} */ (['s', 'm', 'l', 'banner']);
/** Desktop panel ratio for the lab stage (16:9). */
export const LAB_STAGE_ASPECT = '16 / 9';
/** Used for capacity checks before the preview stage is measured (16:9). */
export const LAB_REFERENCE_STAGE = { width: 1280, height: 720 };
export const LAB_PLAYGROUND_ROWS = 16;

/** Ordered labels for UI / docs — keep in sync with the file header. */
export const LAB_LAYOUT_RULES = [
  'No scroll — entire board fits the panel stage',
  'Fill the 16:9 stage — columns span width, rows span height',
  `Card limit — dynamic by size; must fit at ${LAB_CAPACITY_CELL_PX}px cells`,
  'Honor teacher rects (layout or size seed)',
];
/**
 * @param {{ size?: string, orientation?: string }} pin
 * @returns {{ w: number, h: number }}
 */
export function labSeedSpan(pin) {
  const size =
    pin?.size === 's' || pin?.size === 'l' || pin?.size === 'banner' ? pin.size : 'm';
  /** Horizontal = landscape (wider). Vertical swaps axes. */
  let span =
    size === 'banner'
      ? { w: 12, h: 4 }
      : size === 's'
        ? { w: 4, h: 4 }
        : size === 'l'
          ? { w: 12, h: 8 }
          : { w: 6, h: 4 };
  if (pin?.orientation === 'vertical' && span.w !== span.h) {
    span = { w: span.h, h: span.w };
  }
  return span;
}

/**
 * @param {{ col?: number, row?: number, w?: number, h?: number } | null | undefined} raw
 * @returns {{ col: number, row: number, w: number, h: number } | null}
 */
export function labNormalizeRect(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const col = Math.max(0, Math.floor(Number(raw.col)));
  const row = Math.max(0, Math.floor(Number(raw.row)));
  const w = Math.max(1, Math.floor(Number(raw.w)));
  const h = Math.max(1, Math.floor(Number(raw.h)));
  if (![col, row, w, h].every(Number.isFinite)) return null;
  const clampedW = Math.min(w, LAB_COLS);
  const clampedCol = Math.min(col, Math.max(0, LAB_COLS - clampedW));
  return { col: clampedCol, row, w: clampedW, h };
}

/**
 * @param {{ layout?: object, size?: string, orientation?: string }} pin
 */
export function labGetRect(pin) {
  const fromLayout = labNormalizeRect(pin?.layout);
  if (fromLayout) return fromLayout;
  const { w, h } = labSeedSpan(pin);
  return { col: 0, row: 0, w, h };
}

function ensureGridRows(grid, rowCount) {
  while (grid.length < rowCount) {
    grid.push(Array(LAB_COLS).fill(false));
  }
}

function cellFree(grid, col, row, w, h) {
  if (col < 0 || row < 0 || col + w > LAB_COLS) return false;
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
 * @param {Array<{ col: number, row: number, w: number, h: number }>} occupied
 * @param {number} w
 * @param {number} h
 */
export function labFindFirstFit(occupied, w, h, maxRows = 80) {
  const grid = [];
  for (const r of occupied) {
    if (!r) continue;
    markGrid(grid, r.col, r.row, r.w, r.h);
  }
  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col <= LAB_COLS - w; col += 1) {
      if (cellFree(grid, col, row, w, h)) {
        return { col, row, w, h };
      }
    }
  }
  return { col: 0, row: 0, w, h };
}

/**
 * Pack pins using layout or seed only (no content mins).
 * @param {Array<{ id: string, layout?: object, size?: string, orientation?: string }>} pins
 */
export function labPackPins(pins) {
  const list = Array.isArray(pins) ? pins : [];
  const grid = [];
  /** @type {Array<{ id: string, col: number, row: number, w: number, h: number }>} */
  const placements = [];

  for (const pin of list) {
    if (!pin?.id) continue;
    const desired = labGetRect(pin);
    let rect = desired;
    if (!cellFree(grid, desired.col, desired.row, desired.w, desired.h)) {
      const occupied = placements.map((p) => ({
        col: p.col,
        row: p.row,
        w: p.w,
        h: p.h,
      }));
      rect = labFindFirstFit(occupied, desired.w, desired.h);
    }
    markGrid(grid, rect.col, rect.row, rect.w, rect.h);
    placements.push({ id: pin.id, ...rect });
  }

  let rows = Math.max(1, grid.length);
  while (rows > 1) {
    const last = grid[rows - 1];
    if (last?.some(Boolean)) break;
    rows -= 1;
  }

  return { placements, rows };
}

/**
 * Re-place pins with first-fit from their size seeds.
 * Customized layouts are kept when `respectCustomized` is true.
 * @param {Array<object>} pins
 * @param {{ respectCustomized?: boolean }} [opts]
 */
export function labRepackPins(pins, { respectCustomized = false } = {}) {
  const occupied = [];
  return (Array.isArray(pins) ? pins : []).map((pin, index) => {
    if (!pin) return pin;
    if (respectCustomized && pin.layoutCustomized) {
      const rect = labGetRect(pin);
      occupied.push(rect);
      return { ...pin, layout: rect };
    }
    const span = labSeedSpan(pin);
    const layout = labFindFirstFit(occupied, span.w, span.h);
    occupied.push(layout);
    return {
      ...pin,
      id: pin.id || `lab-pin-${index}`,
      layout,
      layoutCustomized: false,
    };
  });
}

/**
 * Fit the packed board into a bounded 16:9 stage with no scroll.
 * Cell width fills the stage width; cell height fills the stage height.
 *
 * @param {{
 *   pins: Array<{ id: string, layout?: object, size?: string, orientation?: string }>,
 *   width: number,
 *   height: number,
 *   cellPx?: number,
 *   gap?: number,
 *   minCellPx?: number,
 * }} args
 */
export function labFitBoard({
  pins,
  width,
  height,
  cellPx = LAB_CELL_PX,
  gap = LAB_GAP_PX,
  minCellPx = LAB_MIN_CELL_PX,
}) {
  const stageW = Math.max(1, Number(width) || 1);
  const stageH = Math.max(1, Number(height) || 1);
  const packed = labPackPins(pins);
  const rowCount = Math.max(1, packed.rows);
  const colCount = LAB_COLS;
  const preferred = Math.max(1, Number(cellPx) || LAB_CELL_PX);
  const capacityCell = Math.max(1, Number(minCellPx) || LAB_CAPACITY_CELL_PX);

  // Fill the stage. Shrink gap if it would exceed the frame (dense packs).
  let useGap = gap;
  let gapX = useGap * (colCount - 1);
  let gapY = useGap * Math.max(0, rowCount - 1);
  if (gapX >= stageW || gapY >= stageH) {
    const maxGapX = colCount > 1 ? stageW / (2 * (colCount - 1)) : useGap;
    const maxGapY = rowCount > 1 ? stageH / (2 * (rowCount - 1)) : useGap;
    useGap = Math.max(0, Math.min(useGap, maxGapX, maxGapY));
    gapX = useGap * (colCount - 1);
    gapY = useGap * Math.max(0, rowCount - 1);
  }

  const cellW = Math.max(1, (stageW - gapX) / colCount);
  const cellH = Math.max(1, (stageH - gapY) / rowCount);
  const boardW = cellW * colCount + gapX;
  const boardH = cellH * rowCount + gapY;
  const minSide = Math.min(cellW, cellH);
  const overCapacity =
    minSide + 0.5 < capacityCell ||
    !labBoardFitsCapacity(pins, stageW, stageH, {
      cellPx: capacityCell,
      gap,
    });
  const belowReadableFloor = overCapacity;
  const shrunk = minSide + 0.5 < preferred;
  const overflows = false;

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
    rows: rowCount,
    cols: colCount,
    cellW,
    cellH,
    preferredCell: preferred,
    capacityCell,
    gap: useGap,
    boardW,
    boardH,
    offsetX: 0,
    offsetY: 0,
    overflows,
    shrunk,
    overCapacity,
    belowReadableFloor,
    scale: 1,
  };
}

/**
 * Pixel size of a packed board at a fixed cell size (capacity math).
 * @param {Array<{ id: string, layout?: object, size?: string, orientation?: string }>} pins
 * @param {{ cellPx?: number, gap?: number }} [opts]
 */
export function labBoardPixelSize(pins, { cellPx = LAB_CAPACITY_CELL_PX, gap = LAB_GAP_PX } = {}) {
  const packed = labPackPins(pins);
  const rows = Math.max(1, packed.rows);
  const gapX = gap * (LAB_COLS - 1);
  const gapY = gap * Math.max(0, rows - 1);
  const cell = Math.max(1, Number(cellPx) || LAB_CAPACITY_CELL_PX);
  return {
    rows,
    boardW: cell * LAB_COLS + gapX,
    boardH: cell * rows + gapY,
  };
}

/**
 * True when the pack fits the stage at the capacity cell size.
 */
export function labBoardFitsCapacity(
  pins,
  width,
  height,
  { cellPx = LAB_CAPACITY_CELL_PX, gap = LAB_GAP_PX } = {},
) {
  const stageW = Math.max(1, Number(width) || 1);
  const stageH = Math.max(1, Number(height) || 1);
  const { boardW, boardH } = labBoardPixelSize(pins, { cellPx, gap });
  return boardW <= stageW + 0.5 && boardH <= stageH + 0.5;
}

/**
 * How many cards of one uniform size fit the stage at the capacity cell.
 * @param {'s' | 'm' | 'l' | 'banner'} size
 */
export function labMaxPinsForUniformSize(
  size,
  width = LAB_REFERENCE_STAGE.width,
  height = LAB_REFERENCE_STAGE.height,
  { cellPx = LAB_CAPACITY_CELL_PX, gap = LAB_GAP_PX, hardCap = 48 } = {},
) {
  const pins = [];
  const span = labSeedSpan({ size });
  for (let i = 0; i < hardCap; i += 1) {
    const occupied = pins.map((p) => ({
      col: p.layout.col,
      row: p.layout.row,
      w: p.layout.w,
      h: p.layout.h,
    }));
    const layout = labFindFirstFit(occupied, span.w, span.h);
    const next = {
      id: `cap-${size}-${i}`,
      type: 'custom',
      size,
      layout,
    };
    if (!labBoardFitsCapacity([...pins, next], width, height, { cellPx, gap })) {
      break;
    }
    pins.push(next);
  }
  return pins.length;
}

/**
 * Uniform ceilings for the four size presets on this stage.
 * @returns {{ s: number, m: number, l: number, banner: number }}
 */
export function labCapacityBySize(
  width = LAB_REFERENCE_STAGE.width,
  height = LAB_REFERENCE_STAGE.height,
  opts = {},
) {
  return {
    s: labMaxPinsForUniformSize('s', width, height, opts),
    m: labMaxPinsForUniformSize('m', width, height, opts),
    l: labMaxPinsForUniformSize('l', width, height, opts),
    banner: labMaxPinsForUniformSize('banner', width, height, opts),
  };
}

/**
 * Absolute card ceiling for a stage (largest uniform pack — usually all S).
 */
export function labAbsoluteMaxPins(
  width = LAB_REFERENCE_STAGE.width,
  height = LAB_REFERENCE_STAGE.height,
  opts = {},
) {
  const caps = labCapacityBySize(width, height, opts);
  return Math.max(caps.s, caps.m, caps.l, caps.banner, 0);
}

/**
 * Whether a candidate pin list is allowed on the panel.
 * Count ceiling = all-small (absolute) max; fit uses capacity cell size.
 * @returns {{ ok: true } | { ok: false, reason: 'max' | 'fit' }}
 */
export function labAcceptsPins(
  pins,
  width = LAB_REFERENCE_STAGE.width,
  height = LAB_REFERENCE_STAGE.height,
  {
    maxPins = null,
    cellPx = LAB_CAPACITY_CELL_PX,
    gap = LAB_GAP_PX,
  } = {},
) {
  const list = Array.isArray(pins) ? pins : [];
  const ceiling =
    maxPins == null
      ? labAbsoluteMaxPins(width, height, { cellPx, gap })
      : maxPins;
  if (list.length > ceiling) return { ok: false, reason: 'max' };
  if (!labBoardFitsCapacity(list, width, height, { cellPx, gap })) {
    return { ok: false, reason: 'fit' };
  }
  return { ok: true };
}

/**
 * @param {Array<object>} pins
 * @param {{ id?: string, type: string, size?: string, orientation?: string, props?: object, layout?: object }} candidate
 * @returns {{ ok: true, pin: object } | { ok: false, reason: 'max' | 'fit' | 'duplicate' }}
 */
export function labCanAddPin(
  pins,
  candidate,
  width = LAB_REFERENCE_STAGE.width,
  height = LAB_REFERENCE_STAGE.height,
  opts = {},
) {
  const list = Array.isArray(pins) ? pins : [];
  const ceiling =
    opts.maxPins == null
      ? labAbsoluteMaxPins(width, height, opts)
      : opts.maxPins;
  if (list.length >= ceiling) return { ok: false, reason: 'max' };

  const type = String(candidate?.type || '');
  if (type && type !== 'custom' && list.some((p) => p.type === type)) {
    return { ok: false, reason: 'duplicate' };
  }

  const occupied = list.map((p) => labGetRect(p));
  const span = candidate?.layout
    ? labNormalizeRect(candidate.layout) || labSeedSpan(candidate)
    : labSeedSpan(candidate);
  const layout =
    candidate?.layout && labNormalizeRect(candidate.layout)
      ? labNormalizeRect(candidate.layout)
      : labFindFirstFit(occupied, span.w, span.h);

  const pin = {
    id: candidate.id || `lab-${type || 'pin'}-${list.length + 1}`,
    type,
    size: candidate.size || 'm',
    orientation: candidate.orientation || 'horizontal',
    props: candidate.props || {},
    layout,
    layoutCustomized: Boolean(candidate.layoutCustomized),
  };

  // Lab UI can skip fit so teachers can still add cards; Preview flags overCapacity.
  if (opts.requireFit === false) {
    return { ok: true, pin };
  }

  const check = labAcceptsPins([...list, pin], width, height, opts);
  if (!check.ok) return check;
  return { ok: true, pin };
}

/**
 * @param {{ col: number, row: number, cols?: number, rows?: number, w?: number, h?: number }} p
 */
export function labPlacementStyle(p) {
  const cols = p.cols ?? p.w ?? 1;
  const rows = p.rows ?? p.h ?? 1;
  return {
    gridColumn: `${p.col + 1} / span ${cols}`,
    gridRow: `${p.row + 1} / span ${rows}`,
  };
}

/**
 * @param {{ col: number, row: number, w?: number, h?: number, cols?: number, rows?: number }} a
 * @param {{ col: number, row: number, w?: number, h?: number, cols?: number, rows?: number }} b
 */
export function labRectsOverlap(a, b) {
  const aw = a.w ?? a.cols ?? 1;
  const ah = a.h ?? a.rows ?? 1;
  const bw = b.w ?? b.cols ?? 1;
  const bh = b.h ?? b.rows ?? 1;
  return !(
    a.col + aw <= b.col ||
    b.col + bw <= a.col ||
    a.row + ah <= b.row ||
    b.row + bh <= a.row
  );
}

/**
 * @param {Array<{ id?: string, col: number, row: number, w: number, h: number }>} rects
 * @param {{ col: number, row: number, w: number, h: number }} candidate
 * @param {string | null} [excludeId]
 */
export function labHasCollision(rects, candidate, excludeId = null) {
  if (!candidate) return true;
  if (candidate.col < 0 || candidate.row < 0) return true;
  if (candidate.col + candidate.w > LAB_COLS) return true;
  for (const r of rects) {
    if (!r) continue;
    if (excludeId != null && r.id === excludeId) continue;
    if (labRectsOverlap(r, candidate)) return true;
  }
  return false;
}
