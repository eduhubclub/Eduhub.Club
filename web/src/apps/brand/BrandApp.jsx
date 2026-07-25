import { AppPageShell } from '../../shared/AppPageShell';
import { BrandOverview } from './BrandOverview';
import { ArtStyleView } from './ArtStyleView';
import { LogoView } from './LogoView';

/**
 * Edu.HubBrand — brand site feel inside the normal app shell (nav + sidebar kept).
 */
export function BrandApp({ isDarkMode, activeTab }) {
  const section = activeTab || 'Overview';

  let body = <BrandOverview isDarkMode={isDarkMode} />;
  if (section === 'Art Style') body = <ArtStyleView isDarkMode={isDarkMode} />;
  else if (section === 'Logo') body = <LogoView isDarkMode={isDarkMode} />;

  return (
    <AppPageShell variant="page" className="!max-w-none !pb-0 w-full">
      {body}
    </AppPageShell>
  );
}
