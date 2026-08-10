import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Eraser, Trash2 } from 'lucide-react';
import {
  LEARNING_DESK_HEIGHT,
  LEARNING_DESK_WIDTH,
  LearningZoomStage,
} from '../components/LearningZoomStage';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { MoneyCurrencyMenu } from '../money/MoneyCurrencyMenu';
import { MoneyViewMenu } from '../money/MoneyViewMenu';
import {
  DEFAULT_CURRENCY_ID,
  denomsFor,
  denomById,
  formatCents,
  getCurrency,
  sumDeskCents,
} from '../money/moneyDenoms';

function nextPieceId() {
  return `cash-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Gap between auto-placed pieces on the desk. */
const PLACE_GAP = 12;
/** Treat as click (not drag) if the pointer moved less than this. */
const CLICK_MOVE_PX = 8;

function pieceSize(denom) {
  if (!denom) return { w: 48, h: 48 };
  return denom.kind === 'coin'
    ? { w: denom.size, h: denom.size }
    : { w: denom.w, h: denom.h };
}

/** Visible desk bounds in desk coordinates (for starting a horizontal row in view). */
function visibleDeskBounds(deskEl) {
  if (!deskEl) {
    return {
      left: 0,
      top: 0,
      right: LEARNING_DESK_WIDTH,
      bottom: LEARNING_DESK_HEIGHT,
      centerX: LEARNING_DESK_WIDTH / 2,
      centerY: LEARNING_DESK_HEIGHT / 2,
    };
  }
  const viewport = deskEl.closest('[data-learning-viewport]');
  const deskRect = deskEl.getBoundingClientRect();
  const viewRect = viewport?.getBoundingClientRect() ?? deskRect;
  const leftPx = Math.max(deskRect.left, viewRect.left);
  const topPx = Math.max(deskRect.top, viewRect.top);
  const rightPx = Math.min(deskRect.right, viewRect.right);
  const bottomPx = Math.min(deskRect.bottom, viewRect.bottom);
  const sx = deskRect.width / Math.max(deskEl.offsetWidth, 1);
  const sy = deskRect.height / Math.max(deskEl.offsetHeight, 1);
  if (rightPx <= leftPx || bottomPx <= topPx) {
    return {
      left: 0,
      top: 0,
      right: LEARNING_DESK_WIDTH,
      bottom: LEARNING_DESK_HEIGHT,
      centerX: LEARNING_DESK_WIDTH / 2,
      centerY: LEARNING_DESK_HEIGHT / 2,
    };
  }
  const left = (leftPx - deskRect.left) / sx;
  const top = (topPx - deskRect.top) / sy;
  const right = (rightPx - deskRect.left) / sx;
  const bottom = (bottomPx - deskRect.top) / sy;
  return {
    left,
    top,
    right,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

/**
 * First piece near visible center; later clicks continue on the same horizontal
 * row (no vertical stacking).
 */
function nextPlacePos(pieces, denom, deskEl) {
  const { w, h } = pieceSize(denom);
  if (!pieces.length) {
    const view = visibleDeskBounds(deskEl);
    const x = Math.min(
      LEARNING_DESK_WIDTH - w,
      Math.max(0, Math.round(view.centerX - w)),
    );
    const y = Math.min(
      LEARNING_DESK_HEIGHT - h,
      Math.max(0, Math.round(view.centerY - h / 2)),
    );
    return { x, y };
  }

  const last = pieces[pieces.length - 1];
  const lastSize = pieceSize(denomById(last.denomId));
  return {
    x: Math.min(
      LEARNING_DESK_WIDTH - w,
      Math.max(0, last.x + lastSize.w + PLACE_GAP),
    ),
    y: last.y,
  };
}

function normalizeRect(x0, y0, x1, y1) {
  return {
    left: Math.min(x0, x1),
    top: Math.min(y0, y1),
    right: Math.max(x0, x1),
    bottom: Math.max(y0, y1),
  };
}

function pieceIntersectsRect(piece, rect) {
  const { w, h } = pieceSize(denomById(piece.denomId));
  return (
    piece.x < rect.right &&
    piece.x + w > rect.left &&
    piece.y < rect.bottom &&
    piece.y + h > rect.top
  );
}

function MoneyPieceFace({ denom, className = '' }) {
  if (!denom) return null;
  if (denom.kind === 'coin') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border-2 border-black/15 font-bold shadow-sm ${className}`}
        style={{
          width: denom.size,
          height: denom.size,
          backgroundColor: denom.fill,
          color: denom.ink,
          fontSize: denom.cents >= 25 ? 13 : 11,
        }}
      >
        {denom.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border-2 border-black/10 font-bold shadow-sm ${className}`}
      style={{
        width: denom.w,
        height: denom.h,
        backgroundColor: denom.fill,
        color: denom.ink,
        fontSize: 14,
      }}
    >
      {denom.label}
    </span>
  );
}

/**
 * Bank → Learning — zoom desk for counting and manipulating money.
 * Money manipulative desk — hosted by MathTools (annotate / zoom / shell footer).
 */
export function MoneyWidget({
  isDarkMode,
  theme,
  onShellFooterActiveChange,
}) {
  const deskSurfaceRef = useRef(null);
  const dragRef = useRef(null);
  const piecesRef = useRef([]);
  const selectedIdsRef = useRef([]);
  const [pieces, setPieces] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const [ghosts, setGhosts] = useState(null);
  const [currencyId, setCurrencyId] = useState(DEFAULT_CURRENCY_ID);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [showTotal, setShowTotal] = useState(true);
  const [selectionAnchor, setSelectionAnchor] = useState(null);

  piecesRef.current = pieces;
  selectedIdsRef.current = selectedIds;

  const currency = getCurrency(currencyId);
  const denoms = denomsFor(currencyId);
  const totalCents = sumDeskCents(pieces);
  const selectedSet = new Set(selectedIds);

  const openCurrency = (next) => {
    const open = typeof next === 'function' ? next(currencyOpen) : next;
    setCurrencyOpen(open);
    if (open) setViewOpen(false);
  };

  const openView = (next) => {
    const open = typeof next === 'function' ? next(viewOpen) : next;
    setViewOpen(open);
    if (open) setCurrencyOpen(false);
  };

  const selectCurrency = (nextId) => {
    if (nextId === currencyId) {
      setCurrencyOpen(false);
      return;
    }
    setCurrencyId(nextId);
    setPieces([]);
    setSelectedIds([]);
    setGhosts(null);
    setMarquee(null);
    dragRef.current = null;
    setCurrencyOpen(false);
  };

  const deskScale = () => {
    const el = deskSurfaceRef.current;
    if (!el) return { rect: null, sx: 1, sy: 1 };
    const rect = el.getBoundingClientRect();
    return {
      rect,
      sx: rect.width / Math.max(el.offsetWidth, 1),
      sy: rect.height / Math.max(el.offsetHeight, 1),
    };
  };

  const clientToDeskPoint = (clientX, clientY) => {
    const { rect, sx, sy } = deskScale();
    if (!rect) {
      return {
        x: LEARNING_DESK_WIDTH / 2,
        y: LEARNING_DESK_HEIGHT / 2,
      };
    }
    return {
      x: (clientX - rect.left) / sx,
      y: (clientY - rect.top) / sy,
    };
  };

  const clientToDesk = (clientX, clientY, pieceW, pieceH) => {
    const pt = clientToDeskPoint(clientX, clientY);
    return {
      x: Math.min(
        LEARNING_DESK_WIDTH - pieceW,
        Math.max(0, pt.x - pieceW / 2),
      ),
      y: Math.min(
        LEARNING_DESK_HEIGHT - pieceH,
        Math.max(0, pt.y - pieceH / 2),
      ),
    };
  };

  const deskPointToClient = (deskX, deskY) => {
    const { rect, sx, sy } = deskScale();
    if (!rect) return { x: deskX, y: deskY };
    return {
      x: rect.left + deskX * sx,
      y: rect.top + deskY * sy,
    };
  };

  const addPieceAt = (denomId, x, y, id = nextPieceId()) => {
    setPieces((prev) => {
      const next = [...prev, { id, denomId, x, y }];
      piecesRef.current = next;
      return next;
    });
  };

  const addPieces = (items) => {
    setPieces((prev) => {
      const next = [...prev, ...items];
      piecesRef.current = next;
      return next;
    });
  };

  const beginTrayDrag = (denom, event) => {
    event.preventDefault();
    const { w, h } = pieceSize(denom);
    dragRef.current = {
      mode: 'create',
      denomId: denom.id,
      w,
      h,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    setGhosts([
      {
        denomId: denom.id,
        x: event.clientX - w / 2,
        y: event.clientY - h / 2,
      },
    ]);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const beginPieceDrag = (piece, event) => {
    event.preventDefault();
    event.stopPropagation();
    const denom = denomById(piece.denomId, currencyId);
    if (!denom) return;

    const currentSelected = selectedIdsRef.current;
    const movingGroup =
      currentSelected.includes(piece.id) && currentSelected.length > 1
        ? piecesRef.current.filter((p) => currentSelected.includes(p.id))
        : [piece];

    const items = movingGroup.map((p) => {
      const size = pieceSize(denomById(p.denomId, currencyId));
      return {
        id: p.id,
        denomId: p.denomId,
        originX: p.x,
        originY: p.y,
        w: size.w,
        h: size.h,
      };
    });

    dragRef.current = {
      mode: 'group-move',
      items,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    // Capture on the piece button and keep it mounted — move in place.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const beginMarquee = (event) => {
    if (event.button != null && event.button !== 0) return;
    // Only empty desk — piece buttons stop propagation.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    const pt = clientToDeskPoint(event.clientX, event.clientY);
    dragRef.current = {
      mode: 'marquee',
      x0: pt.x,
      y0: pt.y,
      x1: pt.x,
      y1: pt.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      additive: event.shiftKey || event.metaKey,
    };
    setMarquee({ x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y });
    if (!(event.shiftKey || event.metaKey)) {
      setSelectedIds([]);
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  useLayoutEffect(() => {
    const dragging = dragRef.current?.mode === 'group-move' && dragRef.current?.moved;
    if (!selectedIds.length || ghosts || marquee || dragging) {
      setSelectionAnchor(null);
      return;
    }
    const el = deskSurfaceRef.current;
    if (!el) {
      setSelectionAnchor(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const sx = rect.width / Math.max(el.offsetWidth, 1);
    const sy = rect.height / Math.max(el.offsetHeight, 1);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    for (const piece of pieces) {
      if (!selectedIds.includes(piece.id)) continue;
      const { w, h } = pieceSize(denomById(piece.denomId));
      minX = Math.min(minX, piece.x);
      minY = Math.min(minY, piece.y);
      maxX = Math.max(maxX, piece.x + w);
      void h;
    }
    if (!Number.isFinite(minX)) {
      setSelectionAnchor(null);
      return;
    }
    setSelectionAnchor({
      x: rect.left + ((minX + maxX) / 2) * sx,
      y: rect.top + minY * sy,
    });
  }, [selectedIds, pieces, ghosts, marquee]);

  const deleteSelection = () => {
    const remove = new Set(selectedIdsRef.current);
    if (!remove.size) return;
    setPieces((prev) => {
      const next = prev.filter((p) => !remove.has(p.id));
      piecesRef.current = next;
      return next;
    });
    setSelectedIds([]);
  };

  const cloneSelection = () => {
    const selected = piecesRef.current.filter((p) =>
      selectedIdsRef.current.includes(p.id),
    );
    if (!selected.length) return;
    const clones = selected.map((p) => {
      const { w, h } = pieceSize(denomById(p.denomId));
      return {
        id: nextPieceId(),
        denomId: p.denomId,
        x: Math.min(LEARNING_DESK_WIDTH - w, p.x + PLACE_GAP),
        y: Math.min(LEARNING_DESK_HEIGHT - h, p.y + PLACE_GAP),
      };
    });
    setPieces((prev) => {
      const next = [...prev, ...clones];
      piecesRef.current = next;
      return next;
    });
    setSelectedIds(clones.map((c) => c.id));
  };

  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (!drag.moved) {
        const dist = Math.hypot(
          event.clientX - drag.startX,
          event.clientY - drag.startY,
        );
        if (dist >= CLICK_MOVE_PX) drag.moved = true;
      }

      if (drag.mode === 'marquee') {
        const pt = clientToDeskPoint(event.clientX, event.clientY);
        drag.x1 = pt.x;
        drag.y1 = pt.y;
        setMarquee({ x0: drag.x0, y0: drag.y0, x1: pt.x, y1: pt.y });
        return;
      }

      if (drag.mode === 'group-move') {
        const { sx, sy } = deskScale();
        const dx = (event.clientX - drag.startX) / sx;
        const dy = (event.clientY - drag.startY) / sy;
        const byId = new Map(
          drag.items.map((item) => [
            item.id,
            {
              x: Math.min(
                LEARNING_DESK_WIDTH - item.w,
                Math.max(0, item.originX + dx),
              ),
              y: Math.min(
                LEARNING_DESK_HEIGHT - item.h,
                Math.max(0, item.originY + dy),
              ),
            },
          ]),
        );
        setPieces((prev) => {
          const next = prev.map((p) => {
            const pos = byId.get(p.id);
            return pos ? { ...p, x: pos.x, y: pos.y } : p;
          });
          piecesRef.current = next;
          return next;
        });
        // Hide the selection chrome while dragging so it doesn't block the grab.
        if (drag.moved) setSelectionAnchor(null);
        return;
      }

      if (drag.mode === 'create') {
        setGhosts([
          {
            denomId: drag.denomId,
            x: event.clientX - drag.w / 2,
            y: event.clientY - drag.h / 2,
          },
        ]);
      }
    };

    const onUp = (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      const desk = deskSurfaceRef.current;
      const rect = desk?.getBoundingClientRect();
      const overDesk =
        rect &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (drag.mode === 'marquee') {
        const box = normalizeRect(drag.x0, drag.y0, drag.x1, drag.y1);
        const hit = piecesRef.current
          .filter((p) => pieceIntersectsRect(p, box))
          .map((p) => p.id);
        if (drag.moved) {
          setSelectedIds((prev) => {
            if (!drag.additive) return hit;
            const merged = new Set([...prev, ...hit]);
            return [...merged];
          });
        } else if (!drag.additive) {
          setSelectedIds([]);
        }
        setMarquee(null);
        dragRef.current = null;
        return;
      }

      if (drag.mode === 'create' && !drag.moved) {
        const denom = denomById(drag.denomId);
        const pos = nextPlacePos(
          piecesRef.current,
          denom,
          deskSurfaceRef.current,
        );
        addPieceAt(drag.denomId, pos.x, pos.y);
        setSelectedIds([]);
      } else if (drag.mode === 'create' && overDesk) {
        const pos = clientToDesk(event.clientX, event.clientY, drag.w, drag.h);
        addPieceAt(drag.denomId, pos.x, pos.y);
        setSelectedIds([]);
      } else if (drag.mode === 'group-move') {
        const { sx, sy } = deskScale();
        const dx = (event.clientX - drag.startX) / sx;
        const dy = (event.clientY - drag.startY) / sy;
        const ids = drag.items.map((i) => i.id);

        if (!drag.moved) {
          setSelectedIds([drag.items[0].id]);
        } else if (overDesk) {
          const byId = new Map(
            drag.items.map((item) => [
              item.id,
              {
                x: Math.min(
                  LEARNING_DESK_WIDTH - item.w,
                  Math.max(0, item.originX + dx),
                ),
                y: Math.min(
                  LEARNING_DESK_HEIGHT - item.h,
                  Math.max(0, item.originY + dy),
                ),
              },
            ]),
          );
          setPieces((prev) => {
            const next = prev.map((p) => {
              const pos = byId.get(p.id);
              return pos ? { ...p, x: pos.x, y: pos.y } : p;
            });
            piecesRef.current = next;
            return next;
          });
          setSelectedIds(ids);
        } else {
          // Dropped off the desk — remove the dragged group.
          const remove = new Set(ids);
          setPieces((prev) => {
            const next = prev.filter((p) => !remove.has(p.id));
            piecesRef.current = next;
            return next;
          });
          setSelectedIds([]);
        }
      }

      dragRef.current = null;
      setGhosts(null);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setSelectedIds([]);
        setMarquee(null);
      }
      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        selectedIdsRef.current.length &&
        !dragRef.current
      ) {
        deleteSelection();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const toolBtn = toolBtnClass(isDarkMode);
  const marqueeBox = marquee
    ? normalizeRect(marquee.x0, marquee.y0, marquee.x1, marquee.y1)
    : null;

  const footerSecondary = (
    <>
      {denoms.map((denom) => (
        <button
          key={denom.id}
          type="button"
          onPointerDown={(e) => beginTrayDrag(denom, e)}
          className="edu-control inline-flex shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          title={`Add ${denom.name} — click to place, or drag onto the desk`}
          aria-label={`Add ${denom.name}`}
        >
          <MoneyPieceFace denom={denom} />
        </button>
      ))}
    </>
  );

  const footerExtra = (
    <MoneyCurrencyMenu
      isDarkMode={isDarkMode}
      theme={theme}
      toolBtn={toolBtn}
      open={currencyOpen}
      onOpenChange={openCurrency}
      currencyId={currencyId}
      currencyLabel={currency.label}
      onSelect={selectCurrency}
    />
  );

  const footerTrailing = (
    <div className="flex flex-wrap items-center gap-2">
      <MoneyViewMenu
        isDarkMode={isDarkMode}
        theme={theme}
        toolBtn={toolBtn}
        open={viewOpen}
        onOpenChange={openView}
        showTotal={showTotal}
        onToggleTotal={() => setShowTotal((v) => !v)}
      />
      <button
        type="button"
        className={toolBtn}
        onClick={() => {
          setPieces([]);
          setSelectedIds([]);
          piecesRef.current = [];
        }}
        title="Clear desk"
        aria-label="Clear desk"
      >
        <Eraser size={16} strokeWidth={2.5} />
        <span>Clear</span>
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <LearningZoomStage
        isDarkMode={isDarkMode}
        theme={theme}
        onShellFooterActiveChange={onShellFooterActiveChange}
        footerExtra={footerExtra}
        footerTrailing={footerTrailing}
        footerSecondary={footerSecondary}
        footerSecondaryLabel="Bills"
      >
        <div
          ref={deskSurfaceRef}
          className="relative h-full w-full touch-none cursor-crosshair"
          onPointerDown={beginMarquee}
        >
          {pieces.map((piece) => {
            const denom = denomById(piece.denomId, currencyId);
            if (!denom) return null;
            const selected = selectedSet.has(piece.id);
            return (
              <button
                key={piece.id}
                type="button"
                onPointerDown={(e) => beginPieceDrag(piece, e)}
                className={`edu-control absolute z-20 cursor-grab touch-none active:cursor-grabbing rounded-lg ${
                  selected
                    ? `ring-2 ring-offset-2 ${theme.ring} ${
                        isDarkMode ? 'ring-offset-slate-900' : 'ring-offset-white'
                      }`
                    : ''
                }`}
                style={{ left: piece.x, top: piece.y }}
                title={`${denom.name} — drag to move, drop off desk to remove`}
                aria-label={denom.name}
                aria-selected={selected}
              >
                <MoneyPieceFace denom={denom} />
              </button>
            );
          })}

          {marqueeBox ? (
            <div
              className={`pointer-events-none absolute z-30 border-2 border-dashed ${theme.border} ${theme.colorPrimaryContainer}`}
              style={{
                left: marqueeBox.left,
                top: marqueeBox.top,
                width: Math.max(0, marqueeBox.right - marqueeBox.left),
                height: Math.max(0, marqueeBox.bottom - marqueeBox.top),
              }}
              aria-hidden
            />
          ) : null}
        </div>
      </LearningZoomStage>

      {showTotal ? (
        <div
          className={`pointer-events-none absolute bottom-4 right-4 z-40 rounded-2xl border-[1.5px] px-5 py-3 ${TYPE.titleMd} tabular-nums shadow-sm ${
            isDarkMode
              ? 'border-slate-600 bg-slate-800/95 text-white'
              : 'border-slate-300 bg-white/95 text-slate-900'
          }`}
          aria-live="polite"
        >
          Total {formatCents(totalCents, currencyId)}
        </div>
      ) : null}

      {ghosts?.map((ghost, index) => (
        <div
          key={`ghost-${ghost.denomId}-${index}`}
          className="pointer-events-none fixed z-[300]"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <MoneyPieceFace denom={denomById(ghost.denomId, currencyId)} />
        </div>
      ))}

      {selectionAnchor && selectedIds.length
        ? createPortal(
            <div
              data-money-selection-tools=""
              className={`fixed z-[400] flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-full border-[1.5px] p-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
              style={{
                left: selectionAnchor.x,
                top: selectionAnchor.y - 6,
              }}
            >
              <button
                type="button"
                className={`edu-control inline-flex h-9 w-9 items-center justify-center rounded-full ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                title="Clone selection"
                aria-label="Clone selection"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cloneSelection();
                }}
              >
                <Copy size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                className={`edu-control inline-flex h-9 w-9 items-center justify-center rounded-full ${theme.colorErrorContainer} ${theme.colorOnErrorContainer}`}
                title="Delete selection"
                aria-label="Delete selection"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteSelection();
                }}
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
