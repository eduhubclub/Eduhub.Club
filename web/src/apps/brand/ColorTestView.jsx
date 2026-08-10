import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Dices,
  Eye,
  Info,
  Moon,
  Pipette,
  Plus,
  Sparkles,
  Sun,
  Type,
} from 'lucide-react';
import { APP_GRID_CARD, APP_SHELL_FOOTER_CHROME } from '../../shared/layout';
import { Modal } from '../../shared/Modal';
import { PRIMARY_KEYS, PRIMARY_SOLID_HEX } from '../../shared/theme';
import { TYPE } from '../../shared/typography';
import { FitPopout } from '../../shared/usePopoutFit';
import {
  exportScaleCss,
  exportScaleTailwind,
  generateScale,
  hexToHsl,
  hslToHex,
  normalizeHex,
  randomSeedHex,
} from './colorScaleGenerator';
import { colorThemeRolesFromScale } from './colorThemeRoles';
import {
  DEFAULT_SECONDARY_STRATEGY,
} from './colorThemeFamilies';
import { ColorThemeRolesCard } from './ColorThemeRolesCard';
import { ColorHarmonyCard } from './ColorHarmonyCard';

// Preview cards live in ColorTestExamples.jsx — parked unused until we reinstate bit by bit.

const EMPTY_ADJ = { hue: 0, saturation: 0, temperature: 0 };
/** Commit palette work after the thumb pauses; flush immediately on release. */
const ADJ_PAUSE_MS = 140;

/**
 * Example actions — content-sized (Material / HIG):
 * 44px min touch (h-11), 24px side padding (px-6), hug label, cap 280px.
 * Press: active:scale-95 (same as ModalPrimaryButton / FABs).
 * Shape: M3 uses full round; Edu.Hub boards often use rounded-xl.
 */
const EXAMPLE_BTN =
  'edu-control inline-flex h-11 max-w-[17.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl px-6 text-sm font-semibold transition-all hover:opacity-90 active:scale-95';
const EXAMPLE_BTN_M3 =
  'edu-control inline-flex h-11 max-w-[17.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-semibold transition-all hover:opacity-90 active:scale-95';
const EXAMPLE_BTN_TEXT =
  'edu-control inline-flex h-11 max-w-[17.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95';
const EXAMPLE_BTN_TEXT_M3 =
  'edu-control inline-flex h-11 max-w-[17.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-all hover:opacity-80 active:scale-95';
const EXAMPLE_ACTIONS =
  'mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:justify-end';
const EXAMPLE_BTN_ROW =
  'flex flex-wrap items-center justify-center gap-2.5 sm:justify-start';
const EXAMPLE_BTN_ELEVATION =
  'shadow-[0_1px_2px_rgb(0,0,0,0.12),0_4px_12px_rgb(0,0,0,0.14)]';

/**
 * Material 3 button set → Edu.Hub tokens.
 * @see https://m3.material.io/components/buttons/guidelines
 *
 * Filled     → Primary / On Primary
 * Tonal      → Accent Container (soft tint; M3’s secondary-container role)
 * Elevated   → same as Tonal + elevation
 * Outlined   → Outline rim + On Primary Container ink
 * Text       → Primary ink, no fill
 * Error      → Edu.Hub extension (destructive)
 */
function exampleButtonVariants(tokens) {
  return [
    {
      id: 'filled',
      label: 'Filled',
      Icon: Check,
      kind: 'filled',
      style: {
        backgroundColor: tokens.colorPrimary.hex,
        color: tokens.colorOnPrimary.hex,
      },
    },
    {
      id: 'tonal',
      label: 'Tonal',
      Icon: Sparkles,
      kind: 'filled',
      style: {
        backgroundColor: tokens.colorAccentContainer.hex,
        color: tokens.colorOnAccentContainer.hex,
      },
    },
    {
      id: 'elevated',
      label: 'Elevated',
      Icon: ArrowRight,
      kind: 'filled',
      elevated: true,
      style: {
        backgroundColor: tokens.colorAccentContainer.hex,
        color: tokens.colorOnAccentContainer.hex,
      },
    },
    {
      id: 'outlined',
      label: 'Outlined',
      Icon: Plus,
      kind: 'filled',
      outline: true,
      style: {
        backgroundColor: 'transparent',
        borderColor: tokens.colorOutline.hex,
        color: tokens.colorOnPrimaryContainer.hex,
      },
    },
    {
      id: 'text',
      label: 'Text',
      Icon: Type,
      kind: 'text',
      style: {
        backgroundColor: 'transparent',
        color: tokens.colorPrimary.hex,
      },
    },
    {
      id: 'error',
      label: 'Error',
      Icon: AlertTriangle,
      kind: 'filled',
      style: {
        backgroundColor: tokens.colorError.hex,
        color: tokens.colorOnError.hex,
      },
    },
  ];
}

function ExampleButtonRow({
  tokens,
  /** M3 default shape (full round) vs Edu.Hub board shape (rounded-xl). */
  shape = 'edu',
  withIcons = false,
}) {
  const m3 = shape === 'm3';
  const filled = m3 ? EXAMPLE_BTN_M3 : EXAMPLE_BTN;
  const text = m3 ? EXAMPLE_BTN_TEXT_M3 : EXAMPLE_BTN_TEXT;
  return (
    <div className={EXAMPLE_BTN_ROW}>
      {exampleButtonVariants(tokens).map((btn) => {
        const base = btn.kind === 'text' ? text : filled;
        const className = [
          base,
          btn.outline ? 'border-[1.5px]' : '',
          btn.elevated ? EXAMPLE_BTN_ELEVATION : '',
        ]
          .filter(Boolean)
          .join(' ');
        const Icon = btn.Icon;
        return (
          <button
            key={btn.id}
            type="button"
            className={className}
            style={btn.style}
          >
            {withIcons && Icon ? (
              <Icon size={16} strokeWidth={2.5} aria-hidden />
            ) : null}
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

function SliderRow({
  label,
  min,
  max,
  value,
  onChange,
  onCommit,
  suffix = '',
  dark,
}) {
  return (
    <label className="block">
      <div
        className={`mb-0.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide ${
          dark ? 'text-stone-400' : 'text-slate-500'
        }`}
      >
        <span>{label}</span>
        <span
          className={`font-mono normal-case tracking-normal ${
            dark ? 'text-stone-200' : 'text-slate-700'
          }`}
        >
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit || undefined}
        onPointerCancel={onCommit || undefined}
        onKeyUp={onCommit || undefined}
        onBlur={onCommit || undefined}
        className="edu-control h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
      />
    </label>
  );
}

function PopoutInfoButton({ dark, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`edu-control inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
        dark
          ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
      }`}
      aria-label={label}
      title={label}
    >
      <Info size={15} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

const SLIDER_HELP = {
  hsl: {
    title: 'HSL',
    intro:
      'Sets the seed color. Changing any slider rewrites the seed and resets Adjust.',
    items: [
      {
        label: 'Hue',
        body: 'Position on the color wheel (0–360°).',
      },
      {
        label: 'Saturation',
        body: 'How vivid the seed is — gray at 0% to full color at 100%.',
      },
      {
        label: 'Lightness',
        body: 'How light or dark the seed appears (roughly white ↔ black).',
      },
    ],
  },
  adjust: {
    title: 'Adjust',
    intro:
      'Fine-tunes the generated scale without replacing the seed. Tone stays put, so the Primary marker keeps its scale step.',
    items: [
      {
        label: 'Hue shift',
        body: 'Rotates hue across the scale (±180°) while keeping the same seed source.',
      },
      {
        label: 'Saturation',
        body: 'Boosts or softens chroma (vividness) on the HCT scale — not the same as HSL Saturation.',
      },
      {
        label: 'Temperature',
        body: 'Nudges toward warm (amber) or cool (cyan).',
      },
    ],
  },
};

/**
 * HubBrand Color Test — palette playground with a whiteboard-style shell footer.
 * Workshop for the theme system (roles, harmony, examples → app handoff).
 * HubBrand Color stays the interim spot palette until decisions land there.
 * Embedded (AppGuide) keeps a local footer; HubBrand portals into #edu-main-footer.
 */
export function ColorTestView({
  isDarkMode,
  onDarkModeChange,
  theme,
  embedded = false,
  onShellFooterActiveChange,
}) {
  const [seed, setSeed] = useState(PRIMARY_SOLID_HEX.Blue);
  const [hexDraft, setHexDraft] = useState(PRIMARY_SOLID_HEX.Blue);
  /** Live adjust — colors update immediately while scrubbing. */
  const [adj, setAdj] = useState(EMPTY_ADJ);
  const adjPauseTimerRef = useRef(null);
  /** True while dragging; morph animations only run after pause / release. */
  const [adjScrubbing, setAdjScrubbing] = useState(false);
  /** Embedded fallback when shell dark-mode control isn’t wired. */
  const [localDark, setLocalDark] = useState(Boolean(isDarkMode));
  const [copied, setCopied] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [primariesOpen, setPrimariesOpen] = useState(false);
  /** null | 'hsl' | 'adjust' — slider help modal from popout info icon */
  const [sliderHelp, setSliderHelp] = useState(null);
  const [secondaryStrategy, setSecondaryStrategy] = useState(
    DEFAULT_SECONDARY_STRATEGY,
  );
  const [mainFooterSlot, setMainFooterSlot] = useState(null);
  const [primariesLeft, setPrimariesLeft] = useState('50%');
  const dockRef = useRef(null);
  const primaryChipRef = useRef(null);

  const canControlShell = typeof onDarkModeChange === 'function';
  /** One dark mode — shell + Color Test stay in sync when wired. */
  const previewModeDark = canControlShell ? Boolean(isDarkMode) : localDark;

  useEffect(() => {
    if (!canControlShell) setLocalDark(Boolean(isDarkMode));
  }, [isDarkMode, canControlShell]);

  const setPreviewDark = (dark) => {
    if (canControlShell) onDarkModeChange(Boolean(dark));
    else setLocalDark(Boolean(dark));
  };

  // Live scale so footer swatch, theme, and harmony share the same effective seed.
  const scale = useMemo(() => generateScale(seed, adj), [seed, adj]);
  /** Exact primary after Hue / Saturation / Temperature. */
  const adjustedSeed = useMemo(
    () => scale.find((s) => s.isSeed)?.hex ?? seed,
    [scale, seed],
  );
  const seedHsl = useMemo(
    () => hexToHsl(adjustedSeed) || { h: 0, s: 0, l: 0 },
    [adjustedSeed],
  );
  /** Shared playground theme — board + examples + future app handoff. */
  const themeRoles = useMemo(
    () =>
      colorThemeRolesFromScale(scale, previewModeDark, {
        secondaryStrategy,
      }),
    [scale, previewModeDark, secondaryStrategy],
  );
  const tokens = themeRoles.tokens;
  const useShellFooter = !embedded;

  useEffect(() => {
    setHexDraft(adjustedSeed);
  }, [adjustedSeed]);

  useEffect(() => {
    if (!useShellFooter || !onShellFooterActiveChange) return undefined;
    onShellFooterActiveChange(true);
    return () => onShellFooterActiveChange(false);
  }, [useShellFooter, onShellFooterActiveChange]);

  useLayoutEffect(() => {
    if (!useShellFooter) {
      setMainFooterSlot(null);
      return;
    }
    setMainFooterSlot(document.getElementById('edu-main-footer'));
  }, [useShellFooter]);

  useEffect(() => {
    if (!pickerOpen && !adjustOpen && !primariesOpen) return undefined;

    const closePopouts = () => {
      setPickerOpen(false);
      setAdjustOpen(false);
      setPrimariesOpen(false);
    };

    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        closePopouts();
        return;
      }
      // Keep open when interacting with the popout itself.
      if (target.closest('[data-color-test-popout]')) return;
      // Owning toggle chips handle open/close in their onClick.
      if (target.closest('[data-color-test-popout-toggle]')) return;
      // Help modal is portaled; don't dismiss the popout under it.
      if (target.closest('[aria-modal="true"]')) return;
      // Click-away or any other footer / page control closes.
      closePopouts();
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (sliderHelp) {
        setSliderHelp(null);
        return;
      }
      closePopouts();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen, adjustOpen, primariesOpen, sliderHelp]);

  // Anchor Primary popout above its chip; keep outside overflow-x so it isn't clipped.
  useLayoutEffect(() => {
    if (!primariesOpen || !dockRef.current || !primaryChipRef.current) {
      return undefined;
    }
    const place = () => {
      const dock = dockRef.current;
      const chip = primaryChipRef.current;
      if (!dock || !chip) return;
      const dockRect = dock.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      setPrimariesLeft(`${chipRect.left + chipRect.width / 2 - dockRect.left}px`);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [primariesOpen]);

  /** Commit a chosen color as the new seed and clear Adjust so Primary matches the pick. */
  const applySeed = (hex) => {
    const n = normalizeHex(hex);
    if (!n) return;
    setSeed(n);
    setHexDraft(n);
    window.clearTimeout(adjPauseTimerRef.current);
    setAdj(EMPTY_ADJ);
    setAdjScrubbing(false);
  };

  const endAdjScrub = () => {
    window.clearTimeout(adjPauseTimerRef.current);
    setAdjScrubbing(false);
  };

  const queueAdj = (patch) => {
    setAdj((a) => ({ ...a, ...patch }));
    setAdjScrubbing(true);
    window.clearTimeout(adjPauseTimerRef.current);
    adjPauseTimerRef.current = window.setTimeout(endAdjScrub, ADJ_PAUSE_MS);
  };

  const resetAdj = () => {
    window.clearTimeout(adjPauseTimerRef.current);
    setAdj(EMPTY_ADJ);
    setAdjScrubbing(false);
  };

  useEffect(
    () => () => {
      window.clearTimeout(adjPauseTimerRef.current);
    },
    [],
  );

  const commitHexDraft = () => {
    const n = normalizeHex(hexDraft);
    if (n) applySeed(n);
    else setHexDraft(adjustedSeed);
  };

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      /* ignore */
    }
  };

  const surface = theme?.colorSurface ?? (isDarkMode ? 'bg-slate-900' : 'bg-white');
  const outline = theme?.colorOutline ?? (isDarkMode ? 'border-slate-600' : 'border-slate-300');
  const muted = previewModeDark ? 'text-stone-400' : 'text-slate-500';
  const popoutSurface = isDarkMode
    ? 'bg-stone-900 border-stone-600'
    : 'bg-white border-stone-200';
  const idleChip = isDarkMode
    ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800';
  const chipClass = (active) =>
    `edu-control shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-2.5 rounded-xl text-xs font-semibold transition-colors ${
      active ? 'bg-rose-500 text-white' : idleChip
    }`;

  const footerBar = (
    <div
      ref={dockRef}
      className={`${APP_SHELL_FOOTER_CHROME} relative z-[120] overflow-visible ${surface} ${outline}`}
      role="toolbar"
      aria-label="Color test tools"
    >
      {pickerOpen ? (
        <FitPopout
          open
          centerX
          data-color-test-popout=""
          className={`absolute bottom-full left-1/2 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-[0_12px_40px_rgb(0,0,0,0.18)] ${popoutSurface}`}
          role="dialog"
          aria-label="HSL pickers"
        >
          <div className="flex justify-end">
            <PopoutInfoButton
              dark={isDarkMode}
              label="About HSL"
              onClick={() => setSliderHelp('hsl')}
            />
          </div>
          <div className="mt-1 space-y-2.5">
            <SliderRow
              label="Hue"
              min={0}
              max={360}
              value={Math.round(seedHsl.h)}
              onChange={(h) => applySeed(hslToHex(h, seedHsl.s, seedHsl.l))}
              suffix="°"
              dark={isDarkMode}
            />
            <SliderRow
              label="Saturation"
              min={0}
              max={100}
              value={Math.round(seedHsl.s)}
              onChange={(s) => applySeed(hslToHex(seedHsl.h, s, seedHsl.l))}
              suffix="%"
              dark={isDarkMode}
            />
            <SliderRow
              label="Lightness"
              min={8}
              max={92}
              value={Math.round(seedHsl.l)}
              onChange={(l) => applySeed(hslToHex(seedHsl.h, seedHsl.s, l))}
              suffix="%"
              dark={isDarkMode}
            />
          </div>
        </FitPopout>
      ) : null}

      {adjustOpen ? (
        <FitPopout
          open
          centerX
          data-color-test-popout=""
          className={`absolute bottom-full left-1/2 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-[0_12px_40px_rgb(0,0,0,0.18)] ${popoutSurface}`}
          role="dialog"
          aria-label="Scale adjust"
        >
          <div className="flex justify-end">
            <PopoutInfoButton
              dark={isDarkMode}
              label="About Adjust"
              onClick={() => setSliderHelp('adjust')}
            />
          </div>
          <div className="mt-1 space-y-2.5">
            <SliderRow
              label="Hue shift"
              min={-180}
              max={180}
              value={adj.hue}
              onChange={(hue) => queueAdj({ hue })}
              onCommit={endAdjScrub}
              suffix="°"
              dark={isDarkMode}
            />
            <SliderRow
              label="Saturation"
              min={-100}
              max={100}
              value={adj.saturation}
              onChange={(saturation) => queueAdj({ saturation })}
              onCommit={endAdjScrub}
              dark={isDarkMode}
            />
            <SliderRow
              label="Temperature"
              min={-100}
              max={100}
              value={adj.temperature}
              onChange={(temperature) => queueAdj({ temperature })}
              onCommit={endAdjScrub}
              dark={isDarkMode}
            />
            {adj.hue !== 0 || adj.saturation !== 0 || adj.temperature !== 0 ? (
              <button
                type="button"
                className={`edu-control text-[11px] font-semibold underline ${muted}`}
                onClick={resetAdj}
              >
                Reset adjust
              </button>
            ) : null}
          </div>
        </FitPopout>
      ) : null}

      {primariesOpen ? (
        <FitPopout
          open
          centerX
          data-color-test-popout=""
          className={`absolute bottom-full mb-2 rounded-2xl border p-2.5 shadow-[0_12px_40px_rgb(0,0,0,0.18)] ${popoutSurface}`}
          style={{ left: primariesLeft }}
          role="dialog"
          aria-label="Brand colors"
        >
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-row sm:items-center">
            {PRIMARY_KEYS.map((key) => {
              const hex = PRIMARY_SOLID_HEX[key];
              const selected =
                normalizeHex(seed) === normalizeHex(hex) &&
                adj.hue === 0 &&
                adj.saturation === 0 &&
                adj.temperature === 0;
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  aria-label={`${key} primary`}
                  aria-pressed={selected}
                  onClick={() => {
                    applySeed(hex);
                    setPrimariesOpen(false);
                  }}
                  className={`edu-control h-9 w-9 rounded-full transition-transform ${
                    selected
                      ? isDarkMode
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-stone-900 scale-105'
                        : 'ring-2 ring-slate-800 ring-offset-1 ring-offset-white scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </FitPopout>
      ) : null}

      <div
        className={`flex w-full min-h-12 items-center justify-center gap-1.5 px-1 ${
          primariesOpen || pickerOpen || adjustOpen
            ? 'overflow-visible'
            : 'overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }`}
      >
        {/* Light / dark preview — pill + sun/moon, Sidebar-matched tones */}
        <div
          className={`inline-flex shrink-0 rounded-full border p-0.5 ${
            isDarkMode ? 'border-slate-600' : 'border-slate-300'
          }`}
        >
          <button
            type="button"
            title="Light mode"
            aria-label="Light mode"
            aria-pressed={!previewModeDark}
            onClick={() => setPreviewDark(false)}
            className={`edu-control flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              !previewModeDark
                ? isDarkMode
                  ? 'bg-slate-800 text-amber-400'
                  : 'bg-slate-900 text-white'
                : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sun size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            title="Dark mode"
            aria-label="Dark mode"
            aria-pressed={previewModeDark}
            onClick={() => setPreviewDark(true)}
            className={`edu-control flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              previewModeDark
                ? 'bg-slate-800 text-amber-400'
                : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Moon size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div
          className={`mx-0.5 h-8 w-px shrink-0 ${
            isDarkMode ? 'bg-stone-700' : 'bg-stone-200'
          }`}
        />

        {/* Primaries — popout rendered above the scroll row */}
        <button
          ref={primaryChipRef}
          type="button"
          data-color-test-popout-toggle=""
          onClick={() => {
            setPrimariesOpen((o) => !o);
            setPickerOpen(false);
            setAdjustOpen(false);
          }}
          aria-pressed={primariesOpen}
          aria-label="Brand colors"
          className={chipClass(primariesOpen)}
        >
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 transition-[background-color] duration-200 ease-out"
            style={{ backgroundColor: adjustedSeed }}
            aria-hidden
          />
          Brand Colors
        </button>

        <div
          className={`mx-0.5 h-8 w-px shrink-0 ${
            isDarkMode ? 'bg-stone-700' : 'bg-stone-200'
          }`}
        />

        {/* Color + hex */}
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-1.5 py-1 ${
            isDarkMode ? 'border-stone-600 bg-stone-950' : 'border-stone-200 bg-stone-50'
          }`}
        >
          <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-300 shadow-inner">
            <input
              type="color"
              value={adjustedSeed}
              onChange={(e) => applySeed(e.target.value)}
              className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
              aria-label="Pick seed color"
            />
          </label>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={commitHexDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHexDraft();
            }}
            spellCheck={false}
            className={`edu-control w-[5.5rem] rounded-lg border-0 bg-transparent px-1 py-1 font-mono text-xs uppercase outline-none ${
              isDarkMode ? 'text-stone-100' : 'text-slate-900'
            }`}
            aria-label="Hex color"
          />
          <button
            type="button"
            className={`edu-control rounded-lg p-1.5 ${idleChip}`}
            onClick={() => copyText('hex', adjustedSeed)}
            aria-label="Copy hex"
          >
            {copied === 'hex' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div
          className={`mx-0.5 h-8 w-px shrink-0 ${
            isDarkMode ? 'bg-stone-700' : 'bg-stone-200'
          }`}
        />

        <button
          type="button"
          data-color-test-popout-toggle=""
          onClick={() => {
            setPickerOpen((o) => !o);
            setAdjustOpen(false);
            setPrimariesOpen(false);
          }}
          aria-pressed={pickerOpen}
          className={chipClass(pickerOpen)}
        >
          <Pipette size={14} strokeWidth={2.5} />
          HSL
        </button>
        <button
          type="button"
          data-color-test-popout-toggle=""
          onClick={() => {
            setAdjustOpen((o) => !o);
            setPickerOpen(false);
            setPrimariesOpen(false);
          }}
          aria-pressed={adjustOpen}
          className={chipClass(adjustOpen)}
        >
          <Eye size={14} strokeWidth={2.5} />
          Adjust
        </button>

        <div
          className={`mx-0.5 h-8 w-px shrink-0 ${
            isDarkMode ? 'bg-stone-700' : 'bg-stone-200'
          }`}
        />

        <button
          type="button"
          onClick={() => {
            applySeed(randomSeedHex());
          }}
          className="edu-control shrink-0 inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white hover:opacity-90"
        >
          <Dices size={14} strokeWidth={2.5} />
          Generate
        </button>
        <button
          type="button"
          onClick={() => copyText('css', exportScaleCss('brand', scale))}
          className={chipClass(copied === 'css')}
        >
          {copied === 'css' ? 'Copied' : 'CSS'}
        </button>
        <button
          type="button"
          onClick={() => copyText('tw', exportScaleTailwind('brand', scale))}
          className={chipClass(copied === 'tw')}
        >
          {copied === 'tw' ? 'Copied' : 'TW'}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={
        embedded
          ? 'relative flex h-[min(36rem,70vh)] min-h-[22rem] w-full flex-col overflow-hidden'
          : 'relative flex h-full min-h-0 w-full flex-col overflow-hidden'
      }
    >
      {/* Preview stage */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pb-2">
        <h1
          className={`font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${
            previewModeDark ? 'text-stone-100' : 'text-stone-900'
          }`}
        >
          Edu.Hub Color Generator
        </h1>

        <div className="flex flex-col gap-4">
          <ColorThemeRolesCard
            themeRoles={themeRoles}
            isDarkMode={previewModeDark}
            theme={theme}
            description={null}
            secondaryStrategy={secondaryStrategy}
            onSecondaryStrategyChange={setSecondaryStrategy}
          />

          <ColorHarmonyCard
            seedHex={adjustedSeed}
            isDarkMode={previewModeDark}
            description={null}
            animate={!adjScrubbing}
            freezeMarker={adjScrubbing}
          />
        </div>

        <h2
          className={`font-serif text-2xl font-bold tracking-tight sm:text-3xl ${
            previewModeDark ? 'text-stone-100' : 'text-stone-900'
          }`}
        >
          Examples
        </h2>

        <section className="space-y-4">
          <h3
            className={`font-serif text-xl font-bold tracking-tight sm:text-2xl ${
              previewModeDark ? 'text-stone-100' : 'text-stone-900'
            }`}
          >
            Buttons
          </h3>

          <article
            className={`${APP_GRID_CARD} space-y-4 overflow-hidden p-5 transition-[background-color,border-color,color] duration-200`}
            style={{
              backgroundColor: tokens.colorPrimaryContainer.hex,
              borderColor: tokens.colorOutline.hex,
              color: tokens.colorOnPrimaryContainer.hex,
            }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: tokens.colorOnSurfaceVariant.hex }}
            >
              Material 3 set — Filled, Tonal, Elevated, Outlined, Text — plus Error
              for destructive actions. Tonal / Elevated use Accent Container.
            </p>
            <ExampleButtonRow tokens={tokens} shape="m3" />
            <ExampleButtonRow tokens={tokens} shape="edu" />
            <ExampleButtonRow tokens={tokens} shape="edu" withIcons />
          </article>
        </section>

        <section className="space-y-4">
          <h3
            className={`font-serif text-xl font-bold tracking-tight sm:text-2xl ${
              previewModeDark ? 'text-stone-100' : 'text-stone-900'
            }`}
          >
            Basic Cards
          </h3>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
          <article
            className={`${APP_GRID_CARD} max-w-sm overflow-hidden p-5 transition-[background-color,border-color,color] duration-200`}
            style={{
              backgroundColor: tokens.colorPrimaryContainer.hex,
              borderColor: tokens.colorOutline.hex,
              color: tokens.colorOnPrimaryContainer.hex,
            }}
          >
            <h4
              className={TYPE.titleSm}
              style={{ color: tokens.colorOnPrimaryContainer.hex }}
            >
              Class welcome
            </h4>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: tokens.colorOnSurfaceVariant.hex }}
            >
              Primary Container chrome — white / dark board with a primary action.
            </p>
            <div className={EXAMPLE_ACTIONS}>
              <button
                type="button"
                className={EXAMPLE_BTN}
                style={{
                  backgroundColor: tokens.colorPrimary.hex,
                  color: tokens.colorOnPrimary.hex,
                }}
              >
                Get started
              </button>
            </div>
          </article>

          <article
            className={`${APP_GRID_CARD} max-w-sm overflow-hidden p-5 transition-[background-color,border-color,color] duration-200`}
            style={{
              backgroundColor: tokens.colorPrimaryContainer.hex,
              borderColor: tokens.colorOutline.hex,
              color: tokens.colorOnPrimaryContainer.hex,
            }}
          >
            <h4
              className={TYPE.titleSm}
              style={{ color: tokens.colorOnPrimaryContainer.hex }}
            >
              Choose a path
            </h4>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: tokens.colorOnSurfaceVariant.hex }}
            >
              Primary for the main path; Accent Container for the soft secondary.
            </p>
            <div className={EXAMPLE_ACTIONS}>
              <button
                type="button"
                className={EXAMPLE_BTN}
                style={{
                  backgroundColor: tokens.colorAccentContainer.hex,
                  color: tokens.colorOnAccentContainer.hex,
                }}
              >
                Learn more
              </button>
              <button
                type="button"
                className={EXAMPLE_BTN}
                style={{
                  backgroundColor: tokens.colorPrimary.hex,
                  color: tokens.colorOnPrimary.hex,
                }}
              >
                Continue
              </button>
            </div>
          </article>

          <article
            className={`${APP_GRID_CARD} max-w-sm overflow-hidden p-5 transition-[background-color,border-color,color] duration-200`}
            style={{
              backgroundColor: tokens.colorPrimaryContainer.hex,
              borderColor: tokens.colorOutline.hex,
              color: tokens.colorOnPrimaryContainer.hex,
            }}
          >
            <h4
              className={TYPE.titleSm}
              style={{ color: tokens.colorOnPrimaryContainer.hex }}
            >
              Save & continue
            </h4>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: tokens.colorOnSurfaceVariant.hex }}
            >
              Filled primary for the commit; text-only for a quieter skip.
            </p>
            <div className={EXAMPLE_ACTIONS}>
              <button
                type="button"
                className={EXAMPLE_BTN_TEXT}
                style={{
                  backgroundColor: 'transparent',
                  color: tokens.colorPrimary.hex,
                }}
              >
                Skip for now
              </button>
              <button
                type="button"
                className={EXAMPLE_BTN}
                style={{
                  backgroundColor: tokens.colorPrimary.hex,
                  color: tokens.colorOnPrimary.hex,
                }}
              >
                Save
              </button>
            </div>
          </article>

          <article
            className={`${APP_GRID_CARD} max-w-sm overflow-hidden p-5 transition-[background-color,border-color,color] duration-200`}
            style={{
              backgroundColor: tokens.colorPrimaryContainer.hex,
              borderColor: tokens.colorOutline.hex,
              color: tokens.colorOnPrimaryContainer.hex,
            }}
          >
            <h4
              className={TYPE.titleSm}
              style={{ color: tokens.colorOnPrimaryContainer.hex }}
            >
              Confirm action
            </h4>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: tokens.colorOnSurfaceVariant.hex }}
            >
              Filled primary for the main action; outline for a secondary choice.
            </p>
            <div className={EXAMPLE_ACTIONS}>
              <button
                type="button"
                className={`${EXAMPLE_BTN} border-[1.5px]`}
                style={{
                  backgroundColor: 'transparent',
                  borderColor: tokens.colorOutline.hex,
                  color: tokens.colorOnPrimaryContainer.hex,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={EXAMPLE_BTN}
                style={{
                  backgroundColor: tokens.colorPrimary.hex,
                  color: tokens.colorOnPrimary.hex,
                }}
              >
                Confirm
              </button>
            </div>
          </article>
          </div>
        </section>
      </div>

      {embedded ? footerBar : null}
      {useShellFooter && mainFooterSlot
        ? createPortal(footerBar, mainFooterSlot)
        : null}

      <Modal
        isOpen={Boolean(sliderHelp)}
        title={sliderHelp ? SLIDER_HELP[sliderHelp].title : ''}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setSliderHelp(null)}
        maxWidth="max-w-md"
        zIndex="z-[220]"
      >
        {sliderHelp ? (
          <div className="space-y-4 px-6 py-5">
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
              {SLIDER_HELP[sliderHelp].intro}
            </p>
            <dl className="space-y-3">
              {SLIDER_HELP[sliderHelp].items.map((item) => (
                <div key={item.label}>
                  <dt className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                  >
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
