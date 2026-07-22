import { PickANumberView } from '../../tiebreaker/views/PickANumberView';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Pick A Number. */
export function PickANumberWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <PickANumberView isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
