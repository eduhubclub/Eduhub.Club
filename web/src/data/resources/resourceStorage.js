/**
 * Resource library — metadata only, per class.
 */

import { normalizeResource, newResourceId, resourceFromUrl } from './resourceModel';

const KEY = 'eduHub.resources.byClass';
export const RESOURCES_UPDATED_EVENT = 'eduHub.resources.updated';

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
    window.dispatchEvent(new CustomEvent(RESOURCES_UPDATED_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}

export function readResources(classId) {
  if (!classId) return [];
  const all = readJson(KEY, {});
  const list = Array.isArray(all[String(classId)]) ? all[String(classId)] : [];
  return list.map(normalizeResource).filter(Boolean);
}

export function writeResources(classId, list) {
  if (!classId) return [];
  const all = readJson(KEY, {});
  const next = (list || []).map(normalizeResource).filter(Boolean);
  all[String(classId)] = next;
  writeJson(KEY, all);
  notify({ classId: String(classId), type: 'resources' });
  return next;
}

export function addResource(classId, resource) {
  const next = normalizeResource(resource) || resourceFromUrl(resource?.url || '');
  if (!next || !classId) return readResources(classId);
  const list = readResources(classId);
  if (!next.id) next.id = newResourceId();
  const idx = list.findIndex((r) => r.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  return writeResources(classId, list);
}

export function addResourceFromUrl(classId, url, overrides = {}) {
  const res = resourceFromUrl(url, overrides);
  if (!res) return readResources(classId);
  return addResource(classId, res);
}

export function removeResource(classId, resourceId) {
  const list = readResources(classId).filter((r) => r.id !== String(resourceId));
  return writeResources(classId, list);
}

export function getResource(classId, resourceId) {
  return readResources(classId).find((r) => r.id === String(resourceId)) || null;
}
