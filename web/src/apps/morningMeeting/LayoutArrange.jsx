import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Bell, Grid, LayoutGrid, Pencil, Search, User } from 'lucide-react';
import { LogoIcon2x2 } from '../../shared/Logo';
import { TYPE } from '../../shared/typography';
import {
  BOARD_COLS,
  BOARD_PLAYGROUND_ROWS,
  contentMinSpan,
  effectiveRect,
  hasCollision,
  rectToPixels,
} from './boardLayout';
import { getWidgetMeta } from './widgets/registry';
import { setPinLayout } from './morningMeetingStorage';

const GAP_PX = 6;
const MIN_CELL_PX = 14;

/**
 * Visual arrange canvas: snap grid fills the stage; drag to move, handles to resize.
 * Overlap allowed while dragging; colliding drops are rejected.
 * Resize cannot go below content minimum.
 */
export function LayoutArrange({ classId, pins, theme, isDarkMode, rosterCount = 0 }) {
  const ctx = { rosterCount };
  const viewportRef = useRef(null);
  const metricsRef = useRef({ cellW: 24, cellH: 24, gap: GAP_PX });
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  /** @type {React.MutableRefObject<null | { id: string, mode: 'move' | 'resize', startX: number, startY: number, origin: { col: number, row: number, w: number, h: number }, edge: string, minW: number, minH: number }>} */
  const dragRef = useRef(null);
  /** @type {React.MutableRefObject<null | { id: string, col: number, row: number, w: number, h: number, invalid: boolean }>} */
  const draftRef = useRef(null);
  const [draft, setDraft] = useState(
    /** @type {null | { id: string, col: number, row: number, w: number, h: number, invalid: boolean }} */ (
      null
    ),
  );

  const setDraftBoth = (next) => {
    draftRef.current = next;
    setDraft(next);
  };

  const chromeBg = isDarkMode ? 'bg-slate-950' : 'bg-white';
  const chromeLine = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const stageBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const railBg = theme.colorSurface;
  const scrollTrack = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const scrollThumb = isDarkMode ? 'bg-slate-600' : 'bg-slate-300';
  const gridLine = isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.45)';

  const rowCount = Math.max(
    BOARD_PLAYGROUND_ROWS,
    ...pins.map((p) => {
      const r = effectiveRect(p, ctx);
      return r.row + r.h;
    }),
    draft ? draft.row + draft.h : 0,
  );

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const measure = () => {
      setStageSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gapX = GAP_PX * (BOARD_COLS - 1);
  const gapY = GAP_PX * Math.max(0, rowCount - 1);
  const cellW =
    stageSize.w > 0
      ? Math.max(MIN_CELL_PX, (stageSize.w - gapX) / BOARD_COLS)
      : 24;
  const cellH =
    stageSize.h > 0
      ? Math.max(MIN_CELL_PX, (stageSize.h - gapY) / rowCount)
      : 24;

  const layoutMetrics = { cellW, cellH, gap: GAP_PX };
  metricsRef.current = layoutMetrics;
  const boardW = cellW * BOARD_COLS + gapX;
  const boardH = cellH * rowCount + gapY;

  const otherRects = useCallback(
    (excludeId) =>
      pins
        .filter((p) => p.id !== excludeId)
        .map((p) => ({ id: p.id, ...effectiveRect(p, ctx) })),
    [pins, rosterCount],
  );

  const onPointerMove = useCallback(
    (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { cellW: cw, cellH: ch, gap } = metricsRef.current;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const dCol = Math.round(dx / (cw + gap));
      const dRow = Math.round(dy / (ch + gap));
      const minW = drag.minW || 1;
      const minH = drag.minH || 1;

      let next = { ...drag.origin };
      if (drag.mode === 'move') {
        next.col = Math.max(0, Math.min(BOARD_COLS - next.w, drag.origin.col + dCol));
        next.row = Math.max(0, drag.origin.row + dRow);
      } else {
        const edge = drag.edge || 'se';
        if (edge.includes('e')) {
          next.w = Math.max(minW, drag.origin.w + dCol);
          if (next.col + next.w > BOARD_COLS) next.w = BOARD_COLS - next.col;
        }
        if (edge.includes('s')) {
          next.h = Math.max(minH, drag.origin.h + dRow);
        }
        if (edge.includes('w')) {
          const right = drag.origin.col + drag.origin.w;
          const newCol = Math.max(0, drag.origin.col + dCol);
          next.col = Math.min(newCol, right - minW);
          next.w = right - next.col;
          if (next.w < minW) {
            next.w = minW;
            next.col = right - minW;
          }
        }
        if (edge.includes('n')) {
          const bottom = drag.origin.row + drag.origin.h;
          const newRow = Math.max(0, drag.origin.row + dRow);
          next.row = Math.min(newRow, bottom - minH);
          next.h = bottom - next.row;
          if (next.h < minH) {
            next.h = minH;
            next.row = bottom - minH;
          }
        }
      }

      const occupied = otherRects(drag.id);
      const invalid = hasCollision(occupied, next, drag.id);
      setDraftBoth({ id: drag.id, ...next, invalid });
    },
    [otherRects],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    const cur = draftRef.current;
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    setDraftBoth(null);
    if (!drag || !cur || cur.id !== drag.id || cur.invalid || !classId) return;
    const occupied = pins
      .filter((p) => p.id !== drag.id)
      .map((p) => ({ id: p.id, ...effectiveRect(p, { rosterCount }) }));
    const nextRect = { col: cur.col, row: cur.row, w: cur.w, h: cur.h };
    if (hasCollision(occupied, nextRect, drag.id)) return;
    setPinLayout(classId, drag.id, nextRect);
  }, [classId, onPointerMove, pins, rosterCount]);

  const startDrag = (e, id, mode, edge = 'se') => {
    e.preventDefault();
    e.stopPropagation();
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    const origin = effectiveRect(pin, ctx);
    const min = contentMinSpan(pin, ctx);
    dragRef.current = {
      id,
      mode,
      edge,
      startX: e.clientX,
      startY: e.clientY,
      origin,
      minW: min.w,
      minH: min.h,
    };
    setDraftBoth({ id, ...origin, invalid: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border-[1.5px] shadow-sm ${chromeLine} ${chromeBg}`}
      role="group"
      aria-label="Board layout playground"
    >
      <div className="flex h-[min(28rem,55vh)] min-h-[18rem]">
        <div
          className={`flex w-11 shrink-0 flex-col border-r-[1.5px] ${chromeLine} ${railBg}`}
          aria-hidden
        >
          <div
            className={`flex h-9 items-center justify-center border-b-[1.5px] ${chromeLine}`}
          >
            <LogoIcon2x2 className="h-6 w-6" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5 px-1.5 py-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              <LayoutGrid size={14} />
            </span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.colorOnSurfaceVariant}`}
            >
              <Pencil size={14} />
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={`flex h-9 shrink-0 items-center gap-2 border-b-[1.5px] px-2.5 ${chromeLine} ${chromeBg}`}
          >
            <p className={`${TYPE.labelMd} truncate min-w-0 flex-1 ${theme.colorOnSurface}`}>
              Edu.<span className="text-orange-500">MorningMeeting</span>
            </p>
            <span className={`inline-flex gap-1.5 ${theme.colorOnSurfaceVariant}`} aria-hidden>
              <Search size={12} />
              <Grid size={12} />
              <Bell size={12} />
              <User size={12} />
            </span>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className={`min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-2.5 ${stageBg}`}>
              <div ref={viewportRef} className="relative h-full w-full overflow-hidden">
                <div
                  className="relative"
                  style={{
                    width: boardW,
                    height: boardH,
                    backgroundImage: `
                    linear-gradient(to right, ${gridLine} 1px, transparent 1px),
                    linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
                  `,
                    backgroundSize: `${cellW + GAP_PX}px ${cellH + GAP_PX}px`,
                    backgroundPosition: '0 0',
                  }}
                >
                  {pins.map((pin) => {
                    const base = effectiveRect(pin, ctx);
                    const live =
                      draft && draft.id === pin.id
                        ? { col: draft.col, row: draft.row, w: draft.w, h: draft.h }
                        : base;
                    const px = rectToPixels(live, layoutMetrics);
                    const meta = getWidgetMeta(pin.type);
                    const label =
                      pin.type === 'custom'
                        ? String(pin.props?.title || meta?.label || 'Custom')
                        : meta?.label || pin.type;
                    const Icon = meta?.Icon;
                    const invalid = draft?.id === pin.id && draft.invalid;
                    const sizeLabel =
                      pin.size === 'banner' ? 'Banner' : String(pin.size || 'm').toUpperCase();

                    return (
                      <div
                        key={pin.id}
                        className={`edu-control absolute flex flex-col overflow-hidden rounded-lg border-[1.5px] ${
                          invalid
                            ? 'border-red-400 ring-2 ring-red-400/50'
                            : theme.colorOutline
                        } ${theme.colorSurface}`}
                        style={{
                          left: px.left,
                          top: px.top,
                          width: px.width,
                          height: px.height,
                          touchAction: 'none',
                        }}
                        title="Drag to move · resize from edges"
                      >
                        <button
                          type="button"
                          className={`edu-control flex min-h-0 flex-1 cursor-grab active:cursor-grabbing items-center gap-1 px-1.5 py-1 text-left ${theme.colorOnSurface}`}
                          onPointerDown={(e) => startDrag(e, pin.id, 'move')}
                        >
                          {Icon ? (
                            <span
                              className={`inline-flex p-0.5 rounded shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                            >
                              <Icon size={11} />
                            </span>
                          ) : null}
                          <span className={`${TYPE.labelSm} truncate font-semibold`}>{label}</span>
                          <span
                            className={`${TYPE.labelSm} shrink-0 opacity-70 ${theme.colorOnSurfaceVariant}`}
                          >
                            {sizeLabel}
                          </span>
                        </button>
                        <span
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-e-resize"
                          onPointerDown={(e) => startDrag(e, pin.id, 'resize', 'e')}
                          aria-hidden
                        />
                        <span
                          className="absolute left-0 right-0 bottom-0 h-1.5 cursor-s-resize"
                          onPointerDown={(e) => startDrag(e, pin.id, 'resize', 's')}
                          aria-hidden
                        />
                        <span
                          className="absolute right-0 bottom-0 h-3 w-3 cursor-se-resize"
                          onPointerDown={(e) => startDrag(e, pin.id, 'resize', 'se')}
                          aria-hidden
                        />
                        <span
                          className={`pointer-events-none absolute right-0.5 bottom-0.5 h-2 w-2 rounded-sm ${theme.colorPrimary}`}
                          aria-hidden
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              className={`flex w-2.5 shrink-0 flex-col border-l-[1.5px] py-1 ${chromeLine} ${scrollTrack}`}
              aria-hidden
            >
              <div className={`mx-auto mt-1 h-8 w-1.5 rounded-full ${scrollThumb}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
