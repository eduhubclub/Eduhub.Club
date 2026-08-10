/**
 * Edu.Calendar localStorage persistence.
 */

import {
  normalizeAcademic,
  normalizeClosure,
  normalizeCountdown,
  normalizeEvent,
  normalizeLayer,
  normalizeUiPrefs,
  specialistRotationSeed,
  defaultAcademicYear,
} from './calendarModel';

const KEYS = {
  academic: 'eduHub.calendar.academicByClass',
  closures: 'eduHub.calendar.closuresByClass',
  layers: 'eduHub.calendar.layersByClass',
  events: 'eduHub.calendar.eventsByClass',
  countdowns: 'eduHub.calendar.countdownsByClass',
  uiPrefs: 'eduHub.calendar.uiPrefs',
};

export const CALENDAR_UPDATED_EVENT = 'eduHub.calendar.updated';

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
    window.dispatchEvent(
      new CustomEvent(CALENDAR_UPDATED_EVENT, { detail }),
    );
  } catch {
    /* ignore */
  }
}

function mapForClass(key, classId, normalizeItem) {
  const all = readJson(key, {});
  const list = Array.isArray(all[String(classId)]) ? all[String(classId)] : [];
  return list.map(normalizeItem).filter(Boolean);
}

function writeMapForClass(key, classId, list, detailType) {
  const all = readJson(key, {});
  all[String(classId)] = list;
  writeJson(key, all);
  notify({ classId: String(classId), type: detailType });
}

export function readAcademic(classId) {
  if (!classId) return defaultAcademicYear();
  const all = readJson(KEYS.academic, {});
  return normalizeAcademic(all[String(classId)]);
}

export function writeAcademic(classId, academic) {
  if (!classId) return;
  const all = readJson(KEYS.academic, {});
  all[String(classId)] = normalizeAcademic(academic);
  writeJson(KEYS.academic, all);
  notify({ classId: String(classId), type: 'academic' });
}

export function readClosures(classId) {
  return mapForClass(KEYS.closures, classId, normalizeClosure);
}

export function writeClosures(classId, closures) {
  writeMapForClass(
    KEYS.closures,
    classId,
    (closures || []).map(normalizeClosure).filter(Boolean),
    'closures',
  );
}

export function readLayers(classId) {
  return mapForClass(KEYS.layers, classId, normalizeLayer);
}

export function writeLayers(classId, layers) {
  writeMapForClass(
    KEYS.layers,
    classId,
    (layers || []).map(normalizeLayer).filter(Boolean),
    'layers',
  );
}

export function upsertLayer(classId, layer) {
  const next = normalizeLayer(layer);
  if (!next || !classId) return readLayers(classId);
  const list = readLayers(classId);
  const idx = list.findIndex((l) => l.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  writeLayers(classId, list);
  return list;
}

export function removeLayer(classId, layerId) {
  const id = String(layerId);
  const list = readLayers(classId).filter((l) => l.id !== id);
  writeLayers(classId, list);
  const events = readEvents(classId).filter((e) => e.layerId !== id);
  writeEvents(classId, events);
  return list;
}

export function readEvents(classId) {
  return mapForClass(KEYS.events, classId, normalizeEvent);
}

export function writeEvents(classId, events) {
  writeMapForClass(
    KEYS.events,
    classId,
    (events || []).map(normalizeEvent).filter(Boolean),
    'events',
  );
}

export function upsertEvent(classId, event) {
  const next = normalizeEvent(event);
  if (!next || !classId) return readEvents(classId);
  const list = readEvents(classId);
  const idx = list.findIndex((e) => e.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  writeEvents(classId, list);
  return list;
}

export function removeEvent(classId, eventId) {
  const list = readEvents(classId).filter((e) => e.id !== String(eventId));
  writeEvents(classId, list);
  return list;
}

export function readCountdowns(classId) {
  return mapForClass(KEYS.countdowns, classId, normalizeCountdown);
}

export function writeCountdowns(classId, countdowns) {
  writeMapForClass(
    KEYS.countdowns,
    classId,
    (countdowns || []).map(normalizeCountdown).filter(Boolean),
    'countdowns',
  );
}

export function upsertCountdown(classId, countdown) {
  const next = normalizeCountdown(countdown);
  if (!next || !classId) return readCountdowns(classId);
  const list = readCountdowns(classId);
  const idx = list.findIndex((c) => c.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  writeCountdowns(classId, list);
  return list;
}

export function removeCountdown(classId, countdownId) {
  const list = readCountdowns(classId).filter(
    (c) => c.id !== String(countdownId),
  );
  writeCountdowns(classId, list);
  return list;
}

export function readUiPrefs(classIds = []) {
  return normalizeUiPrefs(readJson(KEYS.uiPrefs, null), classIds);
}

export function writeUiPrefs(prefs, classIds = []) {
  const next = normalizeUiPrefs(prefs, classIds);
  const prevRaw = (() => {
    try {
      return localStorage.getItem(KEYS.uiPrefs);
    } catch {
      return null;
    }
  })();
  const nextRaw = JSON.stringify(next);
  if (prevRaw === nextRaw) return next;
  writeJson(KEYS.uiPrefs, next);
  notify({ type: 'uiPrefs' });
  return next;
}

/** Seed specialist rotation when the class has no layers yet. */
export function ensureSpecialistSeed(classId) {
  if (!classId) return null;
  const layers = readLayers(classId);
  if (layers.length) return null;
  const seed = specialistRotationSeed();
  writeLayers(classId, [seed]);
  return seed;
}
