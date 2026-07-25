/**
 * HubBrand art-style samples — original SVGs.
 * Direction: playful hand line + (later) kid-art color shapes under the line.
 * Glyphs echo the logo’s building blocks: circle, triangle, square, scribble.
 */

const LOGO = {
  rose: '#f43f5e',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
};

/** Line-only whimsy — ink first, color later. */
export function SampleLineWhimsy({ className = 'w-full h-auto' }) {
  return (
    <svg viewBox="0 0 280 160" className={className} fill="none" aria-hidden>
      <path
        d="M48 48c8-14 28-14 36 0M42 62c10 10 28 10 38 0"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M118 44c10-16 34-16 44 0M112 60c12 12 34 12 46 0"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M198 46c8-12 26-12 34 0M194 58c8 8 24 8 32 0"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M86 118c-18 4-28 22-18 36 14 18 46 14 58-6 6-10 4-22-6-28-8-4-18-4-24-2z"
        stroke="#1c1917"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M108 128c8 2 22 6 28 18"
        stroke="#1c1917"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="118" cy="122" r="2.2" fill="#1c1917" />
      <circle cx="132" cy="124" r="2.2" fill="#1c1917" />
    </svg>
  );
}

/** Preview of what’s next: color shape under line so the drawing pops. */
export function SampleShapeUnderLine({ className = 'w-full h-auto' }) {
  return (
    <svg viewBox="0 0 280 160" className={className} aria-hidden>
      <ellipse cx="88" cy="86" rx="58" ry="48" fill={LOGO.rose} opacity="0.9" />
      <ellipse cx="188" cy="78" rx="62" ry="52" fill={LOGO.sky} opacity="0.85" />
      <path
        d="M70 70c18-28 58-28 76 0"
        fill="none"
        stroke="#1c1917"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M78 92c22 22 58 22 80 0"
        fill="none"
        stroke="#1c1917"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M168 58c-6 22 4 44 28 52 18 6 38-6 42-26"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="196" cy="72" r="3" fill="#1c1917" />
      <path
        d="M210 78c8 6 14 16 10 26"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Logo glyphs as the brand’s building blocks for shape + line. */
export function SampleLogoBlocks({ className = 'w-full h-auto' }) {
  return (
    <svg viewBox="0 0 280 120" className={className} aria-hidden>
      <circle cx="40" cy="60" r="28" fill={LOGO.rose} />
      <path
        d="M112 28 L140 92 H84 Z"
        fill={LOGO.amber}
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="168" y="32" width="52" height="52" rx="8" fill={LOGO.emerald} />
      <path
        d="M248 34c14 0 18 16 10 28-10 14-28 6-26-8 2-12 22-4 18 10-4 12-18 10-16-2"
        fill="none"
        stroke={LOGO.sky}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ink overlays — line on shape */}
      <circle
        cx="40"
        cy="60"
        r="28"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3"
        opacity="0.35"
      />
      <rect
        x="168"
        y="32"
        width="52"
        height="52"
        rx="8"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3"
        opacity="0.35"
      />
    </svg>
  );
}

/** Spot character — simple colored body + marker outline. */
export function SampleSpotCharacter({ className = 'w-full h-auto' }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      <ellipse cx="100" cy="88" rx="44" ry="52" fill={LOGO.amber} />
      <path
        d="M72 70c8-24 48-24 56 0"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="88" cy="82" r="3.5" fill="#1c1917" />
      <circle cx="112" cy="82" r="3.5" fill="#1c1917" />
      <path
        d="M90 98c8 10 20 10 28 0"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M100 36c-4-18 8-28 22-22 10 4 12 18 4 26"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M78 128c-10 14-8 28 6 32M122 128c10 14 8 28-6 32"
        fill="none"
        stroke="#1c1917"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ART_STYLE_NOTES = [
  {
    id: 'line',
    title: 'Playful line',
    body: 'Thick, slightly imperfect ink. Friendly faces, soft gestures — kid energy without looking childish.',
  },
  {
    id: 'shape',
    title: 'Color as shape (next)',
    body: 'Later: kid-art color blobs sit under the line so drawings pop. Shape first, then ink — same recipe as the logo.',
  },
  {
    id: 'blocks',
    title: 'Building blocks',
    body: 'Circle, triangle, square, scribble. The logo already carries these blocks; illustration should feel like they came to life.',
  },
];
