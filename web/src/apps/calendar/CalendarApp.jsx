import { useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { CalendarProvider } from './CalendarContext';
import { CalendarView } from './views/CalendarView';
import { CreateCalendarView } from './views/CreateCalendarView';
import { SavedCalendarView } from './views/SavedCalendarView';
import { CountdownView } from './views/CountdownView';

/**
 * Edu.Calendar — class planners, specialist rotations, countdowns.
 */
export function CalendarApp({ activeTab, isDarkMode, theme }) {
  const { classes, selectedClass, selectClass } = useClasses();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
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
          title="Calendar"
          description="Plan class schedules, rotations, and countdowns."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Calendar size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const isPlanner = !['Create Calendar', 'Saved Calendar', 'Countdown'].includes(
    activeTab,
  );

  return (
    <CalendarProvider classes={activeClasses} classId={selectedClass?.id}>
      <AppPageShell variant={isPlanner ? 'stage' : 'scroll'}>
        {activeTab === 'Create Calendar' ? (
          <CreateCalendarView isDarkMode={isDarkMode} theme={theme} />
        ) : activeTab === 'Saved Calendar' ? (
          <SavedCalendarView isDarkMode={isDarkMode} theme={theme} />
        ) : activeTab === 'Countdown' ? (
          <CountdownView isDarkMode={isDarkMode} theme={theme} />
        ) : (
          <CalendarView isDarkMode={isDarkMode} theme={theme} />
        )}
      </AppPageShell>
    </CalendarProvider>
  );
}
