/**
 * Classroom-facing student name resolution.
 * Legal `name` stays on the record; apps use `appDisplayName` preference.
 */

export const APP_DISPLAY_NAME = {
  legal: 'legal',
  nickname: 'nickname',
};

export function studentNickname(student) {
  return String(student?.nickname || '').trim();
}

/** Normalize preference; defaults to nickname when one exists. */
export function normalizeAppDisplayName(value, nickname) {
  const nick = String(nickname || '').trim();
  if (value === APP_DISPLAY_NAME.legal) return APP_DISPLAY_NAME.legal;
  if (value === APP_DISPLAY_NAME.nickname && nick) return APP_DISPLAY_NAME.nickname;
  return nick ? APP_DISPLAY_NAME.nickname : APP_DISPLAY_NAME.legal;
}

/** Resolved preference for a student record (falls back when nickname missing). */
export function resolveAppDisplayName(student) {
  return normalizeAppDisplayName(student?.appDisplayName, studentNickname(student));
}

/** Name shown across apps (Randomizer, Behavior, Bank, Timer, etc.). */
export function studentDisplayName(student, fallback = 'Student') {
  if (!student) return fallback;
  if (resolveAppDisplayName(student) === APP_DISPLAY_NAME.nickname) {
    return studentNickname(student) || String(student.name || '').trim() || fallback;
  }
  return String(student.name || '').trim() || fallback;
}

/** First token of the app-facing name (award tiles, compact chips). */
export function studentShortName(student, fallback = 'Student') {
  const full = studentDisplayName(student, fallback);
  const first = full.split(/\s+/).filter(Boolean)[0];
  return first || fallback;
}

/**
 * Compact label: given name + last initial (e.g. "Frederick D.").
 * Prefers `lastName` on the record; otherwise last token of the display name.
 */
export function studentNameWithLastInitial(student, fallback = 'Student') {
  const display = studentDisplayName(student, fallback);
  const first =
    display.split(/\s+/).filter(Boolean)[0] ||
    String(student?.firstName || '').trim().split(/\s+/).filter(Boolean)[0] ||
    fallback;
  const lastFromRecord = String(student?.lastName || '').trim();
  if (lastFromRecord) {
    return `${first} ${lastFromRecord.charAt(0).toUpperCase()}.`;
  }
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }
  return first;
}

/**
 * The non-preferred name when both legal name and nickname exist
 * (for quoted secondary labels in directories / randomizer).
 */
export function studentAlternateName(student) {
  const legal = String(student?.name || '').trim();
  const nick = studentNickname(student);
  if (!nick || !legal || nick === legal) return '';
  return resolveAppDisplayName(student) === APP_DISPLAY_NAME.nickname ? legal : nick;
}
