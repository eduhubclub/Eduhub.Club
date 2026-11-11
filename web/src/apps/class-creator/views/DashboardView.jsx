import { useMemo } from 'react';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { TYPE } from '../../../shared/typography';
import { useClasses } from '../../../data/classes/ClassContext';
import { useDistrictOrg } from '../../../data/district/useDistrictOrg';
import { studentDisplayName } from '../../../data/students/displayName';
import { gradesForBand, studentList } from '../../../data/class-creator/classCreatorModel';
import { buildGradeRosterCards } from '../rosterCards';
import { RosterView } from './RosterView';

function StatCard({ theme, isDarkMode, label, value, hint }) {
  return (
    <AppBoard mode="grid" pad="stage" theme={theme}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </p>
          {hint ? (
            <p
              className={`mt-1 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}
            >
              {hint}
            </p>
          ) : null}
        </div>
        <p
          className={`shrink-0 text-3xl font-bold tabular-nums leading-none ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </p>
      </div>
    </AppBoard>
  );
}

function roomFullyRated(run, studentIds, scaleCols) {
  if (!scaleCols.length || !studentIds.length) return true;
  return studentIds.every((id) => {
    const rating = run.ratings?.[id] || {};
    return scaleCols.every((col) => rating[col.id] != null && rating[col.id] !== '');
  });
}

/**
 * Dashboard — run overview + current (and previous) rosters.
 */
export function DashboardView({
  theme,
  isDarkMode,
  run,
  upsertActiveRun,
  isTeacherView = false,
  selectedClass = null,
}) {
  const { org } = useDistrictOrg();
  const { allClasses } = useClasses();

  const currentCards = useMemo(() => {
    if (!run || isTeacherView) return [];
    return buildGradeRosterCards(
      allClasses,
      org,
      run.schoolId,
      gradesForBand(run.gradeBand),
    );
  }, [run, isTeacherView, allClasses, org]);

  const stats = useMemo(() => {
    if (!run) return null;

    const teachers = run.destinationTeachers || [];
    const students = studentList(run);
    const scaleCols = (run.schema?.columns || []).filter(
      (col) => col.enabled && col.type === 'scale',
    );

    let currentStudentCount = 0;
    let currentTeacherRooms = 0;
    let teachersSubmitted = 0;

    if (isTeacherView) {
      const classStudents = selectedClass?.studentList || [];
      currentStudentCount = classStudents.length;
      currentTeacherRooms = selectedClass ? 1 : 0;
      const ids = classStudents.map((s) => String(s.id));
      if (ids.length && roomFullyRated(run, ids, scaleCols)) {
        teachersSubmitted = 1;
      }
    } else {
      for (const card of currentCards) {
        for (const room of card.rooms || []) {
          const ids = (room.students || []).map((s) => String(s.id));
          currentStudentCount += ids.length;
          currentTeacherRooms += 1;
          if (ids.length && roomFullyRated(run, ids, scaleCols)) {
            teachersSubmitted += 1;
          }
        }
      }
    }

    const placedIds = new Set();
    for (const ids of Object.values(run.draftClasses || {})) {
      for (const id of ids || []) placedIds.add(String(id));
    }

    const placeTotal = students.length || currentStudentCount;

    return {
      shared: Boolean(run.sharedWithTeachers),
      currentStudentCount,
      teacherCount: isTeacherView ? currentTeacherRooms : teachers.length,
      teachersSubmitted,
      currentTeacherRooms,
      placedCount: placedIds.size,
      placeTotal,
      feedbackCount: Object.keys(run.teacherFeedback || {}).length,
    };
  }, [run, isTeacherView, selectedClass, currentCards]);

  const teacherRoster = useMemo(() => {
    if (!isTeacherView || !selectedClass) return [];
    return [...(selectedClass.studentList || [])].sort((a, b) =>
      String(a.lastName || a.name || '').localeCompare(String(b.lastName || b.name || ''), undefined, {
        sensitivity: 'base',
      }),
    );
  }, [isTeacherView, selectedClass]);

  if (!run) {
    return (
      <EmptyState
        message={
          isTeacherView
            ? 'Waiting on admin — a placement run has not started yet.'
            : 'No active placement run — Open Setup to choose school, band, and teachers.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ContentCardGrid columns="grid-cols-2 lg:grid-cols-4">
        <StatCard
          theme={theme}
          isDarkMode={isDarkMode}
          label="Current students"
          value={stats.currentStudentCount}
          hint={
            isTeacherView
              ? selectedClass?.grade || 'Your class roster'
              : 'On this year’s grade lists'
          }
        />
        <StatCard
          theme={theme}
          isDarkMode={isDarkMode}
          label={isTeacherView ? 'Your class' : 'Teachers'}
          value={stats.teacherCount}
          hint={
            isTeacherView
              ? 'Selected for ratings'
              : 'Next-year rooms included on Setup'
          }
        />
        {!isTeacherView ? (
          <StatCard
            theme={theme}
            isDarkMode={isDarkMode}
            label="Students placed"
            value={`${stats.placedCount}/${stats.placeTotal || 0}`}
            hint={stats.shared ? `${stats.feedbackCount} teacher comments` : 'In draft rooms'}
          />
        ) : null}
        <StatCard
          theme={theme}
          isDarkMode={isDarkMode}
          label="Teachers submitted"
          value={`${stats.teachersSubmitted}/${stats.currentTeacherRooms || 0}`}
          hint={
            stats.teachersSubmitted === stats.currentTeacherRooms && stats.currentTeacherRooms
              ? 'All current classes complete'
              : 'Classes with finished ratings'
          }
        />
      </ContentCardGrid>

      {isTeacherView ? (
        <AppBoard mode="scroll" pad="board" theme={theme}>
          <h2 className={`${TYPE.titleSm} mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Current class roster
          </h2>
          <p className={`mb-3 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Students you’ll rate for next-year placement.
          </p>
          {teacherRoster.length === 0 ? (
            <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Select your class in the Classes panel to see the roster.
            </p>
          ) : (
            <ul className={`space-y-1 ${TYPE.bodyMd} ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {teacherRoster.map((student) => (
                <li key={student.id}>{studentDisplayName(student)}</li>
              ))}
            </ul>
          )}
        </AppBoard>
      ) : (
        <div className="pt-1">
          <RosterView
            theme={theme}
            isDarkMode={isDarkMode}
            run={run}
            upsertActiveRun={upsertActiveRun}
          />
        </div>
      )}
    </div>
  );
}
