import { useEffect, useMemo } from 'react';
import { Award } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { BehaviorProvider } from './BehaviorContext';
import { AwardView } from './views/AwardView';
import { BehaviorsView } from './views/BehaviorsView';
import { BehaviorTrendsView } from './views/BehaviorTrendsView';
import { BehaviorReportsView } from './views/BehaviorReportsView';
import { StorefrontView } from '../store/views/StorefrontView';

/**
 * Edu.Behavior — ClassDojo-style classroom behavior tracker.
 * Optional sync writes matching class dollars into Bank.
 */
export function BehaviorApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  onSetActiveTab,
}) {
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
          title="Behavior"
          description="Track classroom points. Optionally sync to Bank."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Award size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  return (
    <BehaviorProvider roster={roster} classId={selectedClass?.id}>
      <AppPageShell variant="scroll">
        {activeTab === 'Behaviors' ? (
          <BehaviorsView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
        ) : activeTab === 'Trends' ? (
          <BehaviorTrendsView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
            onOpenReports={() => onSetActiveTab?.('Reports')}
          />
        ) : activeTab === 'Reports' ? (
          <BehaviorReportsView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Store' ? (
          <StorefrontView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
            mode="redeem"
            classId={selectedClass?.id}
            roster={roster}
          />
        ) : (
          <AwardView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
            classId={selectedClass?.id}
          />
        )}
      </AppPageShell>
    </BehaviorProvider>
  );
}
