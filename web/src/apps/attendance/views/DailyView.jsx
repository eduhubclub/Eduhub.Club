import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Grid3x3,
  HeartHandshake,
  List,
  Move,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { ButtonRow } from '../../../shared/ButtonRow';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_NESTED_CARD } from '../../../shared/layout';
import { studentDisplayName } from '../../../data/students/displayName';
import { useAttendance } from '../AttendanceContext';
import { countMarks, STATUS_META } from '../attendanceState';
import {
  AttendanceStudentCard,
  ViewModeToggle,
} from '../components/AttendanceMarking';
import { AttendanceCountsCard } from '../components/AttendanceCountsCard';
import { formatAttendanceDateLabel } from '../../../data/attendance/dateView';

const MODE_OPTIONS = [
  { id: 'grid', label: 'Grid', icon: Grid3x3 },
  { id: 'list', label: 'List', icon: List },
  { id: 'drag', label: 'Drag', icon: Move },
];

const DROP_ZONES = [
  {
    id: 'present',
    label: 'Present',
    icon: Check,
    active: 'border-emerald-500 bg-emerald-500/10',
    badge: 'bg-emerald-500 text-white',
  },
  {
    id: 'absent',
    label: 'Absent',
    icon: X,
    active: 'border-rose-400 bg-rose-400/10',
    badge: 'bg-rose-400 text-white',
  },
  {
    id: 'tardy',
    label: 'Tardy',
    icon: Clock,
    active: 'border-amber-400 bg-amber-400/10',
    badge: 'bg-amber-400 text-white',
  },
  {
    id: 'excused',
    label: 'Excused',
    icon: HeartHandshake,
    active: 'border-blue-400 bg-blue-400/10',
    badge: 'bg-blue-400 text-white',
  },
];

function formatTodayLabel(dateKeyStr, dateView) {
  return formatAttendanceDateLabel(dateKeyStr, dateView);
}

export function DailyView({ isDarkMode, theme, classLabel }) {
  const { roster, day, activeDate, setMark, submitAttendance, dateView } =
    useAttendance();
  const [viewMode, setViewMode] = useState('grid');
  const [showUnmarked, setShowUnmarked] = useState(false);
  const [dragOverZone, setDragOverZone] = useState(null);

  const counts = useMemo(() => countMarks(day, roster), [day, roster]);
  const unmarked = useMemo(
    () => roster.filter((s) => !day.marks[String(s.id)]),
    [roster, day.marks],
  );

  const byStatus = (status) =>
    roster.filter((s) => day.marks[String(s.id)] === status);

  const handleSubmitClick = () => {
    if (unmarked.length) setShowUnmarked(true);
    else submitAttendance();
  };

  const confirmSubmit = () => {
    submitAttendance();
    setShowUnmarked(false);
  };

  const onDropZone = (status) => (e) => {
    e.preventDefault();
    setDragOverZone(null);
    const id = e.dataTransfer.getData('text/student-id');
    if (id) setMark(id, status);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Daily Attendance"
        description={classLabel || undefined}
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
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={day.submitted}
          className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${
            day.submitted
              ? isDarkMode
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-emerald-500/15 text-emerald-700'
              : `${theme.colorPrimary} ${theme.colorOnPrimary}`
          }`}
        >
          {day.submitted ? 'Submitted' : 'Submit Attendance'}
        </button>
      </ButtonRow>

      <div className="flex flex-wrap items-stretch gap-3">
        <div
          className={`flex shrink-0 items-center ${APP_GRID_CARD} px-4 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            {formatTodayLabel(activeDate, dateView)}
          </h3>
        </div>
        <AttendanceCountsCard
          counts={counts}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      </div>

      {viewMode === 'drag' ? (
        <div className="space-y-3">
          <div
            className={`${APP_NESTED_CARD} p-3 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/student-id');
              if (id) setMark(id, null);
            }}
          >
            <p
              className={`mb-2 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
            >
              Unmarked
            </p>
            <div className="flex flex-wrap gap-2">
              {unmarked.length === 0 ? (
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  All students marked.
                </p>
              ) : (
                unmarked.map((s) => (
                  <AttendanceStudentCard
                    key={s.id}
                    student={s}
                    status={null}
                    onMark={(status) => setMark(s.id, status)}
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
            {DROP_ZONES.map((zone) => {
              const Icon = zone.icon;
              const students = byStatus(zone.id);
              const over = dragOverZone === zone.id;
              return (
                <div
                  key={zone.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverZone(zone.id);
                  }}
                  onDragLeave={() => setDragOverZone(null)}
                  onDrop={onDropZone(zone.id)}
                  className={`min-h-[200px] rounded-2xl border-[1.5px] p-4 transition ${
                    over
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
                      <Icon size={16} strokeWidth={2.5} />
                    </span>
                    <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                      {zone.label}
                    </span>
                    <span
                      className={`tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    >
                      {students.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {students.map((s) => (
                      <AttendanceStudentCard
                        key={s.id}
                        student={s}
                        status={zone.id}
                        onMark={(status) => setMark(s.id, status)}
                        viewMode="grid"
                        theme={theme}
                        isDarkMode={isDarkMode}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'text/student-id',
                            String(s.id),
                          );
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div
          className={`divide-y overflow-hidden rounded-2xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline} ${
            isDarkMode ? 'divide-slate-800' : 'divide-slate-100'
          }`}
        >
          {roster.map((s) => (
            <AttendanceStudentCard
              key={s.id}
              student={s}
              status={day.marks[String(s.id)] || null}
              onMark={(status) => setMark(s.id, status)}
              viewMode="list"
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {roster.map((s) => (
            <AttendanceStudentCard
              key={s.id}
              student={s}
              status={day.marks[String(s.id)] || null}
              onMark={(status) => setMark(s.id, status)}
              onCardClick={() => {
                const cur = day.marks[String(s.id)];
                if (cur === 'present') setMark(s.id, 'absent');
                else if (cur === 'absent') setMark(s.id, 'tardy');
                else if (cur === 'tardy') setMark(s.id, 'excused');
                else if (cur === 'excused') setMark(s.id, null);
                else setMark(s.id, 'present');
              }}
              viewMode="grid"
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showUnmarked}
        title="Unmarked Students"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setShowUnmarked(false)}
        maxWidth="max-w-md"
      >
        <p className={`mb-3 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          {unmarked.length} student{unmarked.length === 1 ? '' : 's'} still
          unmarked. Submit will mark them absent.
        </p>
        <ul
          className={`mb-4 max-h-48 space-y-1 overflow-y-auto rounded-xl border-[1.5px] p-3 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
        >
          {unmarked.map((s) => (
            <li
              key={s.id}
              className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}
            >
              {studentDisplayName(s)}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowUnmarked(false)}
            className={`edu-control flex-1 rounded-xl px-3 py-2.5 ${TYPE.labelLg} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
          >
            Go back
          </button>
          <ModalPrimaryButton theme={theme} onClick={confirmSubmit}>
            Mark absent & submit
          </ModalPrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
