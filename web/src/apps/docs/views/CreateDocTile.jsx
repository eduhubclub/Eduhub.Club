import { Plus } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/**
 * First grid cell — same footprint as a doc thumbnail.
 */
export function CreateDocTile({
  theme,
  isDarkMode,
  onCreate,
  label = 'Create Doc',
  hint = 'Blank document',
}) {
  return (
    <article
      className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden flex flex-col`}
    >
      <button
        type="button"
        className="edu-control group flex flex-1 flex-col text-left min-h-0"
        onClick={onCreate}
        aria-label={label}
      >
        <div
          className={`relative aspect-[8.5/11] w-full overflow-hidden ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              aria-hidden
            >
              <Plus className="h-8 w-8" strokeWidth={2.25} />
            </span>
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface} text-center`}>
              {label}
            </span>
          </div>
        </div>
        <div className="border-t border-inherit p-3">
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{hint}</p>
        </div>
      </button>
    </article>
  );
}
