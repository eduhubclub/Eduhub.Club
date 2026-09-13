import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'eduHub.bank.openByClass';
const PIN_KEY = 'eduHub.bank.requireCardPin';

/** Default: bank is open until a teacher closes it. */
const DEFAULT_OPEN = true;

function readMapFrom(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readMap() {
  return readMapFrom(STORAGE_KEY);
}

const BankAccessContext = createContext(null);

/**
 * Teacher gate for student Bank access — open/closed per class.
 * Dashboard + Settings can toggle; persists in localStorage.
 */
export function BankAccessProvider({ children }) {
  const [openByClass, setOpenByClass] = useState(readMap);
  const [requirePinByClass, setRequirePinByClass] = useState(() => readMapFrom(PIN_KEY));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openByClass));
    } catch {
      /* ignore */
    }
  }, [openByClass]);

  useEffect(() => {
    try {
      localStorage.setItem(PIN_KEY, JSON.stringify(requirePinByClass));
    } catch {
      /* ignore */
    }
  }, [requirePinByClass]);

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

  const requireCardPin = useCallback(
    (classId) => {
      if (!classId) return false;
      return Boolean(requirePinByClass[String(classId)]);
    },
    [requirePinByClass],
  );

  const setRequireCardPin = useCallback((classId, required) => {
    if (!classId) return;
    setRequirePinByClass((prev) => ({ ...prev, [String(classId)]: Boolean(required) }));
  }, []);

  const value = useMemo(
    () => ({
      isBankOpen,
      setBankOpen,
      toggleBankOpen,
      requireCardPin,
      setRequireCardPin,
    }),
    [isBankOpen, setBankOpen, toggleBankOpen, requireCardPin, setRequireCardPin],
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
