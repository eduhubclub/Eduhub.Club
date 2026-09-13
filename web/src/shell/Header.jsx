import { useEffect, useRef, useState } from 'react';
import {
  Search,
  X,
  Grid,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  FileText,
  KeyRound,
  Monitor,
  Star,
  BarChart2,
  Menu,
  Pencil,
  Check,
} from 'lucide-react';
import { NAV_HEIGHT } from '../shared/theme';
import { TYPE } from '../shared/typography';
import { launcherApps } from '../apps';
import { useAuth } from '../data/auth/AuthContext';
import { OwnerFacetSwitch } from '../auth/OwnerFacetSwitch';
import { useAppThemePreferences } from '../data/settings/AppThemePreferencesContext';

const LAUNCHER_ORDER_KEY = 'eduHub.launcherAppOrder.v2';
const APPS_EDGE_SCROLL_ZONE = 40;
const APPS_EDGE_SCROLL_MAX = 14;

function loadOrderedApps() {
  const byId = Object.fromEntries(launcherApps.map((a) => [a.id, a]));
  try {
    const saved = JSON.parse(localStorage.getItem(LAUNCHER_ORDER_KEY) || '[]');
    if (Array.isArray(saved) && saved.length) {
      const ordered = saved.map((id) => byId[id]).filter(Boolean);
      const missing = launcherApps.filter((a) => !saved.includes(a.id));
      return [...ordered, ...missing];
    }
  } catch {
    /* ignore */
  }
  return [...launcherApps];
}

function persistOrder(apps) {
  try {
    localStorage.setItem(LAUNCHER_ORDER_KEY, JSON.stringify(apps.map((a) => a.id)));
  } catch {
    /* ignore */
  }
}

const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Resource Added',
    desc: 'Sarah uploaded "Q3 Syllabus"',
    time: '2m ago',
    unread: true,
    icon: FileText,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    id: 2,
    title: 'System Update',
    desc: 'EduHub will be down for maintenance at 2 AM.',
    time: '1h ago',
    unread: true,
    icon: Monitor,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    id: 3,
    title: 'Welcome to EduHub',
    desc: 'Get started by setting up your first classroom.',
    time: '2d ago',
    unread: false,
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 4,
    title: 'Weekly Report Ready',
    desc: 'Your analytics report for last week is available.',
    time: '3d ago',
    unread: false,
    icon: BarChart2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

export function Header({
  appName,
  isDarkMode,
  theme,
  searchRef,
  isSearchExpanded,
  searchQuery,
  onExpandSearch,
  onSearchChange,
  onClearOrCollapseSearch,
  appsButtonRef,
  appsMenuRef,
  isAppsMenuOpen,
  onToggleAppsMenu,
  onSelectLauncherApp,
  notificationsButtonRef,
  notificationsMenuRef,
  isNotificationsOpen,
  onToggleNotifications,
  accountButtonRef,
  accountMenuRef,
  isAccountMenuOpen,
  onToggleAccountMenu,
  onCloseMenus,
  onOpenMobileNav,
  account = null,
  onSignOut,
  onOpenClassroom,
  showApps = true,
}) {
  const { switchView } = useAuth();
  const { getLauncherColor } = useAppThemePreferences();
  const [orderedApps, setOrderedApps] = useState(loadOrderedApps);
  const [isEditingApps, setIsEditingApps] = useState(false);
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [dragOverAppId, setDragOverAppId] = useState(null);
  const [dropEdge, setDropEdge] = useState('before'); // 'before' | 'after'
  const dropEdgeRef = useRef('before');
  const dragOverAppIdRef = useRef(null);
  const appsGridRef = useRef(null);
  const autoScrollRafRef = useRef(null);
  const dragPointerYRef = useRef(null);

  const stopAppsAutoScroll = () => {
    if (autoScrollRafRef.current != null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  };

  const tickAppsAutoScroll = () => {
    const el = appsGridRef.current;
    const y = dragPointerYRef.current;
    if (!el || y == null) {
      autoScrollRafRef.current = null;
      return;
    }
    const rect = el.getBoundingClientRect();
    let dy = 0;
    if (y < rect.top + APPS_EDGE_SCROLL_ZONE) {
      const t = Math.min(
        1,
        (rect.top + APPS_EDGE_SCROLL_ZONE - y) / APPS_EDGE_SCROLL_ZONE,
      );
      dy = -APPS_EDGE_SCROLL_MAX * t;
    } else if (y > rect.bottom - APPS_EDGE_SCROLL_ZONE) {
      const t = Math.min(
        1,
        (y - (rect.bottom - APPS_EDGE_SCROLL_ZONE)) / APPS_EDGE_SCROLL_ZONE,
      );
      dy = APPS_EDGE_SCROLL_MAX * t;
    }
    if (dy !== 0) {
      el.scrollTop += dy;
      autoScrollRafRef.current = requestAnimationFrame(tickAppsAutoScroll);
    } else {
      autoScrollRafRef.current = null;
    }
  };

  const updateDropTarget = (appId, edge) => {
    dragOverAppIdRef.current = appId;
    dropEdgeRef.current = edge;
    setDragOverAppId(appId);
    setDropEdge(edge);
  };

  useEffect(() => {
    if (!isAppsMenuOpen) {
      setIsEditingApps(false);
      setDraggedAppId(null);
      setDragOverAppId(null);
      setDropEdge('before');
      dragOverAppIdRef.current = null;
      dropEdgeRef.current = 'before';
      stopAppsAutoScroll();
    }
  }, [isAppsMenuOpen]);

  // While dragging, scroll the apps grid when the pointer is near its edges.
  useEffect(() => {
    if (draggedAppId == null) {
      stopAppsAutoScroll();
      dragPointerYRef.current = null;
      return undefined;
    }
    const onDragOver = (e) => {
      dragPointerYRef.current = e.clientY;
      if (autoScrollRafRef.current == null) {
        autoScrollRafRef.current = requestAnimationFrame(tickAppsAutoScroll);
      }
    };
    document.addEventListener('dragover', onDragOver);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      stopAppsAutoScroll();
    };
  }, [draggedAppId]);

  // Pick up newly registered apps without wiping a saved order
  useEffect(() => {
    setOrderedApps(loadOrderedApps());
  }, []);

  const handleDragEnd = () => {
    const overId = dragOverAppIdRef.current;
    const edge = dropEdgeRef.current;
    if (draggedAppId != null && overId != null && draggedAppId !== overId) {
      setOrderedApps((prev) => {
        const next = [...prev];
        const from = next.findIndex((a) => a.id === draggedAppId);
        if (from === -1) return prev;
        const [moved] = next.splice(from, 1);
        let to = next.findIndex((a) => a.id === overId);
        if (to === -1) return prev;
        if (edge === 'after') to += 1;
        next.splice(to, 0, moved);
        persistOrder(next);
        return next;
      });
    }
    setDraggedAppId(null);
    setDragOverAppId(null);
    setDropEdge('before');
    dragOverAppIdRef.current = null;
    dropEdgeRef.current = 'before';
    stopAppsAutoScroll();
    dragPointerYRef.current = null;
  };

  const appsList = orderedApps;

  return (
    <header
      aria-label="App header"
      className={`border-b-[1.5px] flex items-center gap-2 px-3 sm:px-4 z-20 shrink-0 ${NAV_HEIGHT} transition-[background-color,border-color] duration-300 ease-in-out ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        className={`md:hidden shrink-0 p-2 rounded-xl transition-colors ${
          isDarkMode
            ? 'text-slate-300 hover:bg-slate-800'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center flex-1 min-w-0 mr-2 sm:mr-4">
        <div className="flex items-center text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">
          <span className={`shrink-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Edu.</span>
          <span className={`truncate ${theme.text}`}>{appName}</span>
        </div>
      </div>

      <div className="flex items-center justify-end h-full gap-2 relative">
        <div ref={searchRef} className="relative flex items-center h-10 shrink-0">
          <div className="w-10 h-10 shrink-0" />
          <div
            className={`absolute right-0 flex items-center h-10 transition-all duration-300 ease-in-out overflow-hidden rounded-full z-50
              ${
                isSearchExpanded
                  ? `w-[200px] sm:w-[280px] md:w-[320px] shadow-sm border ${
                      isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
                    }`
                  : `w-10 border border-transparent bg-transparent ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`
              }`}
          >
            <button
              onClick={() => !isSearchExpanded && onExpandSearch()}
              className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-colors ${
                isSearchExpanded ? theme.text : 'text-slate-400'
              }`}
            >
              <Search size={18} />
            </button>
            <input
              type="text"
              autoFocus={isSearchExpanded}
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`h-full bg-transparent outline-none ${TYPE.bodyMd} transition-opacity duration-300 ${
                isSearchExpanded ? 'flex-1 opacity-100' : 'w-0 opacity-0'
              } ${isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearOrCollapseSearch();
              }}
              className={`w-10 h-10 shrink-0 flex items-center justify-center transition-opacity duration-300 ${
                isSearchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } text-slate-400 hover:text-slate-600 ${
                isDarkMode ? 'hover:text-slate-200' : ''
              }`}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {showApps ? (
          <div className="relative">
            <button
              ref={appsButtonRef}
              onClick={onToggleAppsMenu}
              className={`p-2 text-slate-400 ${theme.hoverText} rounded-full transition-colors`}
            >
              <Grid size={18} />
            </button>

            {isAppsMenuOpen && (
              <div
                ref={appsMenuRef}
                className={`absolute top-full right-0 mt-3 w-[min(260px,calc(100vw-1.5rem))] rounded-2xl shadow-xl z-[150] overflow-hidden ${
                  isDarkMode ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    isDarkMode ? 'border-slate-700' : 'border-slate-300'
                  }`}
                >
                  <span
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Apps
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingApps((v) => !v)}
                    className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} px-2.5 py-1 rounded-md transition-all ${
                      isEditingApps
                        ? `${theme.text} ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`
                        : isDarkMode
                          ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {isEditingApps ? (
                      <Check size={13} strokeWidth={2.5} />
                    ) : (
                      <Pencil size={13} strokeWidth={2.5} />
                    )}
                    {isEditingApps ? 'Done' : 'Edit'}
                  </button>
                </div>

                <div
                  ref={appsGridRef}
                  className={`grid grid-cols-3 gap-1 overflow-y-auto max-h-[220px] p-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ${
                    isDarkMode
                      ? '[&::-webkit-scrollbar-thumb]:bg-slate-700'
                      : '[&::-webkit-scrollbar-thumb]:bg-slate-200'
                  }`}
                >
                  {appsList.map((app, index) => {
                    const isDragging = draggedAppId === app.id;
                    const isDropTarget =
                      isEditingApps &&
                      dragOverAppId === app.id &&
                      draggedAppId != null &&
                      draggedAppId !== app.id;
                    const showJiggle = isEditingApps && !isDragging;

                    return (
                      <div key={app.id} className="relative">
                        {isDropTarget && dropEdge === 'before' && (
                          <div
                            className={`pointer-events-none absolute left-0 top-1.5 bottom-5 w-0.5 rounded-full z-10 ${
                              isDarkMode ? 'bg-slate-400' : 'bg-slate-600'
                            }`}
                            aria-hidden
                          />
                        )}
                        <button
                          type="button"
                          draggable={isEditingApps}
                          onDragStart={(e) => {
                            if (!isEditingApps) return;
                            setDraggedAppId(app.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            if (isEditingApps && draggedAppId != null && draggedAppId !== app.id) {
                              updateDropTarget(app.id, 'before');
                            }
                          }}
                          onDragOver={(e) => {
                            if (!isEditingApps) return;
                            e.preventDefault();
                            if (draggedAppId == null || draggedAppId === app.id) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const mid = rect.left + rect.width / 2;
                            updateDropTarget(app.id, e.clientX < mid ? 'before' : 'after');
                          }}
                          onDragEnd={handleDragEnd}
                          className={`w-full flex flex-col items-center justify-start gap-1.5 p-2 rounded-xl group ${
                            isEditingApps
                              ? 'cursor-grab active:cursor-grabbing'
                              : isDarkMode
                                ? 'hover:bg-slate-800 transition-colors'
                                : 'hover:bg-slate-50 transition-colors'
                          } ${isDragging ? 'opacity-40' : ''}`}
                          onClick={() => {
                            if (isEditingApps) return;
                            onSelectLauncherApp(app);
                          }}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${getLauncherColor(
                              app
                            )} ${showJiggle ? 'animate-edu-jiggle' : ''} ${
                              !isEditingApps
                                ? 'transition-transform group-hover:scale-105 group-active:scale-95'
                                : ''
                            }`}
                            style={
                              showJiggle
                                ? {
                                    animationDelay: `${(index % 5) * 35}ms`,
                                    transformOrigin: 'center center',
                                  }
                                : undefined
                            }
                          >
                            <app.icon size={22} strokeWidth={2} />
                          </div>
                          <span
                            className={`${TYPE.labelMd} text-center ${
                              isDarkMode
                                ? 'text-slate-400 group-hover:text-slate-200'
                                : 'text-slate-500 group-hover:text-slate-900'
                            }`}
                          >
                            {app.name}
                          </span>
                        </button>
                        {isDropTarget && dropEdge === 'after' && (
                          <div
                            className={`pointer-events-none absolute right-0 top-1.5 bottom-5 w-0.5 rounded-full z-10 ${
                              isDarkMode ? 'bg-slate-400' : 'bg-slate-600'
                            }`}
                            aria-hidden
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          ) : null}

          <div className="relative">
            <button
              ref={notificationsButtonRef}
              onClick={onToggleNotifications}
              className={`p-2 text-slate-400 ${theme.hoverText} rounded-full transition-colors relative`}
            >
              <Bell size={18} />
              <span
                className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 ${theme.colorPrimary} rounded-full border border-white`}
              />
            </button>

            {isNotificationsOpen && (
              <div
                ref={notificationsMenuRef}
                className={`absolute top-full right-0 mt-3 w-[min(320px,calc(100vw-1.5rem))] rounded-2xl shadow-xl z-[150] overflow-hidden ${
                  isDarkMode ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    isDarkMode ? 'border-slate-700' : 'border-slate-300'
                  }`}
                >
                  <span
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Notifications
                  </span>
                  <button
                    className={`${TYPE.labelMd} px-2.5 py-1 rounded-md transition-all ${
                      isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Mark Read
                  </button>
                </div>

                <div
                  className={`overflow-y-auto max-h-[300px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ${
                    isDarkMode
                      ? '[&::-webkit-scrollbar-thumb]:bg-slate-700'
                      : '[&::-webkit-scrollbar-thumb]:bg-slate-200'
                  }`}
                >
                  {PLACEHOLDER_NOTIFICATIONS.map((notif) => (
                    <button
                      key={notif.id}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b last:border-b-0 ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'
                      } ${notif.unread ? (isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50') : ''}`}
                      onClick={onCloseMenus}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.bg} ${notif.color}`}
                      >
                        <notif.icon size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 pr-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`${TYPE.titleSm} ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                          >
                            {notif.title}
                          </span>
                          {notif.unread && <span className={`w-2 h-2 rounded-full ${theme.colorPrimary}`} />}
                        </div>
                        <p className={`${TYPE.bodySm} mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {notif.desc}
                        </p>
                        <span
                          className={`${TYPE.labelMicro} ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {notif.time}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className={`p-2 border-t text-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    className={`${TYPE.labelMd} py-2 px-4 rounded-lg w-full transition-colors ${theme.text} ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`h-6 w-[1px] mx-1 shrink-0 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />

          <div className="relative">
            <button
              ref={accountButtonRef}
              onClick={onToggleAccountMenu}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-white'
              }`}
            >
              <User size={20} strokeWidth={2} />
            </button>

            {isAccountMenuOpen && (
              <div
                ref={accountMenuRef}
                className={`absolute top-full right-0 mt-3 w-[min(260px,calc(100vw-1.5rem))] rounded-2xl shadow-xl z-[150] overflow-hidden ${
                  isDarkMode ? 'bg-slate-900' : 'bg-white'
                }`}
              >
                <div
                  className={`px-4 py-3 flex items-center justify-between border-b ${
                    isDarkMode ? 'border-slate-700' : 'border-slate-300'
                  }`}
                >
                  <span
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Account
                  </span>
                  <button
                    className={`${TYPE.labelMd} px-2.5 py-1 rounded-md transition-all ${
                      isDarkMode
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    Manage
                  </button>
                </div>

                <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden shrink-0">
                      <User size={20} className="text-sky-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                    <p className={`${TYPE.titleSm} truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {account?.displayName || 'Account'}
                    </p>
                    <p className={`${TYPE.bodySm} truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {account?.email || ''}
                    </p>
                    {account?.owner ? (
                      <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>Owner</p>
                    ) : null}
                    </div>
                  </div>
                </div>

                {account?.owner ? (
                  <div className={`border-b px-4 py-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <OwnerFacetSwitch
                      activeRole={account.role}
                      theme={theme}
                      onSwitch={(role) => {
                        onCloseMenus?.();
                        switchView(role);
                      }}
                    />
                  </div>
                ) : null}

                <div className="py-2">
                  {account?.role === 'teacher' && onOpenClassroom ? (
                    <button
                      type="button"
                      className={`w-full flex items-center px-4 py-2.5 ${TYPE.bodyMd} transition-colors ${
                        isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        onCloseMenus?.();
                        onOpenClassroom();
                      }}
                    >
                      <KeyRound
                        size={16}
                        className={`mr-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      />
                      Classroom sign-in
                    </button>
                  ) : null}
                  {[
                    { name: 'Your Profile', icon: User },
                    { name: 'Preferences', icon: Settings },
                    { name: 'Help & Support', icon: HelpCircle },
                  ].map((item) => (
                    <button
                      key={item.name}
                      className={`w-full flex items-center px-4 py-2.5 ${TYPE.bodyMd} transition-colors ${
                        isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={onCloseMenus}
                    >
                      <item.icon
                        size={16}
                        className={`mr-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      />
                      {item.name}
                    </button>
                  ))}
                </div>

                <div className={`p-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    className={`w-full flex items-center justify-center px-2 py-2 ${TYPE.labelLg} rounded-lg transition-colors text-rose-500 ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-rose-50'
                    }`}
                    onClick={() => {
                      onCloseMenus?.();
                      onSignOut?.();
                    }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
