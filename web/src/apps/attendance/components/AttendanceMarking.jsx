import { Check, Clock, HeartHandshake, X } from 'lucide-react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName, studentNameWithLastInitial } from '../../../data/students/displayName';
import { STATUS_META } from '../attendanceState';

const STATUS_ACTIVE = {
  present: 'bg-emerald-500 text-white shadow-md scale-110',
  absent: 'bg-rose-400 text-white shadow-md scale-110',
  tardy: 'bg-amber-400 text-white shadow-md scale-110',
  excused: 'bg-blue-400 text-white shadow-md scale-110',
};

const STATUS_IDLE_LIGHT = {
  present: 'bg-slate-100 text-slate-400 hover:text-emerald-700',
  absent: 'bg-slate-100 text-slate-400 hover:text-rose-600',
  tardy: 'bg-slate-100 text-slate-400 hover:text-amber-800',
  excused: 'bg-slate-100 text-slate-400 hover:text-blue-600',
};

const STATUS_IDLE_DARK = {
  present: 'bg-slate-800 text-slate-400 hover:text-emerald-400',
  absent: 'bg-slate-800 text-slate-400 hover:text-rose-400',
  tardy: 'bg-slate-800 text-slate-400 hover:text-amber-400',
  excused: 'bg-slate-800 text-slate-400 hover:text-blue-400',
};

const STATUS_ICONS = {
  present: Check,
  absent: X,
  tardy: Clock,
  excused: HeartHandshake,
};

/** Colored board border for a mark — replaces outline so we don’t double-stroke. */
export function statusRingClass(status) {
  if (status === 'present') return 'border-emerald-500';
  if (status === 'absent') return 'border-rose-400';
  if (status === 'tardy') return 'border-amber-400';
  if (status === 'excused') return 'border-blue-400';
  return '';
}

export function StatusMarkButtons({
  status,
  onMark,
  isDarkMode,
  size = 'md',
}) {
  const btn =
    size === 'sm'
      ? 'edu-control w-8 h-8 rounded-full flex items-center justify-center transition-all'
      : 'edu-control w-10 h-10 rounded-full flex items-center justify-center transition-all';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {['present', 'absent', 'tardy', 'excused'].map((key) => {
        const Icon = STATUS_ICONS[key];
        const active = status === key;
        const idle = isDarkMode ? STATUS_IDLE_DARK[key] : STATUS_IDLE_LIGHT[key];
        return (
          <button
            key={key}
            type="button"
            title={STATUS_META[key].label}
            aria-label={STATUS_META[key].label}
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation();
              onMark(active ? null : key);
            }}
            className={`${btn} ${active ? STATUS_ACTIVE[key] : idle}`}
          >
            <Icon size={iconSize} strokeWidth={active ? 3 : 2} />
          </button>
        );
      })}
    </div>
  );
}

export function AttendanceStudentCard({
  student,
  status,
  onMark,
  onCardClick,
  viewMode,
  theme,
  isDarkMode,
  draggable,
  onDragStart,
}) {
  const name = studentDisplayName(student);
  const compactName = studentNameWithLastInitial(student);
  const statusBorder = draggable ? '' : statusRingClass(status);
  const outlineClass = statusBorder || theme.colorOutline;

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 ${
          isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
        }`}
      >
        <StudentAvatar student={student} theme={theme} size="sm" />
        <p
          className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
        >
          {name}
        </p>
        <StatusMarkButtons
          status={status}
          onMark={onMark}
          isDarkMode={isDarkMode}
          size="sm"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onCardClick}
      className={`edu-control group rounded-2xl border-[1.5px] text-left transition ${theme.colorSurface} ${outlineClass} ${
        draggable
          ? 'inline-flex items-center gap-2 px-2 py-1.5 cursor-grab active:cursor-grabbing'
          : `flex flex-col items-center p-3 ${
              isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
            }`
      }`}
    >
      {draggable ? (
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
          <div className="mb-2">
            <StudentAvatar student={student} theme={theme} size="lg" />
          </div>
          <p
            className={`mb-3 w-full truncate text-center ${TYPE.titleSm} ${theme.colorOnSurface}`}
          >
            {name}
          </p>
          <StatusMarkButtons
            status={status}
            onMark={onMark}
            isDarkMode={isDarkMode}
            size="sm"
          />
        </>
      )}
    </button>
  );
}

export function ViewModeToggle({ value, onChange, isDarkMode, theme, options }) {
  return (
    <div
      className={`inline-flex items-center rounded-xl border-[1.5px] p-1 ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`edu-control inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${TYPE.labelMd} transition ${
              active
                ? `${theme.colorSurface} ${theme.colorOnSurface} shadow-sm`
                : `${theme.colorOnSurfaceVariant} hover:opacity-90`
            }`}
          >
            {opt.icon ? <opt.icon size={14} strokeWidth={2.25} /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
