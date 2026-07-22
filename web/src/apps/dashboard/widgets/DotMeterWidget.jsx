import { NoiseMeterStage } from '../../noisemeter/NoiseMeterStage';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Dot Meter (same layout as NoiseMeter app). */
export function DotMeterWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="flex-1 h-full min-h-0">
      <NoiseMeterStage mode="dot" isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
