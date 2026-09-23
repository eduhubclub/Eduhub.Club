/** Apps a teacher can assign to a class. Staff tools stay off this list. */
export const STUDENT_APP_IDS = [
  'arcade',
  'games',
  'eduType',
  'mathTools',
  'dictionary',
  'paper',
  'earlyliteracy',
  'ofTheDay',
  'timer',
  'slides',
  'library',
  'morningMeeting',
  'headspace',
];

export const STUDENT_APP_NAMES = {
  arcade: 'Arcade',
  games: 'Games',
  eduType: 'Edu.Type',
  mathTools: 'Math Tools',
  dictionary: 'Dictionary',
  paper: 'Paper',
  earlyliteracy: 'Early Literacy',
  ofTheDay: 'Of the Day',
  timer: 'Timer',
  slides: 'Slides',
  library: 'Library',
  morningMeeting: 'Morning Meeting',
  headspace: 'Headspace',
};

export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

export const CLASS_TIME_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Phoenix',
  'America/Chicago',
  'America/New_York',
  'Pacific/Honolulu',
  'UTC',
];

export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isStudentApp(appId) {
  return STUDENT_APP_IDS.includes(appId);
}

/**
 * Student-facing parts of an app. Missing from a class rule means on
 * when the app itself is on. A stored false turns that part off.
 * Teacher chrome (Classes, Edit, layout labs) is not a part.
 */
export const STUDENT_APP_PARTS = {
  arcade: [
    { id: 'snake', name: 'Snake', tab: 'Snake' },
    { id: 'arkanoid', name: 'Arkanoid', tab: 'Arkanoid' },
    { id: 'math-train', name: 'Math Train', tab: 'Math Train' },
    { id: 'solitaire', name: 'Solitaire', tab: 'Solitaire' },
    { id: 'spider', name: 'Spider', tab: 'Spider' },
    { id: 'go-fish', name: 'Go Fish', tab: 'Go Fish' },
    { id: 'math-train', name: 'Math Train', tab: 'Math Train' },
    { id: 'sudoku', name: 'Sudoku', tab: 'Sudoku' },
    { id: 'boom-jump', name: 'Boom Jump', tab: 'Boom Jump' },
  ],
  games: [{ id: 'wordle', name: 'Wordle', tab: 'Wordle' }],
  eduType: [
    { id: 'type-a-classic', name: 'Type a Classic', tab: 'Type a Classic' },
    { id: 'today', name: 'Today', tab: 'Today' },
  ],
  mathTools: [
    { id: 'money', name: 'Money', tab: 'Money' },
    { id: 'clock', name: 'Clock', tab: 'Clock' },
  ],
  dictionary: [
    { id: 'lookup', name: 'Lookup', tab: 'Lookup' },
    { id: 'word-of-the-day', name: 'Word of the Day', tab: 'Word of the Day' },
  ],
  paper: [
    { id: 'paper', name: 'Paper', tab: 'Paper' },
    { id: 'saved', name: 'Saved', tab: 'Saved' },
  ],
  earlyliteracy: [
    { id: 'blending-board', name: 'Blending Board', tab: 'Blending Board' },
    { id: 'word-work-mat', name: 'Word Work Mat', tab: 'Word Work Mat' },
    { id: 'elkonin', name: 'Elkonin Boxes', tab: 'Elkonin Boxes' },
    { id: 'heart-words', name: 'Heart Words', tab: 'Heart Words' },
    { id: 'sound-wall', name: 'Sound Wall', tab: 'Sound Wall' },
  ],
  ofTheDay: [
    { id: 'today', name: 'Today', tab: 'Today' },
    { id: 'joke', name: 'Joke', tab: 'Joke' },
    { id: 'art', name: 'Art', tab: 'Art' },
    { id: 'animal', name: 'Animal', tab: 'Animal' },
    { id: 'word', name: 'Word', tab: 'Word' },
    { id: 'quote', name: 'Quote', tab: 'Quote' },
    { id: 'fact', name: 'Fact', tab: 'Fact' },
    { id: 'song', name: 'Song', tab: 'Song' },
  ],
  timer: [
    { id: 'whole-class', name: 'Whole Class', tab: 'Whole Class' },
    { id: 'small-group', name: 'Small Group', tab: 'Small Group' },
    { id: 'individual', name: 'Individual', tab: 'Individual' },
  ],
  slides: [{ id: 'follow', name: 'Follow', tab: 'Follow' }],
  library: [{ id: 'shelf', name: 'Library', tab: 'Library' }],
  morningMeeting: [{ id: 'board', name: 'Board', tab: 'Board' }],
  headspace: [{ id: 'pet-rock', name: 'Pet Rock', tab: 'Pet Rock' }],
};

export function appParts(appId) {
  return STUDENT_APP_PARTS[appId] || [];
}

export function partsHeading(appId) {
  if (appId === 'arcade') return 'Games';
  if (appId === 'mathTools') return 'Desks';
  if (appId === 'headspace') return 'Journal types';
  return 'Parts';
}

export function normalizeParts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const next = {};
  for (const [id, on] of Object.entries(value)) {
    if (on === false) next[id] = false;
  }
  return next;
}

/** A missing part follows the app: on unless the teacher stored false. */
export function partEnabled(parts, partId) {
  return normalizeParts(parts)[partId] !== false;
}

export function partByTab(appId, tab) {
  if (!tab) return null;
  return appParts(appId).find((part) => part.tab === tab || part.id === tab) || null;
}

export function withPart(parts, partId, enabled) {
  const next = normalizeParts(parts);
  if (enabled) delete next[partId];
  else next[partId] = false;
  return next;
}
