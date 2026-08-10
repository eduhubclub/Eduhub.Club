import { AppPageShell } from '../../shared/AppPageShell';
import { BrandOverview } from './BrandOverview';
import { ArtStyleView } from './ArtStyleView';
import { ColorTestView } from './ColorTestView';
import { ColorView } from './ColorView';
import { LogoView } from './LogoView';

/**
 * Edu.HubBrand — brand site feel inside the normal app shell (nav + sidebar kept).
 * Logo Test / Color Test also embed in AppGuide → Branding.
 * Color Test uses stage fill + shell footer (whiteboard-style) when not embedded.
 */
export function BrandApp({
  isDarkMode,
  onDarkModeChange,
  activeTab,
  theme,
  onShellFooterActiveChange,
}) {
  const section = activeTab || 'Overview';
  const isColorTest = section === 'Color Test';

  let body = <BrandOverview isDarkMode={isDarkMode} />;
  if (section === 'Art Style') body = <ArtStyleView isDarkMode={isDarkMode} />;
  else if (section === 'Logo') body = <LogoView isDarkMode={isDarkMode} />;
  else if (section === 'Color') body = <ColorView isDarkMode={isDarkMode} />;
  else if (isColorTest) {
    body = (
      <ColorTestView
        isDarkMode={isDarkMode}
        onDarkModeChange={onDarkModeChange}
        theme={theme}
        onShellFooterActiveChange={onShellFooterActiveChange}
      />
    );
  }

  return (
    <AppPageShell
      variant={isColorTest ? 'stage' : 'page'}
      className={
        isColorTest ? '!max-w-none h-full min-h-0' : '!max-w-none !pb-0 w-full'
      }
    >
      {body}
    </AppPageShell>
  );
}
