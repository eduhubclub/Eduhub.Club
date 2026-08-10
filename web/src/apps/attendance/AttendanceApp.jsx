import { useEffect, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { AttendanceProvider } from './AttendanceContext';
import { DailyView } from './views/DailyView';
import { LunchView } from './views/LunchView';
import { ReportsView } from './views/ReportsView';
import { AwardsView } from './views/AwardsView';

/**
 * Edu.Attendance — mark who is here, lunch count, reports, and goals.
 */
export function AttendanceApp({ activeTab, isDarkMode, theme, isLeft }) {
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
          title="Attendance"
          description="Take attendance, lunch count, and track class goals."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={
            <ClipboardCheck size={36} className="text-slate-400" />
          }
        />
      </AppPageShell>
    );
  }

  return (
    <AttendanceProvider roster={roster} classId={selectedClass?.id}>
      <AppPageShell variant="scroll">
        {activeTab === 'Lunch' ? (
          <LunchView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Reports' ? (
          <ReportsView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Awards' ? (
          <AwardsView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : (
          <DailyView
            isDarkMode={isDarkMode}
            theme={theme}
            isLeft={isLeft}
            classLabel={selectedClass?.name}
          />
        )}
      </AppPageShell>
    </AttendanceProvider>
  );
}
