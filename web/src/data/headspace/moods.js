/** Fixed mood chips for Pet Rock journal entries. */
export const HEADSPACE_MOODS = [
  { id: 'glad', label: 'Glad' },
  { id: 'okay', label: 'Okay' },
  { id: 'worried', label: 'Worried' },
  { id: 'mad', label: 'Mad' },
  { id: 'tired', label: 'Tired' },
  { id: 'proud', label: 'Proud' },
];

const MOOD_IDS = new Set(HEADSPACE_MOODS.map((m) => m.id));

export function isValidMood(mood) {
  return MOOD_IDS.has(String(mood || ''));
}

export function moodLabel(mood) {
  return HEADSPACE_MOODS.find((m) => m.id === mood)?.label || '';
}
