/**
 * Shared segmented pill control for mode switches (timer modes, word-work levels, etc.).
 * Lives in shared/ so mini-apps stay standalone and import peers only through shared + data.
 */
import { TYPE } from './typography';

export function SegmentControl({ isDarkMode, theme, value, onChange, options }) {
  return (
    <div
      className={`inline-flex p-1 rounded-xl shadow-sm border ${
        isDarkMode
          ? `${theme.colorSurface} ${theme.colorOutline}`
          : `${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`
      }`}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`edu-control flex items-center px-4 py-2 rounded-lg ${TYPE.labelLg} transition-all ${
              active
                ? `${theme.colorSurface} ${theme.colorOnSurface} shadow`
                : `${theme.colorOnSurfaceVariant} hover:opacity-80`
            }`}
          >
            {opt.icon ? <opt.icon size={16} className="mr-2 shrink-0" /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
