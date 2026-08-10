import {
  Menu,
  ChevronLeft,
  ArrowLeftRight,
  Sun,
  Moon,
  X,
  Settings,
  Plus,
} from 'lucide-react';
import { LogoHorizontal, LogoIcon2x2 } from '../shared/Logo';
import { NAV_HEIGHT } from '../shared/theme';
import { TYPE } from '../shared/typography';
import { APP_SHELL_FOOTER_CHROME } from '../shared/layout';
import { NavItem } from '../nav/NavItem';
import { MAX_DASHBOARD_WIDGETS } from '../apps/dashboard/widgets/registry';

/**
 * Desktop (md+): collapsible rail in the flex layout.
 * Phone: off-canvas drawer over content; always shows labels when open.
 */
export function Sidebar({
  sidebarRef,
  navItems,
  isSidebarOpen,
  isMobileNavOpen,
  isDesktop,
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
  onToggleDarkMode,
  onFlipSidebar,
  onToggleSidebar,
  onCloseMobileNav,
  onNavScroll,
  isSettingsOpen,
  onOpenSettings,
  /** Dashboard-only teaching widgets pinned to this rail. */
  showTeachingWidgets = false,
  pinnedWidgets = [],
  activeWidgetId = null,
  onPinnedWidgetClick,
  onOpenAddWidget,
}) {
  const showLabels = isDesktop ? isSidebarOpen : true;
  const desktopWidth = isSidebarOpen ? 'md:w-64' : 'md:w-20';
  const atWidgetLimit = pinnedWidgets.length >= MAX_DASHBOARD_WIDGETS;

  const asidePosition = isDesktop
    ? 'relative shrink-0 h-full'
    : `fixed inset-y-0 z-[70] h-full w-[min(18rem,85vw)] shadow-2xl transition-transform duration-300 ease-in-out ${
        isLeft ? 'left-0' : 'right-0'
      } ${
        isMobileNavOpen
          ? 'translate-x-0'
          : isLeft
            ? '-translate-x-full'
            : 'translate-x-full'
      }`;

  return (
    <>
      {!isDesktop && isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-[65] bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={onCloseMobileNav}
        />
      )}

      <aside
        ref={sidebarRef}
        aria-label="App sidebar"
        className={`${asidePosition} ${desktopWidth} transition-[width,background-color,transform] duration-300 ease-in-out flex flex-col ${
          theme.colorSurface
        } ${isLeft ? 'border-r-[1.5px]' : 'border-l-[1.5px]'} ${theme.colorOutline}`}
      >
        <div
          className={`relative flex items-center justify-center shrink-0 border-b-[1.5px] ${NAV_HEIGHT} w-full px-3 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="flex items-center justify-center px-1 min-w-0">
            {showLabels ? (
              <LogoHorizontal className="h-8 w-auto" />
            ) : (
              <LogoIcon2x2 className="h-8 w-8" />
            )}
          </div>
          {!isDesktop && (
            <button
              type="button"
              onClick={onCloseMobileNav}
              className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-lg md:hidden ${
                isLeft ? 'right-2' : 'left-2'
              } ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="pt-2 shrink-0" />

        <nav
          aria-label="Primary"
          onScroll={onNavScroll}
          className="flex-1 px-2 space-y-1 pt-2 pb-10 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isSidebarOpen={showLabels}
              isLeft={isLeft}
              isDarkMode={isDarkMode}
              theme={theme}
              activeTab={activeTab}
              expandedItem={expandedItem}
              panelItem={panelItem}
              onItemClick={onItemClick}
              onSubItemClick={onSubItemClick}
              onShowTooltip={onShowTooltip}
              onHideTooltip={onHideTooltip}
            />
          ))}

          {showTeachingWidgets ? (
            <>
              {showLabels ? (
                <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-1">
                  <p className={`${TYPE.labelMicro} text-slate-400`}>
                    Widgets
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenAddWidget?.()}
                    onMouseEnter={(e) =>
                      onShowTooltip(
                        e,
                        atWidgetLimit
                          ? `Widgets (${MAX_DASHBOARD_WIDGETS} max)`
                          : 'Add widget'
                      )
                    }
                    onMouseLeave={onHideTooltip}
                    aria-label="Add widget"
                    className={`inline-flex items-center justify-center rounded-lg p-0.5 transition-colors ${
                      isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="pt-3 pb-1 flex flex-col items-center gap-1">
                  <div className="w-8 border-t border-slate-300 dark:border-slate-600" />
                  <button
                    type="button"
                    onClick={() => onOpenAddWidget?.()}
                    onMouseEnter={(e) =>
                      onShowTooltip(
                        e,
                        atWidgetLimit
                          ? `Widgets (${MAX_DASHBOARD_WIDGETS} max)`
                          : 'Add widget'
                      )
                    }
                    onMouseLeave={onHideTooltip}
                    aria-label="Add widget"
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {pinnedWidgets.map((widget) => {
                const Icon = widget.icon;
                const isActive = activeWidgetId === widget.id;
                return (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => onPinnedWidgetClick?.(widget)}
                    onMouseEnter={(e) => onShowTooltip(e, widget.name)}
                    onMouseLeave={onHideTooltip}
                    title={showLabels ? undefined : widget.name}
                    className={`flex items-center transition-all group rounded-xl h-12 mt-1 ${
                      showLabels ? 'w-full px-3' : 'w-16 mx-auto justify-center'
                    } ${
                      isActive
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                        : isDarkMode
                          ? `${theme.colorOnSurfaceVariant} hover:bg-slate-800 ${theme.hoverText}`
                          : `${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`
                    }`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      {Icon ? (
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      ) : null}
                    </div>
                    {showLabels ? (
                      <span className={`ml-4 ${TYPE.titleSm} flex-1 text-left truncate`}>
                        {widget.name}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </>
          ) : null}

          <button
            type="button"
            onClick={onOpenSettings}
            onMouseEnter={(e) => onShowTooltip(e, 'Settings')}
            onMouseLeave={onHideTooltip}
            className={`flex items-center transition-all group rounded-xl h-12 mt-1 ${
              showLabels ? 'w-full px-3' : 'w-16 mx-auto justify-center'
            } ${
              isSettingsOpen
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : isDarkMode
                  ? `${theme.colorOnSurfaceVariant} hover:bg-slate-800 ${theme.hoverText}`
                  : `${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`
            }`}
          >
            <div className="flex items-center justify-center shrink-0">
              <Settings size={20} strokeWidth={isSettingsOpen ? 2.5 : 2} />
            </div>
            {showLabels && (
              <span className={`ml-4 ${TYPE.titleSm} flex-1 text-left truncate`}>Settings</span>
            )}
          </button>
        </nav>

        <div className={`${APP_SHELL_FOOTER_CHROME} ${theme.colorOutline}`}>
          <div
            className={`flex min-w-0 transition-all duration-300 ${
              showLabels ? 'flex-row items-center gap-1' : 'flex-col items-center gap-2'
            }`}
          >
            <button
              type="button"
              onClick={onToggleDarkMode}
              onMouseEnter={(e) => onShowTooltip(e, isDarkMode ? 'Light Mode' : 'Dark Mode')}
              onMouseLeave={onHideTooltip}
              className={`flex items-center justify-center rounded-xl transition-all h-12 group min-w-0 ${
                showLabels ? 'flex-1 px-1.5' : 'w-16'
              } ${
                isDarkMode
                  ? 'text-amber-400 bg-transparent hover:bg-slate-800'
                  : 'text-slate-400 bg-transparent hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1.5 min-w-0">
                {isDarkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
                {showLabels ? (
                  <span className={`${TYPE.labelMicro} truncate`}>
                    {isDarkMode ? 'Light' : 'Dark'}
                  </span>
                ) : null}
              </span>
            </button>

            {isDesktop && (
              <button
                type="button"
                onClick={onFlipSidebar}
                onMouseEnter={(e) => onShowTooltip(e, 'Flip Sidebar')}
                onMouseLeave={onHideTooltip}
                className={`flex items-center justify-center rounded-xl transition-all h-12 group min-w-0 ${
                  showLabels ? 'flex-1 px-1.5' : 'w-16'
                } ${
                  isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-400 bg-transparent hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5 min-w-0">
                  <ArrowLeftRight size={16} className="shrink-0" />
                  {showLabels ? (
                    <span className={`${TYPE.labelMicro} truncate`}>Flip</span>
                  ) : null}
                </span>
              </button>
            )}

            {isDesktop && (
              <button
                type="button"
                onClick={onToggleSidebar}
                onMouseEnter={(e) =>
                  onShowTooltip(e, isSidebarOpen ? 'Collapse Menu' : 'Expand Menu')
                }
                onMouseLeave={onHideTooltip}
                className={`flex items-center justify-center transition-all rounded-xl h-12 group min-w-0 ${
                  showLabels ? 'flex-1 px-1.5' : 'mx-auto w-16'
                } ${
                  isDarkMode
                    ? 'text-slate-400 bg-transparent hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-400 bg-transparent hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5 min-w-0">
                  {isSidebarOpen ? (
                    <ChevronLeft size={18} className={`shrink-0 ${!isLeft ? 'rotate-180' : ''}`} />
                  ) : (
                    <Menu size={20} className="shrink-0" />
                  )}
                  {showLabels ? (
                    <span className={`${TYPE.labelMicro} truncate`}>Menu</span>
                  ) : null}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
