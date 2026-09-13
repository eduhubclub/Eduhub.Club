import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck } from 'lucide-react';
import { ATTENDANCE_UPDATED_EVENT } from '../../../data/attendance/todayPresence';
import { studentNameWithLastInitial } from '../../../data/students/displayName';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import {
  MORNING_MEETING_PREFS_EVENT,
  readCheckInCardStyle,
} from '../checkInPrefs';
import { readTodayDay, toggleStudentPresent } from '../attendanceActions';
import { WidgetShell } from './WidgetShell';

/**
 * Student self check-in — tap your name or avatar when you arrive.
 */
export function AttendanceWidget({ theme, classId, roster, onOpenApp, pin }) {
  const [tick, setTick] = useState(0);
  const [cardStyle, setCardStyle] = useState(readCheckInCardStyle);
  const avatarsOnly = cardStyle === 'avatars';

  useEffect(() => {
    const onAttendance = () => setTick((n) => n + 1);
    const onPrefs = (e) => {
      if (e?.detail?.checkInCardStyle) setCardStyle(e.detail.checkInCardStyle);
      else setCardStyle(readCheckInCardStyle());
    };
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, onAttendance);
    window.addEventListener(MORNING_MEETING_PREFS_EVENT, onPrefs);
    return () => {
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, onAttendance);
      window.removeEventListener(MORNING_MEETING_PREFS_EVENT, onPrefs);
    };
  }, []);

  const day = useMemo(() => {
    void tick;
    return readTodayDay(classId, roster || []);
  }, [classId, roster, tick]);

  const sorted = useMemo(() => {
    const list = [...(roster || [])];
    list.sort((a, b) =>
      studentNameWithLastInitial(a).localeCompare(studentNameWithLastInitial(b)),
    );
    return list;
  }, [roster]);

  const hereCount = sorted.filter((s) => {
    const status = day.marks[String(s.id)];
    return status === 'present' || status === 'tardy';
  }).length;

  return (
    <WidgetShell
      theme={theme}
      title="Check in"
      icon={ClipboardCheck}
      compact
      pin={pin}
      action={
        onOpenApp ? (
          <button
            type="button"
            className={`edu-control rounded-lg px-1.5 py-0.5 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => onOpenApp('attendance')}
          >
            Teacher
          </button>
        ) : null
      }
    >
      {!classId || !sorted.length ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Select a class with a roster so students can check in.
        </p>
      ) : day.submitted ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Attendance is locked for today ({hereCount} here).
        </p>
      ) : (
        <div className="flex min-h-0 flex-col gap-1">
          <p className={`${TYPE.labelSm} shrink-0 ${theme.colorOnSurfaceVariant}`}>
            {avatarsOnly ? 'Tap your picture' : 'Tap your name'} · {hereCount}/
            {sorted.length} here
          </p>
          <div className="min-h-0">
            <div
              className={
                avatarsOnly
                  ? 'grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-0.5'
                  : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1'
              }
            >
              {sorted.map((student) => {
                const id = String(student.id);
                const status = day.marks[id] || null;
                const here = status === 'present' || status === 'tardy';
                const name = studentNameWithLastInitial(student);
                if (avatarsOnly) {
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={Boolean(day.submitted)}
                      onClick={() => toggleStudentPresent(classId, id, roster)}
                      className="edu-control relative flex items-center justify-center rounded-full p-0 transition-all"
                      aria-pressed={here}
                      aria-label={
                        here
                          ? `${name} — checked in (tap to undo)`
                          : `${name} — tap to check in`
                      }
                      title={name}
                    >
                      <span
                        className={`relative inline-flex rounded-full ${
                          here ? 'ring-2 ring-emerald-500' : ''
                        }`}
                      >
                        <StudentAvatar student={student} theme={theme} size="sm" />
                        {here ? (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={Boolean(day.submitted)}
                    onClick={() => toggleStudentPresent(classId, id, roster)}
                    className={`edu-control flex items-center gap-1.5 rounded-lg border-[1.5px] px-1.5 py-1 text-left transition-colors min-w-0 ${
                      here
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100'
                        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                    }`}
                    aria-pressed={here}
                    title={
                      here
                        ? `${name} — checked in (tap to undo)`
                        : `${name} — tap to check in`
                    }
                  >
                    <StudentAvatar student={student} theme={theme} size="xs" />
                    <span className={`${TYPE.labelSm} truncate flex-1 min-w-0`}>
                      {name}
                    </span>
                    {here ? (
                      <Check size={12} className="shrink-0 text-emerald-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
