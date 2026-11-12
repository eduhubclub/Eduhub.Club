import { useEffect, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { useTestsData } from '../../data/tests/useTestsData';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { PageHeader } from '../../shared/PageHeader';
import { BookView } from './views/BookView';

export function GradesApp({ isDarkMode, theme }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const { store, ownerId } = useTestsData();

  const activeClasses = useMemo(
    () => (classes || []).filter((item) => !item.isArchived),
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
          title="Grades"
          description="Scores from tests land here."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Star size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  return (
    <BookView
      theme={theme}
      isDarkMode={isDarkMode}
      store={store}
      ownerId={ownerId}
      selectedClass={selectedClass}
    />
  );
}
