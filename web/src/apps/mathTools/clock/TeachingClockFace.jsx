import {
  ACCESSIBLE_FONTS,
  TEXT_SIZES,
  useAccessibilityPreferences,
} from '../../../data/settings/AccessibilityPreferencesContext';
import { useAppThemePreferences } from '../../../data/settings/AppThemePreferencesContext';
import { bestOnColor } from '../../../shared/colorContrast';
import { PRIMARY_SOLID_HEX } from '../../../shared/theme';
import {
  halfSectionHue,
  hourRainbowFill,
  hourSectionBackdrop,
  minuteRainbowFill,
  primaryBlockPalette,
  quarterSectionHue,
  sectionMarkStroke,
  sectionRainbowCenter,
  sectionRainbowSolid,
} from './blockRainbowColors';
import {
  annularArcPath,
  arcMidAngle,
  DEGREES_PER_HOUR,
  DEGREES_PER_MINUTE,
  normalizeDegrees,
  polarToCartesian,
} from './teachingClockMath';

const FACE = '#FFFFFF';
const FACE_STROKE = '#0F172A'; // slate-900
const FACE_DARK = '#0F172A'; // slate-900
const FACE_STROKE_DARK = '#E2E8F0'; // slate-200 — rim on dark face
export const HOUR_INK = '#C62828';
export const MINUTE_INK = '#1565C0';
export const SECOND_INK = '#E11D48'; // rose-600 — distinct from hour red
const TICK_MINOR = '#64748B'; // slate-500
const TICK_MAJOR = FACE_STROKE; // match rim
const TICK_MINOR_DARK = '#334155'; // slate-700
const TICK_MAJOR_DARK = FACE_STROKE_DARK; // match rim
const NUMERAL = '#334155'; // slate-700 — two steps lighter than hour slate-900
const NUMERAL_DARK = '#CBD5E1'; // slate-300 — two steps down from white on dark face
const PIVOT_FILL = '#FFFFFF';
const PIVOT_STROKE = '#1E293B'; // slate-800
const PIVOT_DOT = '#0F172A'; // slate-900 — idle hub accent
/** Matches Tailwind font-sans when Settings accessible font is Default. */
const DEFAULT_FACE_FONT =
  'ui-sans-serif, system-ui, sans-serif';

/** Clock hours 1–24 as Roman numerals (24h PM face uses 13–24). */
const ROMAN_HOURS = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
  13: 'XIII',
  14: 'XIV',
  15: 'XV',
  16: 'XVI',
  17: 'XVII',
  18: 'XVIII',
  19: 'XIX',
  20: 'XX',
  21: 'XXI',
  22: 'XXII',
  23: 'XXIII',
  24: 'XXIV',
};

function formatHourLabel(num, { roman = false } = {}) {
  if (roman) return ROMAN_HOURS[num] ?? String(num);
  return String(num);
}

/** SVG viewBox — padded so thick outer wedges aren’t clipped. */
export const CLOCK_VIEWBOX = 240;
const CX = 120;
const CY = 120;
export const FACE_R = 78;
/** Just inside the major tick tips so numerals hug their hour marks. */
const HOUR_NUM_R = 57;
/** Minute labels nest near the tick band at the rim. */
const MINUTE_LABEL_R = 72;
/** Quarter-line labels: horizontal sit inward to clear 3 & 9; vertical stay farther out. */
const TIME_NAME_R_H = 28;
const TIME_NAME_R_V = 40;
const HOUR_HAND_LEN = 40;
const MINUTE_HAND_LEN = 58;
const SECOND_HAND_LEN = 68;
const HOUR_HAND_STROKE = 5;
const MINUTE_HAND_STROKE = 3.25;
const SECOND_HAND_STROKE = 1.75;
/** Hit stroke widths — wide for touch, butt caps so grabs stop at the tip. */
const HOUR_HIT_STROKE = 18;
const MINUTE_HIT_STROKE = 18;
const SECOND_HIT_STROKE = 14;

/** Radial thickness of each wedge ring (was 5; 2.5× → 12.5). */
const WEDGE_BAND = 12.5;
/** Face stroke (centered on FACE_R) — outer chip wedges start just outside it. */
const FACE_STROKE_WIDTH = 1.5;
const WEDGE_RIM = FACE_R + FACE_STROKE_WIDTH / 2;

const MINUTE_LABELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

/** Inside-face past/to halves (12→6 = past, 6→12 = to). */
const PAST_TO_R = FACE_R - FACE_STROKE_WIDTH / 2;
const PAST_TO_LABEL_R = 30;
const PAST_FILL = '#FFF8E1';
const TO_FILL = '#E3F2FD';

/** Quarter-hour pie slices (same opaque palette as past/to). */
const QUARTER_SLICES = [
  { start: 0, end: 90, fill: PAST_FILL },
  { start: 90, end: 180, fill: TO_FILL },
  { start: 180, end: 270, fill: PAST_FILL },
  { start: 270, end: 360, fill: TO_FILL },
];
/** Divider angles — same rays as thick 5-minute / hour marks. */
const QUARTER_DIVIDER_ANGLES = [0, 90, 180, 270];
const HALF_DIVIDER_ANGLES = [0, 180];
/** Labels sit on the quarter lines (12 / 3 / 6 / 9) where the terms are said. */
const QUARTER_LINE_LABELS = [
  { angle: 0, text: "o'clock", r: TIME_NAME_R_V },
  { angle: 90, text: 'Quarter', r: TIME_NAME_R_H },
  { angle: 180, text: 'Half', r: TIME_NAME_R_V },
  { angle: 270, text: 'Quarter till', r: TIME_NAME_R_H },
];

/** Minute blocks tuck under the outer rim so face fill can’t peek through. */
const MINUTE_WEDGE_OUTER = FACE_R - FACE_STROKE_WIDTH / 2 + 0.55;
const MINUTE_WEDGE_INNER = MINUTE_WEDGE_OUTER - 10;
const MINUTE_WEDGE_LABEL_R =
  (MINUTE_WEDGE_INNER + MINUTE_WEDGE_OUTER) / 2;
/** Hour wedges fill the disk inside the minute band (or full face when minutes are ticks). */
/** Slightly underlap the minute ring so yellow face fill can't peek at the join. */
const HOUR_WEDGE_R_WITH_MINUTES = MINUTE_WEDGE_INNER + 0.75;
const HOUR_WEDGE_LABEL_R = 48;
/** Extra sweep so adjacent pie / ring slices overlap — kills hairline face seams. */
const WEDGE_SEAM_OVERLAP = 1.25;
/** Chip wedge outline — drawn as an interior stroke (clipped), viewBox units. */
const CHIP_WEDGE_STROKE = 0.35;

/** Pie slice from center through startDeg → endDeg (clockwise). */
function pieSlicePath(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  let sweep = normalizeDegrees(endDeg - startDeg);
  if (sweep < 0.5) sweep = 0.5;
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function ringRadii(hasMinutes, hasHours) {
  const hug = { inner: WEDGE_RIM, outer: WEDGE_RIM + WEDGE_BAND };
  if (hasMinutes && hasHours) {
    return {
      minute: hug,
      hour: {
        inner: hug.outer,
        outer: hug.outer + WEDGE_BAND,
      },
    };
  }
  if (hasMinutes) return { minute: hug, hour: null };
  if (hasHours) return { minute: null, hour: hug };
  return { minute: null, hour: null };
}

/**
 * Teaching clock face — white/grey chrome aligned with TimerCard analog.
 * Hands stay red/blue/rose so hour, minute, and second stay easy to tell apart.
 */
export function TeachingClockFace({
  hourAngle,
  minuteAngle,
  secondAngle = 0,
  onHourPointerDown,
  onMinutePointerDown,
  onSecondPointerDown,
  onWedgePointerDown,
  showHourHand = true,
  showMinuteHand = true,
  showSecondHand = false,
  showMinuteLabels = true,
  showHourWedges = false,
  showPastTo = false,
  showQuarters = false,
  /** When true, 60 numbered interior wedges replace tick marks. */
  showMinuteWedges = false,
  /** Blocks-only: rainbow hour hues + light/dark minute cells. */
  rainbowBlocks = false,
  showRomanNumerals = false,
  hour24 = false,
  isPm = false,
  isDarkMode = false,
  wedges = [],
  selectedWedgeIds = [],
  /** 'hour' | 'minute' | 'second' while dragging a hand; null when idle. */
  activeHand = null,
}) {
  const { fontId, textSizeId } = useAccessibilityPreferences();
  const { getAppPrimary } = useAppThemePreferences();
  const primaryKey = getAppPrimary('timer');
  const primaryHex =
    PRIMARY_SOLID_HEX[primaryKey] || PRIMARY_SOLID_HEX.Emerald;
  const primaryBlocks = primaryBlockPalette(primaryHex);
  /** Blocks mode without Rainbow — app primary + light/dark minutes. */
  const usePrimaryBlocks = showMinuteWedges && !rainbowBlocks;
  /** Non-rainbow interiors — primary light/dark (Tickmarks + Blocks half/quarter). */
  const usePrimarySections = !rainbowBlocks;
  const primaryLight = primaryBlocks.light;
  const primaryDark = primaryBlocks.dark;
  const tickSectionA = usePrimarySections ? primaryLight : PAST_FILL;
  const tickSectionB = usePrimarySections ? primaryDark : TO_FILL;
  const pivotDot =
    activeHand === 'hour'
      ? HOUR_INK
      : activeHand === 'minute'
        ? MINUTE_INK
        : activeHand === 'second'
          ? SECOND_INK
          : PIVOT_DOT;

  const faceFontFamily =
    ACCESSIBLE_FONTS.find((f) => f.id === fontId)?.cssFamily || DEFAULT_FACE_FONT;
  /** SVG fontSize is viewBox units — mirror Settings text size (root %). */
  const textScale =
    (TEXT_SIZES.find((s) => s.id === textSizeId)?.rootPercent ?? 100) / 100;
  const fs = (n) => n * textScale;

  const hasMinutes = wedges.some((w) => w.ring === 'minute');
  const hasHours = wedges.some((w) => w.ring === 'hour');
  const radii = ringRadii(hasMinutes, hasHours);
  const usePmHourLabels = hour24 && isPm;
  const faceFill = isDarkMode ? FACE_DARK : FACE;
  const faceStroke = isDarkMode ? FACE_STROKE_DARK : FACE_STROKE;
  const tickMinor = isDarkMode ? TICK_MINOR_DARK : TICK_MINOR;
  const tickMajor = isDarkMode ? TICK_MAJOR_DARK : TICK_MAJOR;
  const numeral = isDarkMode ? NUMERAL_DARK : NUMERAL;
  const hourWedgeR = showMinuteWedges
    ? HOUR_WEDGE_R_WITH_MINUTES
    : PAST_TO_R;
  /** Border sits on the visual join with the minute ring, not the underlap radius. */
  const hourWedgeBorderR = showMinuteWedges
    ? MINUTE_WEDGE_INNER
    : PAST_TO_R;
  /** Half / quarter disk — flush under minute blocks when Blocks is on. */
  const overlayR = showMinuteWedges ? HOUR_WEDGE_R_WITH_MINUTES : PAST_TO_R;
  /** Dividers run out to the thick mark tips on the minute ring (or face rim). */
  const dividerOuterR = showMinuteWedges ? MINUTE_WEDGE_OUTER : PAST_TO_R;
  const dividerStroke = rainbowBlocks
    ? null // per-angle stroke below
    : tickMajor;

  const selectedWedgeSet = new Set(selectedWedgeIds);
  const wedgeNodes = wedges.map((wedge) => {
    const band = radii[wedge.ring];
    if (!band) return null;
    const fill = wedge.ring === 'hour' ? HOUR_INK : MINUTE_INK;
    const onFill = bestOnColor(fill).hex;
    const mid = arcMidAngle(wedge.startAngle, wedge.endAngle);
    const labelR = (band.inner + band.outer) / 2;
    const labelPt = polarToCartesian(CX, CY, labelR, mid);
    const pathD = annularArcPath(
      CX,
      CY,
      band.inner,
      band.outer,
      wedge.startAngle,
      wedge.endAngle,
    );
    const clipId = `chip-wedge-clip-${wedge.id}`;
    const selected = selectedWedgeSet.has(wedge.id);
    return (
      <g
        key={wedge.id}
        data-wedge-id={wedge.id}
        className={
          wedge.linkedSegmentId
            ? 'pointer-events-none'
            : 'cursor-grab touch-none'
        }
        onPointerDown={
          wedge.linkedSegmentId
            ? undefined
            : (e) => onWedgePointerDown?.(wedge.id, e)
        }
      >
        <defs>
          <clipPath id={clipId}>
            <path d={pathD} />
          </clipPath>
        </defs>
        <path d={pathD} fill={fill} fillOpacity={0.85} />
        {/* Centered stroke at 2×, clipped to fill → interior-only outline. */}
        <path
          d={pathD}
          fill="none"
          stroke={fill}
          strokeOpacity={0.85}
          strokeWidth={CHIP_WEDGE_STROKE * 2}
          strokeLinejoin="miter"
          clipPath={`url(#${clipId})`}
          style={{ pointerEvents: 'none' }}
        />
        {selected ? (
          <path
            d={pathD}
            fill="none"
            stroke={isDarkMode ? '#F8FAFC' : '#0F172A'}
            strokeWidth={CHIP_WEDGE_STROKE * 2.5}
            strokeLinejoin="miter"
            style={{ pointerEvents: 'none' }}
          />
        ) : null}
        <text
          x={labelPt.x}
          y={labelPt.y}
          fill={onFill}
          fontSize={fs(7)}
          fontWeight="700"
          fontFamily={faceFontFamily}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ pointerEvents: 'none' }}
        >
          {wedge.label}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${CLOCK_VIEWBOX} ${CLOCK_VIEWBOX}`}
      className="h-full w-full select-none overflow-visible"
      aria-hidden="true"
    >
      <circle
        cx={CX}
        cy={CY}
        r={FACE_R}
        fill={faceFill}
      />

      <defs>
        <filter
          id="clock-hour-seam-blur"
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
        </filter>
        <clipPath id="clock-hour-wedge-clip">
          <circle cx={CX} cy={CY} r={hourWedgeR} />
        </clipPath>
        <clipPath id="clock-overlay-clip">
          <circle cx={CX} cy={CY} r={overlayR} />
        </clipPath>
      </defs>

      {rainbowBlocks && (showQuarters || showPastTo) ? (
        <defs>
          {showQuarters
            ? QUARTER_SLICES.map(({ start }, qi) => {
                const hue = quarterSectionHue(qi);
                return (
                  <radialGradient
                    key={`qg-${start}`}
                    id={`clock-quarter-grad-${start}`}
                    cx={CX}
                    cy={CY}
                    r={overlayR}
                    fx={CX}
                    fy={CY}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={sectionRainbowCenter(hue)} />
                    <stop offset="100%" stopColor={sectionRainbowSolid(hue)} />
                  </radialGradient>
                );
              })
            : null}
          {showPastTo ? (
            <>
              <radialGradient
                id="clock-half-grad-past"
                cx={CX}
                cy={CY}
                r={overlayR}
                fx={CX}
                fy={CY}
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0%"
                  stopColor={sectionRainbowCenter(halfSectionHue(true))}
                />
                <stop
                  offset="100%"
                  stopColor={sectionRainbowSolid(halfSectionHue(true))}
                />
              </radialGradient>
              <radialGradient
                id="clock-half-grad-to"
                cx={CX}
                cy={CY}
                r={overlayR}
                fx={CX}
                fy={CY}
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0%"
                  stopColor={sectionRainbowCenter(halfSectionHue(false))}
                />
                <stop
                  offset="100%"
                  stopColor={sectionRainbowSolid(halfSectionHue(false))}
                />
              </radialGradient>
            </>
          ) : null}
        </defs>
      ) : null}

      {showHourWedges ? (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={CX}
            cy={CY}
            r={hourWedgeR}
            fill={
              rainbowBlocks
                ? hourRainbowFill(12)
                : usePrimaryBlocks
                  ? primaryBlocks.solid
                  : tickSectionA
            }
          />
          <g clipPath="url(#clock-hour-wedge-clip)">
            {Array.from({ length: 12 }, (_, i) => {
              const start = i * DEGREES_PER_HOUR;
              /** Exact hour rays — matches 5-minute / 60 tick marks. */
              const end = start + DEGREES_PER_HOUR;
              /** Sector 12→1 is hour 12; 1→2 is hour 1; … */
              const num = i === 0 ? 12 : i;
              const fill = rainbowBlocks
                ? hourRainbowFill(num)
                : usePrimaryBlocks
                  ? primaryBlocks.solid
                  : i % 2 === 0
                    ? tickSectionA
                    : tickSectionB;
              return (
                <path
                  key={`hour-wedge-fill-${num}`}
                  d={pieSlicePath(CX, CY, hourWedgeR, start, end)}
                  fill={fill}
                />
              );
            })}
          </g>
          {Array.from({ length: 12 }, (_, i) => {
            const start = i * DEGREES_PER_HOUR;
            const num = i === 0 ? 12 : i;
            const display = formatHourLabel(
              usePmHourLabels ? (num === 12 ? 24 : num + 12) : num,
              { roman: showRomanNumerals },
            );
            /** Tickmarks: mid-wedge at regular numeral radius; Blocks: mid-wedge inward. */
            const labelR = showMinuteWedges ? HOUR_WEDGE_LABEL_R : HOUR_NUM_R;
            const labelAngle = arcMidAngle(start, start + DEGREES_PER_HOUR);
            const pt = polarToCartesian(CX, CY, labelR, labelAngle);
            const fill = rainbowBlocks
              ? hourRainbowFill(num)
              : usePrimaryBlocks
                ? primaryBlocks.solid
                : i % 2 === 0
                  ? tickSectionA
                  : tickSectionB;
            const onFill = bestOnColor(fill).hex;
            return (
              <text
                key={`hour-wedge-label-${num}`}
                x={pt.x}
                y={pt.y}
                fill={onFill}
                fontSize={fs(
                  showRomanNumerals
                    ? usePmHourLabels
                      ? 8
                      : 11
                    : usePmHourLabels
                      ? 11
                      : 13,
                )}
                fontWeight="700"
                fontFamily={faceFontFamily}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {display}
              </text>
            );
          })}
          {!showMinuteWedges ? (
            <circle
              cx={CX}
              cy={CY}
              r={hourWedgeBorderR}
              fill="none"
              stroke={faceStroke}
              strokeWidth="1"
            />
          ) : null}
        </g>
      ) : showQuarters ? (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={CX}
            cy={CY}
            r={overlayR}
            fill={
              rainbowBlocks
                ? sectionRainbowSolid(quarterSectionHue(0))
                : tickSectionA
            }
          />
          {QUARTER_SLICES.map(({ start, end, fill }, qi) => (
            <path
              key={`quarter-${start}`}
              d={pieSlicePath(
                CX,
                CY,
                overlayR,
                start,
                end + WEDGE_SEAM_OVERLAP,
              )}
              fill={
                rainbowBlocks
                  ? `url(#clock-quarter-grad-${start})`
                  : usePrimarySections
                    ? qi % 2 === 0
                      ? primaryLight
                      : primaryDark
                    : fill
              }
            />
          ))}
          {showMinuteWedges
            ? QUARTER_DIVIDER_ANGLES.map((angle, di) => {
                const tip = polarToCartesian(CX, CY, dividerOuterR, angle);
                // Divider sits between sections; use the section that starts at this mark.
                const hue = quarterSectionHue(di);
                return (
                  <line
                    key={`quarter-div-${angle}`}
                    x1={CX}
                    y1={CY}
                    x2={tip.x}
                    y2={tip.y}
                    stroke={
                      rainbowBlocks ? sectionMarkStroke(hue) : dividerStroke
                    }
                    strokeWidth="1.35"
                    strokeLinecap="butt"
                  />
                );
              })
            : null}
          {QUARTER_LINE_LABELS.map(({ angle, text, r }) => {
            const pt = polarToCartesian(CX, CY, r, angle);
            const slice =
              QUARTER_SLICES.find((s) => s.start === angle) || QUARTER_SLICES[0];
            const qi = Math.floor(angle / 90) % 4;
            const labelFill = rainbowBlocks
              ? bestOnColor(sectionRainbowSolid(quarterSectionHue(qi))).hex
              : bestOnColor(
                  usePrimarySections
                    ? qi % 2 === 0
                      ? primaryLight
                      : primaryDark
                    : slice.fill,
                ).hex;
            return (
              <text
                key={`quarter-label-${angle}`}
                x={pt.x}
                y={pt.y}
                fill={labelFill}
                fontSize={fs(5.5)}
                fontWeight="700"
                fontFamily={faceFontFamily}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {text}
              </text>
            );
          })}
        </g>
      ) : showPastTo ? (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={CX}
            cy={CY}
            r={overlayR}
            fill={
              rainbowBlocks
                ? sectionRainbowSolid(halfSectionHue(true))
                : tickSectionA
            }
          />
          {rainbowBlocks ? (
            <g clipPath="url(#clock-overlay-clip)">
              <g filter="url(#clock-hour-seam-blur)">
                <path
                  d={pieSlicePath(
                    CX,
                    CY,
                    overlayR,
                    0,
                    180 + WEDGE_SEAM_OVERLAP,
                  )}
                  fill="url(#clock-half-grad-past)"
                />
                <path
                  d={pieSlicePath(
                    CX,
                    CY,
                    overlayR,
                    180,
                    360 + WEDGE_SEAM_OVERLAP,
                  )}
                  fill="url(#clock-half-grad-to)"
                />
              </g>
            </g>
          ) : (
            <>
              <path
                d={pieSlicePath(
                  CX,
                  CY,
                  overlayR,
                  0,
                  180 + WEDGE_SEAM_OVERLAP,
                )}
                fill={tickSectionA}
              />
              <path
                d={pieSlicePath(
                  CX,
                  CY,
                  overlayR,
                  180,
                  360 + WEDGE_SEAM_OVERLAP,
                )}
                fill={tickSectionB}
              />
            </>
          )}
          {showMinuteWedges
            ? HALF_DIVIDER_ANGLES.map((angle) => {
                const tip = polarToCartesian(CX, CY, dividerOuterR, angle);
                const isPastSide = angle === 0;
                return (
                  <line
                    key={`half-div-${angle}`}
                    x1={CX}
                    y1={CY}
                    x2={tip.x}
                    y2={tip.y}
                    stroke={
                      rainbowBlocks
                        ? sectionMarkStroke(halfSectionHue(isPastSide))
                        : dividerStroke
                    }
                    strokeWidth="1.35"
                    strokeLinecap="butt"
                  />
                );
              })
            : null}
        </g>
      ) : null}

      {showPastTo ? (
        <g style={{ pointerEvents: 'none' }}>
          <text
            x={CX + PAST_TO_LABEL_R}
            y={CY}
            fill={
              rainbowBlocks
                ? bestOnColor(sectionRainbowSolid(halfSectionHue(true))).hex
                : bestOnColor(tickSectionA).hex
            }
            fontSize={fs(7)}
            fontWeight="700"
            fontFamily={faceFontFamily}
            textAnchor="middle"
            dominantBaseline="central"
          >
            past
          </text>
          <text
            x={CX - PAST_TO_LABEL_R}
            y={CY}
            fill={
              rainbowBlocks
                ? bestOnColor(sectionRainbowSolid(halfSectionHue(false))).hex
                : bestOnColor(tickSectionB).hex
            }
            fontSize={fs(7)}
            fontWeight="700"
            fontFamily={faceFontFamily}
            textAnchor="middle"
            dominantBaseline="central"
          >
            to
          </text>
        </g>
      ) : null}

      {showMinuteWedges
        ? (
            <g style={{ pointerEvents: 'none' }}>
              {/* Solid ring underlay so AA seams never flash face white. */}
              <circle
                cx={CX}
                cy={CY}
                r={(MINUTE_WEDGE_INNER + MINUTE_WEDGE_OUTER) / 2}
                fill="none"
                stroke={
                  rainbowBlocks
                    ? minuteRainbowFill(0, {
                        half: showPastTo,
                        quarters: showQuarters,
                      })
                    : usePrimaryBlocks
                      ? primaryBlocks.dark
                      : TO_FILL
                }
                strokeWidth={MINUTE_WEDGE_OUTER - MINUTE_WEDGE_INNER}
              />
              {Array.from({ length: 60 }, (_, i) => {
                const start = i * DEGREES_PER_MINUTE;
                const end = start + DEGREES_PER_MINUTE;
                const label = i + 1;
                const mid = arcMidAngle(start, end);
                const pt = polarToCartesian(CX, CY, MINUTE_WEDGE_LABEL_R, mid);
                const fill = rainbowBlocks
                  ? minuteRainbowFill(i, {
                      half: showPastTo,
                      quarters: showQuarters,
                    })
                  : usePrimaryBlocks
                    ? i % 2 === 0
                      ? primaryBlocks.light
                      : primaryBlocks.dark
                    : i % 2 === 0
                      ? PAST_FILL
                      : TO_FILL;
                const onFill =
                  rainbowBlocks || usePrimaryBlocks
                    ? bestOnColor(fill).hex
                    : numeral;
                return (
                  <g key={`min-wedge-${label}`}>
                    <path
                      d={annularArcPath(
                        CX,
                        CY,
                        MINUTE_WEDGE_INNER,
                        MINUTE_WEDGE_OUTER,
                        start,
                        end,
                      )}
                      fill={fill}
                    />
                    <text
                      x={pt.x}
                      y={pt.y}
                      fill={onFill}
                      fontSize={fs(label === 60 || label >= 10 ? 3.25 : 3.5)}
                      fontWeight="700"
                      fontFamily={faceFontFamily}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = i * DEGREES_PER_HOUR;
                const inner = polarToCartesian(
                  CX,
                  CY,
                  MINUTE_WEDGE_INNER,
                  angle,
                );
                const outer = polarToCartesian(
                  CX,
                  CY,
                  MINUTE_WEDGE_OUTER,
                  angle,
                );
                return (
                  <line
                    key={`min-wedge-mark-${i}`}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={tickMajor}
                    strokeWidth="1.35"
                    strokeLinecap="butt"
                  />
                );
              })}
            </g>
          )
        : Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        if (major && showMinuteLabels) return null;
        const rimInner = FACE_R - FACE_STROKE_WIDTH / 2;
        const rimOuter = FACE_R + FACE_STROKE_WIDTH / 2;
        /** Majors tuck under the rim so they read as emerging from the border. */
        const outer = major ? rimOuter : rimInner - 0.35;
        const inner = major ? FACE_R - 10 : outer - 5;
        return (
          <line
            key={`tick-${i}`}
            x1={CX}
            y1={CY - inner}
            x2={CX}
            y2={CY - outer}
            transform={`rotate(${i * DEGREES_PER_MINUTE} ${CX} ${CY})`}
            stroke={major ? tickMajor : tickMinor}
            strokeWidth={major ? 1.5 : 0.5}
            strokeLinecap={major ? 'butt' : 'round'}
          />
        );
      })}

      {/* Rim above ticks so marks tuck under the border. */}
      <circle
        cx={CX}
        cy={CY}
        r={FACE_R}
        fill="none"
        stroke={faceStroke}
        strokeWidth={FACE_STROKE_WIDTH}
      />

      {!showHourWedges
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
            const a = (num * 30 * Math.PI) / 180;
            const x = CX + HOUR_NUM_R * Math.sin(a);
            const y = CY - HOUR_NUM_R * Math.cos(a);
            const label = formatHourLabel(
              usePmHourLabels ? (num === 12 ? 24 : num + 12) : num,
              { roman: showRomanNumerals },
            );
            let backdrop = faceFill;
            if (rainbowBlocks) {
              backdrop = hourSectionBackdrop(num, {
                half: showPastTo,
                quarters: showQuarters,
              });
            } else if (showPastTo) {
              backdrop =
                num === 12 || num <= 6 ? tickSectionA : tickSectionB;
            } else if (showQuarters) {
              const qi = Math.floor((((num % 12) * 30) % 360) / 90) % 4;
              backdrop = usePrimarySections
                ? qi % 2 === 0
                  ? primaryLight
                  : primaryDark
                : (QUARTER_SLICES.find((s) => s.start === qi * 90)?.fill ??
                  PAST_FILL);
            }
            const ink = bestOnColor(backdrop).hex;
            return (
              <text
                key={`hour-${num}`}
                x={x}
                y={y}
                fill={ink}
                fontSize={fs(
                  showRomanNumerals
                    ? usePmHourLabels
                      ? 9
                      : 12
                    : usePmHourLabels
                      ? 12
                      : 14,
                )}
                fontWeight="700"
                fontFamily={faceFontFamily}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label}
              </text>
            );
          })
        : null}

      {!showMinuteWedges && showMinuteLabels
        ? MINUTE_LABELS.map((label) => {
            const a = ((label % 60) * DEGREES_PER_MINUTE * Math.PI) / 180;
            const x = CX + MINUTE_LABEL_R * Math.sin(a);
            const y = CY - MINUTE_LABEL_R * Math.cos(a);
            return (
              <text
                key={`min-${label}`}
                x={x}
                y={y}
                fill={numeral}
                fontSize={fs(5)}
                fontWeight="700"
                fontFamily={faceFontFamily}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label}
              </text>
            );
          })
        : null}

      {showSecondHand ? (
        <g transform={`rotate(${secondAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 10}
            x2={CX}
            y2={CY - SECOND_HAND_LEN}
            stroke={SECOND_INK}
            strokeWidth={SECOND_HAND_STROKE}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {showMinuteHand ? (
        <g transform={`rotate(${minuteAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 8}
            x2={CX}
            y2={CY - MINUTE_HAND_LEN}
            stroke={MINUTE_INK}
            strokeWidth={MINUTE_HAND_STROKE}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {showHourHand ? (
        <g transform={`rotate(${hourAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 6}
            x2={CX}
            y2={CY - HOUR_HAND_LEN}
            stroke={HOUR_INK}
            strokeWidth={HOUR_HAND_STROKE}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {/*
        Hit targets: longest → shortest. Butt caps so the grab ends at the
        visible tip (round ink caps included), not past it.
      */}
      {showSecondHand ? (
        <g transform={`rotate(${secondAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 10 + SECOND_HAND_STROKE / 2}
            x2={CX}
            y2={CY - (SECOND_HAND_LEN + SECOND_HAND_STROKE / 2)}
            stroke="transparent"
            strokeWidth={SECOND_HIT_STROKE}
            strokeLinecap="butt"
            className="cursor-grab touch-none"
            onPointerDown={onSecondPointerDown}
            style={{ pointerEvents: 'stroke' }}
          />
        </g>
      ) : null}

      {showMinuteHand ? (
        <g transform={`rotate(${minuteAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 8 + MINUTE_HAND_STROKE / 2}
            x2={CX}
            y2={CY - (MINUTE_HAND_LEN + MINUTE_HAND_STROKE / 2)}
            stroke="transparent"
            strokeWidth={MINUTE_HIT_STROKE}
            strokeLinecap="butt"
            className="cursor-grab touch-none"
            onPointerDown={onMinutePointerDown}
            style={{ pointerEvents: 'stroke' }}
          />
        </g>
      ) : null}

      {showHourHand ? (
        <g transform={`rotate(${hourAngle} ${CX} ${CY})`}>
          <line
            x1={CX}
            y1={CY + 6 + HOUR_HAND_STROKE / 2}
            x2={CX}
            y2={CY - (HOUR_HAND_LEN + HOUR_HAND_STROKE / 2)}
            stroke="transparent"
            strokeWidth={HOUR_HIT_STROKE}
            strokeLinecap="butt"
            className="cursor-grab touch-none"
            onPointerDown={onHourPointerDown}
            style={{ pointerEvents: 'stroke' }}
          />
        </g>
      ) : null}

      {/* Wedges above hands at the rim so they stay easy to grab and slide. */}
      {wedgeNodes}

      <circle
        cx={CX}
        cy={CY}
        r="6"
        fill={PIVOT_FILL}
        stroke={PIVOT_STROKE}
        strokeWidth="2"
      />
      <circle cx={CX} cy={CY} r="2.5" fill={pivotDot} />
    </svg>
  );
}

export const CLOCK_CENTER = { cx: CX, cy: CY };
