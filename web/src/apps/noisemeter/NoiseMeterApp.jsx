import { NoiseMeterStage, tabToNoiseMeterMode } from './NoiseMeterStage';
import { AppPageShell } from '../../shared/AppPageShell';

/**
 * Edu.NoiseMeter — classroom volume meter + bubble & tower games.
 */
export function NoiseMeterApp({ activeTab, isDarkMode, theme, isLeft }) {
  const mode = tabToNoiseMeterMode(activeTab);

  return (
    <AppPageShell variant="stage">
      <NoiseMeterStage mode={mode} isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
    </AppPageShell>
  );
}
