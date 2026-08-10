import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { APP_SCROLL_BOARD } from '../../../shared/layout';
import { useBehavior } from '../BehaviorContext';
import { BehaviorBreakdownRing } from '../components/BehaviorBreakdownRing';
import {
  studentDisplayName,
  studentShortName,
} from '../../../data/students/displayName';

const SCOPE_OPTIONS = [
  { id: 'class', label: 'Whole class' },
  { id: 'student', label: 'By student' },
];

const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'lastWeek', label: 'Last week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'custom', label: 'Custom' },
];

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function endOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

function startOfWeekMonday(d = new Date()) {
  const x = new Date(startOfLocalDay(d));
  const day = x.getDay();
  const offset = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - offset);
  return x.getTime();
}

function toInputDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseInputDate(value) {
  if (!value || typeof value !== 'string') return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return startOfLocalDay(new Date(y, m - 1, d));
}

/** Inclusive start / end timestamps for the selected range. */
function rangeBounds(rangeId, customFrom, customTo, now = Date.now()) {
  const d = new Date(now);
  if (rangeId === 'today') {
    return { start: startOfLocalDay(d), end: endOfLocalDay(d) };
  }
  if (rangeId === 'yesterday') {
    const y = new Date(startOfLocalDay(d));
    y.setDate(y.getDate() - 1);
    return { start: startOfLocalDay(y), end: endOfLocalDay(y) };
  }
  if (rangeId === 'week') {
    return { start: startOfWeekMonday(d), end: endOfLocalDay(d) };
  }
  if (rangeId === 'lastWeek') {
    const thisWeek = startOfWeekMonday(d);
    const lastWeekStart = thisWeek - 7 * 24 * 60 * 60 * 1000;
    return { start: lastWeekStart, end: thisWeek - 1 };
  }
  if (rangeId === 'month') {
    const x = new Date(startOfLocalDay(d));
    x.setDate(1);
    return { start: x.getTime(), end: endOfLocalDay(d) };
  }
  if (rangeId === 'year') {
    const x = new Date(startOfLocalDay(d));
    x.setMonth(0, 1);
    return { start: x.getTime(), end: endOfLocalDay(d) };
  }
  // custom
  let start = parseInputDate(customFrom) ?? startOfWeekMonday(d);
  let end = parseInputDate(customTo);
  end = end != null ? endOfLocalDay(new Date(end)) : endOfLocalDay(d);
  if (start > end) {
    const tmp = start;
    start = startOfLocalDay(new Date(end));
    end = endOfLocalDay(new Date(tmp));
  }
  return { start, end };
}

function rangeEmptyLabel(rangeId, customFrom, customTo) {
  if (rangeId === 'today') return 'today';
  if (rangeId === 'yesterday') return 'yesterday';
  if (rangeId === 'week') return 'this week';
  if (rangeId === 'lastWeek') return 'last week';
  if (rangeId === 'month') return 'this month';
  if (rangeId === 'year') return 'this year';
  if (customFrom && customTo) return `${customFrom} – ${customTo}`;
  return 'this date range';
}

function formatAwardWhen(at) {
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

/**
 * Behavior → Reports — full award history by class or student.
 */
export function BehaviorReportsView({
  roster,
  isDarkMode,
  theme,
  classLabel,
  initialStudentId = null,
}) {
  const { recent } = useBehavior();
  const [scope, setScope] = useState(initialStudentId ? 'student' : 'class');
  const [range, setRange] = useState('week');
  const [customFrom, setCustomFrom] = useState(() =>
    toInputDate(startOfWeekMonday()),
  );
  const [customTo, setCustomTo] = useState(() => toInputDate(Date.now()));
  const [studentId, setStudentId] = useState(() => {
    if (initialStudentId) return String(initialStudentId);
    return roster?.[0] ? String(roster[0].id) : '';
  });
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [awardsListOpen, setAwardsListOpen] = useState(true);
  const studentPickerRef = useRef(null);

  useEffect(() => {
    if (!studentMenuOpen) return;
    const onDoc = (e) => {
      if (
        studentPickerRef.current &&
        !studentPickerRef.current.contains(e.target)
      ) {
        setStudentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [studentMenuOpen]);

  useEffect(() => {
    setStudentMenuOpen(false);
  }, [scope]);

  const selectedStudent = useMemo(
    () => (roster || []).find((s) => String(s.id) === String(studentId)),
    [roster, studentId],
  );

  const rows = useMemo(() => {
    const { start, end } = rangeBounds(range, customFrom, customTo);
    let list = (recent || []).filter((entry) => {
      const at = Number(entry.at);
      return at >= start && at <= end;
    });
    if (scope === 'student') {
      const id = String(studentId);
      list = list.filter((entry) =>
        (entry.studentIds || []).some((sid) => String(sid) === id),
      );
    }
    return list;
  }, [recent, scope, studentId, range, customFrom, customTo]);

  const nameFor = (id) => {
    const s = (roster || []).find((r) => String(r.id) === String(id));
    return s ? studentDisplayName(s) : 'Student';
  };

  const rangeLabel = rangeEmptyLabel(range, customFrom, customTo);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description={classLabel || undefined}
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {scope === 'student' ? (
          <div ref={studentPickerRef} className="relative">
            <button
              type="button"
              className={`edu-control flex h-9 max-w-[14rem] items-center gap-2 rounded-xl border-[1.5px] px-2.5 text-left ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
              aria-haspopup="listbox"
              aria-expanded={studentMenuOpen}
              aria-label="Select student"
              onClick={() => setStudentMenuOpen((v) => !v)}
            >
              {selectedStudent ? (
                <StudentAvatar
                  student={selectedStudent}
                  theme={theme}
                  size="xs"
                />
              ) : null}
              <span className={`min-w-0 flex-1 truncate ${TYPE.labelMd}`}>
                {selectedStudent ? studentDisplayName(selectedStudent) : 'Select student'}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${
                  studentMenuOpen ? 'rotate-180' : ''
                } ${theme.colorOnSurfaceVariant}`}
              />
            </button>
            {studentMenuOpen ? (
              <ul
                role="listbox"
                className={`absolute left-0 top-full z-40 mt-1 max-h-64 w-72 overflow-y-auto rounded-xl border-[1.5px] py-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
              >
                {(roster || []).map((s) => {
                  const active = String(s.id) === String(studentId);
                  return (
                    <li key={s.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        className={`edu-control flex w-full items-center gap-2.5 px-3 py-2 text-left ${
                          active
                            ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                            : isDarkMode
                              ? 'hover:bg-slate-800'
                              : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setStudentId(String(s.id));
                          setStudentMenuOpen(false);
                        }}
                      >
                        <StudentAvatar student={s} theme={theme} size="xs" />
                        <span
                          className={`min-w-0 flex-1 truncate ${TYPE.bodyMd} ${theme.colorOnSurface}`}
                        >
                          {studentDisplayName(s)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          aria-label="Date range"
          title="Date range"
          className={`edu-control h-9 rounded-xl border-[1.5px] px-3 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {range === 'custom' ? (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="From date"
              title="From"
              className={`edu-control h-9 rounded-xl border-[1.5px] px-3 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="To date"
              title="To"
              className={`edu-control h-9 rounded-xl border-[1.5px] px-3 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
            />
          </>
        ) : null}
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={scope}
          onChange={setScope}
          options={SCOPE_OPTIONS}
        />
      </div>

      <div
        className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div
          className={`flex items-center justify-between gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pb-3 sm:pt-5 ${
            breakdownOpen ? `border-b ${theme.colorOutline}` : ''
          }`}
        >
          <div className="min-w-0">
            {scope === 'student' && selectedStudent ? (
              <h2
                className={`flex min-w-0 items-center gap-2 ${TYPE.titleMd} ${theme.colorOnSurface}`}
              >
                <StudentAvatar
                  student={selectedStudent}
                  theme={theme}
                  size="sm"
                />
                <span className="min-w-0 truncate">
                  {studentDisplayName(selectedStudent)} Breakdown
                </span>
              </h2>
            ) : (
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                Class Breakdown
              </h2>
            )}
          </div>
          <button
            type="button"
            className={`edu-control flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-expanded={breakdownOpen}
            aria-label={
              breakdownOpen
                ? 'Collapse breakdown chart'
                : 'Expand breakdown chart'
            }
            onClick={() => setBreakdownOpen((v) => !v)}
          >
            <ChevronDown
              size={18}
              strokeWidth={2.25}
              className={`transition-transform duration-200 ${
                breakdownOpen ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>
        </div>
        <BehaviorBreakdownRing
          rows={rows}
          roster={roster}
          theme={theme}
          isDarkMode={isDarkMode}
          open={breakdownOpen}
          scope={scope}
        />
      </div>

      <div
        className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div
          className={`flex items-center justify-between gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pb-3 sm:pt-5 ${
            awardsListOpen ? `border-b ${theme.colorOutline}` : ''
          }`}
        >
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Class Awards
          </h2>
          <button
            type="button"
            className={`edu-control flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-expanded={awardsListOpen}
            aria-label={
              awardsListOpen ? 'Collapse awards list' : 'Expand awards list'
            }
            onClick={() => setAwardsListOpen((v) => !v)}
          >
            <ChevronDown
              size={18}
              strokeWidth={2.25}
              className={`transition-transform duration-200 ${
                awardsListOpen ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>
        </div>
        {awardsListOpen ? (
          <ul
            className={`divide-y ${
              isDarkMode ? 'divide-slate-700' : 'divide-slate-200'
            }`}
          >
            {rows.length === 0 ? (
              <li
                className={`px-5 py-8 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}
              >
                {scope === 'student'
                  ? `No awards for this student ${rangeLabel}.`
                  : `No awards recorded ${rangeLabel}.`}
              </li>
            ) : (
              rows.map((entry) => {
                const ids = entry.studentIds || [];
                const who =
                  scope === 'student'
                    ? studentShortName(selectedStudent)
                    : ids.length === 0
                      ? `${entry.count || 0} students`
                      : ids.length <= 2
                        ? ids.map(nameFor).join(', ')
                        : `${ids
                            .slice(0, 2)
                            .map(nameFor)
                            .join(', ')} +${ids.length - 2}`;
                const pts = Number(entry.behavior?.points) || 0;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 sm:px-5"
                  >
                    <span className="text-xl" aria-hidden>
                      {entry.behavior?.icon || '⭐'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}
                      >
                        {entry.behavior?.name || 'Award'}
                      </p>
                      <p
                        className={`${TYPE.bodySm} truncate ${theme.colorOnSurfaceVariant}`}
                      >
                        {who}
                        {entry.at ? ` · ${formatAwardWhen(entry.at)}` : ''}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                        pts >= 0 ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {pts > 0 ? `+${pts}` : pts}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
