import { TYPE } from '../../shared/typography';
import { JOKE_CATALOG } from '../../data/ofTheDay/catalogs/jokes';

/**
 * OfTheDay notes on the shell Settings page.
 */
export function OfTheDaySettingsCards({ theme, isDarkMode, Card }) {
  return (
    <Card
      title="Of the Day"
      description="Picks are all-ages for now. Joke bank is 365 classroom-safe jokes — one for each day of the year."
      isDarkMode={isDarkMode}
    >
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          {JOKE_CATALOG.length} jokes in the base bank. Art and animal pictures come from
          public-domain (CC0) sources. Song Listen opens YouTube in a new tab.
        </p>
        <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
          Saved days live on this device for the teacher, so you can reuse them across classes.
        </p>
      </div>
    </Card>
  );
}
