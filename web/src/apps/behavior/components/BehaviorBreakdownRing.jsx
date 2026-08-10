import { useEffect, useMemo, useState } from 'react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 92;
const R_INNER = 58;
const LIFT = 10;
/** Midline radius + stroke for full-circle rings (keeps width while `r` animates). */
const RING_MID = (R_OUTER + R_INNER) / 2;
const RING_STROKE = R_OUTER - R_INNER;
const RING_EXPAND_MS = 220;
const TOP_BEHAVIORS = 5;
const TOP_STUDENTS = 5;

/** Light → medium → dark within each tone so abutting segments stay distinct. */
const POSITIVE_SHADES = ['#6ee7b7', '#34d399', '#059669'];
const POSITIVE_ACTIVE = ['#34d399', '#10b981', '#047857'];
const NEGATIVE_SHADES = ['#fda4af', '#fb7185', '#e11d48'];
const NEGATIVE_ACTIVE = ['#fb7185', '#f43f5e', '#be123c'];

function shadeFor(positive, shadeIndex, active) {
  const palette = positive
    ? active
      ? POSITIVE_ACTIVE
      : POSITIVE_SHADES
    : active
      ? NEGATIVE_ACTIVE
      : NEGATIVE_SHADES;
  return palette[shadeIndex % palette.length];
}

/** Pick light/medium/dark so no two neighbors (including first↔last) share a shade. */
function assignShadeIndexes(segments) {
  const n = segments.length;
  const shades = new Array(n).fill(0);
  if (n === 0) return shades;

  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? shades[i - 1] : null;
    let pick = i % 3;
    if (prev != null && pick === prev) pick = (pick + 1) % 3;
    shades[i] = pick;
  }

  if (n > 1 && shades[0] === shades[n - 1]) {
    const before = shades[n - 2];
    for (const tryShade of [0, 1, 2]) {
      if (tryShade !== shades[0] && tryShade !== before) {
        shades[n - 1] = tryShade;
        break;
      }
    }
  }

  return shades;
}

function polar(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function donutSlicePath(startAngle, endAngle, outerR, innerR) {
  const sweep = endAngle - startAngle;
  // SVG arcs can't draw a true full circle in one A command — use two halves.
  if (sweep >= Math.PI * 2 - 1e-6) {
    return [
      `M ${CX} ${CY - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${CX} ${CY + outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${CX} ${CY - outerR}`,
      `M ${CX} ${CY - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${CX} ${CY + innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${CX} ${CY - innerR}`,
      'Z',
    ].join(' ');
  }
  const large = sweep > Math.PI ? 1 : 0;
  const o0 = polar(CX, CY, outerR, startAngle);
  const o1 = polar(CX, CY, outerR, endAngle);
  const i0 = polar(CX, CY, innerR, endAngle);
  const i1 = polar(CX, CY, innerR, startAngle);
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o1.x} ${o1.y}`,
    `L ${i0.x} ${i0.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

function segmentKey(entry) {
  const pts = Number(entry.behavior?.points) || 0;
  return (
    entry.behavior?.id ||
    `${entry.behavior?.name || 'behavior'}:${pts > 0 ? 'pos' : 'neg'}`
  );
}

function buildSegments(rows) {
  const map = new Map();
  for (const entry of rows || []) {
    const pts = Number(entry.behavior?.points) || 0;
    if (pts === 0) continue;
    const weight = Math.max(
      1,
      Number(entry.count) || entry.studentIds?.length || 1,
    );
    const key = segmentKey(entry);
    const prev = map.get(key);
    if (prev) {
      prev.weight += weight;
      prev.awards += 1;
      continue;
    }
    map.set(key, {
      id: key,
      name: entry.behavior?.name || 'Behavior',
      icon: entry.behavior?.icon || (pts > 0 ? '⭐' : '⚠️'),
      points: pts,
      positive: pts > 0,
      weight,
      awards: 1,
    });
  }
  return [...map.values()].sort((a, b) => {
    // Positive block first (from 12:00), then needs-work — each by weight.
    if (a.positive !== b.positive) return a.positive ? -1 : 1;
    return b.weight - a.weight;
  });
}

function topBehaviorsByTone(segments, limit = TOP_BEHAVIORS) {
  const byWeight = (a, b) =>
    b.weight - a.weight || String(a.name).localeCompare(String(b.name));
  const positive = segments
    .filter((s) => s.positive)
    .sort(byWeight)
    .slice(0, limit);
  const negative = segments
    .filter((s) => !s.positive)
    .sort(byWeight)
    .slice(0, limit);
  return [...positive, ...negative];
}

function topStudentsForSegment(rows, segmentId, roster, limit = TOP_STUDENTS) {
  if (!segmentId) return [];
  const counts = new Map();
  for (const entry of rows || []) {
    if (segmentKey(entry) !== segmentId) continue;
    for (const sid of entry.studentIds || []) {
      const id = String(sid);
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => {
      const student =
        (roster || []).find((s) => String(s.id) === id) || {
          id,
          name: 'Student',
        };
      return { student, value: count };
    })
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return studentDisplayName(a.student).localeCompare(studentDisplayName(b.student));
    })
    .slice(0, limit);
}

/** Top students by net points from the filtered award rows. */
function topStudentsOverall(rows, roster, limit = TOP_STUDENTS) {
  const scores = new Map();
  for (const entry of rows || []) {
    const pts = Number(entry.behavior?.points) || 0;
    if (pts === 0) continue;
    for (const sid of entry.studentIds || []) {
      const id = String(sid);
      scores.set(id, (scores.get(id) || 0) + pts);
    }
  }
  return [...scores.entries()]
    .map(([id, points]) => {
      const student =
        (roster || []).find((s) => String(s.id) === id) || {
          id,
          name: 'Student',
        };
      return { student, value: points };
    })
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return studentDisplayName(a.student).localeCompare(studentDisplayName(b.student));
    })
    .slice(0, limit);
}

function formatOccurrenceWhen(at) {
  if (!at) return '';
  try {
    return new Date(at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Award events for a behavior segment, newest first. */
function occurrencesForSegment(rows, segmentId) {
  if (!segmentId) return [];
  const events = [];
  for (const entry of rows || []) {
    if (segmentKey(entry) !== segmentId) continue;
    events.push({
      id: entry.id,
      at: Number(entry.at) || 0,
      count: Math.max(
        1,
        Number(entry.count) || entry.studentIds?.length || 1,
      ),
    });
  }
  return events.sort((a, b) => b.at - a.at);
}

/**
 * Interactive donut of award behaviors.
 * Whole class: right column shows top students (pin a segment to filter).
 * By student: right column shows top positive / needs-work behaviors.
 *
 * Collapse is owned by the parent header via `open` / `onOpenChange`.
 */
export function BehaviorBreakdownRing({
  rows,
  roster = [],
  theme,
  isDarkMode,
  open = true,
  scope = 'class',
}) {
  const segments = useMemo(() => buildSegments(rows), [rows]);
  const [activeId, setActiveId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const [centerMode, setCenterMode] = useState('ratio'); // 'ratio' | 'points'

  useEffect(() => {
    setPinnedId(null);
    setActiveId(null);
  }, [segments]);

  const { arcs, positiveShare, totalPoints, totalWeight } = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.weight, 0);
    let pos = 0;
    let pointsSum = 0;
    for (const s of segments) {
      if (s.positive) pos += s.weight;
      pointsSum += s.points * s.weight;
    }
    let fromRows = 0;
    for (const entry of rows || []) {
      const pts = Number(entry.behavior?.points) || 0;
      if (pts === 0) continue;
      const n = Math.max(
        1,
        Number(entry.count) || entry.studentIds?.length || 1,
      );
      fromRows += pts * n;
    }
    if (total <= 0) {
      return {
        arcs: [],
        positiveShare: null,
        totalPoints: 0,
        totalWeight: 0,
      };
    }

    let angle = -Math.PI / 2;
    const shadeIndexes = assignShadeIndexes(segments);
    const built = segments.map((s, index) => {
      const sweep = (s.weight / total) * Math.PI * 2;
      const start = angle;
      const end = angle + Math.max(sweep, 0);
      const mid = (start + end) / 2;
      angle = end;
      return { ...s, start, end, mid, shadeIndex: shadeIndexes[index] };
    });

    return {
      arcs: built,
      positiveShare: Math.round((pos / total) * 100),
      totalPoints: fromRows || pointsSum,
      totalWeight: total,
    };
  }, [segments, rows]);

  const byStudent = scope === 'student';
  const pinned = arcs.find((a) => a.id === pinnedId) || null;

  const topBehaviors = useMemo(
    () => (byStudent ? topBehaviorsByTone(segments) : []),
    [byStudent, segments],
  );

  const occurrences = useMemo(
    () =>
      byStudent && pinnedId
        ? occurrencesForSegment(rows, pinnedId)
        : [],
    [byStudent, pinnedId, rows],
  );

  const leaders = useMemo(
    () =>
      byStudent
        ? []
        : pinnedId
          ? topStudentsForSegment(rows, pinnedId, roster)
          : topStudentsOverall(rows, roster),
    [byStudent, rows, pinnedId, roster],
  );

  if (!open) return null;

  if (totalWeight === 0) {
    return (
      <div className="relative px-5 py-5 sm:px-6">
        <p
          className={`py-3 text-center ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}
        >
          No awards in this range to chart yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative px-5 py-5 sm:px-6">
      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-[auto_minmax(12rem,1fr)] sm:gap-6">
          <div className="flex items-center justify-center sm:justify-start">
            <div className="relative shrink-0">
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label="Positive versus needs-work behavior breakdown"
              >
                {/* Hit target for empty corners — clears a pinned segment. */}
                <rect
                  width={SIZE}
                  height={SIZE}
                  fill="transparent"
                  aria-hidden
                  onClick={() => setPinnedId(null)}
                />
                {arcs.map((arc) => {
                  const hovered = activeId === arc.id;
                  const isPinned = pinnedId === arc.id;
                  const on = hovered || isPinned;
                  const sweep = arc.end - arc.start;
                  const isFullRing = sweep >= Math.PI * 2 - 1e-6;
                  // Pin expands from center (same easing as the full-ring case).
                  const lift = isPinned ? LIFT : 0;
                  const expand = lift > 0 ? (RING_MID + lift) / RING_MID : 1;
                  const fill = shadeFor(arc.positive, arc.shadeIndex, on);
                  const shared = {
                    onMouseEnter: () => setActiveId(arc.id),
                    onMouseLeave: () => setActiveId(null),
                    onClick: (e) => {
                      e.stopPropagation();
                      setPinnedId((prev) => (prev === arc.id ? null : arc.id));
                    },
                    onFocus: () => setActiveId(arc.id),
                    onBlur: () => setActiveId(null),
                    tabIndex: 0,
                    role: 'button',
                    'aria-pressed': isPinned,
                    'aria-label': `${arc.icon} ${arc.name}, ${arc.weight} award${
                      arc.weight === 1 ? '' : 's'
                    }`,
                  };
                  // Full ring: scale from center; non-scaling-stroke keeps width constant.
                  if (isFullRing) {
                    return (
                      <circle
                        key={arc.id}
                        cx={CX}
                        cy={CY}
                        r={RING_MID}
                        fill="none"
                        stroke={fill}
                        strokeWidth={RING_STROKE}
                        vectorEffect="non-scaling-stroke"
                        style={{
                          transform: `scale(${expand})`,
                          transformOrigin: `${CX}px ${CY}px`,
                          transition: `transform ${RING_EXPAND_MS}ms ease-out, stroke 150ms ease-out`,
                          cursor: 'pointer',
                          filter:
                            hovered && !isPinned
                              ? 'brightness(1.06)'
                              : undefined,
                        }}
                        {...shared}
                      />
                    );
                  }
                  // Segments: break away along the slice midpoint (smoothed easing).
                  const dx = Math.cos(arc.mid) * lift;
                  const dy = Math.sin(arc.mid) * lift;
                  return (
                    <path
                      key={arc.id}
                      d={donutSlicePath(arc.start, arc.end, R_OUTER, R_INNER)}
                      fill={fill}
                      fillRule="evenodd"
                      style={{
                        transform: `translate(${dx}px, ${dy}px)`,
                        transition: `transform ${RING_EXPAND_MS}ms ease-out, fill 150ms ease-out`,
                        cursor: 'pointer',
                        filter:
                          hovered && !isPinned
                            ? 'brightness(1.06)'
                            : undefined,
                      }}
                      {...shared}
                    />
                  );
                })}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R_INNER - 2}
                  fill={isDarkMode ? '#0f172a' : '#ffffff'}
                />
                <foreignObject
                  x={CX - R_INNER + 6}
                  y={CY - R_INNER + 6}
                  width={(R_INNER - 6) * 2}
                  height={(R_INNER - 6) * 2}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <button
                      type="button"
                      className="edu-control flex h-full w-full flex-col items-center justify-center rounded-full border-0 bg-transparent p-0 text-center outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCenterMode((m) =>
                          m === 'ratio' ? 'points' : 'ratio',
                        );
                      }}
                      aria-label={
                        centerMode === 'ratio'
                          ? `${positiveShare}% positive. Show total points.`
                          : `${totalPoints} total points. Show positive percent.`
                      }
                    >
                      {centerMode === 'ratio' ? (
                        <>
                          <span
                            className={`block leading-none ${
                              isDarkMode ? 'text-slate-50' : 'text-slate-900'
                            }`}
                            style={{ fontSize: 28, fontWeight: 700 }}
                          >
                            {positiveShare}%
                          </span>
                          <span
                            className={`mt-1 block leading-none ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            positive
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className={`block leading-none ${
                              isDarkMode ? 'text-slate-50' : 'text-slate-900'
                            }`}
                            style={{ fontSize: 28, fontWeight: 700 }}
                          >
                            {totalPoints}
                          </span>
                          <span
                            className={`mt-1 block leading-none ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            points
                          </span>
                        </>
                      )}
                      <span
                        className="mt-2 flex items-center justify-center gap-1.5"
                        aria-hidden
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            centerMode === 'ratio'
                              ? isDarkMode
                                ? 'bg-slate-200'
                                : 'bg-slate-700'
                              : isDarkMode
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                          }`}
                        />
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            centerMode === 'points'
                              ? isDarkMode
                                ? 'bg-slate-200'
                                : 'bg-slate-700'
                              : isDarkMode
                                ? 'bg-slate-600'
                                : 'bg-slate-300'
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>

          <div
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border-[1.5px] lg:pr-0 ${theme.colorOutlineVariant}`}
            style={{ height: SIZE }}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
              {byStudent ? (
                pinned ? (
                  <>
                    <p
                      className={`shrink-0 truncate ${TYPE.titleMd} ${theme.colorOnSurface}`}
                    >
                      <span aria-hidden className="mr-1.5">
                        {pinned.icon}
                      </span>
                      {pinned.name}
                    </p>
                    <p
                      className={`mt-1 shrink-0 tabular-nums ${TYPE.labelLg} ${
                        pinned.positive
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      }`}
                    >
                      ×{pinned.weight}
                      <span
                        className={`ml-1.5 font-medium ${theme.colorOnSurfaceVariant}`}
                      >
                        {pinned.weight === 1 ? 'time' : 'times'}
                      </span>
                    </p>
                    {occurrences.length === 0 ? (
                      <p
                        className={`mt-4 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                      >
                        No dates found for this behavior.
                      </p>
                    ) : (
                      <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {occurrences.map((event) => (
                          <li
                            key={event.id}
                            className={`flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 ${
                              isDarkMode
                                ? 'hover:bg-slate-800/60'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <p
                              className={`min-w-0 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                            >
                              {formatOccurrenceWhen(event.at) || 'Unknown date'}
                            </p>
                            {event.count > 1 ? (
                              <p
                                className={`shrink-0 tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                              >
                                ×{event.count}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <>
                    <p
                      className={`shrink-0 truncate ${TYPE.titleMd} ${theme.colorOnSurface}`}
                    >
                      Top Behaviors
                    </p>
                    {topBehaviors.length === 0 ? (
                      <p
                        className={`mt-4 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                      >
                        No behaviors in this range yet.
                      </p>
                    ) : (
                      <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                        {topBehaviors.map((behavior, index) => {
                          const isPinned = pinnedId === behavior.id;
                          const label = `×${behavior.weight}`;
                          return (
                            <li key={behavior.id}>
                              <button
                                type="button"
                                className={`edu-control flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${
                                  isPinned
                                    ? isDarkMode
                                      ? 'bg-slate-800'
                                      : 'bg-slate-100'
                                    : isDarkMode
                                      ? 'hover:bg-slate-800/60'
                                      : 'hover:bg-slate-50'
                                }`}
                                onClick={() =>
                                  setPinnedId((prev) =>
                                    prev === behavior.id ? null : behavior.id,
                                  )
                                }
                                aria-pressed={isPinned}
                              >
                                <span
                                  className={`w-5 shrink-0 text-center tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                                >
                                  {index + 1}
                                </span>
                                <span className="shrink-0 text-base" aria-hidden>
                                  {behavior.icon}
                                </span>
                                <p
                                  className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                                >
                                  {behavior.name}
                                </p>
                                <p
                                  className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                                    behavior.positive
                                      ? 'text-emerald-600'
                                      : 'text-rose-500'
                                  }`}
                                >
                                  {label}
                                </p>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )
              ) : (
                <>
                  <p
                    className={`shrink-0 truncate ${TYPE.titleMd} ${theme.colorOnSurface}`}
                  >
                    {pinned ? (
                      <>
                        <span aria-hidden className="mr-1.5">
                          {pinned.icon}
                        </span>
                        {pinned.name}
                      </>
                    ) : (
                      'Top Students'
                    )}
                  </p>
                  {leaders.length === 0 ? (
                    <p
                      className={`mt-4 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                    >
                      {pinned
                        ? 'No students found for this behavior.'
                        : 'No students with awards in this range yet.'}
                    </p>
                  ) : (
                    <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                      {leaders.map(({ student, value }, index) => {
                        const positive = pinned
                          ? pinned.positive
                          : value >= 0;
                        const label = pinned
                          ? `×${value}`
                          : value > 0
                            ? `+${value}`
                            : String(value);
                        return (
                          <li
                            key={student.id}
                            className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
                              isDarkMode
                                ? 'hover:bg-slate-800/60'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-5 shrink-0 text-center tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            >
                              {index + 1}
                            </span>
                            <StudentAvatar
                              student={student}
                              theme={theme}
                              size="xs"
                            />
                            <p
                              className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                            >
                              {studentDisplayName(student)}
                            </p>
                            <p
                              className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                                positive
                                  ? 'text-emerald-600'
                                  : 'text-rose-500'
                              }`}
                            >
                              {label}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
