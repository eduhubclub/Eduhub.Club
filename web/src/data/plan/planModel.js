/**
 * Curriculum plan — assign resources to Day #N / slots.
 */

export const PLAN_STATUSES = ['planned', 'done', 'skipped'];

export function newPlanId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @returns {{
 *   id: string,
 *   dayNumber: number,
 *   slotId: string,
 *   periodId: string,
 *   date: string,
 *   resourceIds: string[],
 *   title: string,
 *   status: 'planned'|'done'|'skipped',
 *   source: 'teacher'|'district',
 * }}
 */
export function normalizePlanItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const dayNumber = Math.round(Number(raw.dayNumber));
  if (!Number.isFinite(dayNumber) || dayNumber < 1) return null;
  const status = PLAN_STATUSES.includes(raw.status) ? raw.status : 'planned';
  const resourceIds = (Array.isArray(raw.resourceIds) ? raw.resourceIds : [])
    .map(String)
    .filter(Boolean);
  return {
    id: String(raw.id || newPlanId()),
    dayNumber,
    slotId: raw.slotId != null ? String(raw.slotId) : '',
    periodId: raw.periodId != null ? String(raw.periodId) : '',
    date: raw.date != null ? String(raw.date) : '',
    resourceIds,
    title: String(raw.title || '').trim(),
    status,
    source: raw.source === 'district' ? 'district' : 'teacher',
  };
}

export function normalizePlan(raw) {
  const items = (Array.isArray(raw?.items) ? raw.items : [])
    .map(normalizePlanItem)
    .filter(Boolean)
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.title.localeCompare(b.title);
    });
  return { items };
}

export function itemsForDay(plan, dayNumber) {
  const n = Math.round(Number(dayNumber));
  if (!Number.isFinite(n)) return [];
  return (plan?.items || []).filter((i) => i.dayNumber === n);
}

/**
 * Shift remaining planned items from `fromDay` down by `delta` session days.
 * Done/skipped items stay put.
 */
export function shiftPlannedItems(plan, fromDay, delta = 1) {
  const start = Math.round(Number(fromDay));
  const d = Math.round(Number(delta)) || 0;
  if (!Number.isFinite(start) || d === 0) return normalizePlan(plan);
  const items = (plan?.items || []).map((item) => {
    if (item.status !== 'planned') return item;
    if (item.dayNumber < start) return item;
    return { ...item, dayNumber: item.dayNumber + d };
  });
  return normalizePlan({ items });
}

/**
 * Mark item done/skipped/planned. Optionally shift other planned items
 * that shared the same day when marking done and `shiftRemaining` is true.
 */
export function setItemStatus(plan, itemId, status, { shiftRemaining = false } = {}) {
  if (!PLAN_STATUSES.includes(status)) return normalizePlan(plan);
  let items = (plan?.items || []).map((item) =>
    item.id === String(itemId) ? { ...item, status } : item,
  );
  let next = normalizePlan({ items });
  if (shiftRemaining && (status === 'done' || status === 'skipped')) {
    const target = next.items.find((i) => i.id === String(itemId));
    if (target) {
      // Move other planned items on this day and later down one teaching day.
      items = next.items.map((item) => {
        if (item.id === target.id) return item;
        if (item.status !== 'planned') return item;
        if (item.dayNumber >= target.dayNumber) {
          return { ...item, dayNumber: item.dayNumber + 1 };
        }
        return item;
      });
      next = normalizePlan({ items });
    }
  }
  return next;
}

/** Advance: bump all planned items on `dayNumber` (and later) by +1. */
export function advanceDay(plan, dayNumber) {
  return shiftPlannedItems(plan, dayNumber, 1);
}
