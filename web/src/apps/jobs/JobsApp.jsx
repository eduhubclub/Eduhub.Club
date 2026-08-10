import { useEffect, useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { JobsProvider } from './JobsContext';
import { JobsBoardView } from './views/JobsBoardView';
import { JobsDashboardView } from './views/JobsDashboardView';
import { JobBoardView } from './views/JobBoardView';

/**
 * Edu.Jobs — classroom roles & salaries (standalone; optional Bank payday sync).
 */
export function JobsApp({ activeTab, isDarkMode, theme, isLeft }) {
  const { classes, selectedClass, selectClass } = useClasses();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );

  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass?.studentList],
  );

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
          title="Jobs"
          description="Classroom roles and salaries. Sync to Bank for payday."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Briefcase size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  return (
    <JobsProvider roster={roster} classId={selectedClass?.id}>
      <AppPageShell variant="scroll">
        {activeTab === 'Job Assignments' ? (
          <JobsBoardView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            isLeft={isLeft}
          />
        ) : activeTab === 'Job Board' ? (
          <JobBoardView
            isDarkMode={isDarkMode}
            theme={theme}
            isLeft={isLeft}
            classLabel={selectedClass?.name}
          />
        ) : (
          <JobsDashboardView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        )}
      </AppPageShell>
    </JobsProvider>
  );
}
