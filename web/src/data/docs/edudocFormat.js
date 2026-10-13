/**
 * Native .edudoc envelope — Word never opens this as a round-trip format.
 */

import { normalizeDoc } from './docModel';

export const EDUDOC_MIME = 'application/vnd.edu.hub.document+json';
export const EDUDOC_VERSION = 1;
export const EDUDOC_EXT = '.edudoc';

/**
 * @param {ReturnType<typeof normalizeDoc>} doc
 */
export function serializeEdudoc(doc) {
  const normalized = normalizeDoc(doc);
  return JSON.stringify(
    {
      format: 'edudoc',
      version: EDUDOC_VERSION,
      mime: EDUDOC_MIME,
      exportedAt: new Date().toISOString(),
      document: {
        id: normalized.id,
        title: normalized.title,
        sections: normalized.sections,
        activeSectionId: normalized.activeSectionId,
        content: normalized.content,
        comments: normalized.comments,
        createdAt: normalized.createdAt,
        updatedAt: normalized.updatedAt,
      },
    },
    null,
    2,
  );
}

/**
 * @param {string} text
 */
export function parseEdudoc(text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text || ''));
  } catch {
    throw new Error('That file is not a valid Edu.Docs document.');
  }
  if (!parsed || parsed.format !== 'edudoc' || !parsed.document) {
    throw new Error('That file is not an Edu.Docs (.edudoc) file.');
  }
  return normalizeDoc(parsed.document);
}

/**
 * Safe cloud/local filename from title.
 * @param {string} title
 */
export function edudocFileName(title) {
  const base = String(title || 'Untitled')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const name = base || 'Untitled';
  return name.toLowerCase().endsWith(EDUDOC_EXT) ? name : `${name}${EDUDOC_EXT}`;
}
