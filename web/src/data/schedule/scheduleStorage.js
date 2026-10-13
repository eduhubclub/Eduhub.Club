/**
 * Edu.Schedule localStorage persistence.
 */

import { normalizeSchedule } from './scheduleModel';
import {
  DEMO_SCHEDULE_CLASS_ID,
  DEMO_SCHEDULE_REV_KEY,
  DEMO_SCHEDULE_SEED_REVISION,
  demoClassScheduleSeed,
} from './demoScheduleSeed';

const KEYS = {
  byClass: 'eduHub.schedule.byClass',
  districtDefaults: 'eduHub.schedule.districtDefaults',
};

export const SCHEDULE_UPDATED_EVENT = 'eduHub.schedule.updated';

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
    window.dispatchEvent(new CustomEvent(SCHEDULE_UPDATED_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}

/** District-wide template schedule (optional). */
export function readDistrictScheduleDefaults() {
  const raw = readJson(KEYS.districtDefaults, null);
  if (!raw) return null;
  return normalizeSchedule({ ...raw, source: 'district' });
}

export function writeDistrictScheduleDefaults(schedule) {
  if (!schedule) {
    try {
      localStorage.removeItem(KEYS.districtDefaults);
    } catch {
      /* ignore */
    }
    notify({ type: 'district' });
    return null;
  }
  const next = normalizeSchedule({ ...schedule, source: 'district' });
  writeJson(KEYS.districtDefaults, next);
  notify({ type: 'district' });
  return next;
}

/** Reseed Demo Class schedule when revision bumps (or missing). */
function ensureDemoScheduleSeed() {
  try {
    const rev = Number(localStorage.getItem(DEMO_SCHEDULE_REV_KEY) || 0);
    if (rev === DEMO_SCHEDULE_SEED_REVISION) return;
    const all = readJson(KEYS.byClass, {});
    all[DEMO_SCHEDULE_CLASS_ID] = normalizeSchedule(demoClassScheduleSeed());
    writeJson(KEYS.byClass, all);
    localStorage.setItem(
      DEMO_SCHEDULE_REV_KEY,
      String(DEMO_SCHEDULE_SEED_REVISION),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Read class schedule. If none saved, inherit district defaults when present.
 */
export function readSchedule(classId) {
  if (!classId) return normalizeSchedule(null);
  ensureDemoScheduleSeed();
  const all = readJson(KEYS.byClass, {});
  const raw = all[String(classId)];
  if (raw) return normalizeSchedule(raw);
  if (String(classId) === DEMO_SCHEDULE_CLASS_ID) {
    return normalizeSchedule(demoClassScheduleSeed());
  }
  const district = readDistrictScheduleDefaults();
  if (district) {
    return normalizeSchedule({
      ...district,
      source: 'district',
    });
  }
  return normalizeSchedule(null);
}

export function writeSchedule(classId, schedule) {
  if (!classId) return;
  const all = readJson(KEYS.byClass, {});
  all[String(classId)] = normalizeSchedule({
    ...schedule,
    source: schedule?.source === 'district' ? 'district' : 'teacher',
  });
  writeJson(KEYS.byClass, all);
  notify({ classId: String(classId), type: 'schedule' });
}

/** Reset class to district defaults (or empty default). */
export function resetScheduleToDistrict(classId) {
  if (!classId) return readSchedule(classId);
  const all = readJson(KEYS.byClass, {});
  delete all[String(classId)];
  writeJson(KEYS.byClass, all);
  notify({ classId: String(classId), type: 'reset' });
  return readSchedule(classId);
}

export function hasClassScheduleOverride(classId) {
  if (!classId) return false;
  const all = readJson(KEYS.byClass, {});
  return Boolean(all[String(classId)]);
}
