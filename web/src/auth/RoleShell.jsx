import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Home, Users } from 'lucide-react';
import { apps, getApp } from '../apps';
import { districtHomeNav, districtSchoolNav } from '../apps/district/districtNav';
import { useAuth } from '../data/auth/AuthContext';
import { useClasses } from '../data/classes/ClassContext';
import { readDistrictOrg } from '../data/district/districtStorage';
import { useAccessibilityPreferences, ACCESSIBLE_FONTS } from '../data/settings/AccessibilityPreferencesContext';
import { useAppThemePreferences } from '../data/settings/AppThemePreferencesContext';
import { AppInfoProvider } from '../shared/AppInfo';
import { APP_PAGE_SHELL, APP_SCROLL_BOARD, SHELL_MAIN_PADDING } from '../shared/layout';
import { PageHeader } from '../shared/PageHeader';
import { SkipLink } from '../shared/SkipLink';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';
import { useIsDesktop } from '../shared/useMediaQuery';
import { Header } from '../shell/Header';
import { SettingsPage } from '../shell/SettingsPage';
import { Sidebar } from '../shell/Sidebar';

const PARENT_NAV = [
  { id: 'home', name: 'Home', icon: Home, type: 'link' },
  { id: 'children', name: 'My children', icon: Users, type: 'link' },
];

const PARENT_COPY = {
  appName: 'Parent',
  Home: {
    title: 'Family home',
    description: 'A simple start for families. Teaching tools stay with the teacher.',
  },
  'My children': {
    title: 'My children',
    description: 'Students linked to this account will show here.',
  },
};

const ALL_SCHOOLS_NAV = {
  id: 'all-schools',
  name: 'All schools',
  icon: ArrowLeft,
  type: 'link',
};

const BACK_TO_DISTRICT_NAV = {
  id: 'back-district',
  name: 'DistrictHub',
  icon: ArrowLeft,
  type: 'link',
};

/**
 * Admin: District dashboard → schools → school workspace (sidebar swap).
 * Parent stays a light shell until family tools land.
 */
export function RoleShell({ role }) {
  const { session, signOut } = useAuth();
  const { setClassVisibility } = useClasses();
  const isDesktop = useIsDesktop();
  const { getAppPrimary, shellBackgroundId } = useAppThemePreferences();
  const { fontId } = useAccessibilityPreferences();
  const isAdmin = role === 'admin';
  const districtApp = getApp('district');

  const [schoolId, setSchoolId] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [openedAppId, setOpenedAppId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [sidebarSide, setSidebarSide] = useState('left');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? districtApp.defaultView : 'Home');
  const [expandedItem, setExpandedItem] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountMenuRef = useRef(null);

  const openedApp = openedAppId && apps[openedAppId] ? apps[openedAppId] : null;
  const currentApp = openedApp || (isAdmin ? districtApp : getApp('hub'));
  const theme = getTheme(getAppPrimary(currentApp.id), isDarkMode);
  const shellBackground = resolveShellBackgroundClass(shellBackgroundId, isDarkMode);
  const accessibleFont = ACCESSIBLE_FONTS.find((font) => font.id === fontId);
  const isLeft = sidebarSide === 'left';
  const parentPage = PARENT_COPY[activeTab] || PARENT_COPY.Home;
  const inSchool = isAdmin && Boolean(schoolId) && !openedApp;
  const navItems = isAdmin
    ? openedApp
      ? [
          BACK_TO_DISTRICT_NAV,
          ...(openedApp.nav || []).filter(
            (item) => !item.hidden && !item.teacherOnly,
          ),
        ]
      : inSchool
        ? [ALL_SCHOOLS_NAV, ...districtSchoolNav]
        : districtHomeNav
    : PARENT_NAV;
  const appName = isAdmin
    ? openedApp
      ? openedApp.name
      : inSchool
        ? schoolName || 'School'
        : districtApp.name
    : PARENT_COPY.appName;
  const DistrictView = districtApp.View;
  const OpenedView = openedApp?.View;

  const openSchool = (id) => {
    const org = readDistrictOrg();
    const school = org.schools.find((row) => row.id === id);
    setOpenedAppId(null);
    setSchoolId(id);
    setSchoolName(school?.name || 'School');
    setActiveTab('Staff');
    setExpandedItem(null);
    setIsSettingsOpen(false);
  };

  const closeSchool = () => {
    setSchoolId(null);
    setSchoolName('');
    setActiveTab('Schools');
    setExpandedItem(null);
  };

  const returnToDistrictHub = () => {
    setOpenedAppId(null);
    setClassVisibility('all');
    setActiveTab('Apps');
    setExpandedItem(null);
    setIsSettingsOpen(false);
  };

  const openCatalogApp = (appId) => {
    if (!isAdmin || !appId) return;
    if (appId === 'district') {
      setOpenedAppId(null);
      setClassVisibility('all');
      setSchoolId(null);
      setSchoolName('');
      setActiveTab(districtApp.defaultView);
      setExpandedItem(null);
      setIsSettingsOpen(false);
      return;
    }
    const next = apps[appId];
    if (!next?.View) return;
    // Keep schoolId when opening from a school workspace (principals stay scoped).
    setOpenedAppId(appId);
    // Teacher tools: Demo Class + classes this admin owns — not other teachers' rooms.
    setClassVisibility('adminWorkspace');
    const nextTab = next.defaultView || next.nav?.[0]?.name || 'Home';
    setActiveTab(nextTab);
    const accordion = (next.nav || []).find(
      (item) =>
        item.type === 'accordion' &&
        (item.name === nextTab || item.subItems?.includes(nextTab)),
    );
    setExpandedItem(accordion?.id || null);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (!openedAppId) setClassVisibility('all');
  }, [openedAppId, setClassVisibility]);

  useEffect(() => {
    document.documentElement.dataset.eduScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  useEffect(() => {
    if (isDesktop) setIsMobileNavOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;
    function onPointerDown(event) {
      const target = event.target;
      if (accountMenuRef.current?.contains(target) || accountButtonRef.current?.contains(target)) {
        return;
      }
      setIsAccountMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isAccountMenuOpen]);

  const account = useMemo(
    () =>
      session
        ? {
            displayName: session.displayName,
            email: session.email,
            role: session.role,
            owner: session.owner,
          }
        : null,
    [session],
  );

  return (
    <AppInfoProvider app={currentApp} theme={theme} isDarkMode={isDarkMode}>
      <div
        className={`flex h-dvh overflow-hidden font-sans ${shellBackground} ${theme.colorOnBackground} ${
          isDarkMode ? '[color-scheme:dark]' : '[color-scheme:light]'
        } ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
        style={accessibleFont?.cssFamily ? { fontFamily: accessibleFont.cssFamily } : undefined}
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
          panelItem={null}
          onItemClick={(item) => {
            if (item.id === 'all-schools') {
              closeSchool();
              if (!isDesktop) setIsMobileNavOpen(false);
              return;
            }
            if (item.id === 'back-district') {
              returnToDistrictHub();
              if (!isDesktop) setIsMobileNavOpen(false);
              return;
            }
            if (item.type === 'accordion') {
              if (isDesktop && !isSidebarOpen) setIsSidebarOpen(true);
              const opening = expandedItem !== item.id;
              setExpandedItem(opening ? item.id : null);
              if (opening) {
                setActiveTab(item.name);
                setIsSettingsOpen(false);
              }
              return;
            }
            setActiveTab(item.name);
            setExpandedItem(null);
            setIsSettingsOpen(false);
            if (!isDesktop) setIsMobileNavOpen(false);
          }}
          onSubItemClick={(sub) => {
            setActiveTab(sub);
            const parent = navItems.find(
              (item) => item.type === 'accordion' && item.subItems?.includes(sub),
            );
            if (parent) setExpandedItem(parent.id);
            setIsSettingsOpen(false);
            if (!isDesktop) setIsMobileNavOpen(false);
          }}
          onShowTooltip={() => {}}
          onHideTooltip={() => {}}
          onToggleDarkMode={() => setIsDarkMode((value) => !value)}
          onFlipSidebar={() => setSidebarSide(isLeft ? 'right' : 'left')}
          onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
          onCloseMobileNav={() => setIsMobileNavOpen(false)}
          onNavScroll={() => {}}
          isSettingsOpen={isSettingsOpen}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            if (!isDesktop) setIsMobileNavOpen(false);
          }}
        />

        <div className="relative z-10 flex h-full min-w-0 flex-1 transform-gpu flex-col overflow-hidden">
          <Header
            appName={appName}
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
            appsButtonRef={accountButtonRef}
            appsMenuRef={accountMenuRef}
            isAppsMenuOpen={false}
            onToggleAppsMenu={() => {}}
            onSelectLauncherApp={() => {}}
            notificationsButtonRef={accountButtonRef}
            notificationsMenuRef={accountMenuRef}
            isNotificationsOpen={false}
            onToggleNotifications={() => {}}
            accountButtonRef={accountButtonRef}
            accountMenuRef={accountMenuRef}
            isAccountMenuOpen={isAccountMenuOpen}
            onToggleAccountMenu={() => setIsAccountMenuOpen((value) => !value)}
            onCloseMenus={() => setIsAccountMenuOpen(false)}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            account={account}
            onSignOut={signOut}
            showApps={false}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className={`relative z-0 min-h-0 flex-1 overflow-y-auto ${SHELL_MAIN_PADDING}`}
          >
            {isSettingsOpen ? (
              <SettingsPage theme={theme} isDarkMode={isDarkMode} currentApp={currentApp} />
            ) : isAdmin && openedApp && OpenedView ? (
              <OpenedView
                activeTab={activeTab}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
                theme={theme}
                isLeft={isLeft}
                isSidebarOpen={isSidebarOpen}
                isDesktop={isDesktop}
                onSetActiveTab={setActiveTab}
                schoolId={schoolId}
              />
            ) : isAdmin && DistrictView ? (
              <DistrictView
                activeTab={activeTab}
                schoolId={schoolId}
                onOpenSchool={openSchool}
                onCloseSchool={closeSchool}
                onOpenApp={openCatalogApp}
                isDarkMode={isDarkMode}
                theme={theme}
                isLeft={isLeft}
                isDesktop={isDesktop}
                onSetActiveTab={setActiveTab}
              />
            ) : (
              <div className={APP_PAGE_SHELL}>
                <div className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-5 sm:p-6`}>
                  <PageHeader
                    title={parentPage.title}
                    description={parentPage.description}
                    isDarkMode={isDarkMode}
                  />
                  <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                    Signed in as {session?.displayName}.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppInfoProvider>
  );
}
