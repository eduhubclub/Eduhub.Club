import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { TYPE } from '../shared/typography';
import { NavAccordion } from './NavAccordion';

export function NavItem({
  item,
  isSidebarOpen,
  isLeft,
  isDarkMode,
  theme,
  activeTab,
  expandedItem,
  panelItem,
  onItemClick,
  onSubItemClick,
  onShowTooltip,
  onHideTooltip,
}) {
  const isExpanded = expandedItem === item.id;
  const isTabActive =
    activeTab === item.name ||
    (item.type === 'accordion' && item.subItems?.includes(activeTab));
  const isPanelOpen = panelItem === item.id;
  const isVisuallyActive =
    isTabActive || isPanelOpen || (item.type === 'accordion' && isExpanded);

  return (
    <div>
      <button
        data-popout-trigger={item.id}
        onClick={(e) => onItemClick(item, e)}
        onMouseEnter={(e) => onShowTooltip(e, item.name)}
        onMouseLeave={onHideTooltip}
        className={`flex items-center transition-all group rounded-xl h-12
          ${isSidebarOpen ? 'w-full px-3' : 'w-16 mx-auto justify-center'}
          ${
            isVisuallyActive
              ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
              : isDarkMode
                ? `${theme.colorOnSurfaceVariant} hover:bg-slate-800 ${theme.hoverText}`
                : `${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`
          }`}
      >
        <div className="flex items-center justify-center shrink-0">
          <item.icon size={20} strokeWidth={isVisuallyActive ? 2.5 : 2} />
        </div>
        {isSidebarOpen && (
          <>
            <span className="ml-4 flex flex-1 items-center min-w-0 gap-2">
              <span className={`${TYPE.titleSm} truncate flex-1 text-left`}>{item.name}</span>
              {item.badge ? (
                <span className={`${TYPE.labelMicro} shrink-0 opacity-60 font-normal tabular-nums`}>
                  {item.badge}
                </span>
              ) : null}
            </span>
            {item.type === 'accordion' && (
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
            {item.type === 'panel' && (
              <ChevronRight
                size={14}
                className={`transition-all duration-200 shrink-0 ${isLeft ? '' : 'rotate-180'} ${
                  isPanelOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                }`}
              />
            )}
            {item.type === 'popout' && <MoreVertical size={14} className="opacity-40 shrink-0" />}
          </>
        )}
      </button>

      {item.type === 'accordion' && isExpanded && isSidebarOpen && (
        <NavAccordion
          item={item}
          isLeft={isLeft}
          isDarkMode={isDarkMode}
          theme={theme}
          activeTab={activeTab}
          onSubItemClick={onSubItemClick}
        />
      )}
    </div>
  );
}
