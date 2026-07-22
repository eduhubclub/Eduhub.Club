import { NoiseMeterStage } from '../../noisemeter/NoiseMeterStage';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Color Meter (same layout as NoiseMeter app). */
export function ColorMeterWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="flex-1 h-full min-h-0">
      <NoiseMeterStage mode="color" isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
