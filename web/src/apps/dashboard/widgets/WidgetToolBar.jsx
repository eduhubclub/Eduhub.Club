import { ButtonRow } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { ActiveStudentsPopout } from '../../randomizer/ActiveStudentsPopout';

/**
 * Shared top toolbar for Dashboard Randomizer widgets (matches Edu.Randomizer).
 */
export function WidgetToolBar({
  activeStudents,
  roster,
  theme,
  isDarkMode,
  onReset,
  children = null,
}) {
  const resetDisabled = activeStudents.length === roster.length;

  return (
    <ButtonRow className="w-full">
      <ActiveStudentsPopout
        activeStudents={activeStudents}
        fullRoster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
      />
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled}
        className={`${toolBtnClass(isDarkMode)} disabled:opacity-40 disabled:pointer-events-none`}
      >
        Reset all
      </button>
      {children}
    </ButtonRow>
  );
}
