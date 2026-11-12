/** Genres, lengths, and built-in buddy portraits for Writing Buddy. */

export const GENRES = [
  { id: 'informative', label: 'Informative', blurb: 'Teach facts about a topic.' },
  { id: 'opinion', label: 'Opinion', blurb: 'Share what you think and why.' },
  { id: 'narrative', label: 'Story', blurb: 'Tell what happened.' },
];

export const LENGTHS = [
  { id: 'sentence', label: 'Sentence', blurb: 'One strong sentence.' },
  { id: 'paragraph', label: 'Paragraph', blurb: 'A few sentences that stick together.' },
  { id: 'essay', label: 'Essay', blurb: 'Intro, body, and conclusion.' },
];

/** Default body paragraphs for essays (intro + bodies + conclusion). */
export const DEFAULT_BODY_COUNT = 1;
export const MIN_BODY_COUNT = 1;
/** Hard cap for custom essay body counts. */
export const MAX_BODY_COUNT = 8;
/** Quick-pick chips in Student View onboarding (custom goes higher). */
export const PRESET_BODY_COUNTS = [1, 2, 3];

export const BUDDY_PORTRAITS = [
  { id: 'sunny', label: 'Sunny', emoji: '☀️', bg: '#F59E0B' },
  {
    id: 'milo',
    label: 'Milo',
    emoji: '✏️',
    image: '/writing-buddy/milo.png',
    writingImage: '/writing-buddy/milo-writing.gif',
    writingStill: '/writing-buddy/milo-writing.png',
    /** One full loop of writingImage (16 × 300ms). */
    writingLoopMs: 4800,
    writingLoops: 3,
    bg: '#F3C9A0',
  },
  {
    id: 'nora',
    label: 'Nora',
    emoji: '📒',
    image: '/writing-buddy/nora.png',
    writingStill: '/writing-buddy/nora.png',
    bg: '#D4A84B',
  },
  {
    id: 'jay',
    label: 'Jay',
    emoji: '📗',
    image: '/writing-buddy/jay.png',
    writingStill: '/writing-buddy/jay.png',
    bg: '#6B9B6E',
  },
  { id: 'sprout', label: 'Sprout', emoji: '🌱', bg: '#22C55E' },
  { id: 'comet', label: 'Comet', emoji: '☄️', bg: '#6366F1' },
  { id: 'pebble', label: 'Pebble', emoji: '🪨', bg: '#78716C' },
  { id: 'coral', label: 'Coral', emoji: '🪸', bg: '#F43F5E' },
  { id: 'owl', label: 'Owl', emoji: '🦉', bg: '#0EA5E9' },
];

/** Built-in id used when a teacher uploads a custom portrait image. */
export const CUSTOM_PORTRAIT_ID = 'custom';

export const CUSTOM_PORTRAIT = {
  id: CUSTOM_PORTRAIT_ID,
  label: 'Custom',
  emoji: '📷',
  bg: '#94A3B8',
};

/** Keep data-URL portraits under ~1.5 MB (same ballpark as Morning Meeting). */
export const MAX_PORTRAIT_BYTES = 1.5 * 1024 * 1024;

export function genreById(id) {
  return GENRES.find((g) => g.id === id) || null;
}

export function lengthById(id) {
  return LENGTHS.find((l) => l.id === id) || null;
}

export function portraitById(id) {
  if (id === CUSTOM_PORTRAIT_ID) return CUSTOM_PORTRAIT;
  return BUDDY_PORTRAITS.find((p) => p.id === id) || BUDDY_PORTRAITS[0];
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readPortraitFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('Choose an image file (JPG, PNG, etc.).'));
      return;
    }
    if (file.size > MAX_PORTRAIT_BYTES) {
      reject(new Error('Image is too large — keep uploads under about 1.5 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Couldn’t read that file.'));
    reader.readAsDataURL(file);
  });
}

export function clampBodyCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return DEFAULT_BODY_COUNT;
  return Math.min(MAX_BODY_COUNT, Math.max(MIN_BODY_COUNT, Math.round(num)));
}
