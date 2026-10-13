/**
 * Edu.Docs — document shape (local-first).
 * A document has one or more sections (tabs); the library preview is one card per document.
 */

export function newDocId(prefix = 'doc') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newCommentId() {
  return newDocId('cmt');
}

export function newSectionId() {
  return newDocId('sec');
}

/** Empty TipTap/ProseMirror document. */
export function emptyDocContent() {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

/**
 * @param {unknown} raw
 */
export function normalizeComment(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || newCommentId());
  const body = String(raw.body || '').trim();
  if (!body) return null;
  return {
    id,
    body,
    from: Math.max(0, Number(raw.from) || 0),
    to: Math.max(0, Number(raw.to) || 0),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    resolved: Boolean(raw.resolved),
  };
}

/**
 * @param {unknown} raw
 * @param {number} [index=0]
 */
export function normalizeSection(raw, index = 0) {
  const id = String(raw?.id || newSectionId());
  let content = raw?.content;
  if (!content || typeof content !== 'object' || content.type !== 'doc') {
    content = emptyDocContent();
  }
  const comments = Array.isArray(raw?.comments)
    ? raw.comments.map(normalizeComment).filter(Boolean)
    : [];
  const title =
    String(raw?.title || '').trim() ||
    (index === 0 ? 'Section 1' : `Section ${index + 1}`);
  return { id, title, content, comments };
}

/**
 * @param {unknown} raw
 */
export function normalizeCloudMirror(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const provider = raw.provider === 'onedrive' ? 'onedrive' : 'google';
  const fileId = String(raw.fileId || '').trim();
  if (!fileId) return null;
  return {
    provider,
    fileId,
    folderId: String(raw.folderId || '').trim(),
    path: String(raw.path || 'Edu.Hub/Docs').trim() || 'Edu.Hub/Docs',
    syncedAt: String(raw.syncedAt || ''),
    webUrl: String(raw.webUrl || ''),
  };
}

/**
 * Ensure legacy top-level content/comments stay in sync with the active section
 * (previews, older readers).
 * @param {object} doc
 */
export function withSyncedLegacyFields(doc) {
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const active =
    sections.find((s) => s.id === doc.activeSectionId) || sections[0] || null;
  if (!active) {
    const fallback = normalizeSection(null, 0);
    return {
      ...doc,
      sections: [fallback],
      activeSectionId: fallback.id,
      content: fallback.content,
      comments: fallback.comments,
    };
  }
  return {
    ...doc,
    content: active.content,
    comments: active.comments,
  };
}

/**
 * @param {unknown} raw
 */
export function normalizeDoc(raw) {
  const now = new Date().toISOString();
  const kind = raw?.kind === 'template' ? 'template' : 'document';
  const defaultTitle =
    kind === 'template' ? 'Untitled template' : 'Untitled document';
  if (!raw || typeof raw !== 'object') {
    const section = normalizeSection(null, 0);
    return withSyncedLegacyFields({
      id: newDocId(),
      kind: 'document',
      title: 'Untitled document',
      sections: [section],
      activeSectionId: section.id,
      content: section.content,
      comments: [],
      createdAt: now,
      updatedAt: now,
      openedAt: now,
      trashedAt: null,
      cloud: null,
    });
  }

  let sections;
  if (Array.isArray(raw.sections) && raw.sections.length) {
    sections = raw.sections.map((s, i) => normalizeSection(s, i));
  } else {
    // Migrate pre-section docs: one section from top-level content/comments.
    let content = raw.content;
    if (!content || typeof content !== 'object' || content.type !== 'doc') {
      content = emptyDocContent();
    }
    const comments = Array.isArray(raw.comments)
      ? raw.comments.map(normalizeComment).filter(Boolean)
      : [];
    sections = [normalizeSection({ id: newSectionId(), title: 'Section 1', content, comments }, 0)];
  }

  const activeSectionId = sections.some((s) => s.id === raw.activeSectionId)
    ? String(raw.activeSectionId)
    : sections[0].id;

  return withSyncedLegacyFields({
    id: String(raw.id || newDocId()),
    kind,
    title: String(raw.title || '').trim() || defaultTitle,
    sections,
    activeSectionId,
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
    openedAt: String(raw.openedAt || raw.updatedAt || now),
    trashedAt: raw.trashedAt ? String(raw.trashedAt) : null,
    cloud: normalizeCloudMirror(raw.cloud),
  });
}

export function createDoc(partial = {}) {
  const now = new Date().toISOString();
  const kind = partial.kind === 'template' ? 'template' : 'document';
  const section = normalizeSection(
    {
      title: 'Section 1',
      content: partial.content || emptyDocContent(),
      comments: partial.comments || [],
    },
    0,
  );
  const sections =
    Array.isArray(partial.sections) && partial.sections.length
      ? partial.sections.map((s, i) => normalizeSection(s, i))
      : [section];
  return normalizeDoc({
    id: newDocId(kind === 'template' ? 'tmpl' : 'doc'),
    kind,
    title:
      partial.title ||
      (kind === 'template' ? 'Untitled template' : 'Untitled document'),
    sections,
    activeSectionId: sections[0].id,
    createdAt: now,
    updatedAt: now,
    openedAt: now,
    trashedAt: null,
    cloud: null,
  });
}

export function createTemplate(partial = {}) {
  return createDoc({ ...partial, kind: 'template' });
}

/** Deep-copy a template into a new editable document. */
export function createDocFromTemplate(template) {
  const src = normalizeDoc(template);
  const title =
    src.title && src.title !== 'Untitled template'
      ? src.title
      : 'Untitled document';
  return createDoc({
    title,
    sections: src.sections.map((s) => ({
      ...s,
      id: newSectionId(),
      content: JSON.parse(JSON.stringify(s.content || emptyDocContent())),
      comments: [],
    })),
    kind: 'document',
  });
}

/**
 * @param {ReturnType<typeof normalizeDoc>} doc
 * @param {string} sectionId
 */
export function getSection(doc, sectionId) {
  const normalized = normalizeDoc(doc);
  return (
    normalized.sections.find((s) => s.id === sectionId) ||
    normalized.sections[0] ||
    null
  );
}

/**
 * @param {ReturnType<typeof normalizeDoc>} doc
 * @param {string} [title]
 */
export function addSection(doc, title) {
  const normalized = normalizeDoc(doc);
  const section = normalizeSection(
    { title: title || `Section ${normalized.sections.length + 1}` },
    normalized.sections.length,
  );
  return withSyncedLegacyFields({
    ...normalized,
    sections: [...normalized.sections, section],
    activeSectionId: section.id,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * @param {ReturnType<typeof normalizeDoc>} doc
 * @param {string} sectionId
 */
export function removeSection(doc, sectionId) {
  const normalized = normalizeDoc(doc);
  if (normalized.sections.length <= 1) return normalized;
  const idx = normalized.sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return normalized;
  const sections = normalized.sections.filter((s) => s.id !== sectionId);
  const activeSectionId =
    normalized.activeSectionId === sectionId
      ? sections[Math.min(idx, sections.length - 1)].id
      : normalized.activeSectionId;
  return withSyncedLegacyFields({
    ...normalized,
    sections,
    activeSectionId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Patch a section and optionally switch active.
 * @param {ReturnType<typeof normalizeDoc>} doc
 * @param {string} sectionId
 * @param {Partial<{ title: string, content: object, comments: object[] }>} patch
 * @param {{ activate?: boolean }} [opts]
 */
export function updateSection(doc, sectionId, patch, opts = {}) {
  const normalized = normalizeDoc(doc);
  const sections = normalized.sections.map((s) =>
    s.id === sectionId
      ? normalizeSection(
          {
            ...s,
            ...patch,
            id: s.id,
          },
          0,
        )
      : s,
  );
  return withSyncedLegacyFields({
    ...normalized,
    sections,
    activeSectionId: opts.activate ? sectionId : normalized.activeSectionId,
    updatedAt: new Date().toISOString(),
  });
}
