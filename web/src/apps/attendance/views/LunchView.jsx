import { useMemo, useState } from 'react';
import { Grid3x3, Home, List, Move, School } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { ButtonRow } from '../../../shared/ButtonRow';
import { TYPE } from '../../../shared/typography';
import { APP_NESTED_CARD } from '../../../shared/layout';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { studentDisplayName, studentNameWithLastInitial } from '../../../data/students/displayName';
import { useAttendance } from '../AttendanceContext';
import { ViewModeToggle } from '../components/AttendanceMarking';

const MODE_OPTIONS = [
  { id: 'grid', label: 'Grid', icon: Grid3x3 },
  { id: 'list', label: 'List', icon: List },
  { id: 'drag', label: 'Drag', icon: Move },
];

function LunchButtons({ choice, onChoose, isDarkMode, size = 'md', disabled = false }) {
  const btn =
    size === 'sm'
      ? 'edu-control w-8 h-8 rounded-full flex items-center justify-center transition-all'
      : 'edu-control w-10 h-10 rounded-full flex items-center justify-center transition-all';
  const schoolOn = choice === 'school';
  const homeOn = choice === 'home';
  const idle = disabled
    ? isDarkMode
      ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
    : null;
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title={disabled ? 'Absent' : 'School lunch'}
        aria-pressed={schoolOn}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onChoose(schoolOn ? null : 'school');
        }}
        className={`${btn} ${
          disabled
            ? idle
            : schoolOn
              ? 'bg-blue-400 text-white shadow-md scale-110'
              : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-blue-400'
                : 'bg-slate-100 text-slate-400 hover:text-blue-600'
        }`}
      >
        <School size={size === 'sm' ? 15 : 17} strokeWidth={schoolOn ? 2.75 : 2} />
      </button>
      <button
        type="button"
        title={disabled ? 'Absent' : 'Home lunch'}
        aria-pressed={homeOn}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onChoose(homeOn ? null : 'home');
        }}
        className={`${btn} ${
          disabled
            ? idle
            : homeOn
              ? 'bg-amber-400 text-white shadow-md scale-110'
              : isDarkMode
                ? 'bg-slate-800 text-slate-400 hover:text-amber-400'
                : 'bg-slate-100 text-slate-400 hover:text-amber-800'
        }`}
      >
        <Home size={size === 'sm' ? 15 : 17} strokeWidth={homeOn ? 2.75 : 2} />
      </button>
    </div>
  );
}

function LunchCard({
  student,
  choice,
  onChoose,
  viewMode,
  theme,
  isDarkMode,
  draggable,
  onDragStart,
  lunchDisabled = false,
}) {
  const name = studentDisplayName(student);
  const compactName = studentNameWithLastInitial(student);
  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 ${
          lunchDisabled ? 'opacity-60' : ''
        } ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
      >
        <StudentAvatar student={student} theme={theme} size="sm" />
        <div className="min-w-0 flex-1">
          <p className={`truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}>
            {name}
          </p>
          {lunchDisabled ? (
            <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              Absent
            </p>
          ) : null}
        </div>
        <LunchButtons
          choice={choice}
          onChoose={onChoose}
          isDarkMode={isDarkMode}
          size="sm"
          disabled={lunchDisabled}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      draggable={draggable && !lunchDisabled}
      onDragStart={lunchDisabled ? undefined : onDragStart}
      className={`edu-control rounded-2xl border-[1.5px] text-left ${theme.colorSurface} ${theme.colorOutline} ${
        lunchDisabled ? 'opacity-60' : ''
      } ${
        !draggable && !lunchDisabled && choice === 'school'
          ? 'ring-2 ring-blue-400/40'
          : !draggable && !lunchDisabled && choice === 'home'
            ? 'ring-2 ring-amber-400/40'
            : ''
      } ${
        draggable && !lunchDisabled
          ? 'inline-flex items-center gap-2 px-2 py-1.5 cursor-grab active:cursor-grabbing'
          : 'flex flex-col items-center p-3'
      }`}
    >
      {draggable && !lunchDisabled ? (
        <>
          <StudentAvatar student={student} theme={theme} size="xs" />
          <p
            className={`min-w-0 truncate ${TYPE.labelMd} ${theme.colorOnSurface}`}
            title={name}
          >
            {compactName}
          </p>
        </>
      ) : (
        <>
          <StudentAvatar student={student} theme={theme} size="lg" />
          <p
            className={`mt-2 mb-3 w-full truncate text-center ${TYPE.titleSm} ${theme.colorOnSurface}`}
          >
            {name}
          </p>
          {lunchDisabled ? (
            <p
              className={`mb-2 text-center ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
            >
              Absent
            </p>
          ) : (
            <LunchButtons
              choice={choice}
              onChoose={onChoose}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}
    </button>
  );
}

export function LunchView({ isDarkMode, theme, classLabel }) {
  const { roster, day, setLunch } = useAttendance();
  const [viewMode, setViewMode] = useState('grid');
  const [dragOverZone, setDragOverZone] = useState(null);

  const isLunchDisabled = (student) =>
    day.marks[String(student.id)] === 'absent';

  const lunchEligible = useMemo(
    () => roster.filter((s) => !isLunchDisabled(s)),
    [roster, day.marks],
  );

  const unassigned = useMemo(
    () => lunchEligible.filter((s) => !day.lunch[String(s.id)]),
    [lunchEligible, day.lunch],
  );
  const school = useMemo(
    () => lunchEligible.filter((s) => day.lunch[String(s.id)] === 'school'),
    [lunchEligible, day.lunch],
  );
  const home = useMemo(
    () => lunchEligible.filter((s) => day.lunch[String(s.id)] === 'home'),
    [lunchEligible, day.lunch],
  );

  const trySetLunch = (studentId, choice) => {
    if (day.marks[String(studentId)] === 'absent') return;
    setLunch(studentId, choice);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lunch Count"
        description={
          classLabel
            ? `${classLabel} · School ${school.length} · Home ${home.length}`
            : `School ${school.length} · Home ${home.length}`
        }
        isDarkMode={isDarkMode}
      />

      <ButtonRow>
        <ViewModeToggle
          value={viewMode}
          onChange={setViewMode}
          isDarkMode={isDarkMode}
          theme={theme}
          options={MODE_OPTIONS}
        />
      </ButtonRow>

      {viewMode === 'drag' ? (
        <div className="space-y-3">
          <div
            className={`${APP_NESTED_CARD} p-3 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/student-id');
              if (id) trySetLunch(id, null);
            }}
          >
            <p className={`mb-2 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              Unassigned ({unassigned.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {unassigned.length === 0 ? (
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  All students assigned.
                </p>
              ) : (
                unassigned.map((s) => (
                  <LunchCard
                    key={s.id}
                    student={s}
                    choice={null}
                    onChoose={(c) => trySetLunch(s.id, c)}
                    viewMode="grid"
                    theme={theme}
                    isDarkMode={isDarkMode}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/student-id', String(s.id));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  />
                ))
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                id: 'school',
                label: 'School lunch',
                students: school,
                active: 'border-blue-400 bg-blue-400/10',
                badge: 'bg-blue-400 text-white',
                Icon: School,
              },
              {
                id: 'home',
                label: 'Home lunch',
                students: home,
                active: 'border-amber-400 bg-amber-400/10',
                badge: 'bg-amber-400 text-white',
                Icon: Home,
              },
            ].map((zone) => (
              <div
                key={zone.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone(zone.id);
                }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const id = e.dataTransfer.getData('text/student-id');
                  if (id) trySetLunch(id, zone.id);
                }}
                className={`min-h-[220px] rounded-2xl border-[1.5px] p-4 transition ${
                  dragOverZone === zone.id
                    ? zone.active
                    : `${theme.colorSurface} ${theme.colorOutline}`
                }`}
              >
                <div
                  className={`mb-3 flex items-center justify-center gap-2 border-b pb-3 ${theme.colorOutline}`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${zone.badge}`}
                  >
                    <zone.Icon size={16} strokeWidth={2.5} />
                  </span>
                  <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {zone.label}
                  </span>
                  <span className={`tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                    {zone.students.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {zone.students.map((s) => (
                    <LunchCard
                      key={s.id}
                      student={s}
                      choice={zone.id}
                      onChoose={(c) => trySetLunch(s.id, c)}
                      viewMode="grid"
                      theme={theme}
                      isDarkMode={isDarkMode}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/student-id', String(s.id));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div
          className={`divide-y overflow-hidden rounded-2xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline} ${
            isDarkMode ? 'divide-slate-800' : 'divide-slate-100'
          }`}
        >
          {roster.map((s) => (
            <LunchCard
              key={s.id}
              student={s}
              choice={day.lunch[String(s.id)] || null}
              onChoose={(c) => trySetLunch(s.id, c)}
              viewMode="list"
              theme={theme}
              isDarkMode={isDarkMode}
              lunchDisabled={isLunchDisabled(s)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {roster.map((s) => (
            <LunchCard
              key={s.id}
              student={s}
              choice={day.lunch[String(s.id)] || null}
              onChoose={(c) => trySetLunch(s.id, c)}
              viewMode="grid"
              theme={theme}
              isDarkMode={isDarkMode}
              lunchDisabled={isLunchDisabled(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
