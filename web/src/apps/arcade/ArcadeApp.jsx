import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { ClassicView } from './views/ClassicView';
import { CardsView } from './views/CardsView';
import { NumberGamesView } from './views/NumberGamesView';
import { PlatformersView } from './views/PlatformersView';
import { SolitaireView } from './solitaire/SolitaireView';
import { SpiderView } from './spider/SpiderView';
import { GoFishView } from './gofish/GoFishView';
import { BoomJumpView } from './boomjump/BoomJumpView';
import { ArkanoidView } from './arkanoid/ArkanoidView';
import { SnakeView } from './snake/SnakeView';
import { MathTrainView } from './mathtrain/MathTrainView';
import { SudokuView } from './sudoku/SudokuView';

/**
 * Edu.Arcade — pure-fun games hub (pixel classics first).
 */
export function ArcadeApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  onSetActiveTab,
}) {
  if (activeTab === 'Classic') {
    return (
      <AppPageShell variant="stage">
        <ClassicView
          isDarkMode={isDarkMode}
          theme={theme}
          onOpenGame={(tab) => onSetActiveTab?.(tab)}
        />
      </AppPageShell>
    );
  }

  if (
    activeTab === 'Card Games' ||
    activeTab === 'Cards' ||
    activeTab === 'Classic Games' ||
    !activeTab
  ) {
    return (
      <AppPageShell variant="stage">
        <CardsView
          isDarkMode={isDarkMode}
          theme={theme}
          onOpenGame={(tab) => onSetActiveTab?.(tab)}
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Number Games') {
    return (
      <AppPageShell variant="stage">
        <NumberGamesView
          isDarkMode={isDarkMode}
          theme={theme}
          onOpenGame={(tab) => onSetActiveTab?.(tab)}
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Platformers') {
    return (
      <AppPageShell variant="stage">
        <PlatformersView
          isDarkMode={isDarkMode}
          theme={theme}
          onOpenGame={(tab) => onSetActiveTab?.(tab)}
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Math Train') {
    return (
      <AppPageShell variant="stage">
        <MathTrainView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Sudoku') {
    return (
      <AppPageShell variant="stage">
        <SudokuView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Solitaire') {
    return (
      <AppPageShell variant="stage">
        <SolitaireView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Spider') {
    return (
      <AppPageShell variant="stage">
        <SpiderView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Go Fish') {
    return (
      <AppPageShell variant="stage">
        <GoFishView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Boom Jump') {
    return (
      <AppPageShell variant="stage">
        <BoomJumpView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Arkanoid') {
    return (
      <AppPageShell variant="stage">
        <ArkanoidView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Snake') {
    return (
      <AppPageShell variant="stage">
        <SnakeView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="page">
      <EmptyState
        isDarkMode={isDarkMode}
        message="This arcade game is not available yet."
      />
    </AppPageShell>
  );
}
