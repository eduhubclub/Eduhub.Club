import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'eduHub.showDemoData';

export function isDemoClassId(id) {
  return String(id || '').startsWith('demo-');
}

export function isDemoStudentId(id) {
  return String(id || '').startsWith('demo-');
}

function readShowDemoData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

const DemoDataContext = createContext(null);

/**
 * Controls whether seeded demo class / students are shown.
 * Preference persists in localStorage.
 */
export function DemoDataProvider({ children }) {
  const [showDemoData, setShowDemoDataState] = useState(readShowDemoData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, showDemoData ? 'true' : 'false');
    } catch {
      /* ignore quota / private mode */
    }
  }, [showDemoData]);

  const setShowDemoData = useCallback((next) => {
    setShowDemoDataState(Boolean(next));
  }, []);

  const value = useMemo(
    () => ({
      showDemoData,
      setShowDemoData,
    }),
    [showDemoData, setShowDemoData]
  );

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) {
    throw new Error('useDemoData must be used within DemoDataProvider');
  }
  return ctx;
}
