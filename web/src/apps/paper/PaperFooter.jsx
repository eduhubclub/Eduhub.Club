import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Download,
  Printer,
  RectangleHorizontal,
  RectangleVertical,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { APP_SHELL_FOOTER_CHROME } from '../../shared/layout';
import { FitPopout } from '../../shared/usePopoutFit';
import { TYPE } from '../../shared/typography';
import { PaperTypeThumb } from './PaperTypeThumb';
import {
  PAPER_TYPES,
  PAPER_INK_PALETTE,
  NOTEBOOK_INK,
  TRACING_INK_COLOR,
  DEFAULT_SPACING_IN,
  DEFAULT_INK_COLOR,
  STORY_BOX_SIZES,
  SPACING_SNAPS_IN,
  SPACING_SNAP_LABELS,
  MARGIN_SNAPS_IN,
  MARGIN_SNAP_LABELS,
  STROKE_SNAPS_PT,
  STROKE_SNAP_LABELS,
  ensurePrintSafeInk,
  defaultInkForType,
  inkFor,
  labelForSnap,
  normalizeStoryBox,
  snapToStops,
} from '../../data/paper/paperModel';

function InkDot({ hex, className = '' }) {
  return (
    <span
      className={`block ${className}`}
      style={{ backgroundColor: hex || DEFAULT_INK_COLOR }}
      aria-hidden
    />
  );
}

/** Classic lined: blue rules | red margin. */
function InkNotebook({ className = '' }) {
  return (
    <span className={`relative block overflow-hidden ${className}`} aria-hidden>
      <span
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ backgroundColor: NOTEBOOK_INK.rule }}
      />
      <span
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ backgroundColor: NOTEBOOK_INK.margin }}
      />
    </span>
  );
}

function inkSwatchRing(on, isDarkMode) {
  if (!on) return '';
  return `ring-2 ring-offset-2 ${
    isDarkMode
      ? 'ring-white ring-offset-slate-900'
      : 'ring-slate-700 ring-offset-white'
  }`;
}

const SLIDER_THUMB_PX = 14;

function sliderLeft(min, max, value) {
  const span = max - min;
  const t = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span));
  return `calc(${SLIDER_THUMB_PX / 2}px + (100% - ${SLIDER_THUMB_PX}px) * ${t})`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  theme,
  stops = [],
  radius = 0,
}) {
  const groove = theme.isDarkMode ? 'bg-slate-700' : 'bg-slate-200';
  const tickOff = theme.isDarkMode ? 'bg-slate-400' : 'bg-slate-600';
  return (
    <label className="min-w-0 flex-1 space-y-1">
      <span className={`flex justify-between ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
        <span>{label}</span>
        <span className="tabular-nums">{display}</span>
      </span>
      <span className="relative block h-5 overflow-visible">
        <span
          className={`pointer-events-none absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full ${groove}`}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full ${theme.colorPrimary}`}
          style={{ width: sliderLeft(min, max, value) }}
          aria-hidden
        />
        {stops.map((stop) => (
          <span
            key={stop}
            className={`pointer-events-none absolute top-1/2 z-[1] h-4 w-px -translate-x-1/2 -translate-y-1/2 ${
              stop <= value ? 'bg-white/80' : tickOff
            }`}
            style={{ left: sliderLeft(min, max, stop) }}
            aria-hidden
          />
        ))}
        <span
          className={`pointer-events-none absolute top-1/2 z-[2] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm ${theme.colorPrimary} ${
            theme.isDarkMode ? 'ring-2 ring-slate-900' : 'ring-2 ring-white'
          }`}
          style={{ left: sliderLeft(min, max, value) }}
          aria-hidden
        />
        <input
          type="range"
          className="edu-control absolute inset-0 z-[3] h-full w-full cursor-pointer opacity-0"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => {
            const raw = Number(e.target.value);
            onChange(stops.length ? snapToStops(raw, stops, radius) : raw);
          }}
        />
      </span>
    </label>
  );
}

/** Relative frame sizes for Story picture box toggle. */
function StoryBoxIcon({ size }) {
  const scale = size === 'big' ? 1 : size === 'medium' ? 0.72 : 0.48;
  const w = 14 * scale;
  const h = 11 * scale;
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden className="shrink-0">
      <rect
        x={(16 - w) / 2}
        y={(14 - h) / 2}
        width={w}
        height={h}
        rx="1.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StoryBoxToggle({ theme, value, onChange }) {
  const current = normalizeStoryBox(value);
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <span className={`flex justify-between ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
        <span>Picture</span>
        <span className="tabular-nums">
          {STORY_BOX_SIZES.find((s) => s.id === current)?.label ?? 'Medium'}
        </span>
      </span>
      <div
        className={`flex h-5 items-center rounded-full border-[1.5px] p-0.5 ${theme.colorOutline}`}
        role="group"
        aria-label="Picture size"
      >
        {STORY_BOX_SIZES.map(({ id, label }) => {
          const on = current === id;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={`Picture ${label}`}
              aria-pressed={on}
              className={`edu-control inline-flex h-full min-w-0 flex-1 items-center justify-center rounded-full ${
                on
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : theme.colorOnSurfaceVariant
              }`}
              onClick={() => onChange(id)}
            >
              <StoryBoxIcon size={id} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizeSliders({ theme, settings, patch }) {
  const isStory = settings.type === 'story';
  const spacingLabel =
    labelForSnap(settings.spacingIn, SPACING_SNAP_LABELS) ||
    `${settings.spacingIn.toFixed(2)} in`;
  const marginLabel =
    labelForSnap(settings.marginIn, MARGIN_SNAP_LABELS) ||
    `${settings.marginIn.toFixed(2)} in`;
  const strokeLabel =
    labelForSnap(settings.strokePt, STROKE_SNAP_LABELS) ||
    `${settings.strokePt.toFixed(1)} pt`;
  return (
    <div className={`grid gap-3 px-1 ${isStory ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {isStory ? (
        <StoryBoxToggle
          theme={theme}
          value={settings.storyBox}
          onChange={(storyBox) => patch({ storyBox })}
        />
      ) : null}
      <Slider
        theme={theme}
        label="Spacing"
        min={0.1}
        max={1}
        step={0.01}
        value={settings.spacingIn}
        display={spacingLabel}
        stops={SPACING_SNAPS_IN}
        radius={0.02}
        onChange={(spacingIn) => patch({ spacingIn })}
      />
      <Slider
        theme={theme}
        label="Margins"
        min={0.25}
        max={1.4}
        step={0.05}
        value={settings.marginIn}
        display={marginLabel}
        stops={MARGIN_SNAPS_IN}
        radius={0.06}
        onChange={(marginIn) => patch({ marginIn })}
      />
      <Slider
        theme={theme}
        label="Stroke"
        min={0.4}
        max={2.4}
        step={0.05}
        value={settings.strokePt}
        display={strokeLabel}
        stops={STROKE_SNAPS_PT}
        radius={0.08}
        onChange={(strokePt) => patch({ strokePt })}
      />
    </div>
  );
}

/**
 * Bottom controls for paper type, spacing, print, and PDF.
 */
export function PaperFooter({
  theme,
  settings,
  onChange,
  onPrint,
  onPdf,
  onSave,
}) {
  const patch = (partial) => onChange({ ...settings, ...partial });
  const [typeOpen, setTypeOpen] = useState(false);
  const [inkOpen, setInkOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [typePos, setTypePos] = useState({ left: 0, bottom: 0 });
  const typeTriggerRef = useRef(null);
  const typePanelRef = useRef(null);
  const typeLabel = PAPER_TYPES.find((t) => t.id === settings.type)?.label || 'Paper';
  const inkColors = inkFor(settings);

  useLayoutEffect(() => {
    if (!typeOpen) return undefined;
    const place = () => {
      const btn = typeTriggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setTypePos({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [typeOpen]);

  useEffect(() => {
    if (!typeOpen) return undefined;
    const onPointer = (event) => {
      const inTrigger = typeTriggerRef.current?.contains(event.target);
      const inPanel = typePanelRef.current?.contains(event.target);
      if (!inTrigger && !inPanel) setTypeOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setTypeOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [typeOpen]);

  return (
    <div className="@container relative z-[120] flex flex-col overflow-visible">
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          inkOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!inkOpen}
      >
        <div
          className={`${APP_SHELL_FOOTER_CHROME} ${theme.colorSurface} ${theme.colorOutline}`}
          role="toolbar"
          aria-label="Ink color"
        >
          <div className="flex w-full min-h-12 items-center justify-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {settings.type === 'lined' ? (
                <button
                  type="button"
                  className={`edu-control relative h-8 w-8 shrink-0 overflow-hidden rounded-full ${inkSwatchRing(
                    settings.inkColor.toLowerCase() === NOTEBOOK_INK.rule.toLowerCase(),
                    theme.isDarkMode,
                  )}`}
                  aria-label={NOTEBOOK_INK.label}
                  aria-pressed={
                    settings.inkColor.toLowerCase() === NOTEBOOK_INK.rule.toLowerCase()
                  }
                  title={NOTEBOOK_INK.label}
                  onClick={() => patch({ inkColor: NOTEBOOK_INK.rule })}
                >
                  <InkNotebook className="h-full w-full" />
                </button>
              ) : null}
              {PAPER_INK_PALETTE.map((hex) => {
                const on = settings.inkColor.toLowerCase() === hex.toLowerCase();
                const tracing = hex.toLowerCase() === TRACING_INK_COLOR.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    className={`edu-control relative h-8 w-8 shrink-0 overflow-hidden rounded-full ${
                      tracing ? `border-[1.5px] ${theme.colorOutline}` : ''
                    } ${inkSwatchRing(on, theme.isDarkMode)}`}
                    aria-label={tracing ? 'Tracing gray' : `Ink ${hex}`}
                    aria-pressed={on}
                    title={tracing ? 'Tracing gray' : hex}
                    onClick={() => patch({ inkColor: hex })}
                  >
                    <InkDot hex={hex} className="h-full w-full" />
                  </button>
                );
              })}
              <label
                className={`edu-control relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-[1.5px] ${theme.colorOutline}`}
                title="Custom ink"
              >
                <span className="sr-only">Custom ink color</span>
                <input
                  type="color"
                  value={
                    settings.inkColor === NOTEBOOK_INK.rule
                      ? NOTEBOOK_INK.rule
                      : settings.inkColor || DEFAULT_INK_COLOR
                  }
                  onChange={(e) =>
                    patch({ inkColor: ensurePrintSafeInk(e.target.value) })
                  }
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <InkDot
                  hex={settings.inkColor || DEFAULT_INK_COLOR}
                  className="h-full w-full"
                />
              </label>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          sizeOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!sizeOpen}
      >
        <div
          className={`${APP_SHELL_FOOTER_CHROME} ${theme.colorSurface} ${theme.colorOutline}`}
          role="toolbar"
          aria-label="Spacing, margins, and stroke"
        >
          <SizeSliders theme={theme} settings={settings} patch={patch} />
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          instructionsOpen ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!instructionsOpen}
      >
        <div
          className={`${APP_SHELL_FOOTER_CHROME} ${theme.colorSurface} ${theme.colorOutline}`}
          role="toolbar"
          aria-label="Instructions"
        >
          <label className="block min-w-0 flex-1 px-1">
            <span className={`sr-only`}>Instructions for students</span>
            <textarea
              className={`edu-control mt-0 w-full resize-none rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              rows={3}
              maxLength={400}
              value={settings.instructions || ''}
              placeholder="Write directions for students…"
              onChange={(e) => patch({ instructions: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div
        className={`${APP_SHELL_FOOTER_CHROME} overflow-visible ${theme.colorSurface} ${theme.colorOutline}`}
        role="toolbar"
        aria-label="Paper tools"
      >
      <div className="flex w-full min-h-12 items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative shrink-0">
          <button
            ref={typeTriggerRef}
            type="button"
            className={`edu-control flex min-w-[8.5rem] items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-2 text-left ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            aria-haspopup="listbox"
            aria-expanded={typeOpen}
            aria-label="Paper type"
            onClick={() => setTypeOpen((v) => !v)}
          >
            <span className={`min-w-0 flex-1 truncate ${TYPE.labelMd}`}>{typeLabel}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform ${typeOpen ? 'rotate-180' : ''} ${theme.colorOnSurfaceVariant}`}
            />
          </button>
          {typeOpen
            ? createPortal(
                <FitPopout
                  ref={typePanelRef}
                  open={typeOpen}
                  style={{ left: typePos.left, bottom: typePos.bottom }}
                  className={`fixed z-[300] max-h-72 min-w-[14rem] overflow-y-auto rounded-xl border-[1.5px] py-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
                  role="listbox"
                  aria-label="Paper type"
                >
                  {PAPER_TYPES.map((t) => {
                    const on = settings.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="option"
                        aria-selected={on}
                        className={`edu-control flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left ${
                          theme.isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          patch({
                            type: t.id,
                            spacingIn: DEFAULT_SPACING_IN[t.id],
                            inkColor: defaultInkForType(t.id),
                            ...(t.id === 'story' ? { storyBox: 'medium' } : {}),
                          });
                          setTypeOpen(false);
                        }}
                      >
                        <PaperTypeThumb type={t.id} selected={on} isDarkMode={theme.isDarkMode} />
                        <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </FitPopout>,
                document.body,
              )
            : null}
        </div>
        <div className={`flex rounded-full border-[1.5px] p-0.5 ${theme.colorOutline}`}>
          {['portrait', 'landscape'].map((id) => {
            const on = settings.orientation === id;
            const label = id === 'portrait' ? 'Vertical' : 'Horizontal';
            const Icon = id === 'portrait' ? RectangleVertical : RectangleHorizontal;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                className={`edu-control inline-flex items-center rounded-full px-2 py-1.5 @[40rem]:px-3 ${TYPE.labelMd} ${
                  on
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                    : theme.colorOnSurfaceVariant
                }`}
                onClick={() => patch({ orientation: id })}
              >
                <Icon size={16} className="@[40rem]:hidden" strokeWidth={on ? 2.5 : 2} />
                <span className="hidden @[40rem]:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2 py-1.5 @[40rem]:px-3 ${TYPE.labelMd} ${
            inkOpen
              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
              : `${theme.colorOutline} ${theme.colorOnSurface}`
          }`}
          aria-pressed={inkOpen}
          aria-expanded={inkOpen}
          aria-label="Ink"
          onClick={() => {
            setInkOpen((v) => !v);
            setSizeOpen(false);
            setInstructionsOpen(false);
          }}
        >
          <span className="h-4 w-4 shrink-0 overflow-hidden rounded-full">
            {settings.inkColor.toLowerCase() === NOTEBOOK_INK.rule.toLowerCase() ? (
              <InkNotebook className="h-full w-full" />
            ) : (
              <InkDot hex={inkColors.rule} className="h-full w-full" />
            )}
          </span>
          <span className="hidden @[40rem]:inline">Ink</span>
        </button>

        <button
          type="button"
          className={`edu-control inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-2 py-1.5 ${TYPE.labelMd} ${
            sizeOpen
              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
              : `${theme.colorOutline} ${theme.colorOnSurface}`
          }`}
          aria-pressed={sizeOpen}
          aria-expanded={sizeOpen}
          aria-label="Size"
          onClick={() => {
            setSizeOpen((v) => !v);
            setInkOpen(false);
            setInstructionsOpen(false);
          }}
        >
          <SlidersHorizontal size={16} strokeWidth={sizeOpen ? 2.5 : 2} />
          <span className="hidden @[40rem]:inline">Size</span>
        </button>

        <button
          type="button"
          className={`edu-control shrink-0 rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
            settings.header
              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
              : `${theme.colorOutline} ${theme.colorOnSurface}`
          }`}
          onClick={() => patch({ header: !settings.header })}
        >
          Name line
        </button>

        <button
          type="button"
          className={`edu-control shrink-0 rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
            settings.instructionsEnabled || instructionsOpen
              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
              : `${theme.colorOutline} ${theme.colorOnSurface}`
          }`}
          aria-pressed={settings.instructionsEnabled}
          aria-expanded={instructionsOpen}
          onClick={() => {
            const enabling = !settings.instructionsEnabled;
            if (enabling) {
              patch({ instructionsEnabled: true });
              setInstructionsOpen(true);
              setInkOpen(false);
              setSizeOpen(false);
            } else if (instructionsOpen) {
              patch({ instructionsEnabled: false });
              setInstructionsOpen(false);
            } else {
              setInstructionsOpen(true);
              setInkOpen(false);
              setSizeOpen(false);
            }
          }}
        >
          Instructions
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2 @[40rem]:px-3 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
          aria-label="Save"
          title="Save"
          onClick={onSave}
        >
          <Save size={16} />
          <span className="hidden @[40rem]:inline">Save</span>
        </button>
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2 @[40rem]:px-3 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
          aria-label="PDF"
          title="PDF"
          onClick={onPdf}
        >
          <Download size={16} />
          <span className="hidden @[40rem]:inline">PDF</span>
        </button>
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-2 @[40rem]:px-3 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
          aria-label="Print"
          title="Print"
          onClick={onPrint}
        >
          <Printer size={16} />
          <span className="hidden @[40rem]:inline">Print</span>
        </button>
        </div>
      </div>
      </div>
    </div>
  );
}
