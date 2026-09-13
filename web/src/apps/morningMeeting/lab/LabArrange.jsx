import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { TYPE } from '../../../shared/typography';
import { getWidgetMeta } from '../widgets/registry';
import {
  LAB_COLS,
  LAB_GAP_PX,
  LAB_REFERENCE_STAGE,
  labAcceptsPins,
  labGetRect,
  labHasCollision,
} from './boardLayoutLab';
import { EmptyCard } from './EmptyCard';

/**
 * Layout Lab arrange canvas — fills the same 16:9 stage as Preview.
 * Cell width/height divide the stage so the grid matches the panel frame.
 */
export function LabArrange({
  pins,
  theme,
  isDarkMode,
  onLayoutChange,
  stageWidth = LAB_REFERENCE_STAGE.width,
  stageHeight = LAB_REFERENCE_STAGE.height,
}) {
  const viewportRef = useRef(null);
  const metricsRef = useRef({ cellW: 24, cellH: 24, gap: LAB_GAP_PX });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  /** @type {React.MutableRefObject<null | { id: string, mode: 'move' | 'resize', startX: number, startY: number, origin: { col: number, row: number, w: number, h: number } }>} */
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

  const stageBg = isDarkMode ? 'bg-slate-900' : 'bg-slate-100';
  const gridLine = isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.45)';

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const measure = () => {
      setViewport({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const contentRows = Math.max(
    1,
    ...pins.map((p) => {
      const r = labGetRect(p);
      return r.row + r.h;
    }),
    draft ? draft.row + draft.h : 0,
  );
  // Enough rows for content + drag room; stage height is fixed so cells shrink if needed.
  const rowCount = Math.max(8, contentRows + 2);

  const gap = LAB_GAP_PX;
  const inset = 8;
  const footerH = 32;
  const availW = Math.max(1, viewport.w - inset * 2);
  const availH = Math.max(1, viewport.h - inset - footerH);
  const gapX = gap * (LAB_COLS - 1);
  const gapY = gap * Math.max(0, rowCount - 1);

  // Fill the 16:9 stage — columns span width, rows span height.
  const cellW = Math.max(1, (availW - gapX) / LAB_COLS);
  const cellH = Math.max(1, (availH - gapY) / rowCount);
  metricsRef.current = { cellW, cellH, gap };

  const boardW = cellW * LAB_COLS + gapX;
  const boardH = cellH * rowCount + gapY;

  const otherRects = useCallback(
    (excludeId) =>
      pins
        .filter((p) => p.id !== excludeId)
        .map((p) => ({ id: p.id, ...labGetRect(p) })),
    [pins],
  );

  const onPointerMove = useCallback(
    (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { cellW: cw, cellH: ch, gap: g } = metricsRef.current;
      const dx = Math.round((e.clientX - drag.startX) / (cw + g));
      const dy = Math.round((e.clientY - drag.startY) / (ch + g));
      const origin = drag.origin;
      let next;
      if (drag.mode === 'move') {
        next = {
          id: drag.id,
          col: Math.max(0, Math.min(LAB_COLS - origin.w, origin.col + dx)),
          row: Math.max(0, origin.row + dy),
          w: origin.w,
          h: origin.h,
        };
      } else {
        const w = Math.max(1, Math.min(LAB_COLS - origin.col, origin.w + dx));
        const h = Math.max(1, origin.h + dy);
        next = { id: drag.id, col: origin.col, row: origin.row, w, h };
      }
      const invalid =
        labHasCollision(otherRects(drag.id), next, drag.id) ||
        !labAcceptsPins(
          pins.map((p) => (p.id === drag.id ? { ...p, layout: next } : p)),
          stageWidth,
          stageHeight,
        ).ok;
      setDraftBoth({ ...next, invalid });
    },
    [otherRects, pins, stageWidth, stageHeight],
  );

  const endDrag = useCallback(() => {
    const d = draftRef.current;
    const drag = dragRef.current;
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    if (d && drag && !d.invalid) {
      onLayoutChange?.(drag.id, {
        col: d.col,
        row: d.row,
        w: d.w,
        h: d.h,
      });
    }
    setDraftBoth(null);
  }, [onLayoutChange, onPointerMove]);

  const startDrag = (e, id, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    const origin = labGetRect(pin);
    dragRef.current = {
      id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin,
    };
    setDraftBoth({ ...origin, id, invalid: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  };

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-hidden rounded-xl border-[1.5px] ${stageBg} ${theme.colorOutline}`}
      aria-label="Layout lab arrange"
    >
      <div
        className="absolute"
        style={{
          left: inset,
          top: inset,
          width: boardW,
          height: boardH,
          backgroundImage: `
            linear-gradient(to right, ${gridLine} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
          `,
          backgroundSize: `${cellW + gap}px ${cellH + gap}px`,
          backgroundPosition: '0 0',
        }}
      >
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${LAB_COLS}, ${cellW}px)`,
            gridTemplateRows: `repeat(${rowCount}, ${cellH}px)`,
            gap,
          }}
        >
          {pins.map((pin) => {
            const meta = getWidgetMeta(pin.type);
            const rect = draft?.id === pin.id ? draft : labGetRect(pin);
            const invalid = draft?.id === pin.id && draft.invalid;
            const title =
              pin.type === 'custom'
                ? String(pin.props?.title || meta?.label || 'Custom')
                : meta?.label || pin.type;
            return (
              <div
                key={pin.id}
                className={`relative min-h-0 min-w-0 ${invalid ? 'opacity-60' : ''}`}
                style={{
                  gridColumn: `${rect.col + 1} / span ${rect.w}`,
                  gridRow: `${rect.row + 1} / span ${rect.h}`,
                }}
              >
                <div
                  className="h-full w-full cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => startDrag(e, pin.id, 'move')}
                >
                  <EmptyCard
                    theme={theme}
                    title={title}
                    icon={meta?.Icon}
                    sizeLabel={pin.size || 'm'}
                  />
                </div>
                <button
                  type="button"
                  className={`edu-control absolute bottom-1 right-1 h-4 w-4 rounded-sm border ${theme.colorOutline} ${theme.colorSurface} cursor-se-resize`}
                  aria-label={`Resize ${title}`}
                  onPointerDown={(e) => startDrag(e, pin.id, 'resize')}
                />
              </div>
            );
          })}
        </div>
      </div>
      <p
        className={`absolute bottom-0 left-0 right-0 px-3 py-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
      >
        16:9 stage · grid fills frame · drag / resize · rejects collisions
      </p>
    </div>
  );
}
