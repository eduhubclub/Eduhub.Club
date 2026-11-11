import { SpellCheck } from 'lucide-react';

/**
 * Screeners hosted inside Edu.Screener.
 * Add an entry here, then register its session component in ScreenerApp.
 */
export const SCREENERS = [
  {
    id: 'letrs',
    name: 'LETRS Spelling',
    audience: 'K–5',
    summary:
      'Basic (K–2) and Advanced (3–5). Hear each word, type the spelling, and score features on the LETRS grid.',
    icon: SpellCheck,
  },
];

export function screenerById(id) {
  return SCREENERS.find((item) => item.id === id) || null;
}
