import { TYPE } from '../shared/typography';

/** Accordion sub-items — only rendered when a nav entry has type: 'accordion'. */
export function NavAccordion({ item, isLeft, isDarkMode, theme, activeTab, onSubItemClick }) {
  return (
    <div
      className={`mt-1 space-y-1 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} ${
        isLeft ? 'ml-10 border-l-[0.5px]' : 'mr-10 border-r-[0.5px]'
      }`}
    >
      {item.subItems.map((sub) => (
        <button
          key={sub}
          onClick={() => onSubItemClick(sub)}
          className={`block w-full text-left py-2 px-4 ${TYPE.labelMd} transition-colors
            ${isLeft ? 'rounded-r-lg' : 'rounded-l-lg text-right'}
            ${
              activeTab === sub
                ? `${theme.colorOnPrimaryContainer} ${theme.colorPrimaryContainer}`
                : isDarkMode
                  ? `${theme.colorOnSurfaceVariant} hover:bg-slate-800/50 ${theme.hoverText}`
                  : `${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`
            }`}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}
