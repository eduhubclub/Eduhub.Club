import {
  GLYPH_VIEWBOX,
  GlyphCircleMark,
  GlyphScribbleMark,
  GlyphSquareMark,
  GlyphTriangleMark,
  getScribbleVariant,
} from './logoGlyphs';
import { DEFAULT_SCRIBBLE_VARIANT_ID } from './logoScribbleVariants';
import {
  DEFAULT_GLYPH_STYLE_ID,
  GlyphStyleMark,
  getGlyphStyleViewBox,
} from './logoGlyphStyleMarks';

export {
  GlyphCircle,
  GlyphTriangle,
  GlyphSquare,
  GlyphScribble,
} from './logoGlyphs';

const COLOR = {
  circle: 'text-rose-500',
  triangle: 'text-amber-500',
  square: 'text-emerald-500',
  scribble: 'text-sky-500',
};

/**
 * Horizontal lockup slot layout (viewBox 0 0 100 24).
 * `x` values are optical — circle/triangle sit closer than a square would at the same gap.
 */
export const LOGO_HORIZONTAL_VIEWBOX = '0 0 100 24';
/** Cropped to circle left → scribble right (no side padding in the artboard). */
export const LOGO_HORIZONTAL_TIGHT_VIEWBOX = '1 0 97 24';

export const LOGO_HORIZONTAL_SLOTS = [
  { id: 'circle', x: 1, y: 2, width: 20, height: 20, viewBox: GLYPH_VIEWBOX.circle, colorClass: COLOR.circle },
  { id: 'triangle', x: 24.5, y: 2.5, width: 22, height: 19, viewBox: GLYPH_VIEWBOX.triangle, colorClass: COLOR.triangle },
  { id: 'square', x: 52, y: 2, width: 20, height: 20, viewBox: GLYPH_VIEWBOX.square, colorClass: COLOR.square },
  { id: 'scribble', x: 76, y: 0.5, width: 22, height: 23, viewBox: GLYPH_VIEWBOX.scribble, colorClass: COLOR.scribble },
];

function resolveSlots(baseSlots, scribbleVariantId, glyphStyle) {
  const scribble = getScribbleVariant(scribbleVariantId);
  return baseSlots.map((slot) => {
    const styleVb = getGlyphStyleViewBox(glyphStyle, slot.id);
    if (styleVb) return { ...slot, viewBox: styleVb };
    if (slot.id === 'scribble') return { ...slot, viewBox: scribble.viewBox };
    return slot;
  });
}

function renderMark(slotId, scribbleVariantId, glyphStyle) {
  if (glyphStyle === 'outline' || glyphStyle === 'textured') {
    return <GlyphStyleMark styleId={glyphStyle} glyphId={slotId} />;
  }
  if (slotId === 'circle') return <GlyphCircleMark />;
  if (slotId === 'triangle') return <GlyphTriangleMark />;
  if (slotId === 'square') return <GlyphSquareMark />;
  return <GlyphScribbleMark variantId={scribbleVariantId} />;
}

/**
 * Nested glyph slot — keeps Illustrator viewBoxes while the parent sets layout.
 */
function GlyphSlot({ x, y, width, height, viewBox, colorClass, monochrome, children, className = '' }) {
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox={viewBox}
      className={`${monochrome ? '' : colorClass} ${className}`.trim()}
      fill="currentColor"
      overflow="hidden"
    >
      {children}
    </svg>
  );
}

/** Padding debug paints — sky = glyph box, orange = gap between slots. */
function HorizontalPaddingOverlay({ slots }) {
  const gaps = [];
  for (let i = 0; i < slots.length - 1; i += 1) {
    const left = slots[i];
    const right = slots[i + 1];
    const x = left.x + left.width;
    const width = right.x - x;
    if (width > 0.05) {
      gaps.push({
        key: `${left.id}-${right.id}`,
        x,
        width,
        label: width.toFixed(1),
      });
    }
  }

  return (
    <g aria-hidden>
      {gaps.map(({ key, x, width }) => (
        <rect
          key={key}
          x={x}
          y={1}
          width={width}
          height={22}
          fill="rgb(251 146 60 / 0.45)"
          stroke="rgb(234 88 12 / 0.9)"
          strokeWidth="0.35"
        />
      ))}
      {slots.map((slot) => (
        <rect
          key={`box-${slot.id}`}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          fill="rgb(56 189 248 / 0.28)"
          stroke="rgb(2 132 199 / 0.85)"
          strokeWidth="0.4"
        />
      ))}
      {gaps.map(({ key, x, width, label }) => (
        <text
          key={`label-${key}`}
          x={x + width / 2}
          y={12.2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgb(124 45 18)"
          fontSize="3.2"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontWeight="600"
        >
          {label}
        </text>
      ))}
    </g>
  );
}

/**
 * Horizontal lockup — circle · triangle · square · scribble.
 * Pass `showPadding` to paint glyph boxes (sky) and inter-glyph gaps (orange).
 * Pass `scribbleVariant` to swap the sky glyph (Default style only).
 * Pass `glyphStyle` for Default / Outline / Textured asset sets.
 */
export const LogoHorizontal = ({
  className = 'h-8 w-auto',
  showPadding = false,
  scribbleVariant = DEFAULT_SCRIBBLE_VARIANT_ID,
  glyphStyle = DEFAULT_GLYPH_STYLE_ID,
  viewBox = LOGO_HORIZONTAL_VIEWBOX,
}) => {
  const slots = resolveSlots(LOGO_HORIZONTAL_SLOTS, scribbleVariant, glyphStyle);
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      {showPadding ? <HorizontalPaddingOverlay slots={slots} /> : null}
      {slots.map((slot) => (
        <GlyphSlot
          key={slot.id}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          viewBox={slot.viewBox}
          colorClass={slot.colorClass}
        >
          {renderMark(slot.id, scribbleVariant, glyphStyle)}
        </GlyphSlot>
      ))}
    </svg>
  );
};

/**
 * 2×2 icon slot layout (viewBox 0 0 40 40).
 * Inter-glyph gutter is 4 units (half of the previous 8).
 */
export const LOGO_ICON_VIEWBOX = '0 0 40 40';
/** Cropped to glyph bounds (no artboard padding). */
export const LOGO_ICON_TIGHT_VIEWBOX = '2 2 36 36';

export const LOGO_ICON_SLOTS = [
  { id: 'circle', x: 2, y: 2, width: 16, height: 16, viewBox: GLYPH_VIEWBOX.circle, colorClass: COLOR.circle },
  { id: 'triangle', x: 22, y: 2, width: 16, height: 16, viewBox: GLYPH_VIEWBOX.triangle, colorClass: COLOR.triangle },
  { id: 'square', x: 2, y: 22, width: 16, height: 16, viewBox: GLYPH_VIEWBOX.square, colorClass: COLOR.square },
  { id: 'scribble', x: 22, y: 22, width: 16, height: 16, viewBox: GLYPH_VIEWBOX.scribble, colorClass: COLOR.scribble },
];

/** Padding debug for the 2×2 grid — glyph boxes + row/column gutters. */
function IconPaddingOverlay({ slots }) {
  const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
  const gutters = [
    {
      key: 'h-top',
      x: byId.circle.x + byId.circle.width,
      y: byId.circle.y,
      width: byId.triangle.x - (byId.circle.x + byId.circle.width),
      height: byId.circle.height,
    },
    {
      key: 'h-bottom',
      x: byId.square.x + byId.square.width,
      y: byId.square.y,
      width: byId.scribble.x - (byId.square.x + byId.square.width),
      height: byId.square.height,
    },
    {
      key: 'v-left',
      x: byId.circle.x,
      y: byId.circle.y + byId.circle.height,
      width: byId.circle.width,
      height: byId.square.y - (byId.circle.y + byId.circle.height),
    },
    {
      key: 'v-right',
      x: byId.triangle.x,
      y: byId.triangle.y + byId.triangle.height,
      width: byId.triangle.width,
      height: byId.scribble.y - (byId.triangle.y + byId.triangle.height),
    },
    {
      key: 'center',
      x: byId.circle.x + byId.circle.width,
      y: byId.circle.y + byId.circle.height,
      width: byId.triangle.x - (byId.circle.x + byId.circle.width),
      height: byId.square.y - (byId.circle.y + byId.circle.height),
    },
  ].filter((g) => g.width > 0.05 && g.height > 0.05);

  return (
    <g aria-hidden>
      {gutters.map(({ key, x, y, width, height }) => (
        <g key={key}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgb(251 146 60 / 0.45)"
            stroke="rgb(234 88 12 / 0.9)"
            strokeWidth="0.35"
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgb(124 45 18)"
            fontSize="3.2"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="600"
          >
            {key.startsWith('v-') ? height.toFixed(0) : width.toFixed(0)}
          </text>
        </g>
      ))}
      {slots.map((slot) => (
        <rect
          key={`box-${slot.id}`}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          fill="rgb(56 189 248 / 0.28)"
          stroke="rgb(2 132 199 / 0.85)"
          strokeWidth="0.4"
        />
      ))}
    </g>
  );
}

/**
 * 2×2 icon lockup — same glyphs and colors. `monochrome` drops brand hues (uses currentColor).
 * Optional `shapeClassName` / `shapeClassNames` for bumper pop animations.
 * Pass `showPadding` to paint glyph boxes (sky) and gutters (orange).
 * Pass `scribbleVariant` to swap the sky glyph (Default style only).
 * Pass `glyphStyle` for Default / Outline / Textured asset sets.
 */
export const LogoIcon2x2 = ({
  className = 'w-16 h-16',
  style,
  monochrome = false,
  showPadding = false,
  scribbleVariant = DEFAULT_SCRIBBLE_VARIANT_ID,
  glyphStyle = DEFAULT_GLYPH_STYLE_ID,
  shapeClassName = '',
  shapeClassNames,
  viewBox = LOGO_ICON_VIEWBOX,
}) => {
  const classes = shapeClassNames || [
    shapeClassName,
    shapeClassName,
    shapeClassName,
    shapeClassName,
  ];
  const slots = resolveSlots(LOGO_ICON_SLOTS, scribbleVariant, glyphStyle);

  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden
    >
      {showPadding ? <IconPaddingOverlay slots={slots} /> : null}
      {slots.map((slot, i) => (
        <GlyphSlot
          key={slot.id}
          x={slot.x}
          y={slot.y}
          width={slot.width}
          height={slot.height}
          viewBox={slot.viewBox}
          colorClass={slot.colorClass}
          monochrome={monochrome}
          className={classes[i]}
        >
          {renderMark(slot.id, scribbleVariant, glyphStyle)}
        </GlyphSlot>
      ))}
    </svg>
  );
};
