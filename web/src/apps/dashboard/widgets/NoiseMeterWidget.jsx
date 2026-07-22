import { NoiseMeterStage } from '../../noisemeter/NoiseMeterStage';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Noise Meter (same layout as NoiseMeter app). */
export function NoiseMeterWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <NoiseMeterStage mode="meter" isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
