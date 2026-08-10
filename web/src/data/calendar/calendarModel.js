/**
 * Edu.Calendar — shapes, IDs, defaults, specialist seed.
 */

export const LAYER_TYPES = ['standard', 'rotation'];
export const CALENDAR_VIEWS = ['Month', 'Week', 'Day'];
export const EVENT_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

/** Slot colors for rotation / layer chips (intentional viz, not theme roles). */
export const CALENDAR_SWATCHES = [
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function newCalendarId(prefix = 'cal') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toIsoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso) {
  const s = String(iso || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysIso(iso, delta) {
  const d = parseIsoDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
}

export function defaultAcademicYear(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based; before Aug → previous Sept start
  const startYear = month < 7 ? year - 1 : year;
  return {
    startDate: `${startYear}-09-01`,
    endDate: `${startYear + 1}-06-15`,
    workingDays: [1, 2, 3, 4, 5],
    breaks: [],
    observeNationalHolidays: true,
  };
}

export function normalizeBreak(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const startDate = String(raw.startDate || '').trim();
  const endDate = String(raw.endDate || startDate).trim();
  if (!parseIsoDate(startDate) || !parseIsoDate(endDate)) return null;
  return {
    id: String(raw.id || newCalendarId('break')),
    name: String(raw.name || 'Break').trim() || 'Break',
    startDate,
    endDate: endDate < startDate ? startDate : endDate,
  };
}

export function normalizeAcademic(raw) {
  const base = defaultAcademicYear();
  const s = raw && typeof raw === 'object' ? raw : {};
  const workingDays = Array.isArray(s.workingDays)
    ? [...new Set(s.workingDays.map(Number).filter((d) => d >= 0 && d <= 6))]
    : base.workingDays;
  return {
    startDate: parseIsoDate(s.startDate) ? String(s.startDate) : base.startDate,
    endDate: parseIsoDate(s.endDate) ? String(s.endDate) : base.endDate,
    workingDays: workingDays.length ? workingDays : base.workingDays,
    breaks: (Array.isArray(s.breaks) ? s.breaks : [])
      .map(normalizeBreak)
      .filter(Boolean),
    // Default on — national holidays auto-close session days.
    observeNationalHolidays: s.observeNationalHolidays !== false,
  };
}

export function normalizeClosure(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const date = String(raw.date || '').trim();
  if (!parseIsoDate(date)) return null;
  return {
    id: String(raw.id || newCalendarId('closure')),
    date,
    label: String(raw.label || 'Snow day').trim() || 'Snow day',
  };
}

export function normalizeSlot(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const label = String(raw.label || raw.name || '').trim();
  if (!label) return null;
  return {
    id: String(raw.id || newCalendarId('slot')),
    label,
    color: String(raw.color || CALENDAR_SWATCHES[index % CALENDAR_SWATCHES.length]),
  };
}

export function normalizeLayer(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const type = LAYER_TYPES.includes(raw.type) ? raw.type : 'standard';
  const slots =
    type === 'rotation'
      ? (Array.isArray(raw.slots) ? raw.slots : [])
          .map((s, i) => normalizeSlot(s, i))
          .filter(Boolean)
      : [];
  return {
    id: String(raw.id || newCalendarId('layer')),
    name,
    type,
    color: String(raw.color || CALENDAR_SWATCHES[0]),
    slots,
    anchorDate: parseIsoDate(raw.anchorDate)
      ? String(raw.anchorDate)
      : toIsoDate(new Date()),
    visible: raw.visible !== false,
  };
}

export function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title || raw.name || '').trim();
  const startDate = String(raw.startDate || raw.date || '').trim();
  if (!title || !parseIsoDate(startDate)) return null;
  const endDate = String(raw.endDate || startDate).trim();
  return {
    id: String(raw.id || newCalendarId('event')),
    layerId: raw.layerId != null ? String(raw.layerId) : '',
    title,
    startDate,
    endDate: parseIsoDate(endDate)
      ? endDate < startDate
        ? startDate
        : endDate
      : startDate,
    startTime: String(raw.startTime || '').trim(),
    endTime: String(raw.endTime || '').trim(),
    notes: String(raw.notes || '').trim(),
    isRecurring: Boolean(raw.isRecurring),
    frequency: EVENT_FREQUENCIES.includes(raw.frequency)
      ? raw.frequency
      : 'Weekly',
    excludedDates: Array.isArray(raw.excludedDates)
      ? raw.excludedDates.map(String).filter((d) => parseIsoDate(d))
      : [],
  };
}

export function normalizeCountdown(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title || '').trim();
  const targetDate = String(raw.targetDate || '').trim();
  if (!title || !parseIsoDate(targetDate)) return null;
  return {
    id: String(raw.id || newCalendarId('countdown')),
    title,
    targetDate,
    linkedEventId: raw.linkedEventId ? String(raw.linkedEventId) : '',
  };
}

export function normalizeUiPrefs(raw, classIds = []) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const ids = Array.isArray(s.visibleClassIds)
    ? s.visibleClassIds.map(String)
    : classIds.slice(0, 1).map(String);
  const defaultView = CALENDAR_VIEWS.includes(s.defaultView)
    ? s.defaultView
    : CALENDAR_VIEWS.includes(s.view)
      ? s.view
      : 'Month';
  const view = CALENDAR_VIEWS.includes(s.view) ? s.view : defaultView;
  const cursorDate = parseIsoDate(s.cursorDate)
    ? String(s.cursorDate)
    : toIsoDate(new Date());
  const weekStartsOn = Number(s.weekStartsOn) === 1 ? 1 : 0;
  return {
    visibleClassIds: ids,
    view,
    defaultView,
    cursorDate,
    weekStartsOn,
    // Overlay toggles for the Calendars menu (display only for holidays / birthdays).
    showHolidays: s.showHolidays !== false,
    showBirthdays: s.showBirthdays !== false,
  };
}

/** Rotation layers that power the specialist overlay. */
export function isSpecialistLayer(layer) {
  if (!layer || typeof layer !== 'object') return false;
  if (layer.type === 'rotation') return true;
  const id = String(layer.id || '');
  const name = String(layer.name || '').toLowerCase();
  return id.startsWith('demo-specialist-') || name.includes('specialist');
}

/** Six-specialist demo rotation (PE ×2, Future Ready, STEM, Art, Music). */
export function specialistRotationSeed(now = new Date()) {
  const slots = [
    { label: 'P.E.', color: '#0ea5e9' },
    { label: 'P.E.', color: '#0284c7' },
    { label: 'Future Ready', color: '#8b5cf6' },
    { label: 'STEM', color: '#10b981' },
    { label: 'Art', color: '#f43f5e' },
    { label: 'Music', color: '#f59e0b' },
  ].map((s, i) => normalizeSlot({ ...s, id: `demo-slot-${i}` }, i));

  return normalizeLayer({
    id: `demo-specialist-${toIsoDate(now)}`,
    name: 'Specialist Rotation',
    type: 'rotation',
    color: '#0ea5e9',
    slots,
    anchorDate: toIsoDate(now),
    visible: true,
  });
}
