/**
 * Signed-out landing — webpage mode, not app boards.
 * Paper canvas, ink line, and logo pops only.
 */

import { bestOnColor } from '../../shared/colorContrast';

export const LANDING_INK = '#1c1917';

export const LANDING_POPS = {
  rose: '#f43f5e',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
};

const FONT_LINK_ID = 'edu-hub-landing-caveat';

/** Caveat is accent-only (bubbles, short labels). Not for body copy. */
export function ensureLandingHandFont() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap';
  document.head.appendChild(link);
}

export const landingHandStyle = { fontFamily: '"Caveat", cursive' };

export function onPop(hex) {
  return bestOnColor(hex);
}

export function popFillStyle(hex) {
  const on = bestOnColor(hex);
  return { backgroundColor: hex, color: on.hex };
}

export const paperCanvas = 'bg-stone-50 text-stone-900';

export const paperCard = 'border-stone-300 bg-white text-stone-900';

export const mutedInk = 'text-stone-600';

export const navLinkClass =
  'edu-control rounded-full px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-white';
