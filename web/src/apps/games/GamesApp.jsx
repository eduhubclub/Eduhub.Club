import { AppPageShell } from '../../shared/AppPageShell';
import { WordleView } from './wordle/WordleView';
import { EmptyState } from '../../shared/EmptyState';

/**
 * Edu.Games — classroom games hub.
 * Stage/widget tools omit PageHeader; Hub Apps → Description explains the app.
 */
export function GamesApp({ activeTab, isDarkMode, theme, isLeft }) {
  if (activeTab === 'Wordle' || !activeTab) {
    return (
      <AppPageShell variant="stage">
        <WordleView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="page">
      <EmptyState
        isDarkMode={isDarkMode}
        message="This game is not available yet."
      />
    </AppPageShell>
  );
}
