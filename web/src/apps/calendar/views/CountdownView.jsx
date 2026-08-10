import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_BOARD_PAD } from '../../../shared/layout';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { useCalendar } from '../CalendarContext';
import { newCalendarId, toIsoDate } from '../../../data/calendar/calendarModel';
import {
  calendarDaysUntil,
  schoolDaysUntil,
} from '../../../data/calendar/sessionDays';

/**
 * Classroom countdowns to a date (school days + calendar days).
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
          No countdowns yet.
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
