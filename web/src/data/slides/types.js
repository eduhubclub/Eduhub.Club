/**
 * Edu.Slides — teacher lesson decks (local-first).
 */

export const SLIDES_UPDATED_EVENT = 'eduHub.slides.updated';
export const SLIDES_SETTINGS_UPDATED_EVENT = 'eduHub.slides.settings.updated';
export const SLIDES_SESSION_EVENT = 'eduHub.slides.session';
export const SLIDES_CHANNEL = 'eduHub.slides.live';

export const DEFAULT_SLIDES_SETTINGS = {
  aspect: '16:9',
  showJoinQr: true,
  speakerNotes: true,
  googleClientId: '',
};

export const OBJECT_KINDS = ['text', 'image', 'shape', 'embed'];
export const SHAPE_KINDS = ['rect', 'ellipse', 'line'];
export const EMBED_KINDS = ['timer', 'ofTheDay'];

/**
 * @param {unknown} raw
 */
export function normalizeSlidesSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    aspect: src.aspect === '4:3' ? '4:3' : '16:9',
    showJoinQr: src.showJoinQr !== false,
    speakerNotes: src.speakerNotes !== false,
    googleClientId: String(src.googleClientId || '').trim(),
  };
}

export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function buildSlidesJoinPayload(sessionId, joinCode) {
  if (!sessionId) return '';
  return JSON.stringify({
    v: 1,
    app: 'eduhub.slides',
    sessionId: String(sessionId),
    code: String(joinCode || '').trim(),
  });
}

export function parseSlidesJoinPayload(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || data.app !== 'eduhub.slides' || !data.sessionId) return null;
    return {
      sessionId: String(data.sessionId),
      code: String(data.code || '').trim(),
      v: Number(data.v) || 1,
    };
  } catch {
    return null;
  }
}
