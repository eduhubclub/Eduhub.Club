import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Users } from 'lucide-react';
import { defaultAppId, getApp } from '../apps';
import { useAuth } from '../data/auth/AuthContext';
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

const NAV = {
  admin: [
    { id: 'home', name: 'Home', icon: Home, type: 'link' },
    { id: 'people', name: 'People', icon: Users, type: 'link' },
  ],
  parent: [
    { id: 'home', name: 'Home', icon: Home, type: 'link' },
    { id: 'children', name: 'My children', icon: Users, type: 'link' },
  ],
};

const COPY = {
  admin: {
    appName: 'Admin',
    Home: {
      title: 'School home',
      description: 'A simple start for administrators. The teaching apps stay on teacher accounts.',
    },
    People: {
      title: 'People',
      description: 'Teachers, students, and families will live here.',
    },
  },
  parent: {
    appName: 'Parent',
    Home: {
      title: 'Family home',
      description: 'A simple start for families. Teaching tools stay with the teacher.',
    },
    'My children': {
      title: 'My children',
      description: 'Students linked to this account will show here.',
    },
  },
};

export function RoleShell({ role }) {
  const { session, signOut } = useAuth();
  const isDesktop = useIsDesktop();
  const { getAppPrimary, shellBackgroundId } = useAppThemePreferences();
  const { fontId } = useAccessibilityPreferences();
  const currentApp = getApp(defaultAppId);
  const navItems = NAV[role] || NAV.admin;
  const copy = COPY[role] || COPY.admin;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [sidebarSide, setSidebarSide] = useState('left');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountMenuRef = useRef(null);

  const theme = getTheme(getAppPrimary(currentApp.id), isDarkMode);
  const shellBackground = resolveShellBackgroundClass(shellBackgroundId, isDarkMode);
  const accessibleFont = ACCESSIBLE_FONTS.find((font) => font.id === fontId);
  const isLeft = sidebarSide === 'left';
  const page = copy[activeTab] || copy.Home;

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
      if (accountMenuRef.current?.contains(target) || accountButtonRef.current?.contains(target)) return;
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
          expandedItem={null}
          panelItem={null}
          onItemClick={(item) => {
            setActiveTab(item.name);
            setIsSettingsOpen(false);
            if (!isDesktop) setIsMobileNavOpen(false);
          }}
          onSubItemClick={() => {}}
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
            appName={copy.appName}
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
            ) : (
              <div className={APP_PAGE_SHELL}>
                <div className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-5 sm:p-6`}>
                  <PageHeader title={page.title} description={page.description} isDarkMode={isDarkMode} />
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
