import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { toolBtnClass } from '../../shared/toolBtn';
import { OF_THE_DAY_META } from '../../data/ofTheDay/types';

/**
 * Shared OfTheDay card chrome — image, title, body, type badge, listen/source.
 * Jokes keep the punchline covered until tap.
 */
export function OfTheDayCard({
  theme,
  isDarkMode,
  item,
  dateLabel = '',
  onReshuffle,
  compact = false,
}) {
  const type = item?.type || 'joke';
  const meta = OF_THE_DAY_META[type] || OF_THE_DAY_META.joke;
  const Icon = meta.Icon;
  const hasImage = Boolean(item?.imageSrc);
  const toolBtn = toolBtnClass(isDarkMode);
  const imageAlt = item?.title ? String(item.title) : '';
  const isJoke = type === 'joke';
  const [showPunchline, setShowPunchline] = useState(false);

  useEffect(() => {
    setShowPunchline(false);
  }, [item?.id]);

  const listen = () => {
    const url = String(item?.listenUrl || '').trim();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <article
      className={`flex h-full min-h-0 flex-col overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      {hasImage ? (
        <div
          className={`relative shrink-0 overflow-hidden ${
            compact ? 'h-36' : 'h-64 sm:h-80'
          } ${theme.colorSurfaceVariant}`}
        >
          <img
            src={item.imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      ) : null}
      <div className={`flex min-h-0 flex-1 flex-col ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex rounded-lg p-1.5 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Icon size={14} />
          </span>
          <p className={`${TYPE.labelLg} truncate ${theme.colorOnSurface}`}>{meta.label} of the Day</p>
        </div>
        {dateLabel ? (
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>{dateLabel}</p>
        ) : null}

        <h3 className={`mt-2 ${TYPE.titleMd} capitalize ${theme.colorOnSurface}`}>
          {item?.title || 'Loading…'}
        </h3>
        {item?.body && isJoke && !showPunchline ? (
          <button
            type="button"
            className={`edu-control mt-3 self-start rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`}
            onClick={() => setShowPunchline(true)}
          >
            Tap for the punchline
          </button>
        ) : null}
        {item?.body && (!isJoke || showPunchline) ? (
          <p
            className={`${TYPE.bodyMd} mt-1.5 ${compact ? 'line-clamp-4' : 'line-clamp-6'} ${theme.colorOnSurfaceVariant}`}
          >
            {item.body}
          </p>
        ) : null}

        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
          {item?.listenUrl ? (
            <button type="button" className={toolBtn} onClick={listen}>
              <ExternalLink size={14} strokeWidth={2.5} />
              Listen
            </button>
          ) : null}
          {onReshuffle ? (
            <button type="button" className={toolBtn} onClick={onReshuffle}>
              Reshuffle
            </button>
          ) : null}
          {item?.imageAttribution || item?.source ? (
            <span className={`${TYPE.bodySm} truncate ${theme.colorOnSurfaceVariant}`}>
              {item.imageAttribution || item.source}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
