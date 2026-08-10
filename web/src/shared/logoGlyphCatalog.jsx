import {
  GlyphCircle,
  GlyphSquare,
  GlyphScribble,
  GlyphTriangle,
} from './logoGlyphs';
import { DEFAULT_SCRIBBLE_VARIANT_ID, SCRIBBLE_VARIANTS } from './logoScribbleVariants';

/**
 * Per-glyph option catalogs for HubBrand Logo Test selectors.
 * Circle / triangle / square start with one option; scribble has the uploaded set.
 */
export const GLYPH_SELECTORS = [
  {
    id: 'circle',
    label: 'Circle',
    colorClass: 'text-rose-500',
    options: [{ id: 'default', label: '1', Preview: GlyphCircle }],
  },
  {
    id: 'triangle',
    label: 'Triangle',
    colorClass: 'text-amber-500',
    options: [{ id: 'default', label: '1', Preview: GlyphTriangle }],
  },
  {
    id: 'square',
    label: 'Square',
    colorClass: 'text-emerald-500',
    options: [{ id: 'default', label: '1', Preview: GlyphSquare }],
  },
  {
    id: 'scribble',
    label: 'Scribble',
    colorClass: 'text-sky-500',
    options: SCRIBBLE_VARIANTS.map((v) => ({
      id: v.id,
      label: v.label,
      Preview: ({ className }) => (
        <GlyphScribble className={className} variantId={v.id} />
      ),
    })),
  },
];

export const DEFAULT_GLYPH_SELECTION = {
  circle: 'default',
  triangle: 'default',
  square: 'default',
  scribble: DEFAULT_SCRIBBLE_VARIANT_ID,
};
