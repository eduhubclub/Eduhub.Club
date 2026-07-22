import { CoinTossView } from '../../tiebreaker/views/CoinTossView';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Coin Toss. */
export function CoinTossWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <CoinTossView isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
