import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apps } from '../../apps';
import { PRIMARY_KEYS, primaryPalettes, resolvePrimaryKey } from '../../shared/theme';

/** localStorage for now; same shape can persist to a user prefs DB later. */
const STORAGE_KEY = 'eduHub.appPrimaryColors';

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
 * Per-app primary color preferences.
 * Persists in localStorage until a user preferences API/DB is wired.
 */
export function AppThemePreferencesProvider({ children }) {
  const [appPrimaries, setAppPrimaries] = useState(readPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appPrimaries));
    } catch {
      /* ignore quota / private mode */
    }
  }, [appPrimaries]);

  const setAppPrimary = useCallback((appId, primaryKey) => {
    if (!PRIMARY_KEYS.includes(primaryKey)) return;
    setAppPrimaries((prev) => {
      if (prev[appId] === primaryKey) return prev;
      return { ...prev, [appId]: primaryKey };
    });
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
    }),
    [appPrimaries, setAppPrimary, getAppPrimary, getLauncherColor]
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
