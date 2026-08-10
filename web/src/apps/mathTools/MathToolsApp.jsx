import { AppPageShell } from '../../shared/AppPageShell';
import { ClockWidget } from './widgets/ClockWidget';
import { MoneyWidget } from './widgets/MoneyWidget';

/**
 * Edu.MathTools — Money and Clock learning desks.
 */
export function MathToolsApp({
  activeTab,
  isDarkMode,
  theme,
  onShellFooterActiveChange,
}) {
  const isClock = activeTab === 'Clock';

  return (
    <AppPageShell variant="stage" className="!max-w-none h-full min-h-0">
      {isClock ? (
        <ClockWidget
          isDarkMode={isDarkMode}
          theme={theme}
          onShellFooterActiveChange={onShellFooterActiveChange}
        />
      ) : (
        <MoneyWidget
          isDarkMode={isDarkMode}
          theme={theme}
          onShellFooterActiveChange={onShellFooterActiveChange}
        />
      )}
    </AppPageShell>
  );
}
