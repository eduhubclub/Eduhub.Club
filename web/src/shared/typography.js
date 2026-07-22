/**
 * Edu.Hub type scale — Material 3–inspired roles for a set system.
 *
 * Families in product: Display (stage), Title, Body, Label.
 * Headline stays reserved for marketing/landing — PageHeader uses Title Large.
 *
 * Each token is size + weight + line-height (+ tracking when needed).
 * Pair with theme color roles separately (colorOnSurface, muted, brand text).
 * Stage clocks may add `font-mono` on top of Display tokens.
 *
 * @see https://m3.material.io/styles/typography/overview
 */

/**
 * @typedef {'displaySm' | 'displayMd' | 'displayLg' | 'titleLg' | 'titleMd' | 'titleSm' | 'bodyMd' | 'bodySm' | 'labelLg' | 'labelMd' | 'labelSm' | 'labelMicro'} TypeRole
 */

/**
 * Canonical class strings. Import `TYPE.titleLg` (etc.) instead of inventing sizes.
 */
export const TYPE = {
  /**
   * Stage word / name reveal — blending tray, word mat, wheel winner.
   * Prefer over raw text-2xl/3xl font-bold.
   */
  displaySm:
    'text-2xl sm:text-3xl font-bold leading-none tracking-wide',

  /**
   * Mid stage numeral — world clock, calibration mid values, method scores.
   * Add `font-mono` for clocks. Prefer over raw text-3xl/4xl font-black.
   */
  displayMd:
    'text-3xl sm:text-4xl font-black tabular-nums leading-none tracking-tighter',

  /**
   * Large stage numeral — noise meter %, stopwatch/timer stage values.
   * Add `font-mono` for clocks. Prefer over raw text-5xl/6xl/7xl font-black.
   */
  displayLg:
    'text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tabular-nums leading-none tracking-tighter',

  /** PageHeader h1 — primary screen title */
  titleLg: 'text-xl sm:text-2xl font-bold leading-tight tracking-tight',

  /** Modal titles, major in-page headers */
  titleMd: 'text-lg font-bold leading-snug',

  /** Section / list row primary labels */
  titleSm: 'text-sm font-semibold leading-snug',

  /** Page descriptions, empty-state body, About copy */
  bodyMd: 'text-sm font-normal leading-relaxed',

  /** Captions, helpers, card subtitles */
  bodySm: 'text-xs font-normal leading-normal',

  /** Primary buttons (ModalPrimaryButton) */
  labelLg: 'text-sm font-semibold leading-none',

  /** Tool chips, sidebar nav emphasis */
  labelMd: 'text-xs font-semibold leading-none',

  /** Back link, quiet meta next to controls */
  labelSm: 'text-xs font-normal leading-none',

  /** Eyebrow / dock / picker captions (near M3 Label Small) */
  labelMicro: 'text-[11px] font-medium uppercase tracking-wider leading-none',
};

/**
 * Design Guide / docs — role metadata for the living type scale.
 * `sample` is example copy; `mapsTo` ties role → product chrome.
 */
export const TYPE_SCALE = [
  {
    role: 'displaySm',
    family: 'Display',
    size: 'Small',
    className: TYPE.displaySm,
    mapsTo: 'Stage words / name reveals',
    sample: 'cat',
  },
  {
    role: 'displayMd',
    family: 'Display',
    size: 'Medium',
    className: TYPE.displayMd,
    mapsTo: 'Mid stage numerals (clocks, scores)',
    sample: '12:34',
  },
  {
    role: 'displayLg',
    family: 'Display',
    size: 'Large',
    className: TYPE.displayLg,
    mapsTo: 'Large stage numerals (timers, meters)',
    sample: '05:00',
  },
  {
    role: 'titleLg',
    family: 'Title',
    size: 'Large',
    className: TYPE.titleLg,
    mapsTo: 'PageHeader title',
    sample: 'Classes',
  },
  {
    role: 'titleMd',
    family: 'Title',
    size: 'Medium',
    className: TYPE.titleMd,
    mapsTo: 'Modal title',
    sample: 'Create class',
  },
  {
    role: 'titleSm',
    family: 'Title',
    size: 'Small',
    className: TYPE.titleSm,
    mapsTo: 'Section / list row title',
    sample: 'Show demo class & students',
  },
  {
    role: 'bodyMd',
    family: 'Body',
    size: 'Medium',
    className: TYPE.bodyMd,
    mapsTo: 'PageHeader description, About body',
    sample: 'Preferences for your Edu.Hub workspace.',
  },
  {
    role: 'bodySm',
    family: 'Body',
    size: 'Small',
    className: TYPE.bodySm,
    mapsTo: 'Captions, helpers, card subtitles',
    sample: 'Saved on this device for now.',
  },
  {
    role: 'labelLg',
    family: 'Label',
    size: 'Large',
    className: TYPE.labelLg,
    mapsTo: 'Primary button label',
    sample: 'Save changes',
  },
  {
    role: 'labelMd',
    family: 'Label',
    size: 'Medium',
    className: TYPE.labelMd,
    mapsTo: 'Tool chips, nav items',
    sample: 'Settings',
  },
  {
    role: 'labelSm',
    family: 'Label',
    size: 'Small',
    className: TYPE.labelSm,
    mapsTo: 'PageBackLink, quiet meta',
    sample: 'Back to Classes',
  },
  {
    role: 'labelMicro',
    family: 'Label',
    size: 'Micro',
    className: TYPE.labelMicro,
    mapsTo: 'Eyebrows, dock captions, picker labels',
    sample: 'Key features',
  },
];

/** Reserved — not in product chrome yet; document only. */
export const TYPE_RESERVED = [
  {
    family: 'Headline',
    note: 'Larger than Title for marketing/landing. PageHeader uses Title Large instead.',
  },
];

/** Human label for Live View / docs — e.g. "Title Medium · TYPE.titleMd". */
export function typeRoleLabel(role) {
  const entry = TYPE_SCALE.find((s) => s.role === role);
  if (!entry) return `TYPE.${role}`;
  return `${entry.family} ${entry.size} · TYPE.${role}`;
}
