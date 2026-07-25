import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apps } from '../../apps';
import {
  PRIMARY_KEYS,
  primaryPalettes,
  resolvePrimaryKey,
  SHELL_BACKGROUND_IDS,
} from '../../shared/theme';

/** localStorage for now; same shape can persist to a user prefs DB later. */
const STORAGE_KEY = 'eduHub.appPrimaryColors';
const SHELL_BG_STORAGE_KEY = 'eduHub.shellBackground';

function buildDefaults() {
  const defaults = {};
  for (const app of Object.values(apps)) {
    defaults[app.id] = resolvePrimaryKey(app.themeKey);
  }
  return defaults;
}

function readPreferences() {
  const defaults = buildDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;
    const next = { ...defaults };
    for (const appId of Object.keys(defaults)) {
      const value = parsed[appId];
      if (typeof value === 'string' && PRIMARY_KEYS.includes(value)) {
        next[appId] = value;
      }
    }
    return next;
  } catch {
    return defaults;
  }
}

function readShellBackground() {
  try {
    const raw = localStorage.getItem(SHELL_BG_STORAGE_KEY);
    if (raw && SHELL_BACKGROUND_IDS.includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'gray';
}

/**
 * Icon/tile background for launcher entries.
 * Registered apps use the user's primary preference; placeholders keep static colors.
 */
export function resolveLauncherAppColor(app, getAppPrimary) {
  if (app?.id && apps[app.id] && typeof getAppPrimary === 'function') {
    const key = getAppPrimary(app.id);
    return primaryPalettes[key]?.colorPrimary || app.color;
  }
  return app?.color || 'bg-slate-500';
}

const AppThemePreferencesContext = createContext(null);

/**
 * Per-app primary color preferences + global shell background.
 * Persists in localStorage until a user preferences API/DB is wired.
 */
export function AppThemePreferencesProvider({ children }) {
  const [appPrimaries, setAppPrimaries] = useState(readPreferences);
  const [shellBackgroundId, setShellBackgroundIdState] = useState(readShellBackground);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appPrimaries));
    } catch {
      /* ignore quota / private mode */
    }
  }, [appPrimaries]);

  useEffect(() => {
    try {
      localStorage.setItem(SHELL_BG_STORAGE_KEY, shellBackgroundId);
    } catch {
      /* ignore quota / private mode */
    }
  }, [shellBackgroundId]);

  const setAppPrimary = useCallback((appId, primaryKey) => {
    if (!PRIMARY_KEYS.includes(primaryKey)) return;
    setAppPrimaries((prev) => {
      if (prev[appId] === primaryKey) return prev;
      return { ...prev, [appId]: primaryKey };
    });
  }, []);

  const setShellBackgroundId = useCallback((id) => {
    if (!SHELL_BACKGROUND_IDS.includes(id)) return;
    setShellBackgroundIdState(id);
  }, []);

  const getAppPrimary = useCallback(
    (appId) => {
      const defaults = buildDefaults();
      return appPrimaries[appId] || defaults[appId] || 'Blue';
    },
    [appPrimaries]
  );

  const getLauncherColor = useCallback(
    (app) => resolveLauncherAppColor(app, getAppPrimary),
    [getAppPrimary]
  );

  const value = useMemo(
    () => ({
      appPrimaries,
      setAppPrimary,
      getAppPrimary,
      getLauncherColor,
      defaults: buildDefaults(),
      shellBackgroundId,
      setShellBackgroundId,
    }),
    [
      appPrimaries,
      setAppPrimary,
      getAppPrimary,
      getLauncherColor,
      shellBackgroundId,
      setShellBackgroundId,
    ]
  );

  return (
    <AppThemePreferencesContext.Provider value={value}>
      {children}
    </AppThemePreferencesContext.Provider>
  );
}

export function useAppThemePreferences() {
  const ctx = useContext(AppThemePreferencesContext);
  if (!ctx) {
    throw new Error('useAppThemePreferences must be used within AppThemePreferencesProvider');
  }
  return ctx;
}
