import { useEffect, useMemo, useState } from 'react';
import { Home, School, Utensils } from 'lucide-react';
import { ATTENDANCE_UPDATED_EVENT } from '../../../data/attendance/todayPresence';
import { studentNameWithLastInitial } from '../../../data/students/displayName';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import { readTodayDay, setStudentLunch } from '../attendanceActions';
import { WidgetShell } from './WidgetShell';

/**
 * Student lunch choice — tap school or home lunch next to your name.
 */
export function LunchWidget({ theme, isDarkMode, classId, roster, onOpenApp, pin }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(ATTENDANCE_UPDATED_EVENT, onChange);
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

  const schoolCount = sorted.filter((s) => day.lunch[String(s.id)] === 'school').length;
  const homeCount = sorted.filter((s) => day.lunch[String(s.id)] === 'home').length;

  return (
    <WidgetShell
      theme={theme}
      title="Hot lunch"
      icon={Utensils}
      pin={pin}
      action={
        onOpenApp ? (
          <button
            type="button"
            className={`edu-control rounded-lg px-2 py-1 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => onOpenApp('attendance')}
          >
            Teacher
          </button>
        ) : null
      }
    >
      {!classId || !sorted.length ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Select a class with a roster so students can choose lunch.
        </p>
      ) : day.submitted ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Lunch is locked · School {schoolCount} · Home {homeCount}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className={`${TYPE.bodySm} shrink-0 ${theme.colorOnSurfaceVariant}`}>
            Tap school or home · School {schoolCount} · Home {homeCount}
          </p>
          <div className="min-h-0">
            <ul className="space-y-1">
              {sorted.map((student) => {
                const id = String(student.id);
                const absent = day.marks[id] === 'absent';
                const choice = day.lunch[id] || null;
                const name = studentNameWithLastInitial(student);
                return (
                  <li
                    key={id}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-2 py-1.5 min-w-0 ${theme.colorOutline} ${
                      absent ? 'opacity-50' : theme.colorSurface
                    }`}
                  >
                    <StudentAvatar student={student} theme={theme} size="xs" />
                    <span className={`${TYPE.labelMd} truncate flex-1 min-w-0 ${theme.colorOnSurface}`}>
                      {name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <LunchPick
                        label="School lunch"
                        active={choice === 'school'}
                        disabled={absent || day.submitted}
                        activeClass="bg-blue-400 text-white"
                        idleClass={
                          isDarkMode
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                        }
                        onClick={() =>
                          setStudentLunch(
                            classId,
                            id,
                            choice === 'school' ? null : 'school',
                            roster,
                          )
                        }
                      >
                        <School size={15} strokeWidth={choice === 'school' ? 2.75 : 2} />
                      </LunchPick>
                      <LunchPick
                        label="Home lunch"
                        active={choice === 'home'}
                        disabled={absent || day.submitted}
                        activeClass="bg-amber-400 text-white"
                        idleClass={
                          isDarkMode
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                        }
                        onClick={() =>
                          setStudentLunch(
                            classId,
                            id,
                            choice === 'home' ? null : 'home',
                            roster,
                          )
                        }
                      >
                        <Home size={15} strokeWidth={choice === 'home' ? 2.75 : 2} />
                      </LunchPick>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

function LunchPick({ label, active, disabled, activeClass, idleClass, onClick, children }) {
  return (
    <button
      type="button"
      title={disabled ? 'Absent' : label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`edu-control w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        disabled ? 'cursor-not-allowed opacity-40' : active ? `${activeClass} shadow-sm` : idleClass
      }`}
    >
      {children}
    </button>
  );
}
