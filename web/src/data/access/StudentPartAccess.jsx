import { createContext, useContext } from 'react';
import { partByTab, partEnabled } from './studentApps';

const StudentPartAccessContext = createContext(null);

export function StudentPartAccessProvider({ appId, parts, onExplain, children }) {
  const value = {
    isClosed(id, tab) {
      if (!appId || id !== appId) return false;
      const part = partByTab(id, tab);
      return Boolean(part && !partEnabled(parts, part.id));
    },
    explain(name) {
      onExplain?.(name);
    },
  };
  return (
    <StudentPartAccessContext.Provider value={value}>
      {children}
    </StudentPartAccessContext.Provider>
  );
}

export function useStudentParts() {
  return (
    useContext(StudentPartAccessContext) || {
      isClosed: () => false,
      explain: () => {},
    }
  );
}
