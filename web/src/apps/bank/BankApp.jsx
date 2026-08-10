import { useEffect, useMemo } from 'react';
import { Landmark } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { BankProvider } from './BankContext';
import { BankDashboardView } from './views/BankDashboardView';
import { BankView } from './views/BankView';
import { TransactionsView } from './views/TransactionsView';
import { BankTrendsView } from './views/BankTrendsView';
import { BankLearningView } from './views/BankLearningView';
import { StorefrontView } from '../store/views/StorefrontView';

/**
 * Edu.Bank — classroom economy hub.
 */
export function BankApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  onSetActiveTab,
  onOpenApp,
  onShellFooterActiveChange,
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

  // Legacy "Students" tab removed — profiles open from Bank cards.
  useEffect(() => {
    if (activeTab === 'Students') onSetActiveTab?.('Bank');
  }, [activeTab, onSetActiveTab]);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Bank"
          description="Classroom economy for balances and payouts."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Landmark size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const isLearning = activeTab === 'Learning';
  const shellVariant = isLearning ? 'stage' : 'scroll';

  return (
    <BankProvider roster={roster} classId={selectedClass?.id}>
      <AppPageShell
        variant={shellVariant}
        className={isLearning ? '!max-w-none h-full min-h-0' : undefined}
      >
        {activeTab === 'Transactions' ? (
          <TransactionsView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Trends' ? (
          <BankTrendsView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Learning' ? (
          <BankLearningView
            isDarkMode={isDarkMode}
            theme={theme}
            onShellFooterActiveChange={onShellFooterActiveChange}
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
        ) : activeTab === 'Bank' || activeTab === 'Students' ? (
          <BankView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            isLeft={isLeft}
            classLabel={selectedClass?.name}
          />
        ) : (
          <BankDashboardView
            roster={roster}
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
            classId={selectedClass?.id}
            onSetActiveTab={onSetActiveTab}
            onOpenApp={onOpenApp}
          />
        )}
      </AppPageShell>
    </BankProvider>
  );
}
