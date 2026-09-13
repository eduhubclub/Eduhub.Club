import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/**
 * Empty titled card for Layout Lab — chrome only, no widget body.
 */
export function EmptyCard({ theme, title, icon: Icon, sizeLabel = null }) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${APP_GRID_CARD} p-3 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        {Icon ? (
          <span
            className={`inline-flex rounded-lg shrink-0 p-1.5 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Icon size={14} />
          </span>
        ) : null}
        <p className={`${TYPE.labelLg} truncate flex-1 min-w-0 ${theme.colorOnSurface}`}>
          {title}
        </p>
        {sizeLabel ? (
          <span
            className={`${TYPE.labelSm} shrink-0 uppercase tracking-wide ${theme.colorOnSurfaceVariant}`}
          >
            {sizeLabel}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1" aria-hidden />
    </div>
  );
}
