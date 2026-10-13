/**
 * Local custom fonts for Edu.Docs (FontFace + IndexedDB).
 * Files stay on this device — not uploaded to a server.
 */

const DB_NAME = 'eduHub.docs.fonts';
const STORE = 'fonts';
const DB_VERSION = 1;
const MAX_BYTES = 4 * 1024 * 1024; // 4MB per file

const MIME_BY_EXT = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

export const DOCS_FONTS_UPDATED_EVENT = 'eduHub.docs.fonts.updated';

function notify() {
  try {
    window.dispatchEvent(new CustomEvent(DOCS_FONTS_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open fonts DB.'));
  });
}

/** Unquoted family name for FontFace / CSS. */
function familyName(label) {
  const safe = String(label || 'Custom')
    .replace(/["'\\]/g, '')
    .trim()
    .slice(0, 48);
  return `EduDocs ${safe || 'Custom'}`;
}

/** Quoted CSS font-family value for TipTap. */
export function familyCssValue(labelOrFamily) {
  const name = String(labelOrFamily || '')
    .replace(/^["']|["']$/g, '')
    .trim();
  return `"${name || 'EduDocs Custom'}"`;
}

/**
 * @returns {Promise<{ id: string, label: string, family: string, mime: string, dataUrl: string }[]>}
 */
export async function listCustomFonts() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = Array.isArray(req.result) ? req.result : [];
      resolve(
        rows
          .map((r) => {
            const name = String(r.family || familyName(r.label)).replace(
              /^["']|["']$/g,
              '',
            );
            return {
              id: String(r.id),
              label: String(r.label || 'Custom'),
              family: familyCssValue(name),
              familyName: name,
              mime: String(r.mime || 'font/ttf'),
              dataUrl: String(r.dataUrl || ''),
            };
          })
          .filter((r) => r.id && r.dataUrl)
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
    };
    req.onerror = () => reject(req.error || new Error('Could not list fonts.'));
  });
}

/**
 * Register a stored font with the document.
 * @param {{ family: string, dataUrl: string }} font
 */
export async function registerFontFace(font) {
  if (!font?.dataUrl || typeof FontFace === 'undefined') return;
  const name = String(font.familyName || font.family || '')
    .replace(/^["']|["']$/g, '')
    .trim();
  if (!name) return;
  const existing = [...document.fonts].some(
    (f) => f.family.replace(/["']/g, '') === name,
  );
  if (existing) return;
  const face = new FontFace(name, `url(${font.dataUrl})`);
  const loaded = await face.load();
  document.fonts.add(loaded);
}

export async function registerAllCustomFonts() {
  const fonts = await listCustomFonts();
  await Promise.all(fonts.map((f) => registerFontFace(f).catch(() => {})));
  return fonts;
}

/**
 * @param {File} file
 */
export async function uploadCustomFont(file) {
  if (!file) throw new Error('Choose a font file.');
  const name = String(file.name || 'font');
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const mime = MIME_BY_EXT[ext] || file.type || '';
  if (!MIME_BY_EXT[ext]) {
    throw new Error('Use a .ttf, .otf, .woff, or .woff2 font file.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Font must be under 4 MB.');
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  const dataUrl = `data:${mime};base64,${btoa(binary)}`;

  const label = name.replace(/\.(ttf|otf|woff2?)$/i, '').trim() || 'Custom';
  const family = familyName(label);
  const id = `font_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const row = {
    id,
    label,
    family,
    mime,
    dataUrl,
    createdAt: new Date().toISOString(),
  };

  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not save font.'));
  });

  await registerFontFace(row);
  notify();
  return row;
}

export async function removeCustomFont(id) {
  if (!id) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(String(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not remove font.'));
  });
  notify();
}
