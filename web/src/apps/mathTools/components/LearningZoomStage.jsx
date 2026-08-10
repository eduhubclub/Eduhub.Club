import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronUp,
  Eraser,
  Highlighter,
  MousePointer2,
  Move,
  PenTool,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { APP_BOARD_CHROME, APP_SHELL_FOOTER_CHROME } from '../../../shared/layout';
import {
  ANNOTATE_PALETTE,
  BOARD_NEUTRAL_HEX,
  PRIMARY_SOLID_HEX,
} from '../../../shared/theme';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { LearningAnnotateLayer } from './LearningAnnotateLayer';

const needsSwatchBorder = (color) =>
  color === BOARD_NEUTRAL_HEX.white || color === BOARD_NEUTRAL_HEX.slate;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
/** Logical desk size at 100% zoom (CSS px). */
export const LEARNING_DESK_WIDTH = 2000;
export const LEARNING_DESK_HEIGHT = 1400;
/** Gutter around the desk so zoomed-out bounds stay visible. */
const DESK_PAD = 80;

function clampZoom(z) {
  const stepped = Math.round(z / ZOOM_STEP) * ZOOM_STEP;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(stepped.toFixed(2))));
}

/**
 * Fill-height Learning workspace: finite scrollable desk under the shell.
 * Zoom scales the desk layout size; overflow scroll moves around it.
 * Tools live in `#edu-main-footer` (double footer: secondary chips + primary).
 */
export function LearningZoomStage({
  isDarkMode,
  theme,
  onShellFooterActiveChange,
  footerExtra = null,
  footerTrailing = null,
  footerSecondary = null,
  /** Label for the secondary tray toggle (Timer: Blocks, Bank: Bills). */
  footerSecondaryLabel = 'Blocks',
  children,
}) {
  const viewportRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [mainFooterSlot, setMainFooterSlot] = useState(null);
  const [wedgesFooterOpen, setWedgesFooterOpen] = useState(false);
  const [annotateFooterOpen, setAnnotateFooterOpen] = useState(false);
  const [annotateTool, setAnnotateTool] = useState(null);
  const [annotateColor, setAnnotateColor] = useState(PRIMARY_SOLID_HEX.Red);
  const [annotateSize, setAnnotateSize] = useState(4);
  const annotateDockRef = useRef(null);
  const annotateLayerRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pendingScrollRef = useRef(null);
  const didCenterRef = useRef(false);
  /** True after the user pans or zooms — stop auto-recentering on resize. */
  const userAdjustedViewRef = useRef(false);
  /** Suppress scroll listener while we set scrollLeft/Top programmatically. */
  const programmaticScrollRef = useRef(false);

  const useShellFooter = typeof onShellFooterActiveChange === 'function';

  const selectAnnotateTool = (tool) => {
    setAnnotateTool((current) => (current === tool ? null : tool));
  };

  const selectCursor = () => {
    setAnnotateFooterOpen(false);
    setAnnotateTool(null);
  };

  const toggleAnnotateFooter = () => {
    setAnnotateFooterOpen((open) => {
      const next = !open;
      if (!next) {
        setAnnotateTool(null);
      } else {
        setAnnotateTool((t) => t || 'pen');
      }
      return next;
    });
  };

  useEffect(() => {
    if (!useShellFooter) return undefined;
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

  const deskW = LEARNING_DESK_WIDTH * zoom;
  const deskH = LEARNING_DESK_HEIGHT * zoom;
  const canvasW = deskW + DESK_PAD * 2;
  const canvasH = deskH + DESK_PAD * 2;

  const scrollToCenter = useCallback((z = zoomRef.current) => {
    const el = viewportRef.current;
    if (!el || el.clientWidth <= 0 || el.clientHeight <= 0) return null;
    const w = LEARNING_DESK_WIDTH * z + DESK_PAD * 2;
    const h = LEARNING_DESK_HEIGHT * z + DESK_PAD * 2;
    return {
      left: Math.max(0, (w - el.clientWidth) / 2),
      top: Math.max(0, (h - el.clientHeight) / 2),
    };
  }, []);

  const applyScroll = useCallback((left, top) => {
    const el = viewportRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    el.scrollLeft = left;
    el.scrollTop = top;
    requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
    });
  }, []);

  const centerViewport = useCallback(
    (z = zoomRef.current) => {
      const center = scrollToCenter(z);
      if (!center) return false;
      applyScroll(center.left, center.top);
      return true;
    },
    [scrollToCenter, applyScroll],
  );

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    if (pendingScrollRef.current) {
      const next = pendingScrollRef.current;
      pendingScrollRef.current = null;
      applyScroll(next.left, next.top);
      return;
    }

    if (!didCenterRef.current) {
      if (centerViewport(zoom)) {
        didCenterRef.current = true;
      }
    }
  }, [zoom, canvasW, canvasH, centerViewport, applyScroll]);

  // Keep the default view centered when the shell footer / Bills tray resizes
  // the viewport — until the user pans or zooms themselves.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      if (programmaticScrollRef.current) return;
      userAdjustedViewRef.current = true;
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      if (userAdjustedViewRef.current) return;
      if (zoomRef.current !== 1) return;
      if (centerViewport(1)) {
        didCenterRef.current = true;
      }
    });
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [centerViewport]);

  const applyZoom = useCallback(
    (nextZoom, anchorClientX, anchorClientY) => {
      const el = viewportRef.current;
      const z0 = zoomRef.current;
      const z1 = clampZoom(nextZoom);
      if (z1 === z0) return;

      userAdjustedViewRef.current = true;

      if (!el) {
        setZoom(z1);
        return;
      }

      const rect = el.getBoundingClientRect();
      const ax =
        anchorClientX != null ? anchorClientX - rect.left : el.clientWidth / 2;
      const ay =
        anchorClientY != null ? anchorClientY - rect.top : el.clientHeight / 2;

      const contentX = el.scrollLeft + ax;
      const contentY = el.scrollTop + ay;
      const ratio = z1 / z0;

      pendingScrollRef.current = {
        left: Math.max(0, contentX * ratio - ax),
        top: Math.max(0, contentY * ratio - ay),
      };
      setZoom(z1);
    },
    [],
  );

  const zoomBy = useCallback(
    (delta) => {
      applyZoom(zoomRef.current + delta);
    },
    [applyZoom],
  );

  const resetView = useCallback(() => {
    const center = scrollToCenter(1) ?? { left: 0, top: 0 };
    userAdjustedViewRef.current = false;

    if (zoomRef.current === 1) {
      const el = viewportRef.current;
      if (!el) return;
      // Already on the default centered view — don't nudge (avoids a jump when
      // the open layout was centered with a different viewport size earlier).
      if (
        Math.abs(el.scrollLeft - center.left) < 1 &&
        Math.abs(el.scrollTop - center.top) < 1
      ) {
        return;
      }
      applyScroll(center.left, center.top);
      return;
    }
    pendingScrollRef.current = center;
    setZoom(1);
  }, [scrollToCenter, applyScroll]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoom(zoomRef.current + direction, e.clientX, e.clientY);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const toolBtn = toolBtnClass(isDarkMode);
  const iconBtn = `${toolBtn} !px-0 w-9 shrink-0`;
  /** Active chips omit toolBtn idle bg/text so primary isn’t overridden by Tailwind order. */
  const toolBtnActive = `edu-control inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl ${TYPE.labelMd} transition-colors ${theme.colorPrimary} ${theme.colorOnPrimary} border border-transparent`;
  const toolBtnActiveSoft = `edu-control inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl ${TYPE.labelMd} transition-colors ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer} border border-transparent`;
  const iconBtnActive = `${toolBtnActive} !px-0 w-9 shrink-0`;
  const iconBtnActiveSoft = `${toolBtnActiveSoft} !px-0 w-9 shrink-0`;
  const annotateBtn = (active) => (active ? iconBtnActive : iconBtn);
  const cursorActive = !annotateFooterOpen;
  const cursorBtnClass = cursorActive ? iconBtnActive : iconBtn;
  const annotateToggleClass = annotateFooterOpen ? iconBtnActiveSoft : iconBtn;
  const wedgesToggleClass = wedgesFooterOpen ? toolBtnActive : toolBtn;
  const chromeDivider = isDarkMode ? 'bg-slate-600' : 'bg-slate-300';
  const rangeInputClass = `h-1.5 appearance-none cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 bg-transparent ${theme.text}
    [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:border-0
    [&::-webkit-slider-thumb]:bg-current
    [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0
    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
    [&::-moz-range-thumb]:bg-current
    ${
      isDarkMode
        ? '[&::-webkit-slider-runnable-track]:bg-slate-600 [&::-moz-range-track]:bg-slate-600'
        : '[&::-webkit-slider-runnable-track]:bg-slate-200 [&::-moz-range-track]:bg-slate-200'
    }`;

  const annotateToolButtons = (
    <>
      <button
        type="button"
        onClick={() => selectAnnotateTool('move')}
        className={annotateBtn(annotateTool === 'move')}
        aria-pressed={annotateTool === 'move'}
        title="Move drawings"
        aria-label="Move drawings"
      >
        <Move size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => selectAnnotateTool('pen')}
        className={annotateBtn(annotateTool === 'pen')}
        aria-pressed={annotateTool === 'pen'}
        title="Pen"
        aria-label="Pen"
      >
        <PenTool size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => selectAnnotateTool('highlight')}
        className={annotateBtn(annotateTool === 'highlight')}
        aria-pressed={annotateTool === 'highlight'}
        title="Highlighter"
        aria-label="Highlighter"
      >
        <Highlighter size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => selectAnnotateTool('eraser')}
        className={annotateBtn(annotateTool === 'eraser')}
        aria-pressed={annotateTool === 'eraser'}
        title="Eraser"
        aria-label="Eraser"
      >
        <Eraser size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => annotateLayerRef.current?.clearAll?.()}
        className={`${iconBtn} ${
          isDarkMode
            ? 'text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
            : 'text-slate-500 hover:bg-rose-500/15 hover:text-rose-600'
        }`}
        title="Clear all annotations"
        aria-label="Clear all annotations"
      >
        <Trash2 size={16} strokeWidth={2.5} />
      </button>

      <span className={`h-5 w-px shrink-0 ${chromeDivider}`} aria-hidden />

      <div
        className="flex shrink-0 items-center gap-1.5"
        role="group"
        aria-label="Stroke color"
      >
        {ANNOTATE_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setAnnotateColor(color)}
            className={`edu-control h-6 w-6 rounded-full transition-transform hover:scale-110 shrink-0 ${
              needsSwatchBorder(color) ? 'border border-slate-400' : ''
            } ${
              annotateColor === color
                ? `ring-2 ring-offset-2 ${
                    isDarkMode
                      ? 'ring-white ring-offset-slate-900'
                      : 'ring-slate-700 ring-offset-white'
                  }`
                : ''
            }`}
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Color ${color}`}
            aria-pressed={annotateColor === color}
          />
        ))}
      </div>

      <div
        className="flex h-9 shrink-0 items-center gap-1 px-1 sm:px-2"
        title="Adjust pen, highlighter, and eraser size"
      >
        <input
          type="range"
          min="1"
          max="20"
          value={annotateSize}
          onChange={(e) => setAnnotateSize(parseInt(e.target.value, 10))}
          className={`edu-control w-16 sm:w-20 ${rangeInputClass}`}
          aria-label="Stroke size"
        />
      </div>
    </>
  );

  const footerBar = (
    <div className="relative z-[120] flex flex-col overflow-visible">
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          wedgesFooterOpen ? 'max-h-16 sm:max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!wedgesFooterOpen}
      >
        <div
          className={`${APP_SHELL_FOOTER_CHROME} ${theme.colorSurface} ${theme.colorOutline}`}
          role="toolbar"
          aria-label="Time wedges"
        >
          <div className="w-full min-h-12 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full items-center justify-center gap-1.5 sm:gap-2 px-1">
              {footerSecondary}
            </div>
          </div>
        </div>
      </div>

      {/* Annotate tools in a double-footer strip */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          annotateFooterOpen
            ? 'max-h-16 sm:max-h-20 opacity-100'
            : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!annotateFooterOpen}
      >
        <div
          ref={annotateDockRef}
          className={`${APP_SHELL_FOOTER_CHROME} relative overflow-visible ${theme.colorSurface} ${theme.colorOutline}`}
          role="toolbar"
          aria-label="Annotation tools"
        >
          <div className="w-full min-h-12 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full items-center justify-center gap-1.5 px-1">
              {annotateToolButtons}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${APP_SHELL_FOOTER_CHROME} relative overflow-visible ${theme.colorSurface} ${theme.colorOutline}`}
        role="toolbar"
        aria-label="Learning tools"
      >
        <div className="w-full min-h-12 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full items-center justify-center gap-1.5 px-1">
            <button
              type="button"
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              className={`${iconBtn} disabled:opacity-40 disabled:pointer-events-none`}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              className={`${iconBtn} disabled:opacity-40 disabled:pointer-events-none`}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={resetView}
              className={toolBtn}
              title="Reset zoom and center desk"
              aria-label="Reset zoom and center desk"
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              <span>Reset View</span>
            </button>

            <span className={`h-5 w-px shrink-0 ${chromeDivider}`} aria-hidden />

            <button
              type="button"
              onClick={selectCursor}
              className={cursorBtnClass}
              aria-pressed={cursorActive}
              title="Cursor"
              aria-label="Cursor"
            >
              <MousePointer2 size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={toggleAnnotateFooter}
              className={annotateToggleClass}
              aria-pressed={annotateFooterOpen}
              aria-expanded={annotateFooterOpen}
              title={annotateFooterOpen ? 'Hide annotate tools' : 'Annotate'}
              aria-label={
                annotateFooterOpen ? 'Hide annotate tools' : 'Annotate'
              }
            >
              {annotateFooterOpen ? (
                <X size={16} strokeWidth={2.5} />
              ) : (
                <PenTool size={16} strokeWidth={2.5} />
              )}
            </button>

            {footerExtra}
            <button
              type="button"
              onClick={() => setWedgesFooterOpen((v) => !v)}
              className={wedgesToggleClass}
              aria-pressed={wedgesFooterOpen}
              aria-expanded={wedgesFooterOpen}
              title={
                wedgesFooterOpen
                  ? `Hide ${footerSecondaryLabel.toLowerCase()}`
                  : `Show ${footerSecondaryLabel.toLowerCase()}`
              }
              aria-label={
                wedgesFooterOpen
                  ? `Hide ${footerSecondaryLabel.toLowerCase()}`
                  : `Show ${footerSecondaryLabel.toLowerCase()}`
              }
            >
              <span>{footerSecondaryLabel}</span>
              <ChevronUp
                size={16}
                strokeWidth={2.5}
                className={`transition-transform ${wedgesFooterOpen ? '' : 'rotate-180'}`}
              />
            </button>
            {footerTrailing}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-1 min-h-0 flex-col">
      <div
        ref={viewportRef}
        className={`relative flex-1 min-h-0 overflow-auto rounded-2xl border-[1.5px] ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
        data-learning-viewport=""
      >
        <div
          className="relative box-border"
          style={{
            width: canvasW,
            height: canvasH,
            padding: DESK_PAD,
          }}
        >
          <div
            className={`${APP_BOARD_CHROME} relative overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
            style={{ width: deskW, height: deskH }}
            data-learning-desk=""
          >
            <div
              className="relative origin-top-left"
              style={{
                width: LEARNING_DESK_WIDTH,
                height: LEARNING_DESK_HEIGHT,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              {children}
              <LearningAnnotateLayer
                ref={annotateLayerRef}
                tool={annotateTool}
                color={annotateColor}
                size={annotateSize}
                width={LEARNING_DESK_WIDTH}
                height={LEARNING_DESK_HEIGHT}
              />
            </div>
          </div>
        </div>
      </div>

      {useShellFooter && mainFooterSlot
        ? createPortal(footerBar, mainFooterSlot)
        : !useShellFooter
          ? footerBar
          : null}
    </div>
  );
}
