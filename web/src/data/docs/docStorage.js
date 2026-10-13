/**
 * Edu.Docs localStorage persistence (local-first).
 */

import {
  createDoc,
  createDocFromTemplate,
  createTemplate,
  normalizeDoc,
} from './docModel';

const KEY = 'eduHub.docs.library';
export const DOCS_UPDATED_EVENT = 'eduHub.docs.updated';

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
    window.dispatchEvent(new CustomEvent(DOCS_UPDATED_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}

function readAllRaw() {
  const all = readJson(KEY, {});
  return all && typeof all === 'object' ? all : {};
}

/**
 * @returns {ReturnType<typeof normalizeDoc>[]}
 */
export function readAllDocs() {
  const all = readAllRaw();
  return Object.values(all)
    .map((raw) => normalizeDoc(raw))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function readDoc(id) {
  if (!id) return null;
  const all = readAllRaw();
  const raw = all[String(id)];
  return raw ? normalizeDoc(raw) : null;
}

export function writeDoc(doc) {
  const next = normalizeDoc(doc);
  const all = readAllRaw();
  all[next.id] = next;
  writeJson(KEY, all);
  notify({ type: 'write', id: next.id });
  return next;
}

export function upsertDoc(partial) {
  const existing = partial?.id ? readDoc(partial.id) : null;
  const now = new Date().toISOString();
  if (!existing) {
    return writeDoc(
      createDoc({
        ...partial,
        updatedAt: now,
        openedAt: now,
      }),
    );
  }
  return writeDoc({
    ...existing,
    ...partial,
    id: existing.id,
    updatedAt: now,
  });
}

export function touchOpened(id) {
  const doc = readDoc(id);
  if (!doc) return null;
  return writeDoc({
    ...doc,
    openedAt: new Date().toISOString(),
  });
}

export function trashDoc(id) {
  const doc = readDoc(id);
  if (!doc) return null;
  return writeDoc({
    ...doc,
    trashedAt: new Date().toISOString(),
  });
}

export function restoreDoc(id) {
  const doc = readDoc(id);
  if (!doc) return null;
  return writeDoc({
    ...doc,
    trashedAt: null,
  });
}

export function purgeDoc(id) {
  if (!id) return;
  const all = readAllRaw();
  delete all[String(id)];
  writeJson(KEY, all);
  notify({ type: 'purge', id: String(id) });
}

export function emptyTrash() {
  const all = readAllRaw();
  let changed = false;
  for (const [id, raw] of Object.entries(all)) {
    if (raw?.trashedAt) {
      delete all[id];
      changed = true;
    }
  }
  if (changed) {
    writeJson(KEY, all);
    notify({ type: 'emptyTrash' });
  }
}

export function listActiveDocs() {
  return readAllDocs().filter((d) => !d.trashedAt && d.kind !== 'template');
}

export function listTemplates() {
  return readAllDocs().filter((d) => !d.trashedAt && d.kind === 'template');
}

export function listTrashedDocs() {
  return readAllDocs().filter((d) => d.trashedAt);
}

export function listRecentDocs(limit = 30) {
  return listActiveDocs()
    .slice()
    .sort((a, b) => String(b.openedAt).localeCompare(String(a.openedAt)))
    .slice(0, limit);
}

export function listSharedDocs() {
  return listActiveDocs().filter((d) => d.cloud?.fileId);
}

export function createBlankTemplate() {
  return writeDoc(createTemplate());
}

/** Open a new document cloned from a template. */
export function startDocFromTemplate(templateId) {
  const template = readDoc(templateId);
  if (!template || template.kind !== 'template') return null;
  return writeDoc(createDocFromTemplate(template));
}
