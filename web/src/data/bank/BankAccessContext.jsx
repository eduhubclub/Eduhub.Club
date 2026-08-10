import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'eduHub.bank.openByClass';

/** Default: bank is open until a teacher closes it. */
const DEFAULT_OPEN = true;

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const BankAccessContext = createContext(null);

/**
 * Teacher gate for student Bank access — open/closed per class.
 * Dashboard + Settings can toggle; persists in localStorage.
 */
export function BankAccessProvider({ children }) {
  const [openByClass, setOpenByClass] = useState(readMap);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openByClass));
    } catch {
      /* ignore */
    }
  }, [openByClass]);

  const isBankOpen = useCallback(
    (classId) => {
      if (!classId) return DEFAULT_OPEN;
      const key = String(classId);
      if (Object.prototype.hasOwnProperty.call(openByClass, key)) {
        return Boolean(openByClass[key]);
      }
      return DEFAULT_OPEN;
    },
    [openByClass],
  );

  const setBankOpen = useCallback((classId, open) => {
    if (!classId) return;
    const key = String(classId);
    setOpenByClass((prev) => ({ ...prev, [key]: Boolean(open) }));
  }, []);

  const toggleBankOpen = useCallback((classId) => {
    if (!classId) return;
    const key = String(classId);
    setOpenByClass((prev) => {
      const current = Object.prototype.hasOwnProperty.call(prev, key)
        ? Boolean(prev[key])
        : DEFAULT_OPEN;
      return { ...prev, [key]: !current };
    });
  }, []);

  const value = useMemo(
    () => ({
      isBankOpen,
      setBankOpen,
      toggleBankOpen,
    }),
    [isBankOpen, setBankOpen, toggleBankOpen],
  );

  return (
    <BankAccessContext.Provider value={value}>{children}</BankAccessContext.Provider>
  );
}

export function useBankAccess() {
  const ctx = useContext(BankAccessContext);
  if (!ctx) {
    throw new Error('useBankAccess must be used within BankAccessProvider');
  }
  return ctx;
}
