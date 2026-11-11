/**
 * Shared segmented control for mode switches (timer modes, word-work levels, etc.).
 * Lives in shared/ so mini-apps stay standalone and import peers only through shared + data.
 *
 * `variant` — `pills` (default track) or `tabs` (underline row, no pill shell).
 * `fullWidth` — stretch across the parent and share space evenly (labels may truncate).
 */
import { TYPE } from './typography';

export function SegmentControl({
  isDarkMode,
  theme,
  value,
  onChange,
  options,
  fullWidth = false,
  variant = 'pills',
}) {
  const isTabs = variant === 'tabs';

  return (
    <div
      role="tablist"
      className={`${fullWidth ? 'flex w-full' : 'inline-flex'} ${
        isTabs
          ? `gap-0 border-b ${theme.colorOutline}`
          : `p-1 rounded-full shadow-sm border ${
              isDarkMode
                ? `${theme.colorSurface} ${theme.colorOutline}`
                : `${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`
            }`
      }`}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`edu-control flex items-center ${
              fullWidth ? 'min-w-0 flex-1 justify-center px-2' : 'px-4'
            } ${TYPE.labelLg} transition-all ${
              isTabs
                ? `-mb-px border-b-2 py-2.5 ${
                    active
                      ? `${theme.colorOnSurface} border-current${
                          fullWidth
                            ? isDarkMode
                              ? ' bg-slate-900/50'
                              : ' bg-white'
                            : ''
                        }`
                      : `${theme.colorOnSurfaceVariant} border-transparent hover:opacity-80`
                  }`
                : `py-2 rounded-full ${
                    active
                      ? `${theme.colorSurface} ${theme.colorOnSurface} shadow`
                      : `${theme.colorOnSurfaceVariant} hover:opacity-80`
                  }`
            }`}
          >
            {opt.icon ? <opt.icon size={16} className="mr-2 shrink-0" /> : null}
            <span className={fullWidth ? 'truncate' : undefined}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
