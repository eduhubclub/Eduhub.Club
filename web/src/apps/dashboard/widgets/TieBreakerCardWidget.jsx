import { PickACardView } from '../../tiebreaker/views/PickACardView';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Pick A Card (TieBreaker). */
export function TieBreakerCardWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <PickACardView isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
