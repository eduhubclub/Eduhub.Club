/**
 * Edu.Schedule — per-class day structure (slots / periods).
 */

export const SCHEDULE_MODES = ['daySlots', 'periods'];

export const SCHEDULE_SWATCHES = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#f43f5e',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
];

export function newScheduleId(prefix = 'sch') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** @returns {{ id: string, label: string, order: number, color: string, durationMin: number|null, startTime: string, endTime: string }} */
export function normalizeSlot(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const label = String(raw.label || '').trim();
  if (!label) return null;
  const order = Number.isFinite(Number(raw.order)) ? Number(raw.order) : index;
  const color =
    typeof raw.color === 'string' && raw.color.trim()
      ? raw.color.trim()
      : SCHEDULE_SWATCHES[order % SCHEDULE_SWATCHES.length];
  const durationRaw = raw.durationMin;
  const durationMin =
    durationRaw == null || durationRaw === ''
      ? null
      : Math.max(0, Math.round(Number(durationRaw)) || 0);
  return {
    id: String(raw.id || newScheduleId('slot')),
    label,
    order,
    color,
    durationMin,
    startTime: typeof raw.startTime === 'string' ? raw.startTime : '',
    endTime: typeof raw.endTime === 'string' ? raw.endTime : '',
  };
}

/** @returns {{ id: string, name: string, slots: object[] }} */
export function normalizeTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim() || 'Day template';
  const slots = (Array.isArray(raw.slots) ? raw.slots : [])
    .map((s, i) => normalizeSlot(s, i))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));
  return {
    id: String(raw.id || newScheduleId('tmpl')),
    name,
    slots,
  };
}

export function defaultRegularTemplate() {
  return normalizeTemplate({
    id: newScheduleId('tmpl'),
    name: 'Regular day',
    slots: [
      { label: 'Morning Meeting', order: 0 },
      { label: 'Math', order: 1 },
      { label: 'Reading', order: 2 },
      { label: 'Writing', order: 3 },
      { label: 'Science / Social Studies', order: 4 },
    ],
  });
}

/**
 * @returns {{
 *   mode: 'daySlots'|'periods',
 *   dayNumbering: { anchorSessionDay: number, labelPrefix: string },
 *   templates: object[],
 *   weekdayTemplateIds: Record<string, string>,
 *   source: 'teacher'|'district',
 * }}
 */
export function normalizeSchedule(raw) {
  const base = {
    mode: 'daySlots',
    dayNumbering: { anchorSessionDay: 1, labelPrefix: 'Day' },
    templates: [],
    weekdayTemplateIds: {},
    source: 'teacher',
  };
  if (!raw || typeof raw !== 'object') {
    return { ...base, templates: [defaultRegularTemplate()] };
  }
  const mode = SCHEDULE_MODES.includes(raw.mode) ? raw.mode : 'daySlots';
  const anchor = Math.max(1, Math.round(Number(raw.dayNumbering?.anchorSessionDay)) || 1);
  const labelPrefix =
    String(raw.dayNumbering?.labelPrefix || 'Day').trim() || 'Day';
  let templates = (Array.isArray(raw.templates) ? raw.templates : [])
    .map(normalizeTemplate)
    .filter(Boolean);
  if (!templates.length) templates = [defaultRegularTemplate()];
  const weekdayTemplateIds = {};
  const wt = raw.weekdayTemplateIds && typeof raw.weekdayTemplateIds === 'object'
    ? raw.weekdayTemplateIds
    : {};
  for (const [k, v] of Object.entries(wt)) {
    const day = Number(k);
    if (day >= 0 && day <= 6 && v) weekdayTemplateIds[String(day)] = String(v);
  }
  const source = raw.source === 'district' ? 'district' : 'teacher';
  return {
    mode,
    dayNumbering: { anchorSessionDay: anchor, labelPrefix },
    templates,
    weekdayTemplateIds,
    source,
  };
}

export function formatDayLabel(dayNumber, labelPrefix = 'Day') {
  const n = Number(dayNumber);
  if (!Number.isFinite(n) || n < 1) return '';
  return `${labelPrefix} #${Math.round(n)}`;
}

/** Pick template for an ISO date (weekday override → first template). */
export function templateForDate(schedule, iso) {
  if (!schedule?.templates?.length) return null;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (d) {
    const date = new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
    if (!Number.isNaN(date.getTime())) {
      const id = schedule.weekdayTemplateIds?.[String(date.getDay())];
      if (id) {
        const found = schedule.templates.find((t) => t.id === id);
        if (found) return found;
      }
    }
  }
  return schedule.templates[0];
}
