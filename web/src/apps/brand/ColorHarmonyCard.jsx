import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  generateHarmony,
  HARMONY_MODE_META,
  HARMONY_MODES,
} from './colorHarmony';
import { generateHarmonyScale } from './harmonyScale';

const HANDOFF_MS = 500;
/** Soft in-out — readable twist without dragging. */
const HANDOFF_EASE = 'cubic-bezier(0.4, 0.05, 0.5, 0.95)';
/** Material short — typical FAB / elevation hover. */
const HOVER_MS = 200;
const HOVER_EASE = 'cubic-bezier(0.2, 0, 0, 1)';
/** While scrubbing: live color, no shape morph. */
const SWATCH_SCRUB_TRANSITION =
  'background-color 80ms linear, color 80ms linear, box-shadow 0s, border-radius 0s, transform 0s';

function swatchTransition({ morphing }) {
  const transformMs = morphing ? HANDOFF_MS : HOVER_MS;
  const transformEase = morphing ? HANDOFF_EASE : HOVER_EASE;
  return [
    'background-color 400ms ease',
    'color 400ms ease',
    `box-shadow ${HOVER_MS}ms ${HOVER_EASE}`,
    `border-radius ${HANDOFF_MS}ms ${HANDOFF_EASE}`,
    `transform ${transformMs}ms ${transformEase}`,
  ].join(', ');
}

/**
 * Compact 50–950 ramp for one harmony color.
 * Colors update live; circle↔square morph runs only when animate (idle / release).
 * freezeMarker pins the circle during scrub so handoff can play on release.
 */
function HarmonyScaleRow({
  color,
  onCopied,
  animate = true,
  freezeMarker = false,
}) {
  const scale = useMemo(() => generateHarmonyScale(color), [color]);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const liveRecommended = scale.find((s) => s.isRecommended)?.level ?? null;
  const [pinnedRecommended, setPinnedRecommended] = useState(null);
  const prevRecommendedRef = useRef(liveRecommended);
  const [handoffLevels, setHandoffLevels] = useState(() => new Set());
  const cols = scale.length;

  useEffect(() => {
    if (freezeMarker) {
      setPinnedRecommended((prev) => {
        const pin = prev ?? liveRecommended;
        prevRecommendedRef.current = pin;
        return pin;
      });
      return;
    }
    setPinnedRecommended(null);
  }, [freezeMarker, liveRecommended]);

  const displayRecommended = freezeMarker
    ? (pinnedRecommended ?? liveRecommended)
    : liveRecommended;

  useLayoutEffect(() => {
    if (freezeMarker) return undefined;
    const prev = prevRecommendedRef.current;
    const next = liveRecommended;
    if (!animate || !prev || !next || prev === next) {
      prevRecommendedRef.current = next;
      return undefined;
    }
    setHandoffLevels(new Set([prev, next]));
    prevRecommendedRef.current = next;
    const timer = window.setTimeout(() => setHandoffLevels(new Set()), HANDOFF_MS);
    return () => window.clearTimeout(timer);
  }, [liveRecommended, animate, freezeMarker]);

  const copyHex = async (hex) => {
    try {
      await navigator.clipboard.writeText(hex);
      onCopied?.(hex);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="grid gap-0.5 overflow-visible"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="list"
      aria-label={`${color.label} scale`}
    >
      {scale.map((swatch, index) => {
        const isFirst = index === 0;
        const isLast = index === scale.length - 1;
        const isRecommended = swatch.level === displayRecommended;
        const isHovered = hoveredLevel === swatch.level;
        const inHandoff = handoffLevels.has(swatch.level);
        const asCircle = isRecommended;
        const hexLabel = swatch.hex.toUpperCase();
        // Percent radii interpolate cleanly with circle 50% (unlike 0px → 9999px).
        const rectRadius = isFirst
          ? '18% 0% 0% 18%'
          : isLast
            ? '0% 18% 18% 0%'
            : '0%';
        // 90° turn — readable mid-morph while corners ease.
        const rotation = asCircle ? 90 : 0;

        return (
          <button
            key={swatch.level}
            type="button"
            role="listitem"
            title={hexLabel}
            aria-label={`${hexLabel}. Click to copy.`}
            aria-current={isRecommended ? 'true' : undefined}
            onClick={() => copyHex(swatch.hex)}
            onMouseEnter={() => setHoveredLevel(swatch.level)}
            onMouseLeave={() => setHoveredLevel(null)}
            className={`edu-control relative aspect-square w-full origin-center cursor-pointer text-center will-change-transform ${
              asCircle || inHandoff
                ? 'z-[1] shadow-[0_1px_4px_rgb(0,0,0,0.14)]'
                : ''
            } ${isHovered ? 'z-[2] shadow-[0_10px_28px_rgb(0,0,0,0.22)]' : ''}`}
            style={{
              backgroundColor: swatch.hex,
              color: swatch.onHex,
              borderRadius: asCircle ? '50%' : rectRadius,
              transform: isHovered
                ? `translateY(-0.375rem) scale(1.35) rotate(${rotation}deg)`
                : `rotate(${rotation}deg)`,
              transition: animate
                ? swatchTransition({ morphing: inHandoff })
                : SWATCH_SCRUB_TRANSITION,
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-semibold leading-none tracking-wide sm:text-[10px]"
              style={{
                transform: `rotate(${-rotation}deg)`,
                transition: animate
                  ? `transform ${inHandoff ? HANDOFF_MS : HOVER_MS}ms ${
                      inHandoff ? HANDOFF_EASE : HOVER_EASE
                    }`
                  : 'none',
              }}
            >
              {swatch.level}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PrimarySection({
  seedHex,
  isDarkMode,
  onCopied,
  animate,
  freezeMarker,
}) {
  const primary = useMemo(() => {
    const { colors } = generateHarmony(seedHex, 'complementary');
    return colors.find((c) => c.isSeed);
  }, [seedHex]);
  const sectionTitle = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';

  if (!primary) return null;

  return (
    <section className="space-y-3" aria-labelledby="harmony-primary-heading">
      <div>
        <h4 id="harmony-primary-heading" className={`${TYPE.titleSm} ${sectionTitle}`}>
          Primary
        </h4>
        <p className={`mt-0.5 text-[11px] leading-snug ${muted}`}>
          Seed color — complementary, analogous, and triadic pairs derive from this hue.
        </p>
      </div>
      <HarmonyScaleRow
        color={primary}
        onCopied={onCopied}
        animate={animate}
        freezeMarker={freezeMarker}
      />
    </section>
  );
}

function HarmonySection({
  mode,
  seedHex,
  isDarkMode,
  onCopied,
  animate,
  freezeMarker,
}) {
  const harmony = useMemo(() => generateHarmony(seedHex, mode), [seedHex, mode]);
  const meta = HARMONY_MODE_META[mode];
  const sectionTitle = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const divider = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <section
      className={`space-y-3 border-t pt-4 ${divider}`}
      aria-labelledby={`harmony-${mode}-heading`}
    >
      <div>
        <h4
          id={`harmony-${mode}-heading`}
          className={`${TYPE.titleSm} ${sectionTitle}`}
        >
          {meta.label}
        </h4>
        <p className={`mt-0.5 text-[11px] leading-snug ${muted}`}>{meta.blurb}</p>
      </div>
      <div className="space-y-1" role="list" aria-label={`${meta.label} palettes`}>
        {harmony.colors
          .filter((color) => !color.isSeed)
          .map((color) => (
            <div key={`${mode}-${color.id}`} role="listitem">
              <HarmonyScaleRow
                color={color}
                onCopied={onCopied}
                animate={animate}
                freezeMarker={freezeMarker}
              />
            </div>
          ))}
      </div>
    </section>
  );
}

/**
 * Material-style complementary / analogous / triadic palettes.
 * Collapsible card — all three harmony types shown at once.
 */
export function ColorHarmonyCard({
  seedHex,
  isDarkMode,
  title = 'Color Harmony',
  description = null,
  defaultOpen = true,
  collapsible = true,
  animate = true,
  freezeMarker = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copiedHex, setCopiedHex] = useState(null);

  const handleCopied = (hex) => {
    setCopiedHex(hex.toUpperCase());
    window.setTimeout(() => setCopiedHex(null), 1600);
  };

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-600'
    : 'bg-white border-slate-300';
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';

  return (
    <article className={`${APP_GRID_CARD} relative min-w-0 overflow-hidden ${surface}`}>
      {copiedHex ? (
        <div
          role="status"
          className={`pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-xl px-3 py-2 text-center text-xs font-semibold shadow-[0_8px_24px_rgb(0,0,0,0.18)] ${
            isDarkMode
              ? 'bg-slate-800 text-slate-100 ring-1 ring-slate-600'
              : 'bg-slate-900 text-white'
          }`}
        >
          Copied to clipboard
          <span className="mt-0.5 block font-mono text-[10px] font-medium opacity-80">
            {copiedHex}
          </span>
        </div>
      ) : null}

      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          onClick={() => setOpen((v) => !v)}
          className={`edu-control absolute top-2 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-colors sm:top-2.5 sm:right-3 ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.25}
            className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      ) : null}

      <div
        className={`px-4 py-3 sm:px-5 ${collapsible ? 'pr-12 sm:pr-14' : ''} ${
          open ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}` : ''
        }`}
      >
        <h3 className={`${TYPE.titleSm} ${titleColor}`}>{title}</h3>
        {description ? (
          <p className={`mt-1 text-xs ${muted}`}>{description}</p>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-4 p-3 sm:p-4">
          <PrimarySection
            seedHex={seedHex}
            isDarkMode={isDarkMode}
            onCopied={handleCopied}
            animate={animate}
            freezeMarker={freezeMarker}
          />

          {HARMONY_MODES.map((mode) => (
            <HarmonySection
              key={mode}
              mode={mode}
              seedHex={seedHex}
              isDarkMode={isDarkMode}
              onCopied={handleCopied}
              animate={animate}
              freezeMarker={freezeMarker}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
