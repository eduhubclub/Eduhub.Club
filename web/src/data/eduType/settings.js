const STORAGE_KEY = 'eduHub.eduType.settings';
export const EDU_TYPE_SETTINGS_EVENT = 'eduHub.eduType.settings';

/** Accuracy from wrong keys pressed (includes fixed typos). */
export const ACCURACY_MODE_KEYSTROKE = 'keystroke';

/** Accuracy from correct vs mistyped letters currently typed. */
export const ACCURACY_MODE_LETTERS = 'letters';

export const ACCURACY_MODES = [
  {
    id: ACCURACY_MODE_KEYSTROKE,
    label: 'Wrong keys',
    description:
      'Accuracy from hitting the wrong key while you type. Backspaces still count the miss.',
  },
  {
    id: ACCURACY_MODE_LETTERS,
    label: 'Letters',
    description:
      'Accuracy as a ratio of correct letters to mistyped letters in what you have typed.',
  },
];

const DEFAULTS = {
  accuracyMode: ACCURACY_MODE_KEYSTROKE,
  showKeyboard: true,
};

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function readEduTypeSettings() {
  const parsed = readRaw();
  const mode = ACCURACY_MODES.some((m) => m.id === parsed.accuracyMode)
    ? parsed.accuracyMode
    : DEFAULTS.accuracyMode;
  return {
    accuracyMode: mode,
    showKeyboard: parsed.showKeyboard !== false,
  };
}

export function writeEduTypeSettings(patch) {
  const next = { ...readEduTypeSettings(), ...patch };
  if (!ACCURACY_MODES.some((m) => m.id === next.accuracyMode)) {
    next.accuracyMode = DEFAULTS.accuracyMode;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EDU_TYPE_SETTINGS_EVENT, { detail: next }));
  return next;
}

export function readAccuracyMode() {
  return readEduTypeSettings().accuracyMode;
}

export function writeAccuracyMode(mode) {
  return writeEduTypeSettings({ accuracyMode: mode }).accuracyMode;
}

/**
 * @param {'keystroke'|'letters'} mode
 * @param {{ correctKeystrokes?: number, errorKeystrokes?: number, letterCorrect?: number, letterWrong?: number }} stats
 */
export function resolveAccuracy(mode, stats = {}) {
  if (mode === ACCURACY_MODE_LETTERS) {
    const correct = Math.max(0, stats.letterCorrect || 0);
    const wrong = Math.max(0, stats.letterWrong || 0);
    const total = correct + wrong;
    if (total <= 0) return 1;
    return Math.round((correct / total) * 10000) / 10000;
  }
  const correct = Math.max(0, stats.correctKeystrokes || 0);
  const errors = Math.max(0, stats.errorKeystrokes || 0);
  const total = correct + errors;
  if (total <= 0) return 1;
  return Math.round((correct / total) * 10000) / 10000;
}
