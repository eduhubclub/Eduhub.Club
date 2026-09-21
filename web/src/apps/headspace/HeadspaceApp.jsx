import { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { useStudentParts } from '../../data/access/StudentPartAccess';
import { studentDisplayName } from '../../data/students/displayName';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { PetRockView } from './petrock/PetRockView';
import { InboxView } from './views/InboxView';

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

/**
 * Edu.Headspace — SEL journaling hub (Pet Rock first).
 */
export function HeadspaceApp({ activeTab, isDarkMode, theme, session }) {
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

  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  useEffect(() => {
    if (!roster.length) {
      setStudentId('');
      return;
    }
    if (isStudentFrame) {
      setStudentId(matchStudentId(roster, session));
      return;
    }
    if (!roster.some((s) => String(s.id) === String(studentId))) {
      setStudentId(String(roster[0].id));
    }
  }, [roster, studentId, isStudentFrame, session]);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Headspace"
          description="SEL journaling for kids — Pet Rock Pen Pal and more."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Heart size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const classId = selectedClass?.id;
  const isInbox = activeTab === 'Inbox' && !isStudentFrame;

  if (isInbox) {
    return (
      <AppPageShell variant="scroll">
        <InboxView
          theme={theme}
          isDarkMode={isDarkMode}
          classId={classId}
          roster={roster}
          classLabel={selectedClass?.name}
        />
      </AppPageShell>
    );
  }

  const visibleRoster = isStudentFrame
    ? roster.filter((s) => String(s.id) === String(studentId))
    : roster;

  return (
    <AppPageShell variant="stage">
      <PetRockView
        theme={theme}
        isDarkMode={isDarkMode}
        classId={classId}
        roster={visibleRoster}
        studentId={studentId}
        onStudentIdChange={isStudentFrame ? undefined : setStudentId}
        hideStudentPicker={isStudentFrame}
      />
    </AppPageShell>
  );
}
