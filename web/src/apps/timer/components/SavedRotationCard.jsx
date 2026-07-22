import { Layers, X } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/** Saved small-group rotation preset card. */
export function SavedRotationCard({ title, groups, isDarkMode, theme, onClick, onRemove }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-5 ${APP_GRID_CARD} transition-all hover:scale-[1.02] active:scale-[0.98] group ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${theme.colorOnSurfaceVariant} hover:text-rose-500`}
        role="presentation"
      >
        <X size={16} />
      </div>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
      >
        <Layers size={20} />
      </div>
      <h4 className={`${TYPE.titleMd} mb-2 ${theme.colorOnSurface}`}>{title}</h4>
      <ul className={`${TYPE.bodyMd} space-y-1 ${theme.colorOnSurfaceVariant}`}>
        {groups.map((group) => (
          <li key={group} className="truncate">
            {group}
          </li>
        ))}
      </ul>
    </button>
  );
}
