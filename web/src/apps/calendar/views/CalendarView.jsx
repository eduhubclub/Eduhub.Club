import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { APP_BOARD_CHROME, APP_BOARD_PAD, APP_BOARD_BODY_SCROLL } from '../../../shared/layout';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { bestOnColor } from '../../../shared/colorContrast';
import { useClasses } from '../../../data/classes/ClassContext';
import { useCalendar } from '../CalendarContext';
import { CalendarLayersMenu } from '../components/CalendarLayersMenu';
import {
  addDaysIso,
  newCalendarId,
  parseIsoDate,
  toIsoDate,
} from '../../../data/calendar/calendarModel';
import { isSessionDay, sessionDayHoliday } from '../../../data/calendar/sessionDays';
import { readAcademic, readClosures } from '../../../data/calendar/calendarStorage';
import { expandStudentBirthdays } from '../../../data/calendar/studentBirthdays';
import { getStudents } from '../../../data/classes/seed';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeek(iso, weekStartsOn = 0) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toIsoDate(d);
}

function monthGridStart(iso, weekStartsOn = 0) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const diff = (first.getDay() - weekStartsOn + 7) % 7;
  first.setDate(first.getDate() - diff);
  return toIsoDate(first);
}

function weekdayLabels(weekStartsOn = 0) {
  return [
    ...WEEKDAY_LABELS.slice(weekStartsOn),
    ...WEEKDAY_LABELS.slice(0, weekStartsOn),
  ];
}

function monthLabel(iso) {
  const d = parseIsoDate(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function rangeForView(view, cursor, weekStartsOn = 0) {
  if (view === 'Day') return { start: cursor, end: cursor };
  if (view === 'Week') {
    const start = startOfWeek(cursor, weekStartsOn);
    return { start, end: addDaysIso(start, 6) };
  }
  const start = monthGridStart(cursor, weekStartsOn);
  return { start, end: addDaysIso(start, 41) };
}

function shiftCursor(view, cursor, dir) {
  if (view === 'Day') return addDaysIso(cursor, dir);
  if (view === 'Week') return addDaysIso(cursor, dir * 7);
  const d = parseIsoDate(cursor);
  if (!d) return cursor;
  d.setMonth(d.getMonth() + dir);
  return toIsoDate(d);
}

/**
 * Main month / week / day planner with multi-class overlays.
 */
export function CalendarView({ isDarkMode, theme }) {
  const { selectClass } = useClasses();
  const {
    classes,
    prefs,
    updatePrefs,
    getOccurrences,
    layers,
    saveEvent,
    classId,
    academic,
    closures,
    specialistVisible,
    setSpecialistVisible,
  } = useCalendar();

  const view = prefs.view || prefs.defaultView || 'Month';
  const weekStartsOn = prefs.weekStartsOn === 1 ? 1 : 0;
  const cursor = prefs.cursorDate || toIsoDate(new Date());
  const showHolidays = prefs.showHolidays !== false;
  const showBirthdays = prefs.showBirthdays !== false;
  const classFilterValue = useMemo(() => {
    const visible = new Set((prefs.visibleClassIds || []).map(String));
    const allIds = classes.map((c) => String(c.id));
    if (
      allIds.length > 0 &&
      allIds.every((id) => visible.has(id)) &&
      visible.size === allIds.length
    ) {
      return 'all';
    }
    if (visible.size === 1) return [...visible][0];
    return String(classId || allIds[0] || 'all');
  }, [prefs.visibleClassIds, classes, classId]);

  const onClassFilterChange = (value) => {
    if (value === 'all') {
      updatePrefs({
        visibleClassIds: classes.map((c) => String(c.id)),
      });
      return;
    }
    updatePrefs({ visibleClassIds: [String(value)] });
    selectClass(value);
  };

  const [selected, setSelected] = useState(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    startDate: cursor,
    endDate: cursor,
    startTime: '',
    endTime: '',
    layerId: '',
    notes: '',
  });

  const range = useMemo(
    () => rangeForView(view, cursor, weekStartsOn),
    [view, cursor, weekStartsOn],
  );
  const weekdays = useMemo(
    () => weekdayLabels(weekStartsOn),
    [weekStartsOn],
  );
  const occurrences = useMemo(
    () => getOccurrences(range.start, range.end, prefs.visibleClassIds),
    [getOccurrences, range.start, range.end, prefs.visibleClassIds],
  );

  const birthdayOccurrences = useMemo(() => {
    if (!showBirthdays) return [];
    const visible = new Set((prefs.visibleClassIds || []).map(String));
    const classBundles = classes
      .filter((c) => visible.has(String(c.id)))
      .map((c) => ({
        classId: String(c.id),
        className: c.name || 'Class',
        students: getStudents(c),
      }));
    return expandStudentBirthdays({
      rangeStart: range.start,
      rangeEnd: range.end,
      classBundles,
    });
  }, [showBirthdays, prefs.visibleClassIds, classes, range.start, range.end]);

  const byDate = useMemo(() => {
    const map = {};
    for (const row of [...occurrences, ...birthdayOccurrences]) {
      if (!map[row.date]) map[row.date] = [];
      map[row.date].push(row);
    }
    return map;
  }, [occurrences, birthdayOccurrences]);

  const days = useMemo(() => {
    const out = [];
    let cur = range.start;
    const end = range.end;
    while (cur && cur <= end) {
      out.push(cur);
      cur = addDaysIso(cur, 1);
    }
    return out;
  }, [range]);

  const openNewEvent = (dateIso) => {
    setDraft({
      title: '',
      startDate: dateIso || cursor,
      endDate: dateIso || cursor,
      startTime: '',
      endTime: '',
      layerId: layers[0]?.id || '',
      notes: '',
    });
    setDraftOpen(true);
  };

  const saveDraft = () => {
    if (!draft.title.trim()) return;
    saveEvent({
      id: newCalendarId('event'),
      title: draft.title.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate || draft.startDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      layerId: draft.layerId,
      notes: draft.notes,
      isRecurring: false,
    });
    setDraftOpen(false);
  };

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={view}
          onChange={(id) => updatePrefs({ view: id })}
          options={[
            { id: 'Month', label: 'Month' },
            { id: 'Week', label: 'Week' },
            { id: 'Day', label: 'Day' },
          ]}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
            onClick={() => updatePrefs({ cursorDate: toIsoDate(new Date()) })}
          >
            Today
          </button>
        </div>
        <label className="sr-only" htmlFor="calendar-class-filter">
          Class
        </label>
        <select
          id="calendar-class-filter"
          className={`edu-control max-w-[12rem] rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          value={classFilterValue}
          onChange={(e) => onClassFilterChange(e.target.value)}
        >
          {classes.map((cls) => (
            <option key={cls.id} value={String(cls.id)}>
              {cls.name}
            </option>
          ))}
          <option value="all">All</option>
        </select>
        <CalendarLayersMenu
          theme={theme}
          isDarkMode={isDarkMode}
          showHolidays={showHolidays}
          onShowHolidaysChange={(next) => updatePrefs({ showHolidays: next })}
          showBirthdays={showBirthdays}
          onShowBirthdaysChange={(next) => updatePrefs({ showBirthdays: next })}
          specialistVisible={specialistVisible}
          onSpecialistVisibleChange={setSpecialistVisible}
        />
        <button
          type="button"
          className={`edu-control ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={() => openNewEvent(cursor)}
        >
          <Plus size={16} />
          Event
        </button>
      </div>

      {view === 'Month' ? (
        <div
          className={`${APP_BOARD_CHROME} flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div
            className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 ${theme.colorOutline}`}
          >
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] p-2 ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() =>
                updatePrefs({ cursorDate: shiftCursor(view, cursor, -1) })
              }
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              {monthLabel(cursor)}
            </h2>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] p-2 ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() =>
                updatePrefs({ cursorDate: shiftCursor(view, cursor, 1) })
              }
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className={`grid shrink-0 grid-cols-7 ${theme.colorOutline}`}>
            {weekdays.map((d, i) => (
              <div
                key={d}
                className={`border-b px-2 py-2 text-center ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant} ${theme.colorOutline} ${
                  i < 6 ? 'border-r' : ''
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
            {days.map((iso, index) => {
              const d = parseIsoDate(iso);
              const inMonth =
                d &&
                parseIsoDate(cursor) &&
                d.getMonth() === parseIsoDate(cursor).getMonth();
              const session = isSessionDay(iso, academic, closures);
              const holiday = sessionDayHoliday(iso, academic);
              const isWorkingDow = Boolean(
                d && (academic.workingDays || []).includes(d.getDay()),
              );
              // Shade snow/breaks/holidays on workdays only — not ordinary weekends.
              const closedWorkday = inMonth && isWorkingDow && !session;
              const items = byDate[iso] || [];
              const col = index % 7;
              const isLastRow = index >= days.length - 7;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => openNewEvent(iso)}
                  className={`edu-control flex h-full min-h-0 w-full flex-col items-start justify-start overflow-hidden p-1.5 text-left ${theme.colorOutline} ${
                    col < 6 ? 'border-r' : ''
                  } ${isLastRow ? '' : 'border-b'} ${
                    !inMonth
                      ? theme.colorSurfaceVariant
                      : closedWorkday
                        ? 'bg-slate-50 dark:bg-slate-900/40'
                        : ''
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full text-xs font-semibold leading-none ${
                      iso === toIsoDate(new Date())
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                        : !inMonth
                          ? theme.colorOnSurfaceVariant
                          : theme.colorOnSurface
                    }`}
                  >
                    {d?.getDate()}
                  </span>
                  {showHolidays && holiday && inMonth ? (
                    <p
                      className={`mt-0.5 w-full truncate text-[10px] font-semibold leading-tight ${theme.colorOnSurfaceVariant}`}
                      title={holiday.label}
                    >
                      {holiday.label}
                    </p>
                  ) : null}
                  <ul className="mt-1 min-h-0 w-full flex-1 space-y-0.5 self-stretch overflow-hidden">
                    {items.slice(0, 3).map((row) => {
                      const on = bestOnColor(row.color || '#6366f1');
                      return (
                        <li
                          key={row.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-tight"
                          style={{
                            backgroundColor: row.color,
                            color: on.hex,
                          }}
                          title={`${row.title} · ${row.className}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                          }}
                        >
                          {row.title}
                        </li>
                      );
                    })}
                    {items.length > 3 ? (
                      <li
                        className={`text-[10px] ${theme.colorOnSurfaceVariant}`}
                      >
                        +{items.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={`${APP_BOARD_CHROME} ${APP_BOARD_BODY_SCROLL} flex max-h-full min-h-0 w-full flex-1 flex-col ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className={`${APP_BOARD_PAD} space-y-2`}>
          {days.map((iso) => {
            const items = byDate[iso] || [];
            const multiClass = prefs.visibleClassIds.length > 1;
            const session = prefs.visibleClassIds.every((id) =>
              isSessionDay(iso, readAcademic(id), readClosures(id)),
            );
            const holiday = showHolidays
              ? sessionDayHoliday(iso, academic)
              : null;
            return (
              <div
                key={iso}
                className={`rounded-xl border-[1.5px] ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {parseIsoDate(iso)?.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {holiday ? (
                      <span
                        className={`ml-2 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
                      >
                        {holiday.label}
                      </span>
                    ) : !session ? (
                      <span
                        className={`ml-2 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
                      >
                        Non-session
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    className={`edu-control rounded-lg px-2 py-1 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                    onClick={() => openNewEvent(iso)}
                  >
                    Add
                  </button>
                </div>
                {items.length === 0 ? (
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    No events
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((row) => {
                      const on = bestOnColor(row.color || '#6366f1');
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            className="edu-control flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                            style={{
                              backgroundColor: row.color,
                              color: on.hex,
                            }}
                            onClick={() => setSelected(row)}
                          >
                            <span className="min-w-0 flex-1 truncate font-semibold">
                              {row.title}
                              {multiClass ? ` · ${row.className}` : ''}
                            </span>
                            {row.startTime ? (
                              <span className="shrink-0 text-xs opacity-90">
                                {row.startTime}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(selected)}
        title={selected?.title || 'Event'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setSelected(null)}
        footer={
          <div className="flex justify-end">
            <ModalPrimaryButton theme={theme} onClick={() => setSelected(null)}>
              Close
            </ModalPrimaryButton>
          </div>
        }
      >
        {selected ? (
          <div className={`space-y-2 p-6 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
            <p>
              <span className={theme.colorOnSurfaceVariant}>Class · </span>
              {selected.className}
            </p>
            {selected.layerName ? (
              <p>
                <span className={theme.colorOnSurfaceVariant}>Calendar · </span>
                {selected.layerName}
              </p>
            ) : null}
            {selected.kind === 'birthday' ? (
              <p>
                <span className={theme.colorOnSurfaceVariant}>Type · </span>
                Birthday
              </p>
            ) : null}
            <p>
              <span className={theme.colorOnSurfaceVariant}>Date · </span>
              {selected.date}
            </p>
            {selected.notes ? <p>{selected.notes}</p> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={draftOpen}
        title="New event"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setDraftOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() => setDraftOpen(false)}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={saveDraft}>
              Save
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="space-y-3 p-6">
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Title
            </span>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Start
              </span>
              <input
                type="date"
                className={inputClass}
                value={draft.startDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, startDate: e.target.value }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                End
              </span>
              <input
                type="date"
                className={inputClass}
                value={draft.endDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, endDate: e.target.value }))
                }
              />
            </label>
          </div>
          {layers.length ? (
            <label className="block space-y-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Calendar layer
              </span>
              <select
                className={inputClass}
                value={draft.layerId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, layerId: e.target.value }))
                }
              >
                <option value="">None</option>
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Saves to the focused class
            {classId ? ` (${classes.find((c) => String(c.id) === String(classId))?.name || ''})` : ''}.
          </p>
        </div>
      </Modal>
    </div>
  );
}
