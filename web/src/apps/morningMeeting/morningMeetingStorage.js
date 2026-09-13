/**
 * Per-class Morning Meeting board pins.
 * Storage: eduHub.morningMeeting.byClass
 */

import { BOARD_COLS, clampRectToContentMin, normalizeRect, packAssignLayouts, seedSpan } from './boardLayout';

export const MORNING_MEETING_STORAGE_KEY = 'eduHub.morningMeeting.byClass';
export const MORNING_MEETING_UPDATED_EVENT = 'eduHub.morningMeeting.updated';

/** @typedef {'s' | 'm' | 'l' | 'banner'} PinSize */
/** @typedef {'horizontal' | 'vertical'} PinOrientation */
/** @typedef {'sm' | 'md' | 'lg'} PinTextSize */
/** @typedef {string} PinFont */
/** @typedef {'date' | 'message' | 'attendance' | 'lunch' | 'jobs' | 'timer' | 'novelty' | 'custom' | 'weather'} WidgetType */
/** @typedef {{ col: number, row: number, w: number, h: number }} PinLayout */

/**
 * @typedef {{
 *   id: string,
 *   type: WidgetType,
 *   size: PinSize,
 *   orientation: PinOrientation,
 *   textSize: PinTextSize,
 *   font: PinFont,
 *   layout: PinLayout | null,
 *   layoutCustomized: boolean,
 *   props: Record<string, unknown>,
 * }} BoardPin
 *
 * @typedef {{ pins: BoardPin[], backgroundSrc: string }} MorningBoard
 */

const SIZES = new Set(['s', 'm', 'l', 'banner']);
const ORIENTATIONS = new Set(['horizontal', 'vertical']);
const TEXT_SIZES = new Set(['sm', 'md', 'lg']);
const FONTS = new Set(['default', 'atkinson', 'lexend', 'serif', 'mono']);
const TYPES = new Set([
  'date',
  'weather',
  'message',
  'attendance',
  'lunch',
  'jobs',
  'timer',
  'novelty',
  'custom',
]);

/** Types that may appear more than once on a board. */
const MULTI_TYPES = new Set(['custom']);

function newId(prefix = 'pin') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyBoard() {
  return { pins: [], backgroundSrc: '' };
}

/**
 * @param {Partial<BoardPin> & { type: WidgetType, id?: string }} partial
 * @returns {BoardPin}
 */
function makePin(partial) {
  const size = SIZES.has(partial.size) ? partial.size : 'm';
  const orientation = ORIENTATIONS.has(partial.orientation)
    ? partial.orientation
    : 'horizontal';
  const textSize = TEXT_SIZES.has(partial.textSize) ? partial.textSize : 'md';
  const font = FONTS.has(partial.font) ? partial.font : 'default';
  const layout = normalizeRect(partial.layout);
  return {
    id: String(partial.id || newId('pin')),
    type: partial.type,
    size: /** @type {PinSize} */ (size),
    orientation: /** @type {PinOrientation} */ (orientation),
    textSize: /** @type {PinTextSize} */ (textSize),
    font: /** @type {PinFont} */ (font),
    layout,
    layoutCustomized: Boolean(partial.layoutCustomized),
    props: partial.props && typeof partial.props === 'object' ? { ...partial.props } : {},
  };
}

/**
 * @returns {BoardPin[]}
 */
export function defaultPins() {
  return [
    makePin({ type: 'date', size: 'm' }),
    makePin({ type: 'novelty', size: 'm' }),
    makePin({
      type: 'message',
      size: 's',
      props: {
        text: 'Welcome! Hang up your backpack and start morning work.',
      },
    }),
    makePin({ type: 'attendance', size: 'l' }),
    makePin({ type: 'lunch', size: 'l' }),
  ].map((p) => {
    // Layouts assigned in ensureLayouts
    return p;
  });
}

/**
 * @param {unknown} raw
 * @returns {BoardPin | null}
 */
function normalizePin(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw.type || '');
  if (!TYPES.has(type)) return null;
  const size = SIZES.has(raw.size) ? raw.size : 'm';
  const orientation = ORIENTATIONS.has(raw.orientation) ? raw.orientation : 'horizontal';
  const textSize = TEXT_SIZES.has(raw.textSize) ? raw.textSize : 'md';
  const font = FONTS.has(raw.font) ? raw.font : 'default';
  const props =
    raw.props && typeof raw.props === 'object' && !Array.isArray(raw.props)
      ? { ...raw.props }
      : {};
  if (type === 'custom') {
    props.title = typeof props.title === 'string' && props.title.trim() ? props.title : 'Custom';
    props.text = typeof props.text === 'string' ? props.text : '';
    props.imageSrc = typeof props.imageSrc === 'string' ? props.imageSrc : '';
    props.studentId =
      props.studentId == null || props.studentId === ''
        ? ''
        : String(props.studentId);
  }
  if (type === 'message' && typeof props.imageSrc !== 'string') {
    delete props.imageSrc;
  }
  if (type === 'weather') {
    props.place = typeof props.place === 'string' ? props.place.trim() : '';
    props.unit = props.unit === 'c' ? 'c' : 'f';
    const latRaw = props.lat;
    const lonRaw = props.lon;
    const lat = latRaw == null || latRaw === '' ? NaN : Number(latRaw);
    const lon = lonRaw == null || lonRaw === '' ? NaN : Number(lonRaw);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      props.lat = lat;
      props.lon = lon;
    } else {
      delete props.lat;
      delete props.lon;
    }
  }
  return makePin({
    id: String(raw.id || newId('pin')),
    type: /** @type {WidgetType} */ (type),
    size: /** @type {PinSize} */ (size),
    orientation: /** @type {PinOrientation} */ (orientation),
    textSize: /** @type {PinTextSize} */ (textSize),
    font: /** @type {PinFont} */ (font),
    layout: raw.layout,
    layoutCustomized: Boolean(raw.layoutCustomized),
    props,
  });
}

/**
 * Ensure every pin has a non-overlapping layout rect.
 * @param {BoardPin[]} pins
 * @returns {{ pins: BoardPin[], changed: boolean }}
 */
export function ensureLayouts(pins) {
  const list = Array.isArray(pins) ? pins : [];
  if (!list.length) return { pins: list, changed: false };

  const missing = list.some((p) => !p.layout);
  let colliding = false;
  if (!missing) {
    const rects = list.map((p) => ({ id: p.id, ...p.layout }));
    for (let i = 0; i < rects.length && !colliding; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        if (
          !(
            a.col + a.w <= b.col ||
            b.col + b.w <= a.col ||
            a.row + a.h <= b.row ||
            b.row + b.h <= a.row
          )
        ) {
          colliding = true;
          break;
        }
      }
    }
  }

  if (!missing && !colliding) {
    return { pins: list, changed: false };
  }

  const packed = packAssignLayouts(list);
  const next = packed.pins.map((p) =>
    normalizePin({
      ...p,
      layout: p.layout,
      layoutCustomized: Boolean(p.layoutCustomized),
    }),
  );
  return { pins: next.filter(Boolean), changed: true };
}

/**
 * @param {unknown} raw
 * @returns {MorningBoard}
 */
export function normalizeBoard(raw) {
  const pins = (Array.isArray(raw?.pins) ? raw.pins : [])
    .map(normalizePin)
    .filter(Boolean);
  const { pins: withLayout } = ensureLayouts(pins);
  const backgroundSrc =
    typeof raw?.backgroundSrc === 'string' ? raw.backgroundSrc : '';
  return { pins: withLayout, backgroundSrc };
}

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(MORNING_MEETING_STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(MORNING_MEETING_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(MORNING_MEETING_UPDATED_EVENT, {
        detail: { at: Date.now() },
      }),
    );
  }
}

/**
 * @param {string | null | undefined} classId
 * @returns {MorningBoard}
 */
export function readBoard(classId) {
  if (!classId) return emptyBoard();
  const all = readAll();
  return normalizeBoard(all[String(classId)]);
}

/**
 * @param {string} classId
 * @param {Partial<MorningBoard> & { pins?: BoardPin[] }} board
 */
export function writeBoard(classId, board) {
  if (!classId) return emptyBoard();
  const all = readAll();
  const prev = normalizeBoard(all[String(classId)]);
  const next = normalizeBoard({
    pins: board.pins !== undefined ? board.pins : prev.pins,
    backgroundSrc:
      board.backgroundSrc !== undefined ? board.backgroundSrc : prev.backgroundSrc,
  });
  all[String(classId)] = next;
  writeAll(all);
  return next;
}

/**
 * Ensure a board exists for this class (seed defaults on first open).
 * Migrates legacy pin sizes and inserts Fun Day when missing; assigns layouts.
 * @param {string} classId
 */
export function ensureBoard(classId) {
  if (!classId) return emptyBoard();
  const all = readAll();
  const key = String(classId);
  if (!Object.prototype.hasOwnProperty.call(all, key)) {
    const seeded = ensureLayouts(defaultPins());
    return writeBoard(classId, { pins: seeded.pins, backgroundSrc: '' });
  }
  const board = normalizeBoard(all[key]);
  let changed = false;
  let pins = board.pins.map((pin) => {
    if ((pin.type === 'attendance' || pin.type === 'lunch') && pin.size === 's') {
      changed = true;
      const span = seedSpan({ ...pin, size: 'l' });
      return {
        ...pin,
        size: /** @type {PinSize} */ ('l'),
        layout: pin.layoutCustomized
          ? pin.layout
          : pin.layout
            ? { ...pin.layout, w: span.w, h: span.h }
            : null,
      };
    }
    return pin;
  });
  if (!pins.some((p) => p.type === 'novelty')) {
    const dateIdx = pins.findIndex((p) => p.type === 'date');
    const novelty = normalizePin({
      id: newId('pin'),
      type: 'novelty',
      size: 'm',
      props: {},
    });
    if (novelty) {
      changed = true;
      if (dateIdx >= 0) {
        pins = [
          ...pins.slice(0, dateIdx + 1),
          novelty,
          ...pins.slice(dateIdx + 1),
        ];
      } else {
        pins = [novelty, ...pins];
      }
    }
  }
  // One pin per built-in type — keep the first of each. Custom cards may repeat.
  const seenTypes = new Set();
  const deduped = [];
  for (const pin of pins) {
    if (!MULTI_TYPES.has(pin.type) && seenTypes.has(pin.type)) {
      changed = true;
      continue;
    }
    if (!MULTI_TYPES.has(pin.type)) seenTypes.add(pin.type);
    deduped.push(pin);
  }
  pins = deduped;

  const laid = ensureLayouts(pins);
  if (laid.changed) changed = true;
  pins = laid.pins;

  if (changed) {
    return writeBoard(classId, { pins, backgroundSrc: board.backgroundSrc });
  }
  return board;
}

/**
 * @param {string} classId
 * @param {{ type: WidgetType, size?: PinSize, props?: Record<string, unknown> }} input
 */
export function addPin(classId, input) {
  const board = ensureBoard(classId);
  const type = String(input?.type || '');
  if (!TYPES.has(type)) return board;
  if (!MULTI_TYPES.has(type) && board.pins.some((p) => p.type === type)) return board;

  let props = { ...(input.props || {}) };
  if (type === 'message') {
    props = {
      ...props,
      text: String(props.text || 'Good morning!'),
    };
  } else if (type === 'custom') {
    props = {
      title: String(props.title || 'Custom'),
      text: typeof props.text === 'string' ? props.text : '',
      imageSrc: typeof props.imageSrc === 'string' ? props.imageSrc : '',
      studentId:
        props.studentId == null || props.studentId === ''
          ? ''
          : String(props.studentId),
    };
  } else if (type === 'weather') {
    props = {
      place: typeof props.place === 'string' ? props.place.trim() : '',
      unit: props.unit === 'c' ? 'c' : 'f',
      ...(Number.isFinite(Number(props.lat)) && Number.isFinite(Number(props.lon))
        ? { lat: Number(props.lat), lon: Number(props.lon) }
        : {}),
    };
  }

  const size =
    input.size ||
    (type === 'attendance' || type === 'lunch'
      ? 'l'
      : type === 'message' || type === 'custom' || type === 'timer' || type === 'weather'
        ? 's'
        : type === 'date' || type === 'novelty' || type === 'jobs'
          ? 'm'
          : 's');

  const pin = normalizePin({
    id: newId('pin'),
    type,
    size,
    orientation: input.orientation || 'horizontal',
    textSize: input.textSize || 'md',
    font: input.font || 'default',
    layout: null,
    layoutCustomized: false,
    props,
  });
  if (!pin) return board;

  const { pins } = ensureLayouts([...board.pins, pin]);
  return writeBoard(classId, { ...board, pins });
}

/**
 * @param {string} classId
 * @param {string} pinId
 */
export function removePin(classId, pinId) {
  const board = ensureBoard(classId);
  return writeBoard(classId, {
    ...board,
    pins: board.pins.filter((p) => p.id !== String(pinId)),
  });
}

/**
 * @param {string} classId
 * @param {string} pinId
 * @param {Partial<BoardPin>} patch
 */
export function updatePin(classId, pinId, patch) {
  const board = ensureBoard(classId);
  const pins = board.pins
    .map((p) => {
      if (p.id !== String(pinId)) return p;
      return normalizePin({
        ...p,
        ...patch,
        props: { ...p.props, ...(patch.props || {}) },
        id: p.id,
        type: p.type,
        layout: patch.layout !== undefined ? patch.layout : p.layout,
        layoutCustomized:
          patch.layoutCustomized !== undefined
            ? patch.layoutCustomized
            : p.layoutCustomized,
      });
    })
    .filter(Boolean);
  const { pins: laid } = ensureLayouts(pins);
  return writeBoard(classId, { ...board, pins: laid });
}

/**
 * Update size. Re-seeds layout span only when layout is not yet customized.
 * @param {string} classId
 * @param {string} pinId
 * @param {PinSize} size
 */
export function setPinSize(classId, pinId, size) {
  if (!SIZES.has(size)) return readBoard(classId);
  const board = ensureBoard(classId);
  const pin = board.pins.find((p) => p.id === String(pinId));
  if (!pin) return board;
  if (pin.layoutCustomized) {
    return updatePin(classId, pinId, { size });
  }
  const span = seedSpan({ ...pin, size });
  const layout = clampRectToContentMin(
    { ...pin, size },
    {
      col: pin.layout?.col ?? 0,
      row: pin.layout?.row ?? 0,
      w: span.w,
      h: span.h,
    },
  );
  return updatePin(classId, pinId, { size, layout, layoutCustomized: false });
}

/**
 * Persist a snapped layout rect from the playground (marks customized).
 * Never stores below the content minimum — content floor cannot be overridden.
 * @param {string} classId
 * @param {string} pinId
 * @param {PinLayout} layout
 */
export function setPinLayout(classId, pinId, layout) {
  const board = ensureBoard(classId);
  const pin = board.pins.find((p) => p.id === String(pinId));
  if (!pin) return board;
  const rect = normalizeRect(layout);
  if (!rect) return board;
  const clamped = clampRectToContentMin(pin, rect);
  return updatePin(classId, pinId, {
    layout: clamped,
    layoutCustomized: true,
  });
}

/**
 * @param {string} classId
 * @param {string} pinId
 * @param {PinOrientation} orientation
 */
export function setPinOrientation(classId, pinId, orientation) {
  if (!ORIENTATIONS.has(orientation)) return readBoard(classId);
  const board = ensureBoard(classId);
  const pin = board.pins.find((p) => p.id === String(pinId));
  if (!pin) return board;
  if (pin.layoutCustomized) {
    return updatePin(classId, pinId, { orientation });
  }
  const span = seedSpan({ ...pin, orientation });
  const layout = clampRectToContentMin(
    { ...pin, orientation },
    {
      col: pin.layout?.col ?? 0,
      row: pin.layout?.row ?? 0,
      w: span.w,
      h: span.h,
    },
  );
  return updatePin(classId, pinId, { orientation, layout });
}

/**
 * @param {string} classId
 * @param {string} pinId
 * @param {PinTextSize} textSize
 */
export function setPinTextSize(classId, pinId, textSize) {
  if (!TEXT_SIZES.has(textSize)) return readBoard(classId);
  return updatePin(classId, pinId, { textSize });
}

/**
 * @param {string} classId
 * @param {string} pinId
 * @param {PinFont} font
 */
export function setPinFont(classId, pinId, font) {
  if (!FONTS.has(font)) return readBoard(classId);
  return updatePin(classId, pinId, { font });
}

/**
 * @param {string} classId
 * @param {string} src
 */
export function setBoardBackground(classId, src) {
  const board = ensureBoard(classId);
  return writeBoard(classId, {
    ...board,
    backgroundSrc: typeof src === 'string' ? src : '',
  });
}

/**
 * Move a pin before another pin (or to the end if beforeId is null).
 * @param {string} classId
 * @param {string} fromId
 * @param {string | null} beforeId
 */
export function reorderPin(classId, fromId, beforeId) {
  const board = ensureBoard(classId);
  const from = String(fromId);
  const before = beforeId != null ? String(beforeId) : null;
  if (from === before) return board;
  const fromIdx = board.pins.findIndex((p) => p.id === from);
  if (fromIdx < 0) return board;
  const next = board.pins.slice();
  const [moved] = next.splice(fromIdx, 1);
  if (!moved) return board;
  if (!before) {
    next.push(moved);
  } else {
    const toIdx = next.findIndex((p) => p.id === before);
    if (toIdx < 0) next.push(moved);
    else next.splice(toIdx, 0, moved);
  }
  return writeBoard(classId, { ...board, pins: next });
}

/**
 * Move a pin one step earlier or later in the list.
 * @param {string} classId
 * @param {string} pinId
 * @param {-1 | 1} direction
 */
export function movePin(classId, pinId, direction) {
  const board = ensureBoard(classId);
  const idx = board.pins.findIndex((p) => p.id === String(pinId));
  if (idx < 0) return board;
  const target = idx + direction;
  if (target < 0 || target >= board.pins.length) return board;
  const next = board.pins.slice();
  const [moved] = next.splice(idx, 1);
  next.splice(target, 0, moved);
  return writeBoard(classId, { ...board, pins: next });
}
