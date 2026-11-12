/**
 * Writing Buddy characters, templates, class assignments, and drafts.
 */

import {
  BUDDY_PORTRAITS,
  CUSTOM_PORTRAIT_ID,
  clampBodyCount,
  DEFAULT_BODY_COUNT,
} from './constants';
import {
  getCurriculumTemplate,
  listCurriculumTemplates,
} from './curriculumTemplates';
import {
  countSectionQuestions,
  normalizeSectionQuestions,
} from './sectionQuestions';

const KEYS = {
  profiles: 'eduHub.writingBuddy.profiles',
  templates: 'eduHub.writingBuddy.templates',
  assignments: 'eduHub.writingBuddy.assignments',
  drafts: 'eduHub.writingBuddy.drafts',
  migrated: 'eduHub.writingBuddy.templateMigrationV1',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Buddy character only (portrait + name). */
function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const portraitImage = String(raw.portraitImage || '').trim();
  const portraitId = portraitImage
    ? CUSTOM_PORTRAIT_ID
    : String(raw.portraitId || BUDDY_PORTRAITS[0].id);
  return {
    id: String(raw.id || newId('buddy')),
    name,
    portraitId,
    portraitImage: portraitImage || null,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

function normalizeTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // Built-ins are resolved separately; never persist curriculum: ids as customs.
  if (String(raw.id || '').startsWith('curriculum:')) {
    return getCurriculumTemplate(raw.id);
  }
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const questions = normalizeSectionQuestions(raw.questions);
  if (countSectionQuestions(questions) === 0) return null;
  const genre = raw.genre ? String(raw.genre) : '';
  const length = raw.length ? String(raw.length) : '';
  const curriculumId = raw.curriculumId ? String(raw.curriculumId) : '';
  return {
    id: String(raw.id || newId('template')),
    name,
    questions,
    genre: genre || null,
    length: length || null,
    bodyCount: clampBodyCount(raw.bodyCount ?? DEFAULT_BODY_COUNT),
    curriculumId: curriculumId || null,
    curriculumName: raw.curriculumName ? String(raw.curriculumName) : null,
    builtIn: false,
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

let migratingLegacy = false;

/**
 * One-time: move questions off legacy buddy profiles into templates.
 */
function migrateLegacyProfileQuestions() {
  if (migratingLegacy || readJson(KEYS.migrated, false)) return;
  migratingLegacy = true;
  try {
    const rawProfiles = readJson(KEYS.profiles, []);
    if (!Array.isArray(rawProfiles) || !rawProfiles.length) {
      writeJson(KEYS.migrated, true);
      return;
    }

    const rawTemplates = readJson(KEYS.templates, []);
    const templates = (Array.isArray(rawTemplates) ? rawTemplates : [])
      .map(normalizeTemplate)
      .filter(Boolean);
    const existingNames = new Set(templates.map((t) => t.name.toLowerCase()));
    let changed = false;

    for (const raw of rawProfiles) {
      if (!raw || typeof raw !== 'object') continue;
      const questions = normalizeSectionQuestions(raw.questions);
      if (countSectionQuestions(questions) === 0) continue;
      const buddyName = String(raw.name || '').trim() || 'Buddy';
      let templateName = `${buddyName} template`;
      let n = 2;
      while (existingNames.has(templateName.toLowerCase())) {
        templateName = `${buddyName} template ${n}`;
        n += 1;
      }
      const created = normalizeTemplate({
        id: newId('template'),
        name: templateName,
        questions,
        genre: raw.genre || null,
        length: raw.length || null,
        bodyCount: raw.bodyCount,
        updatedAt: Date.now(),
      });
      if (created) {
        templates.unshift(created);
        existingNames.add(created.name.toLowerCase());
        changed = true;
      }
    }

    if (changed) writeJson(KEYS.templates, templates);

    // Strip writing fields from stored profiles.
    if (changed || rawProfiles.some((p) => p?.questions || p?.genre || p?.length)) {
      const slim = rawProfiles
        .map((p) =>
          normalizeProfile({
            id: p.id,
            name: p.name,
            portraitId: p.portraitId,
            portraitImage: p.portraitImage,
            updatedAt: p.updatedAt,
          }),
        )
        .filter(Boolean);
      writeJson(KEYS.profiles, slim);
    }

    writeJson(KEYS.migrated, true);
  } finally {
    migratingLegacy = false;
  }
}

export function readProfiles() {
  migrateLegacyProfileQuestions();
  const raw = readJson(KEYS.profiles, []);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeProfile).filter(Boolean);
}

export function writeProfiles(list) {
  const next = (Array.isArray(list) ? list : []).map(normalizeProfile).filter(Boolean);
  writeJson(KEYS.profiles, next);
  return next;
}

export function upsertProfile(profile) {
  const list = readProfiles();
  const next = normalizeProfile({
    ...profile,
    id: profile?.id || newId('buddy'),
    updatedAt: Date.now(),
  });
  if (!next) return null;
  const idx = list.findIndex((p) => p.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  writeProfiles(list);
  return next;
}

export function removeProfile(id) {
  writeProfiles(readProfiles().filter((p) => p.id !== String(id)));
}

export function getProfile(id) {
  return readProfiles().find((p) => p.id === String(id)) || null;
}

export function readTemplates() {
  migrateLegacyProfileQuestions();
  const raw = readJson(KEYS.templates, []);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeTemplate).filter(Boolean);
}

export function writeTemplates(list) {
  const next = (Array.isArray(list) ? list : []).map(normalizeTemplate).filter(Boolean);
  writeJson(KEYS.templates, next);
  return next;
}

export function upsertTemplate(template) {
  const list = readTemplates();
  const next = normalizeTemplate({
    ...template,
    id: template?.id || newId('template'),
    updatedAt: Date.now(),
  });
  if (!next) return null;
  const idx = list.findIndex((t) => t.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  writeTemplates(list);
  return next;
}

export function removeTemplate(id) {
  const tid = String(id);
  writeTemplates(readTemplates().filter((t) => t.id !== tid));
  // Clear class assignments pointing at this template.
  const assignments = readAssignments();
  let dirty = false;
  for (const classId of Object.keys(assignments)) {
    if (assignments[classId] === tid) {
      delete assignments[classId];
      dirty = true;
    }
  }
  if (dirty) writeJson(KEYS.assignments, assignments);
}

export function getTemplate(id) {
  const tid = String(id || '');
  if (!tid) return null;
  return (
    getCurriculumTemplate(tid) ||
    readTemplates().find((t) => t.id === tid) ||
    null
  );
}

/** Custom templates plus curriculum built-ins (for Student View pickers). */
export function listAssignableTemplates() {
  const custom = readTemplates();
  const customIds = new Set(custom.map((t) => t.id));
  const curriculum = listCurriculumTemplates().filter((t) => !customIds.has(t.id));
  return [...curriculum, ...custom];
}

/**
 * Copy a built-in curriculum template into the teacher’s library for editing.
 */
export function customizeCurriculumTemplate(id) {
  const builtIn = getCurriculumTemplate(id);
  if (!builtIn) return null;
  return upsertTemplate({
    name: `${builtIn.name} (custom)`,
    questions: builtIn.questions,
    genre: builtIn.genre,
    length: builtIn.length,
    bodyCount: builtIn.bodyCount,
    curriculumId: builtIn.curriculumId,
    curriculumName: builtIn.curriculumName,
  });
}

/** Map of classId → templateId. */
export function readAssignments() {
  const raw = readJson(KEYS.assignments, {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [classId, templateId] of Object.entries(raw)) {
    if (classId && templateId) out[String(classId)] = String(templateId);
  }
  return out;
}

export function assignedTemplateIdForClass(classId) {
  if (!classId) return '';
  return readAssignments()[String(classId)] || '';
}

export function assignTemplateToClass(classId, templateId) {
  const cid = String(classId || '');
  if (!cid) return readAssignments();
  const assignments = readAssignments();
  const tid = String(templateId || '').trim();
  if (!tid) delete assignments[cid];
  else assignments[cid] = tid;
  writeJson(KEYS.assignments, assignments);
  return assignments;
}

function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const classId = String(raw.classId || '');
  const studentId = String(raw.studentId || '');
  if (!classId || !studentId) return null;
  return {
    id: String(raw.id || newId('draft')),
    classId,
    studentId,
    topic: String(raw.topic || '').trim(),
    genre: String(raw.genre || 'opinion'),
    length: String(raw.length || 'paragraph'),
    bodyCount: clampBodyCount(raw.bodyCount ?? DEFAULT_BODY_COUNT),
    profileId: raw.profileId ? String(raw.profileId) : null,
    templateId: raw.templateId ? String(raw.templateId) : null,
    buddyName: String(raw.buddyName || 'Buddy'),
    portraitImage: String(raw.portraitImage || '').trim() || null,
    portraitId: String(raw.portraitImage || '').trim()
      ? CUSTOM_PORTRAIT_ID
      : String(raw.portraitId || BUDDY_PORTRAITS[0].id),
    pieces: raw.pieces && typeof raw.pieces === 'object' ? { ...raw.pieces } : {},
    draftText: String(raw.draftText || ''),
    stepIndex: Math.max(0, Number(raw.stepIndex) || 0),
    status: raw.status === 'done' ? 'done' : 'in_progress',
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function readDrafts() {
  const raw = readJson(KEYS.drafts, []);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeDraft).filter(Boolean);
}

export function writeDrafts(list) {
  const next = (Array.isArray(list) ? list : []).map(normalizeDraft).filter(Boolean);
  writeJson(KEYS.drafts, next);
  return next;
}

export function upsertDraft(draft) {
  const list = readDrafts();
  const next = normalizeDraft({
    ...draft,
    id: draft?.id || newId('draft'),
    updatedAt: Date.now(),
  });
  if (!next) return null;
  const idx = list.findIndex((d) => d.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  writeDrafts(list);
  return next;
}

export function removeDraft(id) {
  writeDrafts(readDrafts().filter((d) => d.id !== String(id)));
}

export function draftsForClass(classId) {
  return readDrafts().filter((d) => d.classId === String(classId));
}
