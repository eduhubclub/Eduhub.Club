import { useEffect, useId, useRef, useState } from 'react';
import { Ruler } from 'lucide-react';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  LEARNING_DESK_HEIGHT,
  LEARNING_DESK_WIDTH,
  LearningZoomStage,
} from '../components/LearningZoomStage';
import {
  MINUTE_CHIPS,
  TeachingClock,
} from '../clock/TeachingClock';
import {
  HOUR_INK,
  MINUTE_INK,
} from '../clock/TeachingClockFace';
import {
  preferredNumberLineWidth,
  resolveNumberLineSegmentStart,
  snapNumberLineOffset,
  TimeNumberLine,
} from '../clock/TimeNumberLine';
import {
  numberLineSpanMinutes,
  TimeNumberLineModal,
} from '../clock/TimeNumberLineModal';

/** M3 48dp touch height; custom widths — 1 smallest → hour largest, inline-friendly. */
const CHIP_H = 48;
const MINUTE_CHIP_W = {
  1: 48,
  5: 56,
  10: 68,
  15: 80,
  30: 96,
};
const HOUR_CHIP_W = 112;

const chipBtn =
  'edu-control inline-flex shrink-0 cursor-grab items-center justify-center rounded-2xl border-[1.5px] ' +
  'touch-none text-sm font-bold leading-none text-white hover:opacity-90 active:cursor-grabbing transition-opacity ' +
  'sm:text-lg';

function nextLineId() {
  return `nl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextSegmentId() {
  return `nls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextDeskBlockId() {
  return `db-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Clock manipulative desk — hosted by MathTools
 */
export function ClockWidget({
  isDarkMode,
  theme,
  onShellFooterActiveChange,
}) {
  const [footerExtra, setFooterExtra] = useState(null);
  const clockRef = useRef(null);
  const idPrefix = useId();
  const [numberLines, setNumberLines] = useState([]);
  const [deskBlocks, setDeskBlocks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const lineApiRefs = useRef(new Map());
  const externalChipDropRef = useRef(null);
  const numberLinesRef = useRef(numberLines);
  numberLinesRef.current = numberLines;
  const deskSurfaceRef = useRef(null);

  const editingLine = numberLines.find((l) => l.id === editingId) ?? null;

  externalChipDropRef.current = {
    hitTest: (clientX, clientY, opts) => {
      const lines = numberLinesRef.current;
      for (const line of lines) {
        const api = lineApiRefs.current.get(line.id);
        const hit = api?.hitTest?.(clientX, clientY, opts);
        if (!hit) continue;
        const span =
          hit.span ??
          numberLineSpanMinutes(line.startMinutes, line.endMinutes);
        const tick = hit.tickMinutes ?? line.tickMinutes ?? 5;
        return {
          lineId: line.id,
          offsetMinutes: hit.offsetMinutes,
          span,
          tickMinutes: tick,
          snap: (offset, amount) =>
            snapNumberLineOffset(offset, tick, span, amount),
          resolveStart: (offset, amount, excludeId = null) => {
            const live =
              numberLinesRef.current.find((l) => l.id === line.id)
                ?.segments ?? [];
            return resolveNumberLineSegmentStart(
              offset,
              amount,
              live,
              span,
              tick,
              excludeId,
            );
          },
        };
      }
      return null;
    },
    place: ({ lineId, startOffset, ring, amount, label }) => {
      const id = nextSegmentId();
      let resolved = startOffset;
      setNumberLines((prev) => {
        const line = prev.find((l) => l.id === lineId);
        if (!line) return prev;
        const span = numberLineSpanMinutes(
          line.startMinutes,
          line.endMinutes,
        );
        resolved = resolveNumberLineSegmentStart(
          startOffset,
          amount,
          line.segments ?? [],
          span,
          line.tickMinutes,
        );
        return prev.map((l) =>
          l.id === lineId
            ? {
                ...l,
                segments: [
                  ...(l.segments ?? []),
                  {
                    id,
                    startOffset: resolved,
                    ring,
                    amount,
                    label,
                  },
                ],
              }
            : l,
        );
      });
      return { id, startOffset: resolved };
    },
    move: ({ lineId, segmentId, startOffset, amount }) => {
      setNumberLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line;
          const span = numberLineSpanMinutes(
            line.startMinutes,
            line.endMinutes,
          );
          const seg = (line.segments ?? []).find((s) => s.id === segmentId);
          const amt = amount ?? seg?.amount ?? 1;
          const resolved = resolveNumberLineSegmentStart(
            startOffset,
            amt,
            line.segments ?? [],
            span,
            line.tickMinutes,
            segmentId,
          );
          return {
            ...line,
            segments: (line.segments ?? []).map((s) =>
              s.id === segmentId ? { ...s, startOffset: resolved } : s,
            ),
          };
        }),
      );
    },
    remove: ({ lineId, segmentId }) => {
      setNumberLines((prev) =>
        prev.map((line) =>
          line.id === lineId
            ? {
                ...line,
                segments: (line.segments ?? []).filter(
                  (s) => s.id !== segmentId,
                ),
              }
            : line,
        ),
      );
    },
  };

  const openCreateModal = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const clientToDeskPoint = (clientX, clientY, blockW, blockH) => {
    const el = deskSurfaceRef.current;
    if (!el) {
      return {
        x: LEARNING_DESK_WIDTH / 2 - blockW / 2,
        y: LEARNING_DESK_HEIGHT / 2 - blockH / 2,
      };
    }
    const rect = el.getBoundingClientRect();
    const sx = rect.width / Math.max(el.offsetWidth, 1);
    const sy = rect.height / Math.max(el.offsetHeight, 1);
    return {
      x: (clientX - rect.left) / sx - blockW / 2,
      y: (clientY - rect.top) / sy - blockH / 2,
    };
  };

  const handleDeskBlockDrop = ({
    ring,
    amount,
    label,
    color,
    width,
    height,
    clientX,
    clientY,
  }) => {
    const pos = clientToDeskPoint(clientX, clientY, width, height);
    setDeskBlocks((prev) => [
      ...prev,
      {
        id: nextDeskBlockId(),
        ring,
        amount,
        label,
        color,
        width,
        height,
        x: pos.x,
        y: pos.y,
      },
    ]);
  };

  const beginDeskBlockDrag = (block, event) => {
    setDeskBlocks((prev) => prev.filter((b) => b.id !== block.id));
    clockRef.current?.beginChipDrag?.({
      ring: block.ring,
      amount: block.ring === 'hour' ? 1 : block.amount,
      label: block.label,
      color: block.color,
      width: block.width,
      height: block.height,
      event,
    });
  };

  const handleSegmentLiftOff = ({
    id,
    ring,
    amount,
    label,
    clientX,
    clientY,
  }) => {
    setNumberLines((prev) =>
      prev.map((line) => ({
        ...line,
        segments: (line.segments ?? []).filter((seg) => seg.id !== id),
      })),
    );
    const color = ring === 'hour' ? HOUR_INK : MINUTE_INK;
    const width =
      ring === 'hour'
        ? HOUR_CHIP_W
        : (MINUTE_CHIP_W[amount] ?? Math.max(48, 40 + (Number(amount) || 0)));
    clockRef.current?.beginChipDrag?.({
      ring,
      amount: ring === 'hour' ? 1 : amount,
      label: String(label ?? amount),
      color,
      width,
      height: CHIP_H,
      resume: { clientX, clientY },
    });
  };

  const openEditModal = (id) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const applyNumberLine = ({
    startMinutes,
    endMinutes,
    tickMinutes,
    matchAnalog = false,
  }) => {
    const width = preferredNumberLineWidth(
      startMinutes,
      endMinutes,
      tickMinutes,
    );
    if (editingId) {
      setNumberLines((prev) =>
        prev.map((line) =>
          line.id === editingId
            ? {
                ...line,
                startMinutes,
                endMinutes,
                tickMinutes,
                matchAnalog,
                width,
              }
            : line,
        ),
      );
    } else {
      setNumberLines((prev) => [
        ...prev,
        {
          id: `${idPrefix}-${nextLineId()}`,
          startMinutes,
          endMinutes,
          tickMinutes,
          matchAnalog,
          width,
          x: Math.round((LEARNING_DESK_WIDTH - width) / 2),
          y: Math.round(LEARNING_DESK_HEIGHT * 0.72),
          segments: [],
        },
      ]);
    }
    setModalOpen(false);
    setEditingId(null);
  };

  useEffect(() => {
    const lines = numberLines;
    const sync = clockRef.current?.syncLinkedNumberLine;
    if (!sync) return;
    for (const line of lines) {
      sync({
        lineId: line.id,
        matchAnalog: Boolean(line.matchAnalog),
        startMinutes: line.startMinutes,
        segments: line.segments ?? [],
      });
    }
  }, [numberLines]);

  const footerSecondary = (
    <>
      {MINUTE_CHIPS.map((m) => {
        const width = MINUTE_CHIP_W[m];
        return (
          <button
            key={`min-chip-${m}`}
            type="button"
            onPointerDown={(event) =>
              clockRef.current?.beginChipDrag?.({
                ring: 'minute',
                amount: m,
                label: String(m),
                color: MINUTE_INK,
                width,
                height: CHIP_H,
                event,
              })
            }
            className={chipBtn}
            style={{
              backgroundColor: MINUTE_INK,
              borderColor: MINUTE_INK,
              width,
              height: CHIP_H,
              minWidth: CHIP_H,
            }}
            title={`Add ${m} minute${m === 1 ? '' : 's'} — drag onto clock or number line`}
            aria-label={`Add ${m} minute${m === 1 ? '' : 's'}`}
          >
            {m}
          </button>
        );
      })}
      <span
        className={`mx-1 h-8 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onPointerDown={(event) =>
          clockRef.current?.beginChipDrag?.({
            ring: 'hour',
            amount: 1,
            label: '+1',
            color: HOUR_INK,
            width: HOUR_CHIP_W,
            height: CHIP_H,
            event,
          })
        }
        className={chipBtn}
        style={{
          backgroundColor: HOUR_INK,
          borderColor: HOUR_INK,
          width: HOUR_CHIP_W,
          height: CHIP_H,
          minWidth: CHIP_H,
        }}
        title="Add 1 hour — drag onto clock or number line"
        aria-label="Add 1 hour"
      >
        +1
      </button>
    </>
  );

  const toolBtn = toolBtnClass(isDarkMode);
  const footerTrailing = (
    <button
      type="button"
      onClick={openCreateModal}
      className={toolBtn}
      title="Add time number line"
      aria-label="Add time number line"
    >
      <Ruler size={16} strokeWidth={2.5} />
      <span>Number Line</span>
    </button>
  );

  return (
    <div className="relative flex flex-1 min-h-0 flex-col">
      <LearningZoomStage
        isDarkMode={isDarkMode}
        theme={theme}
        onShellFooterActiveChange={onShellFooterActiveChange}
        footerExtra={footerExtra}
        footerTrailing={footerTrailing}
        footerSecondary={footerSecondary}
      >
        <div ref={deskSurfaceRef} className="relative h-full w-full">
          <div className="flex h-full w-full items-center justify-center p-10">
            <TeachingClock
              ref={clockRef}
              isDarkMode={isDarkMode}
              theme={theme}
              onFooterExtraChange={setFooterExtra}
              externalChipDropRef={externalChipDropRef}
              onDeskBlockDrop={handleDeskBlockDrop}
            />
          </div>
          {deskBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onPointerDown={(event) => beginDeskBlockDrag(block, event)}
              className={chipBtn}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                zIndex: 25,
                backgroundColor: block.color,
                borderColor: block.color,
                width: block.width,
                height: block.height,
                minWidth: block.height,
              }}
              title="Drag onto clock or number line"
              aria-label={`${block.label} minute block`}
            >
              {block.label}
            </button>
          ))}
          {numberLines.map((line) => (
            <TimeNumberLine
              key={line.id}
              ref={(api) => {
                if (api) lineApiRefs.current.set(line.id, api);
                else lineApiRefs.current.delete(line.id);
              }}
              startMinutes={line.startMinutes}
              endMinutes={line.endMinutes}
              tickMinutes={line.tickMinutes}
              x={line.x}
              y={line.y}
              width={line.width}
              theme={theme}
              segments={line.segments ?? []}
              onPositionChange={({ x, y }) =>
                setNumberLines((prev) =>
                  prev.map((l) => (l.id === line.id ? { ...l, x, y } : l)),
                )
              }
              onEdit={() => openEditModal(line.id)}
              onRemove={() => {
                clockRef.current?.syncLinkedNumberLine?.({
                  lineId: line.id,
                  matchAnalog: false,
                  segments: [],
                });
                setNumberLines((prev) =>
                  prev.filter((l) => l.id !== line.id),
                );
              }}
              onSegmentMove={(segmentId, startOffset) =>
                setNumberLines((prev) =>
                  prev.map((l) =>
                    l.id === line.id
                      ? {
                          ...l,
                          segments: (l.segments ?? []).map((seg) =>
                            seg.id === segmentId
                              ? { ...seg, startOffset }
                              : seg,
                          ),
                        }
                      : l,
                  ),
                )
              }
              onSegmentRemove={(segmentId) =>
                setNumberLines((prev) =>
                  prev.map((l) =>
                    l.id === line.id
                      ? {
                          ...l,
                          segments: (l.segments ?? []).filter(
                            (seg) => seg.id !== segmentId,
                          ),
                        }
                      : l,
                  ),
                )
              }
              onSegmentLiftOff={handleSegmentLiftOff}
            />
          ))}
        </div>
      </LearningZoomStage>

      <TimeNumberLineModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onApply={applyNumberLine}
        isDarkMode={isDarkMode}
        theme={theme}
        isEditing={Boolean(editingLine)}
        initialStartMinutes={editingLine?.startMinutes ?? 9 * 60}
        initialEndMinutes={editingLine?.endMinutes ?? 10 * 60}
        initialTickMinutes={editingLine?.tickMinutes ?? 5}
        initialMatchAnalog={editingLine?.matchAnalog ?? false}
      />
    </div>
  );
}
