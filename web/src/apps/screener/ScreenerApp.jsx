import { useEffect, useMemo, useState } from 'react';
import { SpellCheck } from 'lucide-react';
import { useStudentParts } from '../../data/access/StudentPartAccess';
import { useClasses } from '../../data/classes/ClassContext';
import { studentDisplayName } from '../../data/students/displayName';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { PageHeader } from '../../shared/PageHeader';
import { ScreenerCatalogView } from './views/ScreenerCatalogView';
import { LetrsSession } from './views/LetrsSession';
import { ResultsView } from './views/ResultsView';

function matchStudentId(roster, session) {
  if (!roster?.length) return '';
  const uid = session?.userId ? String(session.userId) : '';
  if (uid && roster.some((student) => String(student.id) === uid)) return uid;
  const name = String(session?.displayName || '')
    .trim()
    .toLowerCase();
  if (!name) return '';
  const hit = roster.find(
    (student) => studentDisplayName(student).trim().toLowerCase() === name,
  );
  return hit ? String(hit.id) : '';
}

/**
 * Edu.Screener hosts one catalog of screeners. LETRS Spelling is the first session.
 */
export function ScreenerApp({ activeTab, isDarkMode, theme, session }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const { isStudentFrame } = useStudentParts();
  const [openId, setOpenId] = useState('');

  const activeClasses = useMemo(
    () => (classes || []).filter((item) => !item.isArchived),
    [classes],
  );

  const roster = selectedClass?.studentList || [];
  const lockedStudentId = isStudentFrame ? matchStudentId(roster, session) : '';

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Screeners"
          description="Give a spelling screener and keep the results with the class."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<SpellCheck size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Results' && !isStudentFrame) {
    return (
      <ResultsView
        theme={theme}
        isDarkMode={isDarkMode}
        classId={selectedClass?.id || ''}
        className={selectedClass?.name || ''}
      />
    );
  }

  if (openId === 'letrs') {
    return (
      <LetrsSession
        theme={theme}
        isDarkMode={isDarkMode}
        roster={roster}
        classId={selectedClass?.id || ''}
        classGrade={selectedClass?.grade || ''}
        isStudentFrame={isStudentFrame}
        lockedStudentId={lockedStudentId}
        lockedName={session?.displayName || ''}
        onExit={() => setOpenId('')}
      />
    );
  }

  return (
    <ScreenerCatalogView
      theme={theme}
      isDarkMode={isDarkMode}
      onOpen={setOpenId}
    />
  );
}
