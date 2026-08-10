import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { Cog, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { FitPopout } from '../../../shared/usePopoutFit';
import { TeachingClockFace, CLOCK_CENTER, FACE_R, HOUR_INK, MINUTE_INK } from './TeachingClockFace';
import { TeachingClockTimeModal } from './TeachingClockTimeModal';
import {
  angleFromPointer,
  anglesFromTotalMinutes,
  clampSeconds,
  clockMeridiem,
  clockPartsFromDayMinutes,
  dayMinutesAfterFreeHourMove,
  dayMinutesFromClockParts,
  formatDigital,
  gearedTotalAfterHourAngle,
  gearedTotalAfterMinuteAngle,
  HOUR_DEGREES_PER_MINUTE,
  hourAngleFromTotalMinutes,
  hourChipSweep,
  minuteAngleFromTotalMinutes,
  minuteChipSweep,
  normalizeDegrees,
  normalizeDayMinutes,
  secondAngleFromSeconds,
  secondsAfterSecondAngle,
  secondsFromSecondAngle,
  shortestAngleDelta,
  snapDayMinutes,
  snapMinuteAngle,
  snapSecondAngle,
  totalMinutesFromFreeAngles,
  MINUTES_PER_HALF_DAY,
} from './teachingClockMath';

const MODE_OPTIONS = [
  { id: 'geared', label: 'Geared', icon: Cog },
  { id: 'free', label: 'Free' },
];

const FACE_STYLE_OPTIONS = [
  { id: 'tickmarks', label: 'Tickmarks' },
  { id: 'blocks', label: 'Blocks' },
];

const SHOW_ITEMS = [
  { key: 'hour', label: 'Hour hand' },
  { key: 'minute', label: 'Minute hand' },
  { key: 'second', label: 'Second hand' },
  { key: 'labels', label: 'Minute labels' },
  { key: 'roman', label: 'Roman numerals' },
  { key: 'hourWedges', label: 'Hour wedges' },
  { key: 'pastTo', label: 'Half Hours' },
  { key: 'quarters', label: 'Quarter hours' },
  { key: 'digital', label: 'Digital clock' },
  { key: 'ampm', label: 'AM / PM' },
  { key: 'hour24', label: '24 Hour' },
];

const BLOCKS_RAINBOW_ITEM = { key: 'rainbow', label: 'Rainbow' };

export const MINUTE_CHIPS = [1, 5, 10, 15, 30];

/** SVG radius band where a dragged chip snaps onto the face. */
const CHIP_SNAP_INNER = FACE_R - 24;
const CHIP_SNAP_OUTER = FACE_R + 40;
const CHIP_CLICK_MOVE_PX = 8;
/** Hover pause before a dragged chip snaps onto a number line. */
const NUMBER_LINE_DWELL_MS = 380;

function wedgeSelectionAnchor(svgOrWrap, ids) {
  if (!ids?.length) return null;
  const root = svgOrWrap;
  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  for (const id of ids) {
    const el = root?.querySelector?.(`[data-wedge-id="${id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.right);
  }
  if (!Number.isFinite(minL)) return null;
  return { x: (minL + maxR) / 2, y: minT };
}

function rectsIntersect(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}
const CHIP_H = 48;
const HOUR_CHIP_W = 112;
const MINUTE_CHIP_W = {
  1: 48,
  5: 56,
  10: 68,
  15: 80,
  30: 96,
};

function chipSizeFor(ring, amount) {
  if (ring === 'hour') return { width: HOUR_CHIP_W, height: CHIP_H };
  const width = MINUTE_CHIP_W[amount] ?? Math.max(48, 40 + (Number(amount) || 0));
  return { width, height: CHIP_H };
}

let wedgeIdSeq = 0;
function nextWedgeId() {
  wedgeIdSeq += 1;
  return `wedge-${wedgeIdSeq}`;
}

function clientToSvgPoint(svg, clientX, clientY) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(clientX, clientY);
  return pt.matrixTransform(ctm.inverse());
}

function ClockShowMenu({
  isDarkMode,
  theme,
  toolBtn,
  open,
  onOpenChange,
  showHourHand,
  showMinuteHand,
  showSecondHand,
  showMinuteLabels,
  showHourWedges,
  showPastTo,
  showQuarters,
  showDigital,
  showAmPm,
  showRomanNumerals,
  rainbowBlocks,
  faceStyle,
  hour24 = false,
  showItems = SHOW_ITEMS,
  onToggleHour,
  onToggleMinute,
  onToggleSecond,
  onToggleLabels,
  onToggleRoman,
  onToggleHourWedges,
  onTogglePastTo,
  onToggleQuarters,
  onToggleDigital,
  onToggleAmPm,
  onToggleHour24,
  onToggleRainbow,
  onFaceStyleChange,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, bottom: 0 });
  const checked = {
    hour: showHourHand,
    minute: showMinuteHand,
    second: showSecondHand,
    labels: showMinuteLabels,
    roman: showRomanNumerals,
    hourWedges: showHourWedges,
    pastTo: showPastTo,
    quarters: showQuarters,
    digital: showDigital,
    ampm: showAmPm,
    hour24,
    rainbow: rainbowBlocks,
  };
  const toggles = {
    hour: onToggleHour,
    minute: onToggleMinute,
    second: onToggleSecond,
    labels: onToggleLabels,
    roman: onToggleRoman,
    hourWedges: onToggleHourWedges,
    pastTo: onTogglePastTo,
    quarters: onToggleQuarters,
    digital: onToggleDigital,
    ampm: onToggleAmPm,
    hour24: onToggleHour24,
    rainbow: onToggleRainbow,
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setPos({
        left: rect.left + rect.width / 2,
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
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inTrigger && !inPanel) onOpenChange(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative shrink-0" data-clock-show-menu="">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className={toolBtn}
        aria-expanded={open}
        aria-haspopup="menu"
        title="View clock parts"
        aria-label="View clock parts"
      >
        <Eye size={16} strokeWidth={2.5} />
        <span className="hidden xl:inline">View</span>
      </button>
      {open
        ? createPortal(
            <FitPopout
              ref={panelRef}
              open={open}
              centerX
              style={{ left: pos.left, bottom: pos.bottom }}
              className={`fixed w-64 rounded-2xl border-[1.5px] p-2 shadow-lg z-[300] ${theme.colorSurface} ${theme.colorOutline}`}
              role="menu"
              aria-label="Clock parts"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-center px-1.5 pb-1.5 pt-0.5" role="presentation">
                  <SegmentControl
                    isDarkMode={isDarkMode}
                    theme={theme}
                    value={faceStyle}
                    onChange={onFaceStyleChange}
                    options={FACE_STYLE_OPTIONS}
                  />
                </div>
                <div
                  className={`-mx-2 my-1 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                  role="separator"
                />
                {showItems.map((item) => {
                  const on = checked[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl"
                      role="presentation"
                    >
                      <span
                        className={`${TYPE.labelLg} ${theme.colorOnSurface}`}
                      >
                        {item.label}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={item.label}
                        onClick={() => toggles[item.key]()}
                        className={`edu-control relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                          on
                            ? theme.colorPrimary
                            : isDarkMode
                              ? 'bg-slate-700'
                              : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            on ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </FitPopout>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * Teaching clock manipulative: geared/free hands, digital readout, reset time.
 * Footer tools (mode + reset) are reported via onFooterExtraChange for the shell footer.
 * Chip actions are exposed via ref for the secondary wedges rail.
 */
export const TeachingClock = forwardRef(function TeachingClock(
  {
    isDarkMode,
    theme,
    onFooterExtraChange,
    externalChipDropRef = null,
    onDeskBlockDrop = null,
  },
  ref,
) {
  const svgWrapRef = useRef(null);
  const clockStackRef = useRef(null);
  const digitalRef = useRef(null);
  const dragRef = useRef(null);
  const [mode, setMode] = useState('geared');
  const [faceStyle, setFaceStyle] = useState('tickmarks');
  const [hourCycle, setHourCycle] = useState('12');
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [freeHourAngle, setFreeHourAngle] = useState(0);
  const [freeMinuteAngle, setFreeMinuteAngle] = useState(0);
  const [freeSecondAngle, setFreeSecondAngle] = useState(0);
  const [showHourHand, setShowHourHand] = useState(true);
  const [showMinuteHand, setShowMinuteHand] = useState(true);
  const [showSecondHand, setShowSecondHand] = useState(false);
  const [showMinuteLabels, setShowMinuteLabels] = useState(false);
  const [showHourWedges, setShowHourWedges] = useState(false);
  const [showPastTo, setShowPastTo] = useState(false);
  const [showQuarters, setShowQuarters] = useState(false);
  const [showDigital, setShowDigital] = useState(false);
  const [showAmPm, setShowAmPm] = useState(true);
  const [showRomanNumerals, setShowRomanNumerals] = useState(false);
  const [rainbowBlocks, setRainbowBlocks] = useState(false);
  const [showMenuOpen, setShowMenuOpen] = useState(false);
  const [wedges, setWedges] = useState([]);
  const [selectedWedgeIds, setSelectedWedgeIds] = useState([]);
  const [wedgeDeleteAnchor, setWedgeDeleteAnchor] = useState(null);
  const [wedgeMarquee, setWedgeMarquee] = useState(null);
  /** null = default under-clock placement; then { x, y } in clock-stack local px. */
  const [digitalPos, setDigitalPos] = useState(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [activeHand, setActiveHand] = useState(null);

  const showMinuteWedges = faceStyle === 'blocks';
  /** Blocks always includes hour wedges unless Half Hours / Quarters overlay is on. */
  const showHourBlocks = showMinuteWedges
    ? !showPastTo && !showQuarters
    : showHourWedges;
  const showMenuItems = showMinuteWedges
    ? [
        BLOCKS_RAINBOW_ITEM,
        ...SHOW_ITEMS.filter(
          (item) => item.key !== 'labels' && item.key !== 'hourWedges',
        ),
      ]
    : SHOW_ITEMS;

  const setFaceStyleSafe = useCallback((next) => {
    setFaceStyle(next);
    if (next === 'blocks') {
      setShowMinuteLabels(false);
      setShowHourWedges(true);
      setShowPastTo(false);
      setShowQuarters(false);
    } else {
      setShowHourWedges(false);
      setRainbowBlocks(false);
    }
  }, []);

  const stateRef = useRef({
    mode,
    totalMinutes,
    seconds,
    freeHourAngle,
    freeMinuteAngle,
    freeSecondAngle,
  });
  stateRef.current = {
    mode,
    totalMinutes,
    seconds,
    freeHourAngle,
    freeMinuteAngle,
    freeSecondAngle,
  };

  const hourAngle =
    mode === 'geared' ? hourAngleFromTotalMinutes(totalMinutes) : freeHourAngle;
  const minuteAngle =
    mode === 'geared'
      ? minuteAngleFromTotalMinutes(totalMinutes)
      : freeMinuteAngle;
  const secondAngle =
    mode === 'geared' ? secondAngleFromSeconds(seconds) : freeSecondAngle;
  const hour24 = hourCycle === '24';
  const digitalSeconds =
    mode === 'geared' ? seconds : secondsFromSecondAngle(freeSecondAngle);
  const digital = formatDigital({
    hour24,
    mode,
    totalMinutes,
    hourAngle,
    minuteAngle,
    seconds: digitalSeconds,
    showSeconds: showSecondHand,
  });
  const meridiem = clockMeridiem(totalMinutes);
  const digitalLabel = showAmPm ? `${digital} ${meridiem}` : digital;
  const timeParts = clockPartsFromDayMinutes(totalMinutes, { hour24 });

  const setModeSafe = useCallback((next) => {
    const s = stateRef.current;
    if (next === s.mode) return;
    if (next === 'free') {
      const angles = anglesFromTotalMinutes(s.totalMinutes);
      setFreeHourAngle(angles.hourAngle);
      setFreeMinuteAngle(angles.minuteAngle);
      setFreeSecondAngle(secondAngleFromSeconds(s.seconds));
    } else {
      setTotalMinutes(
        totalMinutesFromFreeAngles(
          s.freeHourAngle,
          s.freeMinuteAngle,
          s.totalMinutes,
        ),
      );
      setSeconds(secondsFromSecondAngle(s.freeSecondAngle));
    }
    setMode(next);
  }, []);

  const resetTime = useCallback(() => {
    setTotalMinutes(0);
    setSeconds(0);
    setFreeHourAngle(0);
    setFreeMinuteAngle(0);
    setFreeSecondAngle(0);
    setWedges([]);
    setSelectedWedgeIds([]);
    setWedgeDeleteAnchor(null);
  }, []);

  const applyTypedTime = useCallback(
    ({ hours, minutes, seconds: nextSec, meridiem: nextMeridiem }) => {
      const nextTotal = dayMinutesFromClockParts({
        hour24,
        hours,
        minutes,
        meridiem: nextMeridiem,
      });
      const sec = clampSeconds(nextSec);
      const angles = anglesFromTotalMinutes(nextTotal);
      setTotalMinutes(nextTotal);
      setSeconds(sec);
      setFreeHourAngle(angles.hourAngle);
      setFreeMinuteAngle(angles.minuteAngle);
      setFreeSecondAngle(secondAngleFromSeconds(sec));
      if (sec > 0) setShowSecondHand(true);
      setTimeModalOpen(false);
    },
    [hour24],
  );

  const toggleMeridiem = useCallback(() => {
    setTotalMinutes((t) => snapDayMinutes(t + MINUTES_PER_HALF_DAY));
  }, []);

  const applyMinuteChip = useCallback((minutes, startAngleOpt) => {
    const s = stateRef.current;
    const startAngle =
      startAngleOpt != null
        ? snapMinuteAngle(startAngleOpt)
        : s.mode === 'geared'
          ? minuteAngleFromTotalMinutes(s.totalMinutes)
          : s.freeMinuteAngle;
    const sweep = minuteChipSweep(minutes);
    const endAngle = normalizeDegrees(startAngle + sweep);
    const id = nextWedgeId();

    if (s.mode === 'geared') {
      setTotalMinutes(snapDayMinutes(s.totalMinutes + minutes));
    } else {
      setFreeMinuteAngle(normalizeDegrees(s.freeMinuteAngle + sweep));
    }

    setWedges((prev) => [
      ...prev,
      {
        id,
        ring: 'minute',
        amount: minutes,
        startAngle,
        endAngle,
        label: String(minutes),
      },
    ]);
    return { id, startAngle, sweep };
  }, []);

  const applyHourChip = useCallback((startAngleOpt) => {
    const s = stateRef.current;
    const startAngle =
      startAngleOpt != null
        ? snapMinuteAngle(startAngleOpt)
        : s.mode === 'geared'
          ? hourAngleFromTotalMinutes(s.totalMinutes)
          : s.freeHourAngle;
    const sweep = hourChipSweep(1);
    const endAngle = normalizeDegrees(startAngle + sweep);
    const id = nextWedgeId();

    if (s.mode === 'geared') {
      setTotalMinutes(snapDayMinutes(s.totalMinutes + 60));
    } else {
      const next = normalizeDegrees(s.freeHourAngle + sweep);
      setTotalMinutes((t) =>
        dayMinutesAfterFreeHourMove(t, s.freeHourAngle, next),
      );
      setFreeHourAngle(next);
    }

    setWedges((prev) => [
      ...prev,
      {
        id,
        ring: 'hour',
        amount: 1,
        startAngle,
        endAngle,
        label: '1',
      },
    ]);
    return { id, startAngle, sweep };
  }, []);

  const [chipGhost, setChipGhost] = useState(null);
  const chipDragRef = useRef(null);
  const endDragRef = useRef(() => {});
  const endWedgeDragRef = useRef(() => {});

  const endChipDrag = useCallback(() => {
    const drag = chipDragRef.current;
    if (!drag) return;
    drag.clearDwell?.();
    chipDragRef.current = null;
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
    setChipGhost(null);
  }, []);

  const beginChipDrag = useCallback(
    ({ ring, amount, label, color, width, height, event = null, resume = null }) => {
      if (!resume) {
        if (!event) return;
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
      }

      const originX = resume?.clientX ?? event.clientX;
      const originY = resume?.clientY ?? event.clientY;
      const grabX = width / 2;
      const grabY = height / 2;
      const amountMinutes = ring === 'hour' ? 60 : amount;

      /** @type {{ kind: 'clock', id: string, startAngle: number, sweep: number, pointerAtGrab: number, startAtGrab: number } | { kind: 'line', lineId: string, segmentId: string, amount: number, pointerAtGrab: number, startAtGrab: number } | null} */
      let placed = null;
      let moved = Boolean(resume);
      let lastClientX = originX;
      let lastClientY = originY;
      /** @type {ReturnType<typeof setTimeout> | null} */
      let lineDwellTimer = null;
      let lineDwellId = null;

      const svgEl = () => svgWrapRef.current?.querySelector('svg') ?? null;

      const nearFace = (pt) => {
        const dx = pt.x - CLOCK_CENTER.cx;
        const dy = pt.y - CLOCK_CENTER.cy;
        const dist = Math.hypot(dx, dy);
        return dist >= CHIP_SNAP_INNER && dist <= CHIP_SNAP_OUTER;
      };

      const externalApi = () => externalChipDropRef?.current ?? null;

      const clearLineDwell = () => {
        if (lineDwellTimer != null) {
          clearTimeout(lineDwellTimer);
          lineDwellTimer = null;
        }
        lineDwellId = null;
      };

      const showGhostAt = (clientX, clientY) => {
        setChipGhost({
          x: clientX - grabX,
          y: clientY - grabY,
          width,
          height,
          color,
          label,
        });
      };

      if (resume) {
        showGhostAt(originX, originY);
      }

      const liftOffLine = () => {
        if (placed?.kind !== 'line') return;
        externalApi()?.remove?.({
          lineId: placed.lineId,
          segmentId: placed.segmentId,
        });
        placed = null;
      };

      const placeOnClock = (pointer) => {
        clearLineDwell();
        liftOffLine();
        const placedWedge =
          ring === 'hour'
            ? applyHourChip(pointer)
            : applyMinuteChip(amount, pointer);
        placed = {
          kind: 'clock',
          ...placedWedge,
          pointerAtGrab: snapMinuteAngle(pointer),
          startAtGrab: placedWedge.startAngle,
        };
        setChipGhost(null);
      };

      const placeOnLine = (hit) => {
        clearLineDwell();
        const placedSeg = externalApi()?.place?.({
          lineId: hit.lineId,
          startOffset: hit.offsetMinutes,
          ring,
          amount: amountMinutes,
          label: String(label),
        });
        if (!placedSeg) return;
        placed = {
          kind: 'line',
          lineId: hit.lineId,
          segmentId: placedSeg.id,
          amount: amountMinutes,
          pointerAtGrab: hit.offsetMinutes,
          startAtGrab: placedSeg.startOffset,
        };
        setChipGhost(null);
      };

      const armLineDwell = (hit) => {
        if (lineDwellId === hit.lineId && lineDwellTimer != null) return;
        clearLineDwell();
        lineDwellId = hit.lineId;
        lineDwellTimer = setTimeout(() => {
          lineDwellTimer = null;
          if (placed || !moved) return;
          const api = externalApi();
          const still = api?.hitTest?.(lastClientX, lastClientY);
          if (!still || still.lineId !== hit.lineId) return;
          const svg = svgEl();
          const pt = svg
            ? clientToSvgPoint(svg, lastClientX, lastClientY)
            : null;
          if (pt && nearFace(pt)) return;
          placeOnLine(still);
        }, NUMBER_LINE_DWELL_MS);
      };

      const onMove = (e) => {
        e.preventDefault();
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        const dx = e.clientX - originX;
        const dy = e.clientY - originY;
        if (!moved && Math.hypot(dx, dy) >= CHIP_CLICK_MOVE_PX) {
          moved = true;
          showGhostAt(e.clientX, e.clientY);
        } else if (moved && !placed) {
          showGhostAt(e.clientX, e.clientY);
        }

        const svg = svgEl();
        const pt = svg
          ? clientToSvgPoint(svg, e.clientX, e.clientY)
          : null;
        const faceHit = Boolean(pt && nearFace(pt));

        if (placed?.kind === 'line') {
          // Clock wins — drag off the line onto the face.
          if (faceHit && pt) {
            const pointer = angleFromPointer(
              CLOCK_CENTER.cx,
              CLOCK_CENTER.cy,
              pt.x,
              pt.y,
            );
            placeOnClock(pointer);
            return;
          }
          // Strict hit (respect Y) so moving past the line lifts the chip.
          const hit = externalApi()?.hitTest?.(e.clientX, e.clientY);
          if (!hit || hit.lineId !== placed.lineId) {
            liftOffLine();
            showGhostAt(e.clientX, e.clientY);
            return;
          }
          const delta = hit.offsetMinutes - placed.pointerAtGrab;
          const raw = placed.startAtGrab + delta;
          const startOffset = hit.resolveStart
            ? hit.resolveStart(raw, placed.amount, placed.segmentId)
            : hit.snap(raw, placed.amount);
          externalApi()?.move?.({
            lineId: placed.lineId,
            segmentId: placed.segmentId,
            startOffset,
            amount: placed.amount,
          });
          return;
        }

        if (placed?.kind === 'clock' && pt) {
          const pointer = angleFromPointer(
            CLOCK_CENTER.cx,
            CLOCK_CENTER.cy,
            pt.x,
            pt.y,
          );
          const delta = shortestAngleDelta(placed.pointerAtGrab, pointer);
          const newStart = snapMinuteAngle(
            normalizeDegrees(placed.startAtGrab + delta),
          );
          const id = placed.id;
          const sweep = placed.sweep;
          setWedges((prev) =>
            prev.map((w) =>
              w.id === id
                ? {
                    ...w,
                    startAngle: newStart,
                    endAngle: normalizeDegrees(newStart + sweep),
                  }
                : w,
            ),
          );
          return;
        }

        if (!placed && moved) {
          // Prefer the clock immediately when over the face.
          if (faceHit && pt) {
            clearLineDwell();
            const pointer = angleFromPointer(
              CLOCK_CENTER.cx,
              CLOCK_CENTER.cy,
              pt.x,
              pt.y,
            );
            placeOnClock(pointer);
            return;
          }
          const hit = externalApi()?.hitTest?.(e.clientX, e.clientY);
          if (hit) {
            armLineDwell(hit);
          } else {
            clearLineDwell();
          }
        }
      };

      const onUp = () => {
        clearLineDwell();
        if (!placed && !moved) {
          if (ring === 'hour') applyHourChip();
          else applyMinuteChip(amount);
        } else if (!placed && moved && typeof onDeskBlockDrop === 'function') {
          onDeskBlockDrop({
            ring,
            amount: amountMinutes,
            label: String(label),
            color,
            width,
            height,
            clientX: lastClientX,
            clientY: lastClientY,
          });
        }
        endChipDrag();
      };

      endChipDrag();
      endWedgeDragRef.current();
      endDragRef.current();
      chipDragRef.current = {
        onMove,
        onUp: () => {
          clearLineDwell();
          onUp();
        },
        clearDwell: clearLineDwell,
      };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', chipDragRef.current.onUp);
      window.addEventListener('pointercancel', chipDragRef.current.onUp);
    },
    [applyHourChip, applyMinuteChip, endChipDrag, externalChipDropRef, onDeskBlockDrop],
  );

  useEffect(() => () => endChipDrag(), [endChipDrag]);

  const syncLinkedNumberLine = useCallback(
    ({ lineId, matchAnalog = false, startMinutes = 0, segments = [] }) => {
      setWedges((prev) => {
        const kept = prev.filter((w) => w.linkedLineId !== lineId);
        if (!matchAnalog) return kept;
        const linked = segments.map((seg) => {
          const dayStart = normalizeDayMinutes(
            startMinutes + (Number(seg.startOffset) || 0),
          );
          const ring = seg.ring === 'hour' ? 'hour' : 'minute';
          if (ring === 'hour') {
            const startAngle = hourAngleFromTotalMinutes(dayStart);
            const sweep = hourChipSweep(1);
            return {
              id: `nl-link-${seg.id}`,
              ring: 'hour',
              amount: 1,
              startAngle,
              endAngle: normalizeDegrees(startAngle + sweep),
              label: String(seg.label ?? '1'),
              linkedLineId: lineId,
              linkedSegmentId: seg.id,
            };
          }
          const amount = Math.max(1, Number(seg.amount) || 1);
          // Number-line time maps to the hour-hand scale so 9:00 sits at 9, not 12.
          const startAngle = hourAngleFromTotalMinutes(dayStart);
          const sweep = amount * HOUR_DEGREES_PER_MINUTE;
          return {
            id: `nl-link-${seg.id}`,
            ring: 'minute',
            amount,
            startAngle,
            endAngle: normalizeDegrees(startAngle + Math.max(sweep, 0.5)),
            label: String(seg.label ?? amount),
            linkedLineId: lineId,
            linkedSegmentId: seg.id,
          };
        });
        return [...kept, ...linked];
      });
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      applyMinuteChip,
      applyHourChip,
      beginChipDrag,
      syncLinkedNumberLine,
    }),
    [applyMinuteChip, applyHourChip, beginChipDrag, syncLinkedNumberLine],
  );

  const applyPointerAngle = useCallback((hand, clientX, clientY) => {
    const wrap = svgWrapRef.current;
    const svg = wrap?.querySelector('svg');
    if (!svg) return;
    const pt = clientToSvgPoint(svg, clientX, clientY);
    if (!pt) return;
    const angle = angleFromPointer(CLOCK_CENTER.cx, CLOCK_CENTER.cy, pt.x, pt.y);
    const { mode: currentMode } = stateRef.current;

    if (hand === 'second') {
      if (currentMode === 'geared') {
        const { seconds: nextSec, minuteDelta } = secondsAfterSecondAngle(
          stateRef.current.seconds,
          angle,
        );
        setSeconds(nextSec);
        stateRef.current.seconds = nextSec;
        if (minuteDelta) {
          setTotalMinutes((t) => snapDayMinutes(t + minuteDelta));
        }
      } else {
        const next = snapSecondAngle(angle);
        setFreeSecondAngle(next);
        stateRef.current.freeSecondAngle = next;
      }
      return;
    }

    if (currentMode === 'geared') {
      if (hand === 'minute') {
        setTotalMinutes((t) => gearedTotalAfterMinuteAngle(t, angle));
      } else {
        setTotalMinutes((t) => gearedTotalAfterHourAngle(t, angle));
      }
    } else if (hand === 'minute') {
      setFreeMinuteAngle(snapMinuteAngle(angle));
    } else {
      const next = normalizeDegrees(Math.round(angle / 0.5) * 0.5);
      const prev = stateRef.current.freeHourAngle;
      setTotalMinutes((t) => dayMinutesAfterFreeHourMove(t, prev, next));
      setFreeHourAngle(next);
      stateRef.current.freeHourAngle = next;
    }
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setActiveHand(null);
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
  }, []);
  endDragRef.current = endDrag;

  const beginDrag = useCallback(
    (hand, event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture?.(event.pointerId);

      const onMove = (e) => {
        e.preventDefault();
        applyPointerAngle(hand, e.clientX, e.clientY);
      };
      const onUp = () => {
        try {
          target.releasePointerCapture?.(event.pointerId);
        } catch {
          /* already released */
        }
        endDrag();
      };

      endDrag();
      setActiveHand(hand);
      dragRef.current = { onMove, onUp };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      applyPointerAngle(hand, event.clientX, event.clientY);
    },
    [applyPointerAngle, endDrag],
  );

  useEffect(() => () => endDrag(), [endDrag]);

  const wedgeDragRef = useRef(null);

  const endWedgeDrag = useCallback(() => {
    const drag = wedgeDragRef.current;
    if (!drag) return;
    drag.clearDwell?.();
    wedgeDragRef.current = null;
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
  }, []);
  endWedgeDragRef.current = endWedgeDrag;

  const beginWedgeDrag = useCallback(
    (wedgeId, event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const wrap = svgWrapRef.current;
      const svg = wrap?.querySelector('svg');
      if (!svg) return;

      const wedge = wedges.find((w) => w.id === wedgeId);
      if (!wedge) return;

      const pt0 = clientToSvgPoint(svg, event.clientX, event.clientY);
      if (!pt0) return;
      const pointerAtGrab = angleFromPointer(
        CLOCK_CENTER.cx,
        CLOCK_CENTER.cy,
        pt0.x,
        pt0.y,
      );
      const startAtGrab = wedge.startAngle;
      let sweep = normalizeDegrees(wedge.endAngle - wedge.startAngle);
      if (sweep < 0.5) sweep = 0.5;

      const ring = wedge.ring;
      const amountMinutes = ring === 'hour' ? 60 : wedge.amount;
      const label = wedge.label ?? String(wedge.amount);
      const color = ring === 'hour' ? HOUR_INK : MINUTE_INK;
      const { width, height } = chipSizeFor(ring, wedge.amount);
      const grabX = width / 2;
      const grabY = height / 2;

      const target = event.currentTarget;
      const originX = event.clientX;
      const originY = event.clientY;
      let moved = false;
      /** @type {'clock' | 'free'} */
      let mode = 'clock';
      let clockWedgeId = wedgeId;
      let clockGrabPointer = pointerAtGrab;
      let clockGrabStart = startAtGrab;
      /** @type {{ kind: 'line', lineId: string, segmentId: string, amount: number, pointerAtGrab: number, startAtGrab: number } | null} */
      let placed = null;
      let lastClientX = originX;
      let lastClientY = originY;
      /** @type {ReturnType<typeof setTimeout> | null} */
      let lineDwellTimer = null;
      let lineDwellId = null;

      target.setPointerCapture?.(event.pointerId);

      const externalApi = () => externalChipDropRef?.current ?? null;

      const nearFace = (pt) => {
        const dx = pt.x - CLOCK_CENTER.cx;
        const dy = pt.y - CLOCK_CENTER.cy;
        const dist = Math.hypot(dx, dy);
        return dist >= CHIP_SNAP_INNER && dist <= CHIP_SNAP_OUTER;
      };

      const outsideFace = (pt) => {
        const dist = Math.hypot(pt.x - CLOCK_CENTER.cx, pt.y - CLOCK_CENTER.cy);
        return dist > CHIP_SNAP_OUTER;
      };

      const clearLineDwell = () => {
        if (lineDwellTimer != null) {
          clearTimeout(lineDwellTimer);
          lineDwellTimer = null;
        }
        lineDwellId = null;
      };

      const showGhostAt = (clientX, clientY) => {
        setChipGhost({
          x: clientX - grabX,
          y: clientY - grabY,
          width,
          height,
          color,
          label,
        });
      };

      const liftOffClock = () => {
        if (mode !== 'clock') return;
        mode = 'free';
        placed = null;
        setWedges((prev) => prev.filter((w) => w.id !== clockWedgeId));
        setSelectedWedgeIds([]);
        setWedgeDeleteAnchor(null);
        try {
          target.releasePointerCapture?.(event.pointerId);
        } catch {
          /* already released */
        }
        showGhostAt(lastClientX, lastClientY);
      };

      const liftOffLine = () => {
        if (placed?.kind !== 'line') return;
        externalApi()?.remove?.({
          lineId: placed.lineId,
          segmentId: placed.segmentId,
        });
        placed = null;
      };

      /** Re-attach a lifted wedge without advancing clock time again. */
      const remountOnClock = (pointer) => {
        clearLineDwell();
        liftOffLine();
        const startAngle = snapMinuteAngle(pointer);
        const id = nextWedgeId();
        setWedges((prev) => [
          ...prev,
          {
            id,
            ring,
            amount: wedge.amount,
            startAngle,
            endAngle: normalizeDegrees(startAngle + sweep),
            label: String(label),
          },
        ]);
        clockWedgeId = id;
        clockGrabPointer = startAngle;
        clockGrabStart = startAngle;
        placed = null;
        mode = 'clock';
        setChipGhost(null);
      };

      const onMove = (e) => {
        e.preventDefault();
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        if (!moved) {
          if (
            Math.hypot(e.clientX - originX, e.clientY - originY) <
            CHIP_CLICK_MOVE_PX
          ) {
            return;
          }
          moved = true;
          setSelectedWedgeIds([]);
          setWedgeDeleteAnchor(null);
        }

        const pt = clientToSvgPoint(svg, e.clientX, e.clientY);

        if (mode === 'clock') {
          if (pt && outsideFace(pt)) {
            liftOffClock();
            return;
          }
          if (!pt) return;
          const pointer = angleFromPointer(
            CLOCK_CENTER.cx,
            CLOCK_CENTER.cy,
            pt.x,
            pt.y,
          );
          const delta = shortestAngleDelta(clockGrabPointer, pointer);
          const newStart = snapMinuteAngle(
            normalizeDegrees(clockGrabStart + delta),
          );
          setWedges((prev) =>
            prev.map((w) =>
              w.id === clockWedgeId
                ? {
                    ...w,
                    startAngle: newStart,
                    endAngle: normalizeDegrees(newStart + sweep),
                  }
                : w,
            ),
          );
          return;
        }

        // Free (lifted) — desk / number line / back onto the face.
        if (!placed) showGhostAt(e.clientX, e.clientY);
        const faceHit = Boolean(pt && nearFace(pt));

        if (placed?.kind === 'line') {
          if (faceHit && pt) {
            const pointer = angleFromPointer(
              CLOCK_CENTER.cx,
              CLOCK_CENTER.cy,
              pt.x,
              pt.y,
            );
            remountOnClock(pointer);
            return;
          }
          const hit = externalApi()?.hitTest?.(e.clientX, e.clientY);
          if (!hit || hit.lineId !== placed.lineId) {
            liftOffLine();
            showGhostAt(e.clientX, e.clientY);
            return;
          }
          const delta = hit.offsetMinutes - placed.pointerAtGrab;
          const raw = placed.startAtGrab + delta;
          const startOffset = hit.resolveStart
            ? hit.resolveStart(raw, placed.amount, placed.segmentId)
            : hit.snap(raw, placed.amount);
          externalApi()?.move?.({
            lineId: placed.lineId,
            segmentId: placed.segmentId,
            startOffset,
            amount: placed.amount,
          });
          return;
        }

        if (!placed) {
          if (faceHit && pt) {
            const pointer = angleFromPointer(
              CLOCK_CENTER.cx,
              CLOCK_CENTER.cy,
              pt.x,
              pt.y,
            );
            remountOnClock(pointer);
            return;
          }
          const hit = externalApi()?.hitTest?.(e.clientX, e.clientY);
          if (hit) {
            if (lineDwellId !== hit.lineId || lineDwellTimer == null) {
              clearLineDwell();
              lineDwellId = hit.lineId;
              lineDwellTimer = setTimeout(() => {
                lineDwellTimer = null;
                if (placed || mode !== 'free') return;
                const still = externalApi()?.hitTest?.(
                  lastClientX,
                  lastClientY,
                );
                if (!still || still.lineId !== hit.lineId) return;
                const ptNow = clientToSvgPoint(svg, lastClientX, lastClientY);
                if (ptNow && nearFace(ptNow)) return;
                const placedSeg = externalApi()?.place?.({
                  lineId: still.lineId,
                  startOffset: still.offsetMinutes,
                  ring,
                  amount: amountMinutes,
                  label: String(label),
                });
                if (!placedSeg) return;
                placed = {
                  kind: 'line',
                  lineId: still.lineId,
                  segmentId: placedSeg.id,
                  amount: amountMinutes,
                  pointerAtGrab: still.offsetMinutes,
                  startAtGrab: placedSeg.startOffset,
                };
                setChipGhost(null);
              }, NUMBER_LINE_DWELL_MS);
            }
          } else {
            clearLineDwell();
          }
        }
      };

      const onUp = () => {
        clearLineDwell();
        try {
          target.releasePointerCapture?.(event.pointerId);
        } catch {
          /* already released */
        }
        if (!moved) {
          const additive = event.shiftKey || event.metaKey;
          setSelectedWedgeIds((prev) => {
            if (additive) {
              return prev.includes(clockWedgeId)
                ? prev.filter((id) => id !== clockWedgeId)
                : [...prev, clockWedgeId];
            }
            return [clockWedgeId];
          });
          // Anchor refreshed in layout effect from selected ids.
        } else if (
          mode === 'free' &&
          !placed &&
          typeof onDeskBlockDrop === 'function'
        ) {
          onDeskBlockDrop({
            ring,
            amount: amountMinutes,
            label: String(label),
            color,
            width,
            height,
            clientX: lastClientX,
            clientY: lastClientY,
          });
        }
        endWedgeDrag();
      };

      endWedgeDrag();
      endDrag();
      endChipDrag();
      wedgeDragRef.current = {
        onMove,
        onUp,
        clearDwell: clearLineDwell,
      };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [
      wedges,
      endWedgeDrag,
      endDrag,
      endChipDrag,
      externalChipDropRef,
      onDeskBlockDrop,
    ],
  );

  useEffect(() => () => endWedgeDrag(), [endWedgeDrag]);

  useLayoutEffect(() => {
    if (!selectedWedgeIds.length) {
      setWedgeDeleteAnchor(null);
      return;
    }
    const wrap = svgWrapRef.current;
    const anchor = wedgeSelectionAnchor(wrap, selectedWedgeIds);
    setWedgeDeleteAnchor(anchor);
  }, [selectedWedgeIds, wedges]);

  useEffect(() => {
    if (!selectedWedgeIds.length) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedWedgeIds([]);
        setWedgeDeleteAnchor(null);
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectedWedgeIds.length
      ) {
        const remove = new Set(selectedWedgeIds);
        setWedges((prev) => prev.filter((w) => !remove.has(w.id)));
        setSelectedWedgeIds([]);
        setWedgeDeleteAnchor(null);
      }
    };
    const onPointer = (e) => {
      if (e.target?.closest?.('[data-wedge-delete]')) return;
      if (e.target?.closest?.('[data-wedge-id]')) return;
      if (e.target?.closest?.('[data-wedge-marquee]')) return;
      setSelectedWedgeIds([]);
      setWedgeDeleteAnchor(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, [selectedWedgeIds]);

  useEffect(() => {
    if (!selectedWedgeIds.length) return;
    const alive = new Set(wedges.map((w) => w.id));
    const next = selectedWedgeIds.filter((id) => alive.has(id));
    if (next.length !== selectedWedgeIds.length) {
      setSelectedWedgeIds(next);
      if (!next.length) setWedgeDeleteAnchor(null);
    }
  }, [wedges, selectedWedgeIds]);

  const wedgeMarqueeRef = useRef(null);

  const beginWedgeMarquee = useCallback((event) => {
    if (event.button != null && event.button !== 0) return;
    if (event.target?.closest?.('[data-wedge-id]')) return;
    // Hands / tools stopPropagation; empty face / chrome reaches here.
    event.preventDefault();
    const originX = event.clientX;
    const originY = event.clientY;
    const additive = event.shiftKey || event.metaKey;
    let moved = false;
    const wrap = svgWrapRef.current;
    wrap?.setPointerCapture?.(event.pointerId);

    setWedgeMarquee({ x0: originX, y0: originY, x1: originX, y1: originY });
    if (!additive) {
      setSelectedWedgeIds([]);
      setWedgeDeleteAnchor(null);
    }

    const onMove = (e) => {
      e.preventDefault();
      if (
        !moved &&
        Math.hypot(e.clientX - originX, e.clientY - originY) >= CLICK_MOVE_PX
      ) {
        moved = true;
      }
      setWedgeMarquee({
        x0: originX,
        y0: originY,
        x1: e.clientX,
        y1: e.clientY,
      });
    };

    const onUp = (e) => {
      try {
        wrap?.releasePointerCapture?.(event.pointerId);
      } catch {
        /* already released */
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      wedgeMarqueeRef.current = null;

      const box = {
        left: Math.min(originX, e.clientX),
        top: Math.min(originY, e.clientY),
        right: Math.max(originX, e.clientX),
        bottom: Math.max(originY, e.clientY),
      };
      setWedgeMarquee(null);

      if (!moved) {
        if (!additive) {
          setSelectedWedgeIds([]);
          setWedgeDeleteAnchor(null);
        }
        return;
      }

      const hit = [];
      wrap?.querySelectorAll?.('[data-wedge-id]')?.forEach((el) => {
        const id = el.getAttribute('data-wedge-id');
        if (!id) return;
        const r = el.getBoundingClientRect();
        if (rectsIntersect(box, r)) hit.push(id);
      });

      setSelectedWedgeIds((prev) => {
        if (!additive) return hit;
        const merged = new Set([...prev, ...hit]);
        return [...merged];
      });
    };

    wedgeMarqueeRef.current = { onMove, onUp };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, []);

  const digitalDragRef = useRef(null);

  const endDigitalDrag = useCallback(() => {
    const drag = digitalDragRef.current;
    if (!drag) return;
    digitalDragRef.current = null;
    window.removeEventListener('pointermove', drag.onMove);
    window.removeEventListener('pointerup', drag.onUp);
    window.removeEventListener('pointercancel', drag.onUp);
  }, []);

  const beginDigitalDrag = useCallback(
    (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const wrap = clockStackRef.current;
      const el = digitalRef.current;
      if (!wrap || !el) return;

      const originX = event.clientX;
      const originY = event.clientY;
      let moved = false;
      let grabX = 0;
      let grabY = 0;

      el.setPointerCapture?.(event.pointerId);

      const onMove = (e) => {
        e.preventDefault();
        const dx = e.clientX - originX;
        const dy = e.clientY - originY;
        if (!moved) {
          if (Math.hypot(dx, dy) < CHIP_CLICK_MOVE_PX) return;
          moved = true;
          const wrapRect = wrap.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const scaleX = wrapRect.width / Math.max(wrap.offsetWidth, 1);
          const scaleY = wrapRect.height / Math.max(wrap.offsetHeight, 1);
          grabX = (originX - elRect.left) / scaleX;
          grabY = (originY - elRect.top) / scaleY;
          setDigitalPos({
            x: (elRect.left - wrapRect.left) / scaleX,
            y: (elRect.top - wrapRect.top) / scaleY,
          });
        }
        const wr = wrap.getBoundingClientRect();
        const sx = wr.width / Math.max(wrap.offsetWidth, 1);
        const sy = wr.height / Math.max(wrap.offsetHeight, 1);
        setDigitalPos({
          x: (e.clientX - wr.left) / sx - grabX,
          y: (e.clientY - wr.top) / sy - grabY,
        });
      };
      const onUp = () => {
        try {
          el.releasePointerCapture?.(event.pointerId);
        } catch {
          /* already released */
        }
        const wasClick = !moved;
        endDigitalDrag();
        if (wasClick) setTimeModalOpen(true);
      };

      endDigitalDrag();
      digitalDragRef.current = { onMove, onUp };
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [endDigitalDrag],
  );

  useEffect(() => () => endDigitalDrag(), [endDigitalDrag]);

  useEffect(() => {
    if (typeof onFooterExtraChange !== 'function') return undefined;

    const toolBtn = toolBtnClass(isDarkMode);

    onFooterExtraChange(
      <>
        <span
          className={`h-5 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
          aria-hidden="true"
        />
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={mode}
          onChange={setModeSafe}
          options={MODE_OPTIONS}
        />
        <ClockShowMenu
          isDarkMode={isDarkMode}
          theme={theme}
          toolBtn={toolBtn}
          open={showMenuOpen}
          onOpenChange={setShowMenuOpen}
          showHourHand={showHourHand}
          showMinuteHand={showMinuteHand}
          showSecondHand={showSecondHand}
          showMinuteLabels={showMinuteLabels}
          showHourWedges={showHourWedges}
          showPastTo={showPastTo}
          showQuarters={showQuarters}
          showDigital={showDigital}
          showAmPm={showAmPm}
          showRomanNumerals={showRomanNumerals}
          rainbowBlocks={rainbowBlocks}
          faceStyle={faceStyle}
          hour24={hour24}
          showItems={showMenuItems}
          onToggleHour={() => setShowHourHand((v) => !v)}
          onToggleMinute={() => setShowMinuteHand((v) => !v)}
          onToggleSecond={() => setShowSecondHand((v) => !v)}
          onToggleLabels={() => setShowMinuteLabels((v) => !v)}
          onToggleRoman={() => setShowRomanNumerals((v) => !v)}
          onToggleHourWedges={() => {
            setShowHourWedges((v) => {
              const next = !v;
              if (next) {
                setShowPastTo(false);
                setShowQuarters(false);
              }
              return next;
            });
          }}
          onTogglePastTo={() => {
            setShowPastTo((v) => {
              const next = !v;
              if (next) {
                setShowQuarters(false);
                setShowHourWedges(false);
              }
              return next;
            });
          }}
          onToggleQuarters={() => {
            setShowQuarters((v) => {
              const next = !v;
              if (next) {
                setShowPastTo(false);
                setShowHourWedges(false);
              }
              return next;
            });
          }}
          onToggleDigital={() => {
            setShowDigital((v) => {
              const next = !v;
              if (next) setDigitalPos(null);
              return next;
            });
          }}
          onToggleAmPm={() => setShowAmPm((v) => !v)}
          onToggleHour24={() =>
            setHourCycle((c) => (c === '24' ? '12' : '24'))
          }
          onToggleRainbow={() => setRainbowBlocks((v) => !v)}
          onFaceStyleChange={setFaceStyleSafe}
        />
        <button
          type="button"
          onClick={resetTime}
          className={toolBtn}
          title={
            hour24
              ? showSecondHand
                ? 'Reset time to 00:00:00'
                : 'Reset time to 00:00'
              : showSecondHand
                ? 'Reset time to 12:00:00'
                : 'Reset time to 12:00'
          }
          aria-label={
            hour24
              ? showSecondHand
                ? 'Reset time to 00:00:00'
                : 'Reset time to 00:00'
              : showSecondHand
                ? 'Reset time to 12:00:00'
                : 'Reset time to 12:00'
          }
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          <span>Reset Clock</span>
        </button>
      </>,
    );

    return () => onFooterExtraChange(null);
  }, [
    isDarkMode,
    theme,
    mode,
    faceStyle,
    hourCycle,
    hour24,
    showMenuOpen,
    showHourHand,
    showMinuteHand,
    showSecondHand,
    showMinuteLabels,
    showHourWedges,
    showHourBlocks,
    showPastTo,
    showQuarters,
    showDigital,
    showAmPm,
    showRomanNumerals,
    rainbowBlocks,
    showMinuteWedges,
    onFooterExtraChange,
    setModeSafe,
    setFaceStyleSafe,
    resetTime,
  ]);

  return (
    <div
      ref={clockStackRef}
      className="relative flex flex-col items-center justify-center"
    >
      <div
        ref={svgWrapRef}
        className="relative h-[864px] w-[864px] max-h-[min(864px,90%)] max-w-[min(864px,90%)]"
        role="img"
        aria-label={`Teaching clock showing ${digitalLabel}, ${mode} mode`}
        onPointerDown={beginWedgeMarquee}
        data-wedge-marquee=""
      >
        <TeachingClockFace
          hourAngle={hourAngle}
          minuteAngle={minuteAngle}
          secondAngle={secondAngle}
          showHourHand={showHourHand}
          showMinuteHand={showMinuteHand}
          showSecondHand={showSecondHand}
          showMinuteLabels={showMinuteLabels}
          showHourWedges={showHourBlocks}
          showPastTo={showPastTo}
          showQuarters={showQuarters}
          showMinuteWedges={showMinuteWedges}
          rainbowBlocks={showMinuteWedges && rainbowBlocks}
          showRomanNumerals={showRomanNumerals}
          hour24={hour24}
          isPm={meridiem === 'PM'}
          isDarkMode={isDarkMode}
          wedges={wedges}
          selectedWedgeIds={selectedWedgeIds}
          activeHand={activeHand}
          onHourPointerDown={(e) => beginDrag('hour', e)}
          onMinutePointerDown={(e) => beginDrag('minute', e)}
          onSecondPointerDown={(e) => beginDrag('second', e)}
          onWedgePointerDown={beginWedgeDrag}
        />
      </div>
      {showDigital ? (
        <div
          ref={digitalRef}
          role="group"
          aria-label="Digital time — click to set, drag to move"
          title="Click to set time · drag to move"
          onPointerDown={beginDigitalDrag}
          className={`edu-control absolute z-10 cursor-grab touch-none select-none rounded-2xl border-[1.5px] px-4 py-2 active:cursor-grabbing ${theme.colorSurface} ${theme.colorOutline}`}
          style={
            digitalPos
              ? { left: digitalPos.x, top: digitalPos.y }
              : {
                  /* Captured default: above-face, in view (stack-local). */
                  left: '50%',
                  top: 38.56,
                  transform: 'translateX(-50%)',
                }
          }
        >
          <p
            className={`flex items-baseline gap-2 tabular-nums ${TYPE.displayMd} ${theme.colorOnSurface}`}
            aria-live="polite"
          >
            <span>{digital}</span>
            {showAmPm ? (
              <button
                type="button"
                className={`edu-control font-medium tracking-wide ${theme.colorOnSurfaceVariant} hover:opacity-80`}
                aria-label={`Switch to ${meridiem === 'AM' ? 'PM' : 'AM'}`}
                title={`Switch to ${meridiem === 'AM' ? 'PM' : 'AM'}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={toggleMeridiem}
              >
                {meridiem}
              </button>
            ) : null}
          </p>
        </div>
      ) : null}
      <TeachingClockTimeModal
        isOpen={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        onApply={applyTypedTime}
        isDarkMode={isDarkMode}
        theme={theme}
        hour24={hour24}
        initialHours={timeParts.hours}
        initialMinutes={timeParts.minutes}
        initialSeconds={digitalSeconds}
        initialMeridiem={meridiem}
      />
      {chipGhost
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[400] flex items-center justify-center rounded-2xl border-[1.5px] text-sm font-bold leading-none text-white shadow-lg sm:text-lg"
              style={{
                left: chipGhost.x,
                top: chipGhost.y,
                width: chipGhost.width,
                height: chipGhost.height,
                backgroundColor: chipGhost.color,
                borderColor: chipGhost.color,
              }}
              aria-hidden="true"
            >
              {chipGhost.label}
            </div>,
            document.body,
          )
        : null}
      {selectedWedgeIds.length > 0 && wedgeDeleteAnchor
        ? createPortal(
            <button
              type="button"
              data-wedge-delete=""
              className={`edu-control fixed z-[400] inline-flex h-9 w-9 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-[1.5px] shadow-lg ${theme.colorErrorContainer} ${theme.colorOnErrorContainer} ${theme.colorOutline}`}
              style={{
                left: wedgeDeleteAnchor.x,
                top: wedgeDeleteAnchor.y - 6,
              }}
              title={
                selectedWedgeIds.length > 1
                  ? `Remove ${selectedWedgeIds.length} blocks`
                  : 'Remove block'
              }
              aria-label={
                selectedWedgeIds.length > 1
                  ? `Remove ${selectedWedgeIds.length} blocks`
                  : 'Remove block'
              }
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const remove = new Set(selectedWedgeIds);
                setWedges((prev) => prev.filter((w) => !remove.has(w.id)));
                setSelectedWedgeIds([]);
                setWedgeDeleteAnchor(null);
              }}
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>,
            document.body,
          )
        : null}
      {wedgeMarquee
        ? createPortal(
            <div
              data-wedge-marquee=""
              className="pointer-events-none fixed z-[350] border-2 border-dashed border-slate-700/70 bg-slate-500/15"
              style={{
                left: Math.min(wedgeMarquee.x0, wedgeMarquee.x1),
                top: Math.min(wedgeMarquee.y0, wedgeMarquee.y1),
                width: Math.abs(wedgeMarquee.x1 - wedgeMarquee.x0),
                height: Math.abs(wedgeMarquee.y1 - wedgeMarquee.y0),
              }}
              aria-hidden
            />,
            document.body,
          )
        : null}
    </div>
  );
});
