import { useMemo, useState } from 'react';
import { Award, Bell, Star, Target, Trophy } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD } from '../../../shared/layout';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { studentDisplayName } from '../../../data/students/displayName';
import { useAttendance } from '../AttendanceContext';
import {
  classAttendancePercent,
  isInMonth,
  pickChampion,
  pickTopAttenders,
  studentAttendingDays,
  studentEarlyCheckInDays,
} from '../attendanceState';

function GoalBar({ label, current, goal, fillClass, theme, isDarkMode }) {
  const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0);
  const remaining = Math.max(0, Math.round((goal - current) * 10) / 10);
  return (
    <div
      className={`${APP_GRID_CARD} p-5 sm:p-6 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{label}</h2>
          <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Class attendance target
          </p>
        </div>
        <span
          className={`rounded-lg border-[1.5px] px-3 py-1 ${TYPE.titleMd} tabular-nums ${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.text}`}
        >
          {goal}%
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 mb-2">
        <span className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
          Current: {current}%
        </span>
        <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {remaining}% to go
        </span>
      </div>
      <div
        className={`h-3 w-full overflow-hidden rounded-full ${
          isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AwardsView({ isDarkMode, theme, classLabel }) {
  const { roster, days, goals, setGoals, today } = useAttendance();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({
    yearlyPercent: goals.yearlyPercent,
    monthlyPercent: goals.monthlyPercent,
    schoolDays: goals.schoolDays,
  });

  const yearlyPct = useMemo(
    () =>
      classAttendancePercent(days, roster, (key) =>
        key.startsWith(`${year}-`),
      ),
    [days, roster, year],
  );

  const monthlyPct = useMemo(
    () =>
      classAttendancePercent(days, roster, (key) =>
        isInMonth(key, year, month),
      ),
    [days, roster, year, month],
  );

  const attendingById = useMemo(
    () => studentAttendingDays(days, roster, year, month),
    [days, roster, year, month],
  );

  const champion = useMemo(
    () => pickChampion(roster, attendingById, today, 'attendance'),
    [roster, attendingById, today],
  );

  const earlyById = useMemo(
    () => studentEarlyCheckInDays(days, roster, year, month),
    [days, roster, year, month],
  );

  const checkInChampion = useMemo(
    () => pickChampion(roster, earlyById, today, 'check-in'),
    [roster, earlyById, today],
  );

  const topFive = useMemo(
    () => pickTopAttenders(roster, attendingById, 5),
    [roster, attendingById],
  );

  const openEdit = () => {
    setDraft({
      yearlyPercent: goals.yearlyPercent,
      monthlyPercent: goals.monthlyPercent,
      schoolDays: goals.schoolDays,
    });
    setEditing(true);
  };

  const saveGoals = () => {
    setGoals(draft);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Awards & Goals"
        description={
          classLabel
            ? `${classLabel} · Encourage showing up`
            : 'Encourage showing up'
        }
        isDarkMode={isDarkMode}
      />

      <ButtonRow>
        <button
          type="button"
          onClick={openEdit}
          className={toolBtnClass(isDarkMode)}
          title="Edit goals"
          aria-label="Edit goals"
        >
          <Target size={16} strokeWidth={2.5} />
          <ButtonRowLabel>Edit goals</ButtonRowLabel>
        </button>
      </ButtonRow>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoalBar
          label="Yearly Goal"
          current={yearlyPct}
          goal={goals.yearlyPercent}
          fillClass="bg-amber-400"
          theme={theme}
          isDarkMode={isDarkMode}
        />
        <GoalBar
          label="Monthly Goal"
          current={monthlyPct}
          goal={goals.monthlyPercent}
          fillClass={theme.colorPrimary}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <div className="space-y-4">
          <div
            className={`${APP_GRID_CARD} relative overflow-hidden p-5 sm:p-6 ${
              isDarkMode
                ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-700/40'
                : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'
            } ${theme.colorOutline}`}
          >
            <div className="pointer-events-none absolute -right-3 -top-3 text-amber-500/10">
              <Award size={120} />
            </div>
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <Star size={18} className="text-amber-500" fill="currentColor" />
                <h2
                  className={`${TYPE.titleMd} ${
                    isDarkMode ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  Attendance Champion
                </h2>
              </div>
              {champion ? (
                <div className="flex items-center gap-3">
                  <StudentAvatar
                    student={champion.student}
                    theme={theme}
                    size="lg"
                  />
                  <div>
                    <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                      {studentDisplayName(champion.student)}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-0.5 ${
                        isDarkMode ? 'text-amber-300/80' : 'text-amber-700/80'
                      }`}
                    >
                      Present days this month: {champion.days}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-80">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
                  >
                    <Target size={22} />
                  </div>
                  <div>
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurfaceVariant}`}>
                      No champion yet
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      Keep tracking attendance this month.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`${APP_GRID_CARD} relative overflow-hidden p-5 sm:p-6 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-950/40 to-slate-900 border-blue-700/40'
                : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
            } ${theme.colorOutline}`}
          >
            <div className="pointer-events-none absolute -right-3 -top-3 text-blue-400/10">
              <Bell size={120} />
            </div>
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <Bell size={18} className="text-blue-400" />
                <h2
                  className={`${TYPE.titleMd} ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}
                >
                  Check In Champion
                </h2>
              </div>
              {checkInChampion ? (
                <div className="flex items-center gap-3">
                  <StudentAvatar
                    student={checkInChampion.student}
                    theme={theme}
                    size="lg"
                  />
                  <div>
                    <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                      {studentDisplayName(checkInChampion.student)}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-0.5 ${
                        isDarkMode ? 'text-blue-300/80' : 'text-blue-700/80'
                      }`}
                    >
                      Early check-ins this month: {checkInChampion.days}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}
                    >
                      Marked present or tardy before 9:10
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-80">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
                  >
                    <Bell size={22} />
                  </div>
                  <div>
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurfaceVariant}`}>
                      No check-in champion yet
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      Shout-out for students marked before 9:10.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`${APP_GRID_CARD} relative overflow-hidden p-5 sm:p-6 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={18} className={theme.text} />
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Top 5</h2>
          </div>
          {topFive.length > 0 ? (
            <ol className="space-y-2.5">
              {topFive.map((row) => (
                <li key={row.student.id} className="flex items-center gap-3">
                  <StudentAvatar
                    student={row.student}
                    theme={theme}
                    size="sm"
                  />
                  <p
                    className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                  >
                    {studentDisplayName(row.student)}
                  </p>
                  <span
                    className={`shrink-0 tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    {row.days}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              No attendance days recorded this month yet.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(editing)}
        title="Edit goals"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setEditing(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {[
            { key: 'yearlyPercent', label: 'Yearly goal %' },
            { key: 'monthlyPercent', label: 'Monthly goal %' },
            { key: 'schoolDays', label: 'School days in year' },
          ].map((field) => (
            <label key={field.key} className="block">
              <span
                className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
              >
                {field.label}
              </span>
              <input
                type="number"
                value={draft[field.key]}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className={`edu-control mt-1 w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              />
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={saveGoals}>
              Save
            </ModalPrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
