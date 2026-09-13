import { OWNER_VIEWS } from '../data/auth/ownerView';
import { TYPE } from '../shared/typography';

export function OwnerFacetSwitch({ activeRole, theme, onSwitch, className = '' }) {
  return (
    <div className={className}>
      <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>Open as</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {OWNER_VIEWS.map((view) => {
          const selected = view.id === activeRole;
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={selected}
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                selected
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                  : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
              }`}
              onClick={() => onSwitch?.(view.id)}
            >
              {view.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
