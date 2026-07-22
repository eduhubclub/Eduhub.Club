import { AppPageShell } from '../../shared/AppPageShell';
import { BlendingBoardView } from './views/BlendingBoardView';
import { WordWorkMatView } from './views/WordWorkMatView';
import { PlaceholderToolView } from './views/PlaceholderToolView';

const PLACEHOLDERS = {
  'Elkonin Boxes':
    'Segment sounds into boxes for phonemic awareness practice — coming soon.',
  'Heart Words':
    'Practice high-frequency words with heart parts to remember — coming soon.',
  'Sound Wall':
    'Map phonemes to graphemes on a classroom sound wall — coming soon.',
};

/**
 * Edu.EarlyLiteracy — early literacy tools for blending, segmenting, and word work.
 * Stage tools omit PageHeader; explanations live in Hub Apps → Description.
 */
export function EarlyLiteracyApp({ activeTab, isDarkMode, theme, isLeft }) {
  if (activeTab === 'Blending Board' || !activeTab) {
    return (
      <AppPageShell variant="stage">
        <BlendingBoardView
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Word Work Mat') {
    return (
      <AppPageShell variant="stage">
        <WordWorkMatView
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      </AppPageShell>
    );
  }

  const stubMessage = PLACEHOLDERS[activeTab];
  if (stubMessage) {
    return (
      <PlaceholderToolView message={stubMessage} isDarkMode={isDarkMode} />
    );
  }

  return (
    <PlaceholderToolView
      message="Early literacy tools for reading instruction."
      isDarkMode={isDarkMode}
    />
  );
}
