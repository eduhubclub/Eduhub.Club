/**
 * Morning Meeting display prefs (device-wide).
 * Storage: eduHub.morningMeeting.prefs
 */

export const MORNING_MEETING_PREFS_KEY = 'eduHub.morningMeeting.prefs';
export const MORNING_MEETING_PREFS_EVENT = 'eduHub.morningMeeting.prefs';

/** @typedef {'name' | 'avatars'} CheckInCardStyle */

export const CHECK_IN_CARD_STYLES = [
  {
    id: 'name',
    label: 'Name + avatar',
    description: 'Show each student’s picture and name on the check-in tile.',
  },
  {
    id: 'avatars',
    label: 'Avatars only',
    description: 'Show only student pictures — denser grid for smart panels.',
  },
];

const DEFAULTS = {
  checkInCardStyle: /** @type {CheckInCardStyle} */ ('name'),
};

function normalizeStyle(value) {
  return value === 'avatars' ? 'avatars' : 'name';
}

function readRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(MORNING_MEETING_PREFS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeRaw(next) {
  try {
    localStorage.setItem(MORNING_MEETING_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(MORNING_MEETING_PREFS_EVENT, { detail: next }),
    );
  }
  return next;
}

export function readMorningMeetingPrefs() {
  const raw = readRaw();
  return {
    checkInCardStyle: normalizeStyle(raw.checkInCardStyle ?? DEFAULTS.checkInCardStyle),
  };
}

/**
 * @param {CheckInCardStyle} style
 */
export function writeCheckInCardStyle(style) {
  const next = {
    ...readMorningMeetingPrefs(),
    checkInCardStyle: normalizeStyle(style),
  };
  writeRaw(next);
  return next.checkInCardStyle;
}

export function readCheckInCardStyle() {
  return readMorningMeetingPrefs().checkInCardStyle;
}
