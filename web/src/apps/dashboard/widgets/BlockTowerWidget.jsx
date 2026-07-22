import { NoiseMeterStage } from '../../noisemeter/NoiseMeterStage';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Block Tower (same layout as NoiseMeter app). */
export function BlockTowerWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <NoiseMeterStage mode="tower" isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
