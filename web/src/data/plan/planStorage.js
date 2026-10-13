/**
 * Curriculum plan persistence — per class.
 */

import {
  advanceDay,
  normalizePlan,
  normalizePlanItem,
  setItemStatus,
  shiftPlannedItems,
} from './planModel';

const KEY = 'eduHub.plan.byClass';
const DISTRICT_KEY = 'eduHub.plan.districtDefaults';
export const PLAN_UPDATED_EVENT = 'eduHub.plan.updated';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function notify(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent(PLAN_UPDATED_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}

export function readDistrictPlanDefaults() {
  const raw = readJson(DISTRICT_KEY, null);
  if (!raw) return null;
  return normalizePlan(raw);
}

export function writeDistrictPlanDefaults(plan) {
  if (!plan) {
    try {
      localStorage.removeItem(DISTRICT_KEY);
    } catch {
      /* ignore */
    }
    notify({ type: 'district' });
    return null;
  }
  const next = normalizePlan(plan);
  writeJson(DISTRICT_KEY, next);
  notify({ type: 'district' });
  return next;
}

export function readPlan(classId) {
  if (!classId) return normalizePlan(null);
  const all = readJson(KEY, {});
  const raw = all[String(classId)];
  if (raw) return normalizePlan(raw);
  const district = readDistrictPlanDefaults();
  if (district) return district;
  return normalizePlan(null);
}

export function writePlan(classId, plan) {
  if (!classId) return normalizePlan(null);
  const next = normalizePlan(plan);
  const all = readJson(KEY, {});
  all[String(classId)] = next;
  writeJson(KEY, all);
  notify({ classId: String(classId), type: 'plan' });
  return next;
}

export function upsertPlanItem(classId, item) {
  const plan = readPlan(classId);
  const nextItem = normalizePlanItem(item);
  if (!nextItem) return plan;
  const items = [...plan.items];
  const idx = items.findIndex((i) => i.id === nextItem.id);
  if (idx >= 0) items[idx] = nextItem;
  else items.push(nextItem);
  return writePlan(classId, { items });
}

export function removePlanItem(classId, itemId) {
  const plan = readPlan(classId);
  return writePlan(classId, {
    items: plan.items.filter((i) => i.id !== String(itemId)),
  });
}

export function updatePlanItemStatus(classId, itemId, status, opts = {}) {
  const plan = readPlan(classId);
  return writePlan(classId, setItemStatus(plan, itemId, status, opts));
}

export function advancePlanDay(classId, dayNumber) {
  const plan = readPlan(classId);
  return writePlan(classId, advanceDay(plan, dayNumber));
}

export function shiftPlanFromDay(classId, fromDay, delta = 1) {
  const plan = readPlan(classId);
  return writePlan(classId, shiftPlannedItems(plan, fromDay, delta));
}

export function resetPlanToDistrict(classId) {
  if (!classId) return readPlan(classId);
  const all = readJson(KEY, {});
  delete all[String(classId)];
  writeJson(KEY, all);
  notify({ classId: String(classId), type: 'reset' });
  return readPlan(classId);
}
