import { NoiseMeterStage } from '../../noisemeter/NoiseMeterStage';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Bubble Classroom (same layout as NoiseMeter app). */
export function BubbleClassroomWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <NoiseMeterStage mode="bubble" isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
