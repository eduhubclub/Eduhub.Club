import { StudentShowdownView } from '../../tiebreaker/views/StudentShowdownView';
import { AppPageShell } from '../../../shared/AppPageShell';

/** Dashboard teaching widget — Student Showdown. */
export function StudentShowdownWidget({ isDarkMode, theme }) {
  return (
    <AppPageShell variant="scroll" className="relative flex-1 min-h-0 w-full">
      <StudentShowdownView isDarkMode={isDarkMode} theme={theme} />
    </AppPageShell>
  );
}
