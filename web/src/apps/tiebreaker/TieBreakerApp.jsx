import { useEffect, useMemo } from 'react';
import { Swords } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { PageHeader } from '../../shared/PageHeader';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PickANumberView } from './views/PickANumberView';
import { CoinTossView } from './views/CoinTossView';
import { PickACardView } from './views/PickACardView';
import { RandomMethodView } from './views/RandomMethodView';
import { StudentShowdownView } from './views/StudentShowdownView';

/**
 * Edu.TieBreaker — classroom tiebreakers and matchups.
 */
export function TieBreakerApp({ activeTab, isDarkMode, theme, isLeft }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes]
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
          title="TieBreaker"
          description="Settle classroom ties with fair, quick challenges."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Swords size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const shellVariant =
    activeTab === 'Pick A Number' ||
    activeTab === 'Coin Toss' ||
    activeTab === 'Pick A Card' ||
    activeTab === 'Random Tiebreaker'
      ? 'stage'
      : 'scroll';

  return (
    <AppPageShell variant={shellVariant}>
      {activeTab === 'Pick A Number' ? (
        <PickANumberView isDarkMode={isDarkMode} theme={theme} />
      ) : null}
      {activeTab === 'Coin Toss' ? (
        <CoinTossView isDarkMode={isDarkMode} theme={theme} />
      ) : null}
      {activeTab === 'Pick A Card' ? (
        <PickACardView isDarkMode={isDarkMode} theme={theme} />
      ) : null}
      {activeTab === 'Random Tiebreaker' ? (
        <RandomMethodView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      ) : null}
      {activeTab === 'Student Showdown' ? (
        <StudentShowdownView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      ) : null}
    </AppPageShell>
  );
}
