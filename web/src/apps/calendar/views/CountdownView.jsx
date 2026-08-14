import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_BOARD_PAD } from '../../../shared/layout';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { useCalendar } from '../CalendarContext';
import { newCalendarId, parseIsoDate, toIsoDate } from '../../../data/calendar/calendarModel';
import {
  calendarDaysUntil,
  breakWorkingDaysInYear,
  schoolDaysInYear,
  schoolDaysRemaining,
  schoolDaysUntil,
} from '../../../data/calendar/sessionDays';

function formatShortDate(iso) {
  const d = parseIsoDate(iso);
  if (!d) return iso || '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Classroom countdowns to a date (school days + calendar days).
 * Includes an automatic Last Day of School card from Academic year settings.
 */
export function CountdownView({ isDarkMode, theme }) {
  const {
    countdowns,
    saveCountdown,
    deleteCountdown,
    academic,
    closures,
    todayIso,
    classes,
    classId,
  } = useCalendar();
  const classLabel =
    classes.find((c) => String(c.id) === String(classId))?.name || 'Class';

  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(toIsoDate(new Date()));

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const firstDay = academic?.startDate || '';
  const lastDay = academic?.endDate || '';
  const breakCount = (academic?.breaks || []).length;
  const totalSchoolDays = schoolDaysInYear(academic, closures);
  const schoolLeft = schoolDaysRemaining(academic, closures, todayIso);
  const breakDays = breakWorkingDaysInYear(academic);
  const calToLast = lastDay ? calendarDaysUntil(lastDay, todayIso) : 0;
  const beforeYear = firstDay && todayIso < firstDay;
  const afterYear = lastDay && todayIso > lastDay;
  const calToFirst =
    beforeYear && firstDay ? calendarDaysUntil(firstDay, todayIso) : 0;
  const workingLabel = (academic?.workingDays || [])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
    .join('–');
  // Compact Mon–Fri style when contiguous weekdays
  const workingSummary =
    JSON.stringify([...(academic?.workingDays || [])].sort((a, b) => a - b)) ===
    JSON.stringify([1, 2, 3, 4, 5])
      ? 'Mon–Fri'
      : workingLabel || 'Working days';
  const countBasis = [
    workingSummary,
    academic?.observeNationalHolidays !== false ? 'holidays off' : null,
    breakCount > 0
      ? `${breakCount} break${breakCount === 1 ? '' : 's'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const add = () => {
    if (!title.trim() || !targetDate) return;
    saveCountdown({
      id: newCalendarId('countdown'),
      title: title.trim(),
      targetDate,
    });
    setTitle('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Countdown"
        description={`${classLabel} · Days until a date (school days pause on snow/breaks).`}
        isDarkMode={isDarkMode}
      />

      {lastDay ? (
        <div
          className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                From Academic year
              </p>
              <p className={`mt-0.5 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
                Last Day of School
              </p>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {formatShortDate(lastDay)}
                {firstDay ? ` · First Day ${formatShortDate(firstDay)}` : ''}
              </p>
              {countBasis ? (
                <p
                  className={`mt-1 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
                >
                  Session days: {countBasis}
                </p>
              ) : null}
            </div>
            {totalSchoolDays > 0 ? (
              <p
                className={`shrink-0 rounded-full px-3 py-1 ${TYPE.labelMd} ${theme.colorSecondaryContainer} ${theme.colorOnSecondaryContainer}`}
              >
                {totalSchoolDays} school days in year
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className={`rounded-xl p-3 ${theme.colorPrimaryContainer}`}>
              <p
                className={`${TYPE.labelMicro} ${theme.colorOnPrimaryContainer}`}
              >
                School days left
              </p>
              <p
                className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnPrimaryContainer}`}
              >
                {afterYear ? '—' : schoolLeft}
              </p>
            </div>
            <div
              className={`rounded-xl border-[1.5px] p-3 ${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`}
            >
              <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                Break days
              </p>
              <p
                className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}
              >
                {breakDays}
              </p>
            </div>
            <div
              className={`rounded-xl border-[1.5px] p-3 ${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`}
            >
              <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                Calendar days
              </p>
              <p
                className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}
              >
                {afterYear ? 'Passed' : calToLast}
              </p>
            </div>
            <div
              className={`rounded-xl border-[1.5px] p-3 ${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`}
            >
              <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                {beforeYear
                  ? 'Until First Day'
                  : afterYear
                    ? 'Year status'
                    : 'Completed'}
              </p>
              <p
                className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}
              >
                {beforeYear
                  ? `${calToFirst} cal. days`
                  : afterYear
                    ? 'Done'
                    : `${Math.max(0, totalSchoolDays - schoolLeft)} days`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          Set Academic year start and end in Settings to unlock the automatic
          school-days countdown.
        </p>
      )}

      <div
        className={`${APP_GRID_CARD} ${APP_BOARD_PAD} space-y-3 ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Title
            </span>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Field trip"
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Target
            </span>
            <input
              type="date"
              className={inputClass}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <ModalPrimaryButton theme={theme} onClick={add}>
              <Plus size={16} className="mr-1 inline" />
              Add
            </ModalPrimaryButton>
          </div>
        </div>
      </div>

      {!countdowns.length ? (
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          No custom countdowns yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {countdowns.map((c) => {
            const school = schoolDaysUntil(
              c.targetDate,
              academic,
              closures,
              todayIso,
            );
            const cal = calendarDaysUntil(c.targetDate, todayIso);
            const past = c.targetDate < todayIso;
            return (
              <li
                key={c.id}
                className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                      {c.title}
                    </p>
                    <p
                      className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                    >
                      {c.targetDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`edu-control rounded-lg p-2 ${theme.colorOnSurfaceVariant}`}
                    onClick={() => deleteCountdown(c.id)}
                    aria-label="Delete countdown"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className={`rounded-xl p-3 ${theme.colorPrimaryContainer}`}
                  >
                    <p
                      className={`${TYPE.labelMicro} ${theme.colorOnPrimaryContainer}`}
                    >
                      School days
                    </p>
                    <p
                      className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnPrimaryContainer}`}
                    >
                      {past ? '—' : school}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border-[1.5px] p-3 ${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`}
                  >
                    <p
                      className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
                    >
                      Calendar days
                    </p>
                    <p
                      className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}
                    >
                      {past ? 'Passed' : cal}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
