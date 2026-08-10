import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TYPE } from '../../shared/typography';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { useClasses } from '../../data/classes/ClassContext';
import { newCalendarId } from '../../data/calendar/calendarModel';
import { nationalHolidaysInRange } from '../../data/calendar/nationalHolidays';
import {
  CALENDAR_UPDATED_EVENT,
  readAcademic,
  readClosures,
  readUiPrefs,
  writeAcademic,
  writeClosures,
  writeUiPrefs,
} from '../../data/calendar/calendarStorage';

const DOW = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

/**
 * Calendar app settings for the shell Settings page (no CalendarProvider).
 * @param {{ theme: object, isDarkMode: boolean, Card: Function }} props
 */
export function CalendarSettingsCards({ theme, isDarkMode, Card }) {
  const { selectedClass, classes } = useClasses();
  const classId = selectedClass?.id;
  const classLabel =
    classes?.find((c) => String(c.id) === String(classId))?.name ||
    selectedClass?.name ||
    'Class';

  const [academic, setAcademic] = useState(() => readAcademic(classId));
  const [closures, setClosures] = useState(() => readClosures(classId));
  const [prefs, setPrefs] = useState(() => readUiPrefs());
  const [breakName, setBreakName] = useState('Break');
  const [breakStart, setBreakStart] = useState(() => readAcademic(classId).startDate);
  const [breakEnd, setBreakEnd] = useState(() => readAcademic(classId).startDate);
  const [snowDate, setSnowDate] = useState('');
  const [snowLabel, setSnowLabel] = useState('Snow day');

  const reload = () => {
    setAcademic(readAcademic(classId));
    setClosures(readClosures(classId));
    setPrefs(readUiPrefs());
  };

  useEffect(() => {
    reload();
    setBreakStart(readAcademic(classId).startDate);
    setBreakEnd(readAcademic(classId).startDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on class change
  }, [classId]);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener(CALENDAR_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CALENDAR_UPDATED_EVENT, onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${
    isDarkMode
      ? 'bg-slate-900 border-slate-600 text-slate-100'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  const persistAcademic = (next) => {
    if (!classId) return;
    writeAcademic(classId, next);
    setAcademic(readAcademic(classId));
  };

  const persistClosures = (next) => {
    if (!classId) return;
    writeClosures(classId, next);
    setClosures(readClosures(classId));
  };

  const persistPrefs = (patch) => {
    const next = writeUiPrefs({ ...prefs, ...patch });
    setPrefs(next);
  };

  if (!Card) return null;

  return (
    <>
      <Card
        title="Date view"
        description="How the Calendar tab opens and how weeks are laid out."
        isDarkMode={isDarkMode}
      >
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div>
            <p
              className={`${TYPE.labelMd} mb-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Default view
            </p>
            <div className="flex flex-wrap gap-2">
              {['Month', 'Week', 'Day'].map((id) => {
                const on = (prefs.defaultView || prefs.view) === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                      on
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : isDarkMode
                          ? 'border-slate-600 text-slate-200'
                          : 'border-slate-300 text-slate-900'
                    }`}
                    onClick={() => persistPrefs({ defaultView: id, view: id })}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p
              className={`${TYPE.labelMd} mb-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Week starts on
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 0, label: 'Sunday' },
                { id: 1, label: 'Monday' },
              ].map((opt) => {
                const on = (prefs.weekStartsOn === 1 ? 1 : 0) === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                      on
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : isDarkMode
                          ? 'border-slate-600 text-slate-200'
                          : 'border-slate-300 text-slate-900'
                    }`}
                    onClick={() => persistPrefs({ weekStartsOn: opt.id })}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Academic year"
        description={`${classLabel} · Session days drive specialist rotations.`}
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {!classId ? (
            <p className={`${TYPE.bodySm} text-slate-500`}>
              Select a class to edit the academic calendar.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span
                    className={`${TYPE.labelMd} ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Start
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    value={academic.startDate}
                    onChange={(e) =>
                      persistAcademic({
                        ...academic,
                        startDate: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <span
                    className={`${TYPE.labelMd} ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    End
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    value={academic.endDate}
                    onChange={(e) =>
                      persistAcademic({ ...academic, endDate: e.target.value })
                    }
                  />
                </label>
              </div>
              <div>
                <p
                  className={`${TYPE.labelMd} mb-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Working days
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOW.map((d) => {
                    const on = (academic.workingDays || []).includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                          on
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                            : isDarkMode
                              ? 'border-slate-600 text-slate-200'
                              : 'border-slate-300 text-slate-900'
                        }`}
                        onClick={() => {
                          const set = new Set(academic.workingDays || []);
                          if (set.has(d.id)) set.delete(d.id);
                          else set.add(d.id);
                          persistAcademic({
                            ...academic,
                            workingDays: [...set].sort((a, b) => a - b),
                          });
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card
        title="National holidays"
        description="US federal / common school holidays automatically close the day and pause rotations."
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pr-2">
              <p
                className={`${TYPE.titleSm} ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Observe national holidays
              </p>
              <p
                className={`${TYPE.bodySm} mt-1 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {academic.observeNationalHolidays !== false
                  ? 'On — holidays in the academic year are non-session days.'
                  : 'Off — only breaks and snow closures remove school days.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={academic.observeNationalHolidays !== false}
              aria-label="Observe national holidays"
              disabled={!classId}
              onClick={() =>
                persistAcademic({
                  ...academic,
                  observeNationalHolidays: academic.observeNationalHolidays === false,
                })
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                academic.observeNationalHolidays !== false
                  ? theme.colorPrimary
                  : isDarkMode
                    ? 'bg-slate-700'
                    : 'bg-slate-300'
              } ${!classId ? 'opacity-40' : ''}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  academic.observeNationalHolidays !== false
                    ? 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {classId && academic.observeNationalHolidays !== false ? (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto">
              {nationalHolidaysInRange(
                academic.startDate,
                academic.endDate,
              ).map((h) => (
                <li
                  key={h.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2 ${
                    isDarkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`${TYPE.bodySm} ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {h.label}
                  </span>
                  <span
                    className={`${TYPE.labelMicro} tabular-nums ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {h.date}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>

      <Card
        title="Breaks"
        description="Multi-day ranges that pause rotations for this class."
        isDarkMode={isDarkMode}
      >
        <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              className={inputClass}
              value={breakName}
              onChange={(e) => setBreakName(e.target.value)}
              placeholder="Winter break"
              disabled={!classId}
            />
            <input
              type="date"
              className={inputClass}
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              disabled={!classId}
            />
            <input
              type="date"
              className={inputClass}
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              disabled={!classId}
            />
            <ModalPrimaryButton
              theme={theme}
              disabled={!classId}
              onClick={() => {
                if (!breakName.trim() || !breakStart) return;
                persistAcademic({
                  ...academic,
                  breaks: [
                    ...(academic.breaks || []),
                    {
                      id: newCalendarId('break'),
                      name: breakName.trim(),
                      startDate: breakStart,
                      endDate: breakEnd || breakStart,
                    },
                  ],
                });
              }}
            >
              <Plus size={16} className="mr-1 inline" />
              Add
            </ModalPrimaryButton>
          </div>
          <ul className="space-y-2">
            {(academic.breaks || []).map((br) => (
              <li
                key={br.id}
                className={`flex items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <span
                  className={`${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {br.name} · {br.startDate} → {br.endDate}
                </span>
                <button
                  type="button"
                  className={`edu-control rounded-lg p-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                  onClick={() =>
                    persistAcademic({
                      ...academic,
                      breaks: academic.breaks.filter((b) => b.id !== br.id),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card
        title="Snow / closures"
        description="Ad-hoc non-session days pause rotation sequences for this class."
        isDarkMode={isDarkMode}
      >
        <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              className={inputClass}
              value={snowLabel}
              onChange={(e) => setSnowLabel(e.target.value)}
              placeholder="Snow day"
              disabled={!classId}
            />
            <input
              type="date"
              className={inputClass}
              value={snowDate}
              onChange={(e) => setSnowDate(e.target.value)}
              disabled={!classId}
            />
            <ModalPrimaryButton
              theme={theme}
              disabled={!classId}
              onClick={() => {
                if (!snowDate) return;
                persistClosures([
                  ...closures,
                  {
                    id: newCalendarId('closure'),
                    date: snowDate,
                    label: snowLabel.trim() || 'Snow day',
                  },
                ]);
                setSnowDate('');
              }}
            >
              <Plus size={16} className="mr-1 inline" />
              Add
            </ModalPrimaryButton>
          </div>
          <ul className="space-y-2">
            {closures.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <span
                  className={`${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  {c.label} · {c.date}
                </span>
                <button
                  type="button"
                  className={`edu-control rounded-lg p-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                  onClick={() =>
                    persistClosures(closures.filter((x) => x.id !== c.id))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card
        title="Sync"
        description="Local-only for now. Google Calendar / ICS sync is coming later."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <button
            type="button"
            disabled
            className={`edu-control cursor-not-allowed rounded-xl px-3 py-2 opacity-50 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            Connect Google Calendar — coming soon
          </button>
        </div>
      </Card>
    </>
  );
}
