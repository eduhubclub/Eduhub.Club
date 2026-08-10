import { Fragment, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartHandshake,
  Home,
  List,
  School,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { ButtonRow } from '../../../shared/ButtonRow';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD } from '../../../shared/layout';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { studentDisplayName } from '../../../data/students/displayName';
import { useAttendance } from '../AttendanceContext';
import { STATUS_META, countMarks } from '../attendanceState';
import { ViewModeToggle } from '../components/AttendanceMarking';
import { toolBtnClass } from '../../../shared/toolBtn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DOT = {
  present: 'bg-emerald-500',
  school: 'bg-blue-400',
};

const STATUS_PILL = {
  present: {
    Icon: Check,
    className: 'bg-emerald-500 text-white',
  },
  tardy: {
    Icon: Clock,
    className: 'bg-amber-400 text-white',
  },
  absent: {
    Icon: X,
    className: 'bg-rose-400 text-white',
  },
  excused: {
    Icon: HeartHandshake,
    className: 'bg-blue-400 text-white',
  },
};

const LUNCH_PILL = {
  school: {
    Icon: School,
    label: 'School',
    className: 'bg-blue-400 text-white',
  },
  home: {
    Icon: Home,
    label: 'Home',
    className: 'bg-amber-400 text-white',
  },
};

function StatusPill({ status }) {
  if (!status || !STATUS_PILL[status]) {
    return (
      <span
        className={`inline-flex min-w-[4.5rem] items-center justify-end ${TYPE.labelMd} text-slate-400`}
      >
        —
      </span>
    );
  }
  const { Icon, className } = STATUS_PILL[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${className}`}
      title={STATUS_META[status].label}
    >
      <Icon size={11} strokeWidth={2.75} aria-hidden />
      {STATUS_META[status].label}
    </span>
  );
}

function LunchPill({ choice }) {
  if (!choice || !LUNCH_PILL[choice]) {
    return (
      <span
        className={`inline-flex min-w-[3.5rem] items-center ${TYPE.labelMd} text-slate-400`}
      >
        —
      </span>
    );
  }
  const { Icon, label, className } = LUNCH_PILL[choice];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${className}`}
      title={label}
    >
      <Icon size={11} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}

function countLunch(day, roster) {
  let school = 0;
  let home = 0;
  for (const s of roster || []) {
    const choice = day?.lunch?.[String(s.id)];
    if (choice === 'school') school += 1;
    else if (choice === 'home') home += 1;
  }
  return { school, home };
}

function padKey(year, monthIndex0, day) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDayHeading(year, month, day) {
  return new Date(year, month, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function DaySummaryRow({ cell, isDarkMode, theme }) {
  return (
    <div className="flex flex-wrap items-stretch gap-y-2">
      {[
        {
          key: 'present',
          label: STATUS_META.present.label,
          value: cell.counts?.present ?? 0,
        },
        {
          key: 'tardy',
          label: STATUS_META.tardy.label,
          value: cell.counts?.tardy ?? 0,
        },
        {
          key: 'absent',
          label: STATUS_META.absent.label,
          value: cell.counts?.absent ?? 0,
        },
        {
          key: 'excused',
          label: STATUS_META.excused.label,
          value: cell.counts?.excused ?? 0,
        },
        {
          key: 'school',
          label: 'School',
          value: cell.lunchCounts?.school ?? 0,
        },
        {
          key: 'home',
          label: 'Home',
          value: cell.lunchCounts?.home ?? 0,
        },
      ].map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? (
            <span
              aria-hidden
              className={`mx-1 hidden h-4 w-[1.5px] shrink-0 self-center rounded-full sm:block ${
                isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            />
          ) : null}
          <span
            className={`inline-flex shrink-0 items-center gap-1 px-2.5 first:pl-0 ${TYPE.labelMd} ${theme.colorOnSurface}`}
          >
            {item.label}{' '}
            <strong className="tabular-nums">{item.value}</strong>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function DayRosterList({ cell, roster, theme, isDarkMode }) {
  if (!cell?.dayRecord) {
    return (
      <p className={`px-4 py-6 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
        No attendance recorded for this day.
      </p>
    );
  }

  return (
    <ul
      className={`divide-y ${
        isDarkMode ? 'divide-slate-700' : 'divide-slate-200'
      }`}
    >
      {roster.map((s) => {
        const id = String(s.id);
        const st = cell.dayRecord.marks[id];
        const lunch = cell.dayRecord.lunch?.[id];
        return (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <StudentAvatar student={s} theme={theme} size="sm" />
            <p
              className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
            >
              {studentDisplayName(s)}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <StatusPill status={st} />
              <LunchPill choice={lunch} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ReportsView({ isDarkMode, theme, classLabel }) {
  const { roster, days } = useAttendance();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState('calendar');
  const [expanded, setExpanded] = useState({});
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const calendarCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = padKey(year, month, d);
      const day = days[key];
      cells.push({
        day: d,
        key,
        dayRecord: day || null,
        counts: day ? countMarks(day, roster) : null,
        lunchCounts: day ? countLunch(day, roster) : null,
      });
    }
    // Pad trailing blanks so the last week still draws full cell borders.
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month, days, roster]);

  const selectedCell = useMemo(
    () => calendarCells.find((c) => c && c.key === selectedDayKey) || null,
    [calendarCells, selectedDayKey],
  );

  const monthDayList = useMemo(() => {
    return calendarCells
      .filter((c) => c && c.dayRecord?.submitted)
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [calendarCells]);

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDayKey(null);
  };

  const setMode = (mode) => {
    setViewMode(mode);
    setSelectedDayKey(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description={classLabel || undefined}
        isDarkMode={isDarkMode}
      />

      <ButtonRow>
        <button
          type="button"
          aria-label="Previous month"
          title="Previous month"
          onClick={() => shiftMonth(-1)}
          className={toolBtnClass(isDarkMode)}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Next month"
          title="Next month"
          onClick={() => shiftMonth(1)}
          className={toolBtnClass(isDarkMode)}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
        <ViewModeToggle
          value={viewMode}
          onChange={setMode}
          isDarkMode={isDarkMode}
          theme={theme}
          options={[
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'list', label: 'List', icon: List },
          ]}
        />
      </ButtonRow>

      {viewMode === 'calendar' ? (
        <div
          className={`overflow-hidden rounded-2xl border-[1.5px] ${theme.colorOutline}`}
        >
          <div
            className={`border-b px-4 py-3 ${theme.colorSurface} ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            {selectedCell ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayKey(null)}
                  className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                    isDarkMode
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  aria-label="Back to calendar"
                  title="Back to calendar"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  {formatDayHeading(year, month, selectedCell.day)}
                </h3>
              </div>
            ) : (
              <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                {monthLabel}
              </h3>
            )}
          </div>

          {selectedCell ? (
            <div className={`${theme.colorSurface}`}>
              <div
                className={`border-b px-4 py-3 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <DaySummaryRow
                  cell={selectedCell}
                  isDarkMode={isDarkMode}
                  theme={theme}
                />
              </div>
              <DayRosterList
                cell={selectedCell}
                roster={roster}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`p-2 text-center border-b ${TYPE.labelMicro} ${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} ${
                    i > 0
                      ? isDarkMode
                        ? 'border-l border-slate-700'
                        : 'border-l border-slate-200'
                      : ''
                  } ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                >
                  {d}
                </div>
              ))}
              {calendarCells.map((cell, i) => {
                if (!cell) {
                  return (
                    <div
                      key={`blank-${i}`}
                      className={`min-h-[96px] border-t border-l ${
                        isDarkMode
                          ? 'border-slate-800 bg-slate-950/40'
                          : 'border-slate-200 bg-slate-50/80'
                      }`}
                    />
                  );
                }
                const present = cell.counts?.present ?? 0;
                const hotLunch = cell.lunchCounts?.school ?? 0;
                const total = cell.counts?.total ?? roster.length;
                const allPresent = total > 0 && present === total;
                const hasBadges = present > 0 || hotLunch > 0;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDayKey(cell.key)}
                    className={`edu-control flex min-h-[96px] flex-col items-stretch justify-start border-t border-l p-1.5 text-left transition ${
                      isDarkMode
                        ? 'border-slate-800 bg-slate-900 hover:bg-slate-800/80'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-start justify-between gap-1">
                      <span
                        className={`leading-none ${TYPE.labelMd} ${theme.colorOnSurface}`}
                      >
                        {cell.day}
                      </span>
                      {allPresent ? (
                        <span className="leading-none text-sm" title="Everyone present">
                          🎉
                        </span>
                      ) : (
                        <span aria-hidden className="w-0" />
                      )}
                    </div>
                    {hasBadges ? (
                      <div className="mt-2 flex w-full flex-col gap-1">
                        {present > 0 ? (
                          <span
                            className={`inline-flex w-full items-center justify-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${DOT.present}`}
                            title="Present"
                          >
                            <Check size={10} strokeWidth={3} aria-hidden />
                            {present}
                          </span>
                        ) : null}
                        {hotLunch > 0 ? (
                          <span
                            className={`inline-flex w-full items-center justify-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${DOT.school}`}
                            title="Hot lunch"
                          >
                            <School size={10} strokeWidth={2.5} aria-hidden />
                            {hotLunch}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className={`${APP_GRID_CARD} px-4 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              {monthLabel}
            </h3>
          </div>
          {monthDayList.length === 0 ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              No submitted attendance days this month.
            </p>
          ) : (
            monthDayList.map((cell) => (
              <div
                key={cell.key}
                className={`${APP_GRID_CARD} p-4 ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <button
                  type="button"
                  className="edu-control flex w-full items-center justify-between text-left"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [cell.key]: !prev[cell.key],
                    }))
                  }
                >
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {new Date(year, month, cell.day).toLocaleDateString(
                      undefined,
                      {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      },
                    )}
                  </p>
                  <ChevronRight
                    size={16}
                    className={`transition ${expanded[cell.key] ? 'rotate-90' : ''} ${theme.colorOnSurfaceVariant}`}
                  />
                </button>
                <div className="mt-3">
                  <DaySummaryRow
                    cell={cell}
                    isDarkMode={isDarkMode}
                    theme={theme}
                  />
                </div>
                {expanded[cell.key] ? (
                  <div
                    className={`-mx-4 mt-3 border-t ${theme.colorOutline}`}
                  >
                    <DayRosterList
                      cell={cell}
                      roster={roster}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
