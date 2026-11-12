import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../../data/auth/AuthContext';
import { studentDisplayName } from '../../../data/students/displayName';
import { toIsoDate } from '../../../data/calendar/calendarModel';
import {
  DELIVERY_LABELS,
  PURPOSE_LABELS,
  isFinished,
  resolveSchedule,
  studentCanSeeAssignment,
} from '../../../data/tests/model';
import { attemptFor } from '../../../data/tests/storage';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { PlayerView } from './PlayerView';

function matchRosterStudent(classes, session) {
  const uid = session?.userId ? String(session.userId) : '';
  const name = String(session?.displayName || '')
    .trim()
    .toLowerCase();
  if (!uid || uid === 'demo') {
    if (!name || name === 'demo student') return null;
  }
  for (const cls of classes) {
    const roster = cls.studentList || [];
    if (uid && uid !== 'demo') {
      const hit = roster.find((student) => String(student.id) === uid);
      if (hit) return { classId: cls.id, student: hit };
    }
    if (name && name !== 'demo student') {
      const hit = roster.find(
        (student) => studentDisplayName(student).trim().toLowerCase() === name,
      );
      if (hit) return { classId: cls.id, student: hit };
    }
  }
  return null;
}

export function TakeView({
  theme,
  isDarkMode,
  store,
  ownerId,
  classes,
  selectedClass,
  isStudentFrame,
}) {
  const { session } = useAuth();
  const matched = useMemo(
    () => (isStudentFrame ? matchRosterStudent(classes, session) : null),
    [isStudentFrame, classes, session],
  );
  const [open, setOpen] = useState(null);

  const classIds = isStudentFrame
    ? matched
      ? [matched.classId]
      : classes.map((cls) => cls.id)
    : selectedClass
      ? [selectedClass.id]
      : [];

  const today = toIsoDate(new Date());
  const cards = store.assignments
    .filter((assignment) => classIds.includes(assignment.classId))
    .map((assignment) => {
      const assessment = store.assessments.find((row) => row.id === assignment.assessmentId);
      const cls = classes.find((row) => row.id === assignment.classId);
      if (!assessment || !cls) return null;
      const studentId = matched?.classId === cls.id ? matched.student.id : '';
      const attempt = studentId ? attemptFor(store, assignment.id, studentId) : null;
      const schedule = resolveSchedule(store, assessment.id, cls.id);
      if (isStudentFrame && attempt?.status === 'closed') return null;
      if (isStudentFrame && matched?.student && !studentCanSeeAssignment(schedule, matched.student.id, today)) {
        return null;
      }
      if (isStudentFrame && !matched && schedule) {
        const roster = cls.studentList || [];
        const anyone = roster.some((student) => studentCanSeeAssignment(schedule, student.id, today));
        if (!anyone && (schedule.assignOn || Object.keys(schedule.studentAssignOn || {}).length)) {
          return null;
        }
      }
      return { assignment, assessment, cls, attempt, schedule };
    })
    .filter(Boolean);

  if (open) {
    return (
      <PlayerView
        theme={theme}
        assessment={open.assessment}
        assignment={open.assignment}
        studentId={open.studentId}
        actorId={ownerId}
        attempt={attemptFor(store, open.assignment.id, open.studentId)}
        onExit={() => setOpen(null)}
      />
    );
  }

  return (
    <AppPageShell variant="scroll" className="h-full overflow-y-auto">
      <PageHeader
        title="Student view"
        description="One question fills the screen. Hear it if you want the question read aloud."
        isDarkMode={isDarkMode}
      />
      {cards.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            isStudentFrame
              ? 'No test right now.'
              : 'Nothing is assigned to this class yet. Assign a test from Saved Assessments.'
          }
          illustration={<ClipboardCheck size={36} className="text-slate-400" />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <TestCard
              key={card.assignment.id}
              theme={theme}
              card={card}
              lockedStudent={matched?.classId === card.cls.id ? matched.student : null}
              isStudentFrame={isStudentFrame}
              today={today}
              onStart={(studentId) => setOpen({ ...card, studentId })}
            />
          ))}
        </div>
      )}
    </AppPageShell>
  );
}

function TestCard({ theme, card, lockedStudent, isStudentFrame, today, onStart }) {
  const { assessment, assignment, cls, attempt, schedule } = card;
  const [picking, setPicking] = useState(false);
  const finished = lockedStudent && isFinished(attempt);
  const roster = cls.studentList || [];

  return (
    <AppBoard mode="scroll" theme={theme} className="flex flex-col gap-3">
      <div>
        <h2 className={TYPE.titleMd}>{assessment.title}</h2>
        <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {assessment.subject} · {PURPOSE_LABELS[assessment.purpose]} ·{' '}
          {DELIVERY_LABELS[assignment.delivery] || 'Self-paced'}
          {cls.name ? ` · ${cls.name}` : ''}
        </p>
      </div>
      {lockedStudent ? (
        <button
          type="button"
          onClick={() => onStart(String(lockedStudent.id))}
          className={`edu-control self-start rounded-xl px-4 py-3 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          {finished ? 'See your result' : attempt ? 'Continue' : 'Start'}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setPicking((value) => !value)}
            className={`edu-control self-start rounded-xl px-4 py-3 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            {picking ? 'Hide names' : 'Who is taking this?'}
          </button>
          {picking ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {roster
                .filter(
                  (student) =>
                    !isStudentFrame || studentCanSeeAssignment(schedule, student.id, today),
                )
                .map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onStart(String(student.id))}
                  className={`edu-control min-h-16 rounded-2xl border-[1.5px] px-3 py-3 ${TYPE.titleSm} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                >
                  {studentDisplayName(student)}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </AppBoard>
  );
}
