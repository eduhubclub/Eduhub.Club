import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'eduHub.accessibility';

/** Readable font options — Google Fonts loaded when selected (except Default). */
export const ACCESSIBLE_FONTS = [
  {
    id: 'default',
    label: 'Default',
    description: 'System UI sans',
    cssFamily: '',
  },
  {
    id: 'atkinson',
    label: 'Atkinson',
    description: 'Atkinson Hyperlegible',
    cssFamily: '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif',
    googleFamily: 'Atkinson+Hyperlegible:wght@400;700',
  },
  {
    id: 'lexend',
    label: 'Lexend',
    description: 'Lexend — readable, variable spacing',
    cssFamily: '"Lexend", ui-sans-serif, system-ui, sans-serif',
    googleFamily: 'Lexend:wght@400;600;700',
  },
];

export const TEXT_SIZES = [
  { id: 'default', label: 'Default', rootPercent: 100 },
  { id: 'large', label: 'Large', rootPercent: 112.5 },
  { id: 'xlarge', label: 'Extra large', rootPercent: 125 },
];

const DEFAULT_PREFS = {
  fontId: 'default',
  textSizeId: 'default',
  reduceMotion: false,
  highContrast: false,
  largeControls: false,
  underlineLinks: false,
};

const GOOGLE_FONTS_LINK_ID = 'edu-hub-accessible-fonts';

function ensureGoogleFont(googleFamily) {
  if (!googleFamily || typeof document === 'undefined') return;
  let link = document.getElementById(GOOGLE_FONTS_LINK_ID);
  if (!link) {
    link = document.createElement('link');
    link.id = GOOGLE_FONTS_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  const families = ACCESSIBLE_FONTS.map((f) => f.googleFamily).filter(Boolean);
  link.href = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join('&')}&display=swap`;
}

function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      fontId: ACCESSIBLE_FONTS.some((f) => f.id === parsed?.fontId)
        ? parsed.fontId
        : DEFAULT_PREFS.fontId,
      textSizeId: TEXT_SIZES.some((s) => s.id === parsed?.textSizeId)
        ? parsed.textSizeId
        : DEFAULT_PREFS.textSizeId,
      reduceMotion: Boolean(parsed?.reduceMotion),
      highContrast: Boolean(parsed?.highContrast),
      largeControls: Boolean(parsed?.largeControls),
      underlineLinks: Boolean(parsed?.underlineLinks),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function setFlag(root, key, on) {
  if (on) root.dataset[key] = 'true';
  else delete root.dataset[key];
}

function applyToDocument(prefs) {
  if (typeof document === 'undefined') return;
  const font = ACCESSIBLE_FONTS.find((f) => f.id === prefs.fontId) || ACCESSIBLE_FONTS[0];
  const size = TEXT_SIZES.find((s) => s.id === prefs.textSizeId) || TEXT_SIZES[0];

  if (font.googleFamily) ensureGoogleFont(font.googleFamily);
  else ensureGoogleFont(ACCESSIBLE_FONTS.find((f) => f.googleFamily)?.googleFamily);

  const root = document.documentElement;
  root.style.fontSize = `${size.rootPercent}%`;
  if (font.cssFamily) {
    root.style.setProperty('--edu-font-family', font.cssFamily);
    root.dataset.eduFont = font.id;
  } else {
    root.style.removeProperty('--edu-font-family');
    delete root.dataset.eduFont;
  }

  setFlag(root, 'eduReduceMotion', prefs.reduceMotion);
  setFlag(root, 'eduHighContrast', prefs.highContrast);
  setFlag(root, 'eduLargeControls', prefs.largeControls);
  setFlag(root, 'eduUnderlineLinks', prefs.underlineLinks);
}

const AccessibilityPreferencesContext = createContext(null);

/**
 * Accessibility prefs — fonts, text size, and optional presentation switches.
 * Baseline shell a11y (skip link, landmarks, focus, live regions) is always on.
 * Persists in localStorage.
 */
export function AccessibilityPreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    applyToDocument(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const setFontId = useCallback((next) => {
    if (!ACCESSIBLE_FONTS.some((f) => f.id === next)) return;
    setPrefs((prev) => (prev.fontId === next ? prev : { ...prev, fontId: next }));
  }, []);

  const setTextSizeId = useCallback((next) => {
    if (!TEXT_SIZES.some((s) => s.id === next)) return;
    setPrefs((prev) => (prev.textSizeId === next ? prev : { ...prev, textSizeId: next }));
  }, []);

  const setReduceMotion = useCallback((next) => {
    setPrefs((prev) =>
      prev.reduceMotion === Boolean(next) ? prev : { ...prev, reduceMotion: Boolean(next) },
    );
  }, []);

  const setHighContrast = useCallback((next) => {
    setPrefs((prev) =>
      prev.highContrast === Boolean(next) ? prev : { ...prev, highContrast: Boolean(next) },
    );
  }, []);

  const setLargeControls = useCallback((next) => {
    setPrefs((prev) =>
      prev.largeControls === Boolean(next) ? prev : { ...prev, largeControls: Boolean(next) },
    );
  }, []);

  const setUnderlineLinks = useCallback((next) => {
    setPrefs((prev) =>
      prev.underlineLinks === Boolean(next) ? prev : { ...prev, underlineLinks: Boolean(next) },
    );
  }, []);

  const value = useMemo(
    () => ({
      fontId: prefs.fontId,
      textSizeId: prefs.textSizeId,
      reduceMotion: prefs.reduceMotion,
      highContrast: prefs.highContrast,
      largeControls: prefs.largeControls,
      underlineLinks: prefs.underlineLinks,
      setFontId,
      setTextSizeId,
      setReduceMotion,
      setHighContrast,
      setLargeControls,
      setUnderlineLinks,
    }),
    [
      prefs,
      setFontId,
      setTextSizeId,
      setReduceMotion,
      setHighContrast,
      setLargeControls,
      setUnderlineLinks,
    ],
  );

  return (
    <AccessibilityPreferencesContext.Provider value={value}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}

export function useAccessibilityPreferences() {
  const ctx = useContext(AccessibilityPreferencesContext);
  if (!ctx) {
    throw new Error(
      'useAccessibilityPreferences must be used within AccessibilityPreferencesProvider',
    );
  }
  return ctx;
}
