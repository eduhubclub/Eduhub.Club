/**
 * Edu.Hub logo glyphs — sourced from web/src/assets/brand/logo-glyphs/default/*.svg
 * Scribble variants live in logoScribbleVariants.js (scribbles/ + default 3pt).
 */

import { getScribbleVariant, DEFAULT_SCRIBBLE_VARIANT_ID } from './logoScribbleVariants';

export const GLYPH_VIEWBOX = {
  circle: '0 0 160 160',
  triangle: '0 0 158.92 139.75',
  square: '0 0 160 160',
  /** Default 3pt scribble viewBox — prefer getScribbleVariant(id).viewBox */
  scribble: '0 0 158.46 153.76',
};

export const TRIANGLE_PATH =
  'M72.53,4L1.08,127.75c-3.08,5.33.77,12,6.93,12h142.9c6.16,0,10.01-6.67,6.93-12L86.39,4c-3.08-5.33-10.78-5.33-13.86,0Z';

export { getScribbleVariant, DEFAULT_SCRIBBLE_VARIANT_ID };
export { SCRIBBLE_VARIANTS } from './logoScribbleVariants';

/** Circle mark content (parent nested svg must set viewBox + fill currentColor). */
export function GlyphCircleMark({ className }) {
  return <circle cx="80" cy="80" r="80" className={className} />;
}

/** Triangle mark content. */
export function GlyphTriangleMark({ className }) {
  return <path d={TRIANGLE_PATH} className={className} />;
}

/** Square mark content. */
export function GlyphSquareMark({ className }) {
  return <rect width="160" height="160" rx="8" ry="8" className={className} />;
}

/**
 * Scribble mark content — marker-style fill paths.
 * @param {string} [variantId] — id from SCRIBBLE_VARIANTS (defaults to product scribble)
 */
export function GlyphScribbleMark({ className, variantId = DEFAULT_SCRIBBLE_VARIANT_ID }) {
  const variant = getScribbleVariant(variantId);
  return (
    <g className={className}>
      {variant.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/**
 * Standalone glyph for inline copy (Logo page, captions).
 * Uses fill=currentColor so Tailwind text-rose-500 etc. color it.
 */
export function GlyphCircle({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em] text-rose-500' }) {
  return (
    <svg viewBox={GLYPH_VIEWBOX.circle} className={className} fill="currentColor" aria-hidden>
      <GlyphCircleMark />
    </svg>
  );
}

export function GlyphTriangle({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em] text-amber-500' }) {
  return (
    <svg viewBox={GLYPH_VIEWBOX.triangle} className={className} fill="currentColor" aria-hidden>
      <GlyphTriangleMark />
    </svg>
  );
}

export function GlyphSquare({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em] text-emerald-500' }) {
  return (
    <svg viewBox={GLYPH_VIEWBOX.square} className={className} fill="currentColor" aria-hidden>
      <GlyphSquareMark />
    </svg>
  );
}

export function GlyphScribble({
  className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em] text-sky-500',
  variantId = DEFAULT_SCRIBBLE_VARIANT_ID,
}) {
  const variant = getScribbleVariant(variantId);
  return (
    <svg viewBox={variant.viewBox} className={className} fill="currentColor" aria-hidden>
      <GlyphScribbleMark variantId={variantId} />
    </svg>
  );
}
