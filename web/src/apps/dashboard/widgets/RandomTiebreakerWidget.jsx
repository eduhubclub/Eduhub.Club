import { RandomMethodView } from '../../tiebreaker/views/RandomMethodView';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Random Tiebreaker. */
export function RandomTiebreakerWidget({ isDarkMode, theme, isLeft }) {
  return (
    <AppPageShell variant="stage" className="relative flex-1 h-full min-h-0 w-full">
      <RandomMethodView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
    </AppPageShell>
  );
}
