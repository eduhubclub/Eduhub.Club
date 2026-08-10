import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ExternalLink,
  Folder,
  Layers,
  MonitorPlay,
  Presentation,
  Upload,
} from 'lucide-react';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { SHELL_MAIN_PADDING } from '../shared/layout';
import { useIsDesktop } from '../shared/useMediaQuery';
import { apps, defaultAppId, getApp } from '../apps';
import { useClasses } from '../data/classes/ClassContext';
import { useLessons } from '../data/lessons/LessonsContext';
import { normalizeLessonUrl } from '../data/lessons/normalizeLessonUrl';
import {
  MAX_DASHBOARD_WIDGETS,
  getDashboardWidget,
  isWidgetAvailable,
} from '../apps/dashboard/widgets/registry';
import {
  loadPinnedWidgets,
  savePinnedWidgets,
} from '../apps/dashboard/widgets/pinnedWidgets';
import { AddWidgetModal } from '../apps/dashboard/widgets/AddWidgetModal';
import { useAppThemePreferences } from '../data/settings/AppThemePreferencesContext';
import {
  ACCESSIBLE_FONTS,
  useAccessibilityPreferences,
} from '../data/settings/AccessibilityPreferencesContext';
import { CLASS_ICONS } from '../apps/classes/icons';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SecondaryPanel } from '../nav/SecondaryPanel';
import { ActionPopout } from '../nav/ActionPopout';
import { AddResourceModal, RESOURCE_ICONS } from '../nav/AddResourceModal';
import { SidebarTooltip } from '../nav/SidebarTooltip';
import { SettingsPage } from './SettingsPage';
import { ShellPaddingBand, ShellPaddingOverlay } from './ShellPaddingBand';
import { AppInfoProvider } from '../shared/AppInfo';
import { SkipLink } from '../shared/SkipLink';
import {
  readStoreSettings,
  STORE_SETTINGS_UPDATED_EVENT,
} from '../data/store/storeSettings';

const LESSON_ICONS = {
  ExternalLink,
  MonitorPlay,
  Presentation,
  Upload,
};

function cloneNav(nav) {
  return nav.map((item) => ({
    ...item,
    panelContent: item.panelContent ? [...item.panelContent] : undefined,
    subItems: item.subItems ? [...item.subItems] : undefined,
    actions: item.actions ? [...item.actions] : undefined,
  }));
}

/** Hide Store embeds unless the matching Connect toggle is on. */
function filterAppNav(appId, nav) {
  const settings = readStoreSettings();
  return nav.filter((item) => {
    if (item.id !== 'store') return true;
    if (appId === 'bank') return settings.connectBank;
    if (appId === 'behavior') return settings.connectBehavior;
    return true;
  });
}

function buildClassesPanelContent(classes) {
  return (classes || [])
    .filter((c) => !c.isArchived)
    .map((c) => ({
      id: c.id,
      label: c.name,
      desc:
        [c.grade, c.subject].filter(Boolean).join(' · ') ||
        `${c.studentList?.length || 0} students`,
      icon: CLASS_ICONS[c.icon] || Layers,
    }));
}

function buildLessonsPanelContent(lessons) {
  return (lessons || []).map((lesson) => ({
    id: lesson.id,
    label: lesson.label,
    desc: lesson.desc || 'Lesson resource',
    icon: LESSON_ICONS[lesson.icon] || ExternalLink,
    link: lesson.link,
  }));
}

export function AppShell() {
  const isDesktop = useIsDesktop();
  const { classes, selectedClass, selectClass } = useClasses();
  const { lessonsByClassId, getLessons, addLesson, removeLesson } = useLessons();
  const { getAppPrimary, shellBackgroundId } = useAppThemePreferences();
  const { fontId } = useAccessibilityPreferences();
  const [currentAppId, setCurrentAppId] = useState(defaultAppId);
  const currentApp = getApp(currentAppId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [sidebarSide, setSidebarSide] = useState('left');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(currentApp.defaultView);
  const [expandedItem, setExpandedItem] = useState(null);
  const [popoutItem, setPopoutItem] = useState(null);
  const [panelItem, setPanelItem] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelSearchQuery, setPanelSearchQuery] = useState('');

  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveSpaceDebug, setLiveSpaceDebug] = useState(false);
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState(loadPinnedWidgets);
  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('Folder');

  const [popoutRect, setPopoutRect] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState({
    visible: false,
    text: '',
    top: 0,
    left: 0,
    right: 0,
  });

  const [navItems, setNavItems] = useState(() => cloneNav(currentApp.nav));
  const [shellFooterActive, setShellFooterActive] = useState(false);

  const handleShellFooterActiveChange = useCallback((active) => {
    setShellFooterActive(Boolean(active));
  }, []);

  const theme = getTheme(getAppPrimary(currentApp.id), isDarkMode);
  const shellBackground = resolveShellBackgroundClass(shellBackgroundId, isDarkMode);
  const accessibleFont = ACCESSIBLE_FONTS.find((f) => f.id === fontId);
  const isLeft = sidebarSide === 'left';

  const popoutRef = useRef(null);
  const searchRef = useRef(null);
  const appsMenuRef = useRef(null);
  const appsButtonRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isDesktop) setIsMobileNavOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    setShellFooterActive(false);
  }, [currentAppId]);

  useEffect(() => {
    if (currentAppId !== 'design' || activeTab !== 'Live View') {
      setLiveSpaceDebug(false);
    }
  }, [currentAppId, activeTab]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.eduScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  useEffect(() => {
    const app = getApp(currentAppId);
    const classLessons = getLessons(selectedClass?.id);
    setNavItems(
      filterAppNav(currentAppId, cloneNav(app.nav)).map((item) => {
        if (item.panelSource === 'classes') {
          return { ...item, panelContent: buildClassesPanelContent(classes) };
        }
        if (item.panelSource === 'lessons') {
          return {
            ...item,
            panelTitle: selectedClass?.name
              ? `${selectedClass.name} Resources`
              : 'Lessons',
            panelContent: buildLessonsPanelContent(classLessons),
          };
        }
        return item;
      })
    );
    setActiveTab(app.defaultView);
    setExpandedItem(null);
    setPanelItem(null);
    setPopoutItem(null);
    setPanelSearchQuery('');
    setIsMobileNavOpen(false);
    setActiveWidgetId(null);
    setIsAddWidgetModalOpen(false);
    // classes/lessons snapshot at switch time; live updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAppId]);

  // Refresh Bank/Behavior Store nav when Store connection toggles change.
  useEffect(() => {
    const refresh = () => {
      if (currentAppId !== 'bank' && currentAppId !== 'behavior') return;
      const app = getApp(currentAppId);
      setNavItems((prev) => {
        const panels = Object.fromEntries(
          prev
            .filter((i) => i.panelSource)
            .map((i) => [i.id, i]),
        );
        return filterAppNav(currentAppId, cloneNav(app.nav)).map((item) => {
          if (item.panelSource && panels[item.id]) {
            return {
              ...item,
              panelContent: panels[item.id].panelContent,
              panelTitle: panels[item.id].panelTitle,
            };
          }
          return item;
        });
      });
      setActiveTab((tab) => {
        if (tab !== 'Store') return tab;
        const settings = readStoreSettings();
        if (currentAppId === 'bank' && !settings.connectBank) {
          return app.defaultView;
        }
        if (currentAppId === 'behavior' && !settings.connectBehavior) {
          return app.defaultView;
        }
        return tab;
      });
    };
    window.addEventListener(STORE_SETTINGS_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(STORE_SETTINGS_UPDATED_EVENT, refresh);
  }, [currentAppId]);

  useEffect(() => {
    savePinnedWidgets(pinnedWidgetIds);
  }, [pinnedWidgetIds]);

  // Keep `panelSource: 'classes'` panels in sync with the shared class store.
  useEffect(() => {
    setNavItems((prev) => {
      if (!prev.some((item) => item.panelSource === 'classes')) return prev;
      const content = buildClassesPanelContent(classes);
      return prev.map((item) =>
        item.panelSource === 'classes' ? { ...item, panelContent: content } : item
      );
    });
  }, [classes]);

  // Keep Lessons panel content + title in sync with the selected class.
  useEffect(() => {
    setNavItems((prev) => {
      if (!prev.some((item) => item.panelSource === 'lessons')) return prev;
      const content = buildLessonsPanelContent(getLessons(selectedClass?.id));
      const title = selectedClass?.name
        ? `${selectedClass.name} Resources`
        : 'Lessons';
      return prev.map((item) =>
        item.panelSource === 'lessons'
          ? { ...item, panelTitle: title, panelContent: content }
          : item
      );
    });
  }, [selectedClass, getLessons, lessonsByClassId]);

  const handleAddResource = () => {
    if (!newItemName.trim() || !panelItem) return;

    const selectedIconObj = RESOURCE_ICONS.find((i) => i.name === newItemIcon);
    const IconComponent = selectedIconObj ? selectedIconObj.icon : Folder;

    const newResource = {
      label: newItemName,
      desc: newItemDesc.trim() || 'Access files',
      icon: IconComponent,
    };

    setNavItems((prev) =>
      prev.map((item) => {
        if (item.id === panelItem && item.panelContent) {
          return { ...item, panelContent: [...item.panelContent, newResource] };
        }
        return item;
      })
    );

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemIcon('Folder');
  };

  const handleNavBadge = useCallback((navId, badge) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === navId ? { ...item, badge } : item))
    );
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoutRef.current && !popoutRef.current.contains(event.target)) {
        if (!event.target.closest('[data-popout-trigger]')) {
          setPopoutItem(null);
        }
      }
      if (appsMenuRef.current && !appsMenuRef.current.contains(event.target)) {
        if (appsButtonRef.current && !appsButtonRef.current.contains(event.target)) {
          setIsAppsMenuOpen(false);
        }
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        if (notificationsButtonRef.current && !notificationsButtonRef.current.contains(event.target)) {
          setIsNotificationsOpen(false);
        }
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        if (accountButtonRef.current && !accountButtonRef.current.contains(event.target)) {
          setIsAccountMenuOpen(false);
        }
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && !searchQuery) {
        setIsSearchExpanded(false);
      }
      if (
        !isAddModalOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setPanelItem(null);
        setPanelSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, [searchQuery, isAddModalOpen]);

  const hideTooltip = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipInfo((prev) => ({ ...prev, visible: false }));
  };

  const showTooltip = (e, text) => {
    if (!isDesktop || isSidebarOpen) return;
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const top = rect.top + rect.height / 2;
    const left = isLeft ? rect.right + 16 : undefined;
    const right = !isLeft ? window.innerWidth - rect.left + 16 : undefined;

    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipInfo({ visible: true, text, top, left, right });
    }, 400);
  };

  const handleItemClick = (item, e) => {
    hideTooltip();
    setIsSettingsOpen(false);
    if (item.type === 'link') {
      setActiveTab(item.name);
      setExpandedItem(null);
      setPanelItem(null);
      setPopoutItem(null);
      setActiveWidgetId(null);
      if (!isDesktop) setIsMobileNavOpen(false);
    } else if (item.type === 'accordion') {
      if (isDesktop && !isSidebarOpen) setIsSidebarOpen(true);
      setExpandedItem(expandedItem !== item.id ? item.id : null);
      setPanelItem(null);
      setPopoutItem(null);
      setActiveWidgetId(null);
    } else if (item.type === 'popout') {
      if (popoutItem === item.id) {
        setPopoutItem(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setPopoutItem(item.id);
        setPopoutRect({
          top: rect.top + rect.height / 2,
          left: isLeft ? rect.right + 16 : undefined,
          right: !isLeft ? window.innerWidth - rect.left + 16 : undefined,
        });
      }
    } else if (item.type === 'panel') {
      const isOpening = panelItem !== item.id;
      setPanelItem(isOpening ? item.id : null);
      setExpandedItem(null);
      setPanelSearchQuery('');
      setPopoutItem(null);
      // Lessons panel needs a class context — pick the first class if none selected.
      if (isOpening && item.panelSource === 'lessons' && !selectedClass) {
        const first = classes.find((c) => !c.isArchived);
        if (first) selectClass(first.id);
      }
      // Design Patterns — open on App Shell so the live shell padding is visible immediately.
      if (isOpening && item.panelSource === 'design-patterns') {
        setActiveTab('App Shell');
        setActiveWidgetId(null);
      }
      // Design Cards — open on Card Types overview (expandable accordion in the panel).
      if (isOpening && item.panelSource === 'design-cards') {
        setActiveTab('Card Types');
        setActiveWidgetId(null);
      }
      // Arcade Classic — land on the Classic board.
      if (isOpening && item.panelSource === 'arcade-classic') {
        setActiveTab('Classic');
        setActiveWidgetId(null);
      }
      // Arcade Cards — land on Card Games when opening the panel.
      if (isOpening && item.panelSource === 'arcade-cards') {
        setActiveTab('Card Games');
        setActiveWidgetId(null);
      }
      // Arcade Platformers — land on the Platformers board.
      if (isOpening && item.panelSource === 'arcade-platformers') {
        setActiveTab('Platformers');
        setActiveWidgetId(null);
      }
      if (!isDesktop) setIsMobileNavOpen(false);
    }
  };

  const closeHeaderMenus = () => {
    setIsAppsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsAccountMenuOpen(false);
  };

  const panelNavItem = navItems.find((i) => i.id === panelItem);
  const popoutNavItem = navItems.find((i) => i.id === popoutItem);
  const hasPanelNav = navItems.some((i) => i.type === 'panel');
  const lessonsTargetClass =
    selectedClass || classes.find((c) => !c.isArchived) || null;
  const isDashboardApp = currentAppId === 'dashboard';
  /** When annotate footer is open, padding lives on the content pane so the footer can go edge-to-edge. */
  const mainEdgePadding = shellFooterActive ? '' : SHELL_MAIN_PADDING;
  const contentEdgePadding = shellFooterActive ? 'p-4 lg:p-6' : '';
  const showAppShellPattern =
    !isSettingsOpen && currentAppId === 'design' && activeTab === 'App Shell';
  const showShellPaddingOverlay =
    !isSettingsOpen &&
    currentAppId === 'design' &&
    activeTab === 'Live View' &&
    liveSpaceDebug;
  const showShellPaddingViz = showAppShellPattern;
  /** Fill-height tools — main locks; scrollable pages use overflow on <main> (edge scrollbar). */
  const lockMainScroll =
    showAppShellPattern ||
    isDashboardApp ||
    currentAppId === 'noisemeter' ||
    currentAppId === 'arcade' ||
    currentAppId === 'games' ||
    (currentAppId === 'calendar' &&
      activeTab !== 'Create Calendar' &&
      activeTab !== 'Saved Calendar' &&
      activeTab !== 'Countdown') ||
    (currentAppId === 'brand' && activeTab === 'Color Test') ||
    (currentAppId === 'timer' &&
      activeTab !== 'Local Time' &&
      activeTab !== 'World Clock') ||
    (currentAppId === 'bank' && activeTab === 'Learning') ||
    currentAppId === 'mathTools' ||
    activeTab === 'Static board' ||
    activeTab === 'Static medium' ||
    activeTab === 'Static small' ||
    activeTab === 'Internal scroll' ||
    activeTab === 'Pick A Number' ||
    activeTab === 'Coin Toss' ||
    activeTab === 'Pick A Card' ||
    activeTab === 'Random Tiebreaker';
  const pinnedWidgets = useMemo(
    () =>
      pinnedWidgetIds
        .map((id) => getDashboardWidget(id))
        .filter((w) => w?.available && w?.Component),
    [pinnedWidgetIds]
  );
  const activeWidget = getDashboardWidget(activeWidgetId);

  const pinWidget = (id) => {
    if (!isWidgetAvailable(id)) return;
    setPinnedWidgetIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_DASHBOARD_WIDGETS) return prev;
      return [...prev, id];
    });
  };

  const unpinWidget = (id) => {
    setPinnedWidgetIds((prev) => prev.filter((x) => x !== id));
    setActiveWidgetId((cur) => (cur === id ? null : cur));
  };

  const handleAddLessonLink = (url) => {
    const target = lessonsTargetClass;
    if (!target || !url?.trim()) return;
    if (!selectedClass || selectedClass.id !== target.id) {
      selectClass(target.id);
    }

    const normalized = normalizeLessonUrl(url);
    if (!normalized.link) return;

    const list = getLessons(target.id);
    const baseLabel = normalized.label || 'Link';
    const duplicateCount = list.filter((item) =>
      item.label === baseLabel || item.label.startsWith(`${baseLabel} `)
    ).length;
    const label =
      duplicateCount === 0 ? baseLabel : `${baseLabel} ${duplicateCount + 1}`;

    addLesson(target.id, {
      id: `lesson-${Date.now()}`,
      label,
      desc: normalized.desc,
      icon: normalized.icon,
      link: normalized.link,
    });
    setActiveTab(label);
  };

  const handleUploadLessonFile = (file) => {
    const target = lessonsTargetClass;
    if (!target || !file) return;
    if (!selectedClass || selectedClass.id !== target.id) {
      selectClass(target.id);
    }
    const fileUrl = URL.createObjectURL(file);
    let typeHash = '#other';
    if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      typeHash = '#pdf';
    } else if (file.type.startsWith('image/')) {
      typeHash = '#img';
    }
    addLesson(target.id, {
      id: `lesson-${Date.now()}`,
      label: file.name,
      desc: 'Local File',
      icon: 'Upload',
      link: fileUrl + typeHash,
    });
    setActiveTab(file.name);
  };

  return (
    <AppInfoProvider app={currentApp} theme={theme} isDarkMode={isDarkMode}>
    <div
      className={`flex h-dvh overflow-hidden font-sans transition-all duration-300 ${shellBackground} ${theme.colorOnBackground} ${
        isDarkMode ? '[color-scheme:dark]' : '[color-scheme:light]'
      } ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      style={
        accessibleFont?.cssFamily ? { fontFamily: accessibleFont.cssFamily } : undefined
      }
    >
      <SkipLink />
      <Sidebar
        sidebarRef={sidebarRef}
        navItems={navItems}
        isSidebarOpen={isSidebarOpen}
        isMobileNavOpen={isMobileNavOpen}
        isDesktop={isDesktop}
        isLeft={isLeft}
        isDarkMode={isDarkMode}
        theme={theme}
        activeTab={isSettingsOpen ? null : activeTab}
        expandedItem={expandedItem}
        panelItem={isSettingsOpen ? null : panelItem}
        onItemClick={handleItemClick}
        onSubItemClick={(sub) => {
          setActiveTab(sub);
          if (!isDesktop) setIsMobileNavOpen(false);
        }}
        onShowTooltip={showTooltip}
        onHideTooltip={hideTooltip}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onFlipSidebar={() => {
          hideTooltip();
          setSidebarSide(isLeft ? 'right' : 'left');
          setPanelItem(null);
        }}
        onToggleSidebar={() => {
          hideTooltip();
          setIsSidebarOpen(!isSidebarOpen);
        }}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
        onNavScroll={() => {
          hideTooltip();
          setPopoutItem(null);
        }}
        isSettingsOpen={isSettingsOpen}
        onOpenSettings={() => {
          hideTooltip();
          setIsSettingsOpen(true);
          setPanelItem(null);
          setPopoutItem(null);
          setExpandedItem(null);
          setActiveWidgetId(null);
          if (!isDesktop) setIsMobileNavOpen(false);
        }}
        showTeachingWidgets={isDashboardApp}
        pinnedWidgets={pinnedWidgets}
        activeWidgetId={activeWidgetId}
        onPinnedWidgetClick={(widget) => {
          hideTooltip();
          setActiveWidgetId(widget.id);
          setPanelItem(null);
          setPopoutItem(null);
          setExpandedItem(null);
          setIsSettingsOpen(false);
          if (!isDesktop) setIsMobileNavOpen(false);
        }}
        onOpenAddWidget={() => {
          hideTooltip();
          setIsAddWidgetModalOpen(true);
        }}
      />

      {hasPanelNav && (
        <SecondaryPanel
          panelRef={panelRef}
          panelItem={panelItem}
          panelNavItem={panelNavItem}
          isLeft={isLeft}
          isDarkMode={isDarkMode}
          theme={theme}
          activeTab={activeTab}
          activePanelId={
            panelNavItem?.panelSource === 'classes' ? selectedClass?.id ?? null : null
          }
          panelSearchQuery={panelSearchQuery}
          onPanelSearchChange={setPanelSearchQuery}
          onClose={() => {
            setPanelItem(null);
            setPanelSearchQuery('');
          }}
          hideAdd={
            panelNavItem?.panelSource === 'classes' ||
            panelNavItem?.panelSource === 'lessons' ||
            panelNavItem?.panelSource === 'design-patterns' ||
            panelNavItem?.panelSource === 'design-cards' ||
            panelNavItem?.panelSource === 'arcade-classic' ||
            panelNavItem?.panelSource === 'arcade-cards' ||
            panelNavItem?.panelSource === 'arcade-platformers'
          }
          onAddClick={() => setIsAddModalOpen(true)}
          onSelectItem={(sub) => {
            if (panelNavItem?.panelSource === 'classes') {
              selectClass(sub.id);
              if (!isDesktop) {
                setPanelItem(null);
                setPanelSearchQuery('');
              }
              return;
            }
            if (panelNavItem?.panelSource === 'lessons') {
              setActiveTab(sub.label);
              setActiveWidgetId(null);
              if (!isDesktop) {
                setPanelItem(null);
                setPanelSearchQuery('');
              }
              return;
            }
            if (
              panelNavItem?.panelSource === 'design-patterns' ||
              panelNavItem?.panelSource === 'design-cards' ||
              panelNavItem?.panelSource === 'arcade-classic' ||
              panelNavItem?.panelSource === 'arcade-cards' ||
              panelNavItem?.panelSource === 'arcade-platformers'
            ) {
              setActiveTab(sub.label);
              setActiveWidgetId(null);
              if (!isDesktop) {
                setPanelItem(null);
                setPanelSearchQuery('');
              }
              return;
            }
            setActiveTab(`Resource: ${sub.label}`);
            setActiveWidgetId(null);
          }}
          isDesktop={isDesktop}
          lessonsEmptyHint={
            panelNavItem?.panelSource === 'lessons' && !lessonsTargetClass
              ? 'Create a class to add lesson resources'
              : panelNavItem?.panelSource === 'lessons'
                ? 'No resources yet'
                : null
          }
          onAddLessonLink={
            panelNavItem?.panelSource === 'lessons' ? handleAddLessonLink : null
          }
          onUploadLessonFile={
            panelNavItem?.panelSource === 'lessons' ? handleUploadLessonFile : null
          }
          onDeleteLesson={
            panelNavItem?.panelSource === 'lessons' && lessonsTargetClass
              ? (sub) => {
                  removeLesson(lessonsTargetClass.id, sub.id);
                  if (
                    activeTab === sub.label ||
                    activeTab === `Resource: ${sub.label}`
                  ) {
                    setActiveTab('Whiteboard');
                  }
                }
              : null
          }
        />
      )}

      {/* transform-gpu: fixed FABs/docks position within this column, not the viewport (keeps them out of the sidebar). */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 overflow-hidden transform-gpu">
        <Header
          appName={currentApp.name}
          isDarkMode={isDarkMode}
          theme={theme}
          searchRef={searchRef}
          isSearchExpanded={isSearchExpanded}
          searchQuery={searchQuery}
          onExpandSearch={() => setIsSearchExpanded(true)}
          onSearchChange={setSearchQuery}
          onClearOrCollapseSearch={() => {
            if (searchQuery) setSearchQuery('');
            else setIsSearchExpanded(false);
          }}
          appsButtonRef={appsButtonRef}
          appsMenuRef={appsMenuRef}
          isAppsMenuOpen={isAppsMenuOpen}
          onToggleAppsMenu={() => {
            setIsAppsMenuOpen(!isAppsMenuOpen);
            setIsNotificationsOpen(false);
            setIsAccountMenuOpen(false);
            setPopoutItem(null);
            hideTooltip();
          }}
          onSelectLauncherApp={(app) => {
            if (apps[app.id]) setCurrentAppId(app.id);
            setIsSettingsOpen(false);
            setIsAppsMenuOpen(false);
          }}
          notificationsButtonRef={notificationsButtonRef}
          notificationsMenuRef={notificationsMenuRef}
          isNotificationsOpen={isNotificationsOpen}
          onToggleNotifications={() => {
            setIsNotificationsOpen(!isNotificationsOpen);
            setIsAppsMenuOpen(false);
            setIsAccountMenuOpen(false);
            setPopoutItem(null);
            hideTooltip();
          }}
          accountButtonRef={accountButtonRef}
          accountMenuRef={accountMenuRef}
          isAccountMenuOpen={isAccountMenuOpen}
          onToggleAccountMenu={() => {
            setIsAccountMenuOpen(!isAccountMenuOpen);
            setIsAppsMenuOpen(false);
            setIsNotificationsOpen(false);
            setPopoutItem(null);
            hideTooltip();
          }}
          onCloseMenus={closeHeaderMenus}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* z-0 traps app stacking (e.g. whiteboard canvas z-60) so Header popouts stay clickable.
            Regular page scroll lives on <main> so the scrollbar sits on the shell content edge. */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className={`flex-1 bg-transparent relative z-0 flex flex-col min-h-0 outline-none ${
            lockMainScroll ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'
          } ${showShellPaddingViz ? '' : mainEdgePadding}`}
        >
          {showShellPaddingOverlay ? <ShellPaddingOverlay /> : null}
          {showShellPaddingViz ? (
            <>
              <ShellPaddingBand edge="top" />
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <ShellPaddingBand edge="side" />
                <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
                  {currentApp.View ? (
                    <div className="flex-1 min-h-0 h-full">
                      <currentApp.View
                        activeTab={activeTab}
                        isDarkMode={isDarkMode}
                        onDarkModeChange={setIsDarkMode}
                        theme={theme}
                        isLeft={isLeft}
                        isSidebarOpen={isSidebarOpen}
                        isDesktop={isDesktop}
                        isPanelOpen={Boolean(panelItem)}
                        onSetActiveTab={setActiveTab}
                        onLiveSpaceDebugChange={setLiveSpaceDebug}
                        onOpenApp={(appId) => {
                          if (apps[appId]) {
                            setCurrentAppId(appId);
                            setIsSettingsOpen(false);
                            setPanelItem(null);
                            setPopoutItem(null);
                          }
                        }}
                        isAppAvailable={(appId) => Boolean(apps[appId])}
                        onNavBadge={handleNavBadge}
                        onShellFooterActiveChange={handleShellFooterActiveChange}
                      />
                    </div>
                  ) : null}
                </div>
                <ShellPaddingBand edge="side" />
              </div>
              <ShellPaddingBand edge="top" />
            </>
          ) : isSettingsOpen ? (
            <SettingsPage
              theme={theme}
              isDarkMode={isDarkMode}
              currentApp={currentApp}
              pinnedWidgetIds={isDashboardApp ? pinnedWidgetIds : []}
              onPinWidget={pinWidget}
              onUnpinWidget={unpinWidget}
            />
          ) : (
            <>
              <div
                className={
                  lockMainScroll
                    ? `flex flex-1 min-h-0 flex-col overflow-hidden min-w-0 ${contentEdgePadding}`
                    : `min-w-0 ${contentEdgePadding}`
                }
              >
                {/* Keep Dashboard mounted under widgets so whiteboard drawings survive. */}
                {currentApp.View ? (
                  <div
                    className={
                      isDashboardApp && activeWidget?.Component
                        ? 'invisible absolute inset-0 pointer-events-none overflow-hidden'
                        : lockMainScroll
                          ? 'flex-1 min-h-0 h-full overflow-hidden'
                          : ''
                    }
                    aria-hidden={
                      isDashboardApp && activeWidget?.Component ? true : undefined
                    }
                  >
                    <currentApp.View
                      activeTab={activeTab}
                      isDarkMode={isDarkMode}
                      onDarkModeChange={setIsDarkMode}
                      theme={theme}
                      isLeft={isLeft}
                      isSidebarOpen={isSidebarOpen}
                      isDesktop={isDesktop}
                      isPanelOpen={Boolean(panelItem)}
                      onSetActiveTab={setActiveTab}
                      onLiveSpaceDebugChange={setLiveSpaceDebug}
                      onOpenApp={(appId) => {
                        if (apps[appId]) {
                          setCurrentAppId(appId);
                          setIsSettingsOpen(false);
                          setPanelItem(null);
                          setPopoutItem(null);
                        }
                      }}
                      isAppAvailable={(appId) => Boolean(apps[appId])}
                      onNavBadge={handleNavBadge}
                      onShellFooterActiveChange={handleShellFooterActiveChange}
                    />
                  </div>
                ) : (
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {activeTab}
                  </p>
                )}
                {isDashboardApp && activeWidget?.Component ? (
                  <div className="flex-1 min-h-0 h-full overflow-hidden">
                    <activeWidget.Component
                      isDarkMode={isDarkMode}
                      theme={theme}
                      isLeft={isLeft}
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </main>
        {!showShellPaddingViz && !isSettingsOpen ? (
          <>
            <div
              id="edu-shell-overlays"
              className="pointer-events-none absolute inset-0 z-[110] overflow-visible"
            />
            <div
              id="edu-main-footer"
              className={`relative shrink-0 overflow-visible ${
                shellFooterActive ? 'z-[120]' : ''
              }`}
            />
          </>
        ) : null}
      </div>

      <SidebarTooltip tooltipInfo={tooltipInfo} theme={theme} isLeft={isLeft} />

      {popoutItem && (
        <ActionPopout
          popoutRef={popoutRef}
          item={popoutNavItem}
          popoutRect={popoutRect}
          isDarkMode={isDarkMode}
          theme={theme}
          onAction={(action) => console.log(`${action.name} clicked`)}
          onClose={() => setPopoutItem(null)}
        />
      )}

      <AddResourceModal
        isOpen={isAddModalOpen}
        isDarkMode={isDarkMode}
        theme={theme}
        newItemName={newItemName}
        newItemDesc={newItemDesc}
        newItemIcon={newItemIcon}
        onNameChange={setNewItemName}
        onDescChange={setNewItemDesc}
        onIconChange={setNewItemIcon}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddResource}
      />

      {isDashboardApp ? (
        <AddWidgetModal
          isOpen={isAddWidgetModalOpen}
          onClose={() => setIsAddWidgetModalOpen(false)}
          theme={theme}
          isDarkMode={isDarkMode}
          pinnedIds={pinnedWidgetIds}
          onPin={pinWidget}
          onUnpin={unpinWidget}
        />
      ) : null}
    </div>
    </AppInfoProvider>
  );
}
