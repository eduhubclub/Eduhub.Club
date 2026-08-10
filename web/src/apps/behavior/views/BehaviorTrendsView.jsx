import { useMemo, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { APP_BOARD_PAD, APP_GRID_CARD, APP_SCROLL_BOARD } from '../../../shared/layout';
import { useBehavior } from '../BehaviorContext';
import { studentDisplayName } from '../../../data/students/displayName';

const PERIODS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function periodStart(periodId, now = Date.now()) {
  const d = new Date(now);
  if (periodId === 'day') return startOfLocalDay(d);
  if (periodId === 'week') {
    const x = new Date(startOfLocalDay(d));
    // Monday-start week
    const day = x.getDay();
    const offset = day === 0 ? 6 : day - 1;
    x.setDate(x.getDate() - offset);
    return x.getTime();
  }
  const x = new Date(startOfLocalDay(d));
  x.setDate(1);
  return x.getTime();
}

/** Most-awarded behavior in a tone, weighted by student count per award. */
function topBehaviorHighlight(entries, tone) {
  const tally = new Map();
  for (const entry of entries) {
    const pts = Number(entry.behavior?.points) || 0;
    if (tone === 'positive' && pts <= 0) continue;
    if (tone === 'needsWork' && pts >= 0) continue;
    const key =
      entry.behavior?.id ||
      entry.behavior?.name ||
      `${entry.behavior?.icon || ''}:${pts}`;
    if (!key) continue;
    const weight = Math.max(1, Number(entry.count) || entry.studentIds?.length || 1);
    const prev = tally.get(key) || {
      behavior: entry.behavior,
      weight: 0,
    };
    prev.weight += weight;
    if (entry.behavior) prev.behavior = entry.behavior;
    tally.set(key, prev);
  }
  let best = null;
  for (const row of tally.values()) {
    if (!best || row.weight > best.weight) best = row;
  }
  return best;
}

function HighlightCard({
  label,
  emptyLabel,
  highlight,
  tone,
  theme,
  isDarkMode,
}) {
  const isPos = tone === 'positive';
  return (
    <div
      className={`rounded-xl border-[1.5px] px-3 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      {highlight ? (
        <div className="mt-2 flex items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
              isPos
                ? isDarkMode
                  ? 'bg-emerald-500/20'
                  : 'bg-emerald-50'
                : isDarkMode
                  ? 'bg-rose-500/20'
                  : 'bg-rose-50'
            }`}
            aria-hidden
          >
            {highlight.behavior?.icon || (isPos ? '⭐' : '⚠️')}
          </span>
          <div className="min-w-0">
            <p className={`truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}>
              {highlight.behavior?.name || 'Behavior'}
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Most awarded · {highlight.weight} time
              {highlight.weight === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      ) : (
        <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

/**
 * Behavior → Trends — class points leaderboard and recent awards.
 */
export function BehaviorTrendsView({
  roster,
  isDarkMode,
  theme,
  classLabel,
  onOpenReports,
}) {
  const { getPoints, recent, showNeedsWork } = useBehavior();
  const [period, setPeriod] = useState('day');

  const ranked = useMemo(() => {
    return [...(roster || [])]
      .map((student) => ({
        student,
        points: getPoints(student.id),
      }))
      .sort((a, b) => b.points - a.points || studentDisplayName(a.student).localeCompare(studentDisplayName(b.student)));
  }, [roster, getPoints]);

  const top = ranked[0];
  const leaderboard = ranked.slice(0, 5);
  const maxPoints = Math.max(1, ...leaderboard.map((r) => Math.abs(r.points) || 0));

  const tracker = useMemo(() => {
    const since = periodStart(period);
    const inPeriod = (recent || []).filter((e) => Number(e.at) >= since);
    return {
      positive: topBehaviorHighlight(inPeriod, 'positive'),
      needsWork: topBehaviorHighlight(inPeriod, 'needsWork'),
      total: inPeriod.length,
    };
  }, [recent, period]);

  const recentRows = useMemo(() => {
    return (recent || []).slice(0, 5).map((entry) => {
      const names = (entry.studentIds || [])
        .map((id) => {
          const s = (roster || []).find((r) => String(r.id) === String(id));
          return s ? studentDisplayName(s) : null;
        })
        .filter(Boolean);
      return {
        ...entry,
        label:
          names.length === 0
            ? `${entry.count || 0} students`
            : names.length <= 2
              ? names.join(', ')
              : `${names.slice(0, 2).join(', ')} +${names.length - 2}`,
      };
    });
  }, [recent, roster]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trends"
        description={
          classLabel
            ? `${classLabel} · points overview`
            : 'Class points overview'
        }
        isDarkMode={isDarkMode}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Top of class
          </p>
          {top ? (
            <div className="mt-3 flex items-center gap-3">
              <StudentAvatar student={top.student} theme={theme} size="lg" />
              <div className="min-w-0">
                <p className={`${TYPE.titleMd} truncate ${theme.colorOnSurface}`}>
                  {studentDisplayName(top.student)}
                </p>
                <p className={`mt-1 ${TYPE.titleLg} tabular-nums text-emerald-600`}>
                  {top.points > 0 ? `+${top.points}` : top.points}
                </p>
              </div>
            </div>
          ) : (
            <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              No students yet.
            </p>
          )}
        </div>

        <div
          className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Class pulse
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
              aria-hidden
            >
              <Award size={32} strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className={`${TYPE.titleMd} truncate ${theme.colorOnSurface}`}>
                Whole Class
              </p>
              <p
                className={`mt-1 ${TYPE.titleLg} tabular-nums text-emerald-600`}
              >
                {ranked.reduce((sum, r) => sum + r.points, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Behavior tracker
          </h2>
          <SegmentControl
            isDarkMode={isDarkMode}
            theme={theme}
            value={period}
            onChange={setPeriod}
            options={PERIODS}
          />
        </div>
        <div
          className={`grid grid-cols-1 gap-2 ${showNeedsWork ? 'sm:grid-cols-2' : ''}`}
        >
          <HighlightCard
            label="Positive highlight"
            emptyLabel="No positive awards in this period yet."
            highlight={tracker.positive}
            tone="positive"
            theme={theme}
            isDarkMode={isDarkMode}
          />
          {showNeedsWork ? (
            <HighlightCard
              label="Needs work highlight"
              emptyLabel="No needs-work awards in this period yet."
              highlight={tracker.needsWork}
              tone="needsWork"
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ) : null}
        </div>
      </div>

      <div
        className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={18} className={theme.text} />
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Top 5</h2>
        </div>
        {leaderboard.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            Award points to see the leaderboard fill in.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {leaderboard.map((row, index) => {
              const width = `${Math.max(6, (Math.abs(row.points) / maxPoints) * 100)}%`;
              const barTone =
                row.points > 0
                  ? 'bg-emerald-500'
                  : row.points < 0
                    ? 'bg-rose-500'
                    : isDarkMode
                      ? 'bg-slate-600'
                      : 'bg-slate-300';
              return (
                <li key={row.student.id} className="flex items-center gap-3">
                  <span
                    className={`w-6 shrink-0 text-center tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    {index + 1}
                  </span>
                  <StudentAvatar student={row.student} theme={theme} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}>
                        {studentDisplayName(row.student)}
                      </p>
                      <p
                        className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                          row.points > 0
                            ? 'text-emerald-600'
                            : row.points < 0
                              ? 'text-rose-500'
                              : theme.colorOnSurfaceVariant
                        }`}
                      >
                        {row.points > 0 ? `+${row.points}` : row.points}
                      </p>
                    </div>
                    <div
                      className={`mt-1.5 h-2 overflow-hidden rounded-full ${
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${barTone}`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Recent awards
          </h2>
          {onOpenReports ? (
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.text}`}
              onClick={onOpenReports}
            >
              View Reports
            </button>
          ) : null}
        </div>
        {recentRows.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            Awards you give this session show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentRows.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2.5 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
              >
                <span className="text-xl" aria-hidden>
                  {entry.behavior?.icon || '⭐'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
                    {entry.label}
                  </p>
                  <p className={`${TYPE.bodySm} truncate ${theme.colorOnSurfaceVariant}`}>
                    {entry.behavior?.name || 'Award'}
                  </p>
                </div>
                <p
                  className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                    (entry.behavior?.points || 0) >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-500'
                  }`}
                >
                  {(entry.behavior?.points || 0) > 0
                    ? `+${entry.behavior.points}`
                    : entry.behavior?.points || 0}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
