import { useEffect, useMemo, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { useStudentParts } from '../../data/access/StudentPartAccess';
import { studentDisplayName } from '../../data/students/displayName';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { TYPE } from '../../shared/typography';
import { WriteSessionView } from './views/WriteSessionView';
import { BuddiesView } from './views/BuddiesView';
import { TemplatesView } from './views/TemplatesView';
import { SavedView } from './views/SavedView';

/** Stable id so teachers can preview Write like a student and save drafts. */
export const TEACHER_PREVIEW_ID = 'teacher-preview';

function matchStudentId(roster, session) {
  if (!roster?.length) return '';
  const uid = session?.userId ? String(session.userId) : '';
  if (uid && roster.some((s) => String(s.id) === uid)) return uid;
  const name = String(session?.displayName || '')
    .trim()
    .toLowerCase();
  if (name) {
    const hit = roster.find(
      (s) => studentDisplayName(s).trim().toLowerCase() === name,
    );
    if (hit) return String(hit.id);
  }
  return String(roster[0].id);
}

function teacherPreviewLabel(session) {
  const name = String(session?.displayName || '').trim();
  return name ? `Teacher · ${name}` : 'Teacher';
}

/**
 * Writing Buddy shell — Student View / Buddies / Templates / Saved.
 */
export function WritingBuddyApp({ activeTab, isDarkMode, theme, session }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const { isStudentFrame } = useStudentParts();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );

  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass?.studentList],
  );

  const [studentId, setStudentId] = useState(TEACHER_PREVIEW_ID);

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  useEffect(() => {
    if (isStudentFrame) {
      if (!roster.length) {
        setStudentId('');
        return;
      }
      setStudentId(matchStudentId(roster, session));
      return;
    }
    // Teacher preview: keep Teacher option, or a roster pick
    if (studentId === TEACHER_PREVIEW_ID) return;
    if (!roster.length) {
      setStudentId(TEACHER_PREVIEW_ID);
      return;
    }
    if (!roster.some((s) => String(s.id) === String(studentId))) {
      setStudentId(TEACHER_PREVIEW_ID);
    }
  }, [roster, studentId, isStudentFrame, session]);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Writing Buddy"
          description="Guide students through writing piece by piece."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<NotebookPen size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const classId = selectedClass?.id || '';
  const isTeacherPreview = studentId === TEACHER_PREVIEW_ID;
  const studentLabel = isTeacherPreview
    ? teacherPreviewLabel(session)
    : studentId
      ? studentDisplayName(
          roster.find((s) => String(s.id) === String(studentId)) || {},
        )
      : '';

  const isBuddies = activeTab === 'Buddies' && !isStudentFrame;
  const isTemplates = activeTab === 'Templates' && !isStudentFrame;
  const isSaved = activeTab === 'Saved' && !isStudentFrame;

  if (isBuddies) {
    return (
      <AppPageShell variant="scroll">
        <PageHeader
          title="Buddies"
          description="Characters kids can pick. Pair any buddy with a writing template."
          isDarkMode={isDarkMode}
        />
        <BuddiesView theme={theme} isDarkMode={isDarkMode} />
      </AppPageShell>
    );
  }

  if (isTemplates) {
    return (
      <AppPageShell variant="scroll">
        <PageHeader
          title="Templates"
          description="Curriculum packs (like Arts & Letters Anatomy of an Essay) plus your own templates — assign one per class."
          isDarkMode={isDarkMode}
        />
        <TemplatesView
          theme={theme}
          isDarkMode={isDarkMode}
          classId={classId}
          selectedClassName={selectedClass?.name || ''}
        />
      </AppPageShell>
    );
  }

  if (isSaved) {
    return (
      <AppPageShell variant="scroll">
        <PageHeader
          title="Saved"
          description={`Drafts for ${selectedClass?.name || 'this class'}.`}
          isDarkMode={isDarkMode}
        />
        <SavedView
          theme={theme}
          isDarkMode={isDarkMode}
          classId={classId}
          roster={roster}
          teacherPreviewId={TEACHER_PREVIEW_ID}
          teacherPreviewLabel={teacherPreviewLabel(session)}
        />
      </AppPageShell>
    );
  }

  // Write — student laptop flow (teachers preview here with a quiet “Preview as” bar)
  return (
    <AppPageShell variant="stage">
      <div className="flex h-full min-h-0 flex-col gap-2">
        {!isStudentFrame ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <label
              className={`flex items-center gap-2 ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}
            >
              Preview as
              <select
                className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                value={studentId || TEACHER_PREVIEW_ID}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value={TEACHER_PREVIEW_ID}>
                  {teacherPreviewLabel(session)}
                </option>
                {roster.map((s) => (
                  <option key={s.id} value={s.id}>
                    {studentDisplayName(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        <div className="min-h-0 flex-1">
          <WriteSessionView
            theme={theme}
            isDarkMode={isDarkMode}
            classId={classId}
            studentId={studentId}
            studentLabel={studentLabel}
            isStudentFrame={isStudentFrame}
          />
        </div>
      </div>
    </AppPageShell>
  );
}
