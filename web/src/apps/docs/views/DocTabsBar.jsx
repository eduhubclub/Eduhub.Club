import { Plus, X } from 'lucide-react';
import { TYPE } from '../../../shared/typography';

/**
 * Section list (left rail) for one Edu.Docs document.
 */
export function DocTabsBar({
  sections,
  activeId,
  theme,
  isDarkMode,
  onSelect,
  onClose,
  onCreate,
  titleValue,
  onTitleChange,
  onTitleBlur,
  canClose = true,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <p className={`${TYPE.labelMicro} px-1 shrink-0 ${theme.colorOnSurfaceVariant}`}>
        Sections
      </p>
      <div
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Document sections"
        aria-orientation="vertical"
      >
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <div
              key={section.id}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={`edu-control group flex w-full min-h-9 shrink-0 items-center gap-1 rounded-xl border-[1.5px] pl-2.5 pr-1 ${
                active
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                  : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`
              }`}
              onClick={() => {
                if (!active) onSelect?.(section.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!active) onSelect?.(section.id);
                }
              }}
            >
              {active ? (
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold leading-normal outline-none placeholder:opacity-70"
                  style={{ color: 'inherit' }}
                  value={titleValue}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  onBlur={() => onTitleBlur?.()}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Section title"
                />
              ) : (
                <span className={`min-w-0 flex-1 truncate text-left ${TYPE.labelMd}`}>
                  {section.title || 'Untitled'}
                </span>
              )}
              {canClose && sections.length > 1 ? (
                <button
                  type="button"
                  className={`edu-control flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? 'opacity-90 hover:opacity-100'
                      : isDarkMode
                        ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                  aria-label={`Remove ${section.title || 'section'}`}
                  title="Remove section"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.(section.id);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={`edu-control flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border-[1.5px] ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} ${
          isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
        }`}
        aria-label="Add section"
        title="Add section"
        onClick={() => onCreate?.()}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Section
      </button>
    </div>
  );
}
