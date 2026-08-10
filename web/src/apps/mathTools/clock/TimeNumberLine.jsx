import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Pencil, Trash2, X } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import {
  HOUR_INK,
  MINUTE_INK,
} from './TeachingClockFace';
import {
  clockMeridiem,
  formatDigital,
  normalizeDayMinutes,
} from './teachingClockMath';
import { numberLineSpanMinutes } from './TimeNumberLineModal';

const PAD_X = 48;
const SEGMENT_H = 22;
const SEGMENT_GAP = 4;
/** Half-lengths from the axis — tape-measure hierarchy, centered on the line. */
const TICK_HALF_HOUR = 18;
const TICK_HALF_HALF_HOUR = 12;
const TICK_HALF_MINOR = 7;
/** Room above hour ticks so wedge segments sit fully visible. */
const AXIS_Y = SEGMENT_H + SEGMENT_GAP + TICK_HALF_HOUR + 6;
/** Segment rests just above the tallest tick. */
const SEGMENT_Y = AXIS_Y - TICK_HALF_HOUR - SEGMENT_GAP - SEGMENT_H;
const LABEL_Y = AXIS_Y + TICK_HALF_HOUR + 14;
const SVG_H = LABEL_Y + 16;
const CLICK_MOVE_PX = 6;
/** Vertical slack for chip / segment hit-testing around the axis + segment band. */
const HIT_PAD_Y = 56;

function formatTickLabel(dayMinutes, { withMeridiem = true } = {}) {
  const digital = formatDigital({
    mode: 'geared',
    totalMinutes: dayMinutes,
    showSeconds: false,
  });
  if (!withMeridiem) return digital;
  return `${digital} ${clockMeridiem(dayMinutes)}`;
}

function tickHalfLength(dayMinutes) {
  const m = ((dayMinutes % 60) + 60) % 60;
  if (m === 0) return TICK_HALF_HOUR;
  if (m === 30) return TICK_HALF_HALF_HOUR;
  return TICK_HALF_MINOR;
}

function tickStrokeWidth(dayMinutes) {
  const m = ((dayMinutes % 60) + 60) % 60;
  if (m === 0) return 2.5;
  if (m === 30) return 2;
  return 1.5;
}

/** Snap a segment start so it fits on the line. */
export function snapNumberLineOffset(offset, tickMinutes, span, amount) {
  const tick = Math.max(1, tickMinutes || 5);
  const amt = Math.max(1, Number(amount) || 1);
  /** 1-min chips must pack on 1-min steps even when ticks are coarser. */
  const grid = Math.min(tick, amt);
  const maxStart = Math.max(0, span - amt);
  const snapped = Math.round(Number(offset) / grid) * grid;
  return Math.max(0, Math.min(maxStart, snapped));
}

function segmentsOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/** Exact end of a segment (no tick snap) — used to abut the next chip. */
function segmentEnd(segment) {
  return segment.startOffset + segment.amount;
}

/**
 * Place a new segment at/near desiredOffset without overlapping others —
 * packs to the right of a hit segment so chips sit side-by-side.
 */
export function resolveNumberLineSegmentStart(
  desiredOffset,
  amount,
  segments = [],
  span,
  tickMinutes,
  excludeId = null,
) {
  const tick = Math.max(1, tickMinutes || 5);
  const amt = Math.max(1, Number(amount) || 1);
  const grid = Math.min(tick, amt);
  const maxStart = Math.max(0, span - amt);
  const others = excludeId
    ? segments.filter((s) => s.id !== excludeId)
    : segments;

  const overlaps = (start) =>
    others.some((s) =>
      segmentsOverlap(start, start + amt, s.startOffset, segmentEnd(s)),
    );

  const prefer = snapNumberLineOffset(desiredOffset, tick, span, amt);
  if (!overlaps(prefer)) return prefer;

  /** Rightmost segment that overlaps the preferred slot or covers the drop. */
  const blockers = others
    .filter(
      (s) =>
        segmentsOverlap(
          prefer,
          prefer + amt,
          s.startOffset,
          segmentEnd(s),
        ) ||
        (desiredOffset >= s.startOffset && desiredOffset < segmentEnd(s)),
    )
    .sort((a, b) => segmentEnd(a) - segmentEnd(b));

  /** Abut exactly after the blocker — do not snap back onto a coarser tick. */
  let cand =
    blockers.length > 0
      ? Math.max(0, Math.min(maxStart, segmentEnd(blockers[blockers.length - 1])))
      : prefer;

  for (let i = 0; i < others.length + 4; i++) {
    if (cand > maxStart) break;
    if (!overlaps(cand)) return cand;
    const blocker = others.find((s) =>
      segmentsOverlap(cand, cand + amt, s.startOffset, segmentEnd(s)),
    );
    if (!blocker) break;
    cand = Math.max(0, Math.min(maxStart, segmentEnd(blocker)));
  }

  const free = [];
  for (let t = 0; t <= maxStart; t += grid) {
    if (!overlaps(t)) free.push(t);
  }
  if (!free.length) return prefer;
  return free.reduce((best, t) =>
    Math.abs(t - desiredOffset) < Math.abs(best - desiredOffset) ? t : best,
  );
}

/** Preferred desk width for a span + tick density. */
export function preferredNumberLineWidth(startMinutes, endMinutes, tickMinutes) {
  const span = numberLineSpanMinutes(startMinutes, endMinutes);
  const tick = Math.max(1, tickMinutes || 5);
  const steps = Math.max(1, Math.ceil(span / tick));
  const pxPerStep = tick <= 1 ? 22 : tick <= 5 ? 28 : tick <= 15 ? 36 : 48;
  return Math.min(1680, Math.max(360, steps * pxPerStep + PAD_X * 2));
}

/**
 * Draggable time number line for the Learning desk.
 * Drag to move; pencil opens the edit modal; chips drop as duration segments.
 */
export const TimeNumberLine = forwardRef(function TimeNumberLine(
  {
    startMinutes,
    endMinutes,
    tickMinutes = 5,
    x,
    y,
    width: widthProp,
    theme,
    segments = [],
    onPositionChange,
    onEdit,
    onRemove,
    onSegmentMove,
    onSegmentRemove,
    onSegmentLiftOff = null,
  },
  ref,
) {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const deleteBtnRef = useRef(null);
  const dragRef = useRef(null);
  const segmentDragRef = useRef(null);
  const [pos, setPos] = useState({ x, y });
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [deleteAnchor, setDeleteAnchor] = useState(null);

  useEffect(() => {
    setPos({ x, y });
  }, [x, y]);

  const span = numberLineSpanMinutes(startMinutes, endMinutes);
  const tick = Math.max(1, tickMinutes || 5);
  const width =
    widthProp ?? preferredNumberLineWidth(startMinutes, endMinutes, tick);
  const svgW = Math.max(120, width - 16);
  const trackW = Math.max(80, svgW - PAD_X * 2);

  const ticks = [];
  for (let t = 0; t <= span; t += tick) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== span) ticks.push(span);
  const startNorm = normalizeDayMinutes(startMinutes);
  const firstHourOffset = (60 - (startNorm % 60)) % 60;
  for (let t = firstHourOffset; t < span; t += 60) {
    if (!ticks.includes(t)) ticks.push(t);
  }
  if (tick < 60) {
    const firstHalfOffset = (30 - (startNorm % 60) + 60) % 60;
    for (let t = firstHalfOffset; t < span; t += 60) {
      if (!ticks.includes(t)) ticks.push(t);
    }
  }
  ticks.sort((a, b) => a - b);

  const clientToTrackOffset = useCallback(
    (clientX, clientY, { ignoreY = false } = {}) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const scaleX = rect.width / svgW;
      const scaleY = rect.height / SVG_H;
      const lx = (clientX - rect.left) / scaleX;
      const ly = (clientY - rect.top) / scaleY;
      if (!ignoreY && (ly < AXIS_Y - HIT_PAD_Y || ly > AXIS_Y + HIT_PAD_Y)) {
        return null;
      }
      if (lx < PAD_X - 24 || lx > PAD_X + trackW + 24) return null;
      const ratio = Math.max(0, Math.min(1, (lx - PAD_X) / trackW));
      return { offsetMinutes: ratio * span, span, tickMinutes: tick };
    },
    [span, svgW, tick, trackW],
  );

  useImperativeHandle(
    ref,
    () => ({
      hitTest: (clientX, clientY, opts) =>
        clientToTrackOffset(clientX, clientY, opts),
      getMetrics: () => ({ span, tickMinutes: tick }),
    }),
    [clientToTrackOffset, span, tick],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
  }, []);

  const endSegmentDrag = useCallback(() => {
    const drag = segmentDragRef.current;
    if (!drag) return;
    segmentDragRef.current = null;
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
  }, []);

  const beginDrag = useCallback(
    (event) => {
      if (event.button != null && event.button !== 0) return;
      if (event.target?.closest?.('[data-nl-action]')) return;
      if (event.target?.closest?.('[data-nl-segment]')) return;
      setSelectedSegmentId(null);
      setDeleteAnchor(null);
      event.preventDefault();
      event.stopPropagation();
      const el = rootRef.current;
      const wrap = el?.offsetParent;
      if (!el || !wrap) return;

      const originX = event.clientX;
      const originY = event.clientY;
      let moved = false;
      let grabX = 0;
      let grabY = 0;
      let latest = { x: pos.x, y: pos.y };

      el.setPointerCapture?.(event.pointerId);

      const onMove = (e) => {
        e.preventDefault();
        const dx = e.clientX - originX;
        const dy = e.clientY - originY;
        if (!moved) {
          if (Math.hypot(dx, dy) < CLICK_MOVE_PX) return;
          moved = true;
          const wrapRect = wrap.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const scaleX = wrapRect.width / Math.max(wrap.offsetWidth, 1);
          const scaleY = wrapRect.height / Math.max(wrap.offsetHeight, 1);
          grabX = (originX - elRect.left) / scaleX;
          grabY = (originY - elRect.top) / scaleY;
        }
        const wr = wrap.getBoundingClientRect();
        const sx = wr.width / Math.max(wrap.offsetWidth, 1);
        const sy = wr.height / Math.max(wrap.offsetHeight, 1);
        latest = {
          x: (e.clientX - wr.left) / sx - grabX,
          y: (e.clientY - wr.top) / sy - grabY,
        };
        setPos(latest);
      };

      const onUp = () => {
        try {
          el.releasePointerCapture?.(event.pointerId);
        } catch {
          /* already released */
        }
        endDrag();
        if (moved) onPositionChange?.(latest);
      };

      endDrag();
      endSegmentDrag();
      dragRef.current = { onMove, onUp };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [endDrag, endSegmentDrag, onPositionChange, pos.x, pos.y],
  );

  const beginSegmentDrag = useCallback(
    (segment, event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const rectEl = event.currentTarget;
      const originX = event.clientX;
      const originY = event.clientY;
      let moved = false;
      let lifted = false;

      const hit0 = clientToTrackOffset(event.clientX, event.clientY, {
        ignoreY: true,
      });
      let pointerAtGrab = segment.startOffset + segment.amount / 2;
      if (hit0) {
        pointerAtGrab = hit0.offsetMinutes;
      } else if (rectEl) {
        const r = rectEl.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (event.clientX - r.left) / Math.max(r.width, 1)),
        );
        pointerAtGrab = segment.startOffset + ratio * segment.amount;
      }
      const startAtGrab = segment.startOffset;

      const liftOff = (clientX, clientY) => {
        if (lifted) return;
        lifted = true;
        setSelectedSegmentId(null);
        setDeleteAnchor(null);
        endSegmentDrag();
        onSegmentLiftOff?.({
          id: segment.id,
          ring: segment.ring,
          amount: segment.amount,
          label: segment.label,
          clientX,
          clientY,
        });
      };

      const onMove = (e) => {
        e.preventDefault();
        if (lifted) return;
        if (!moved) {
          if (
            Math.hypot(e.clientX - originX, e.clientY - originY) <
            CLICK_MOVE_PX
          ) {
            return;
          }
          moved = true;
          setSelectedSegmentId(null);
          setDeleteAnchor(null);
        }
        // Strict Y — leaving the band pulls the block off the line.
        const onLine = clientToTrackOffset(e.clientX, e.clientY);
        if (!onLine) {
          liftOff(e.clientX, e.clientY);
          return;
        }
        const next = clientToTrackOffset(e.clientX, e.clientY, {
          ignoreY: true,
        });
        if (!next) return;
        const delta = next.offsetMinutes - pointerAtGrab;
        const startOffset = resolveNumberLineSegmentStart(
          startAtGrab + delta,
          segment.amount,
          segments,
          span,
          tick,
          segment.id,
        );
        onSegmentMove?.(segment.id, startOffset);
      };
      const onUp = () => {
        if (lifted) return;
        endSegmentDrag();
        if (!moved && rectEl) {
          const r = rectEl.getBoundingClientRect();
          setSelectedSegmentId(segment.id);
          setDeleteAnchor({
            x: r.left + r.width / 2,
            y: r.top,
          });
        }
      };

      endSegmentDrag();
      endDrag();
      segmentDragRef.current = { onMove, onUp };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [
      clientToTrackOffset,
      endDrag,
      endSegmentDrag,
      onSegmentLiftOff,
      onSegmentMove,
      segments,
      span,
      tick,
    ],
  );

  useEffect(() => {
    if (!selectedSegmentId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedSegmentId(null);
        setDeleteAnchor(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSegmentId]);

  useEffect(
    () => () => {
      endDrag();
      endSegmentDrag();
    },
    [endDrag, endSegmentDrag],
  );

  const selectedSeg = segments.find((s) => s.id === selectedSegmentId);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={`Time number line from ${formatTickLabel(startMinutes)} to ${formatTickLabel(endMinutes)}`}
      title="Drag to move"
      onPointerDown={beginDrag}
      className={`edu-control absolute z-20 cursor-grab touch-none select-none rounded-2xl border-[1.5px] px-2 pb-3 pt-2 active:cursor-grabbing ${theme.colorSurface} ${theme.colorOutline}`}
      style={{
        left: pos.x,
        top: pos.y,
        width,
      }}
    >
      <div className="mb-1 flex items-center gap-1 px-1">
        <GripVertical
          size={16}
          strokeWidth={2.5}
          className={`shrink-0 ${theme.colorOnSurfaceVariant}`}
          aria-hidden
        />
        <p
          className={`min-w-0 flex-1 truncate ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}
        >
          {formatTickLabel(startMinutes)}
          <span className="mx-1.5 opacity-50">→</span>
          {formatTickLabel(endMinutes)}
        </p>
        <button
          type="button"
          data-nl-action=""
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-xl ${theme.colorOnSurfaceVariant} hover:opacity-80`}
          title="Edit number line"
          aria-label="Edit number line"
        >
          <Pencil size={15} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          data-nl-action=""
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-xl ${theme.colorOnSurfaceVariant} hover:opacity-80`}
          title="Remove number line"
          aria-label="Remove number line"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <svg
        ref={svgRef}
        width={svgW}
        height={SVG_H}
        viewBox={`0 0 ${svgW} ${SVG_H}`}
        className={`block overflow-visible ${theme.colorOnSurface}`}
        aria-hidden
      >
        {segments.map((seg) => {
          const amount = Math.min(seg.amount, span);
          const start = Math.max(0, Math.min(span - amount, seg.startOffset));
          const x1 = PAD_X + (span === 0 ? 0 : (start / span) * trackW);
          const w = span === 0 ? 0 : (amount / span) * trackW;
          const fill = seg.ring === 'hour' ? HOUR_INK : MINUTE_INK;
          const selected = seg.id === selectedSegmentId;
          return (
            <g key={seg.id}>
              <rect
                data-nl-segment=""
                x={x1}
                y={SEGMENT_Y}
                width={Math.max(w, 1)}
                height={SEGMENT_H}
                rx={6}
                fill={fill}
                stroke={selected ? fill : 'none'}
                strokeWidth={selected ? 2 : 0}
                className="cursor-grab"
                onPointerDown={(e) => beginSegmentDrag(seg, e)}
              />
              {w >= 18 ? (
                <text
                  x={x1 + w / 2}
                  y={SEGMENT_Y + SEGMENT_H / 2 + 4}
                  textAnchor="middle"
                  fill="#fff"
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    pointerEvents: 'none',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {seg.label}
                </text>
              ) : null}
            </g>
          );
        })}
        <line
          x1={PAD_X}
          y1={AXIS_Y}
          x2={PAD_X + trackW}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {ticks.map((t) => {
          const ratio = span === 0 ? 0 : t / span;
          const cx = PAD_X + ratio * trackW;
          const day = normalizeDayMinutes(startMinutes + t);
          const half = tickHalfLength(day);
          const isHour = day % 60 === 0;
          const withMeridiem =
            isHour &&
            (t === firstHourOffset ||
              clockMeridiem(day) !==
                clockMeridiem(normalizeDayMinutes(day - 60)));
          return (
            <g key={`tick-${t}`}>
              <line
                x1={cx}
                y1={AXIS_Y - half}
                x2={cx}
                y2={AXIS_Y + half}
                stroke="currentColor"
                strokeWidth={tickStrokeWidth(day)}
                strokeLinecap="round"
              />
              {isHour ? (
                <text
                  x={cx}
                  y={LABEL_Y}
                  textAnchor="middle"
                  className="fill-current"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatTickLabel(day, { withMeridiem })}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {selectedSeg && deleteAnchor
        ? createPortal(
            <button
              ref={deleteBtnRef}
              type="button"
              data-nl-segment-delete=""
              className={`edu-control pointer-events-auto fixed z-[500] inline-flex h-9 w-9 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-[1.5px] shadow-lg ${theme.colorErrorContainer} ${theme.colorOnErrorContainer} ${theme.colorOutline}`}
              style={{ left: deleteAnchor.x, top: deleteAnchor.y - 6 }}
              title="Remove block"
              aria-label="Remove block"
              onPointerDown={(e) => {
                // Handle on pointerdown so a capture-phase dismiss can't unmount
                // the button before click fires.
                e.preventDefault();
                e.stopPropagation();
                const id = selectedSeg.id;
                setSelectedSegmentId(null);
                setDeleteAnchor(null);
                onSegmentRemove?.(id);
              }}
            >
              <Trash2 size={16} strokeWidth={2.5} aria-hidden />
            </button>,
            document.body,
          )
        : null}
    </div>
  );
});
