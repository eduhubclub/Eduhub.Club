import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../data/auth/AuthContext';
import { addDaysIso, parseIsoDate, toIsoDate } from '../../../data/calendar/calendarModel';
import { studentDisplayName } from '../../../data/students/displayName';
import {
  newId,
  resolveSchedule,
  scheduleDayMarks,
} from '../../../data/tests/model';
import { upsertSchedule } from '../../../data/tests/storage';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { testFieldClass } from '../fields';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MARK_LABEL = { window: 'Window', testing: 'Testing day', assign: 'Assigned' };

function monthGridStart(iso) {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  first.setDate(first.getDate() - first.getDay());
  return toIsoDate(first);
}

function shiftMonth(iso, direction) {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  date.setMonth(date.getMonth() + direction);
  return toIsoDate(date);
}

function monthTitle(iso) {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function dayTitle(iso) {
  const date = parseIsoDate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function AssessmentCalendarView({
  theme,
  isDarkMode,
  store,
  ownerId,
  classes,
  selectedClass,
}) {
  const { session } = useAuth();
  const isDistrict = session?.role === 'admin';
  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [assessmentId, setAssessmentId] = useState('');
  const [mode, setMode] = useState('window');
  const [windowAnchor, setWindowAnchor] = useState('');

  const classId = selectedClass?.id != null ? String(selectedClass.id) : '';
  const roster = selectedClass?.studentList || [];
  const classIds = useMemo(() => (classes || []).map((item) => String(item.id)), [classes]);

  const choices = useMemo(
    () =>
      (store.assessments || []).filter(
        (row) => !row.archived && (row.shelf === 'district' || row.ownerId === ownerId),
      ),
    [store.assessments, ownerId],
  );
  const activeId = assessmentId && choices.some((row) => row.id === assessmentId)
    ? assessmentId
    : choices[0]?.id || '';
  const assessment = choices.find((row) => row.id === activeId) || null;
  const schedule = assessment ? resolveSchedule(store, assessment.id, classId) : null;

  const cursorDate = parseIsoDate(cursor);
  const viewMonth = cursorDate?.getMonth() ?? new Date().getMonth();
  const viewYear = cursorDate?.getFullYear() ?? new Date().getFullYear();
  const gridStart = monthGridStart(cursor);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, index) => addDaysIso(gridStart, index)),
    [gridStart],
  );

  const marksByDay = useMemo(() => {
    const map = new Map();
    for (const row of choices) {
      const rowSchedule = resolveSchedule(store, row.id, classId);
      if (!rowSchedule) continue;
      for (const iso of days) {
        const marks = scheduleDayMarks(rowSchedule, iso);
        if (!marks.length) continue;
        const list = map.get(iso) || [];
        list.push({ id: row.id, title: row.title || 'Untitled assessment', marks });
        map.set(iso, list);
      }
    }
    return map;
  }, [choices, store, classId, days]);

  function save(partial) {
    if (!assessment) return;
    const classRow = (store.schedules || []).find(
      (row) => row.scope === 'class' && row.classId === classId && row.assessmentId === assessment.id,
    );
    const districtRow = (store.schedules || []).find(
      (row) => row.scope === 'district' && row.assessmentId === assessment.id,
    );
    const seed = isDistrict ? districtRow : classRow;
    const fallback = seed || schedule;
    upsertSchedule(
      {
        id: seed?.id || newId(),
        assessmentId: assessment.id,
        classId: isDistrict ? '' : classId,
        scope: isDistrict ? 'district' : 'class',
        windowStart: fallback?.windowStart || '',
        windowEnd: fallback?.windowEnd || '',
        testingDays: fallback?.testingDays || [],
        assignOn: fallback?.assignOn || '',
        studentAssignOn: { ...(fallback?.studentAssignOn || {}) },
        ...partial,
      },
      { title: assessment.title || 'Assessment', classIds },
    );
  }

  function onDay(iso) {
    setSelectedDay(iso);
    if (!assessment || (mode !== 'window' && !classId && !isDistrict)) return;
    if (!isDistrict && !classId) return;
    if (mode === 'window') {
      if (!windowAnchor) {
        setWindowAnchor(iso);
        save({ windowStart: iso, windowEnd: iso });
        return;
      }
      const start = windowAnchor < iso ? windowAnchor : iso;
      const end = windowAnchor < iso ? iso : windowAnchor;
      setWindowAnchor('');
      save({ windowStart: start, windowEnd: end });
      return;
    }
    if (mode === 'testing') {
      const next = new Set(schedule?.testingDays || []);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      save({ testingDays: [...next] });
      return;
    }
    save({ assignOn: iso });
  }

  function setStudentDay(studentId, iso) {
    if (!schedule && !assessment) return;
    const studentAssignOn = { ...(schedule?.studentAssignOn || {}) };
    if (!iso || iso === (schedule?.assignOn || '')) delete studentAssignOn[studentId];
    else studentAssignOn[studentId] = iso;
    save({ studentAssignOn });
  }

  const selectedItems = marksByDay.get(selectedDay) || [];
  const modeHelp =
    mode === 'window'
      ? 'Click the first day of the window, then the last day.'
      : mode === 'testing'
        ? 'Click a day to mark or clear it as a testing day.'
        : 'Click the day students receive this assessment. Set a different day for one student below.';

  return (
    <AppPageShell variant="scroll" className="h-full overflow-y-auto">
      <PageHeader
        title="Assessment Calendar"
        description={
          isDistrict
            ? 'Set the district window, testing days, and when students receive an assessment. Classes see the same dates on their calendar.'
            : selectedClass
              ? `Set the window, testing days, and assign date for ${selectedClass.name}. These dates also show on the class calendar.`
              : 'Choose a class in the sidebar, then set the window, testing days, and assign date.'
        }
        isDarkMode={isDarkMode}
      />
      <AppBoard mode="scroll" theme={theme} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className={TYPE.labelMd}>Assessment</span>
          <select
            value={activeId}
            onChange={(event) => {
              setAssessmentId(event.target.value);
              setWindowAnchor('');
            }}
            className={testFieldClass(theme)}
          >
            {choices.length === 0 ? <option value="">No assessments yet</option> : null}
            {choices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title || 'Untitled assessment'}
                {row.shelf === 'district' ? ' · District' : ''}
              </option>
            ))}
          </select>
        </label>
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          fullWidth
          value={mode}
          onChange={(next) => {
            setMode(next);
            setWindowAnchor('');
          }}
          options={[
            { id: 'window', label: 'Window' },
            { id: 'testing', label: 'Testing day' },
            { id: 'assign', label: 'Assign' },
          ]}
        />
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{modeHelp}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((current) => shiftMonth(current, -1))}
            className={`edu-control inline-flex h-11 w-11 items-center justify-center rounded-xl ${theme.hoverBg} ${theme.colorOnSurface}`}
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className={`flex-1 text-center ${TYPE.titleMd}`}>{monthTitle(cursor)}</h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((current) => shiftMonth(current, 1))}
            className={`edu-control inline-flex h-11 w-11 items-center justify-center rounded-xl ${theme.hoverBg} ${theme.colorOnSurface}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={`flex flex-wrap gap-3 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
          <span className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-5 rounded-full ${theme.colorPrimary}`} /> Window
          </span>
          <span>Test — testing day</span>
          <span>Get — students receive it</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className={`py-1 text-center ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
            >
              {label}
            </div>
          ))}
          {days.map((iso) => {
            const date = parseIsoDate(iso);
            const inMonth = date && date.getMonth() === viewMonth && date.getFullYear() === viewYear;
            const isSelected = iso === selectedDay;
            const items = marksByDay.get(iso) || [];
            const marks = new Set(items.flatMap((item) => item.marks));
            return (
              <button
                key={iso}
                type="button"
                aria-pressed={isSelected}
                aria-label={dayTitle(iso)}
                onClick={() => onDay(iso)}
                className={`edu-control flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] ${
                  isSelected
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.hoverBg}`
                } ${inMonth ? '' : 'opacity-40'}`}
              >
                <span className={TYPE.labelMd}>{date ? date.getDate() : ''}</span>
                {marks.has('window') && !isSelected ? (
                  <span className={`h-1 w-5 rounded-full ${theme.colorPrimary}`} />
                ) : (
                  <span className="h-1 w-5" />
                )}
                <span className={TYPE.labelMicro}>
                  {marks.has('testing') ? 'Test' : marks.has('assign') ? 'Get' : ''}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className={TYPE.titleSm}>{dayTitle(selectedDay)}</h3>
          {schedule ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {[
                schedule.windowStart
                  ? `Window ${schedule.windowStart} to ${schedule.windowEnd}`
                  : '',
                schedule.testingDays.length
                  ? `${schedule.testingDays.length} testing ${schedule.testingDays.length === 1 ? 'day' : 'days'}`
                  : '',
                schedule.assignOn ? `Class receives it ${schedule.assignOn}` : '',
                schedule.scope === 'district' ? 'District dates' : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'Click the calendar to set dates.'}
            </p>
          ) : (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Click the calendar to set dates for {assessment?.title || 'an assessment'}.
            </p>
          )}
          {selectedItems.map((item) => (
            <p key={item.id} className={TYPE.labelLg}>
              {item.title}
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {' '}
                · {item.marks.map((mark) => MARK_LABEL[mark] || mark).join(', ')}
              </span>
            </p>
          ))}
        </div>
        {mode === 'assign' && assessment && roster.length ? (
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            <h3 className={TYPE.titleSm}>When each student receives it</h3>
            {roster.map((student) => {
              const id = String(student.id);
              const value = schedule?.studentAssignOn?.[id] || schedule?.assignOn || '';
              return (
                <label key={id} className="flex items-center gap-2">
                  <span className={`min-w-0 flex-1 truncate ${TYPE.bodySm}`}>
                    {studentDisplayName(student)}
                  </span>
                  <input
                    type="date"
                    aria-label={`Assign date for ${studentDisplayName(student)}`}
                    value={value}
                    onChange={(event) => setStudentDay(id, event.target.value)}
                    className={`${testFieldClass(theme)} max-w-[11rem]`}
                  />
                </label>
              );
            })}
          </div>
        ) : null}
      </AppBoard>
    </AppPageShell>
  );
}
