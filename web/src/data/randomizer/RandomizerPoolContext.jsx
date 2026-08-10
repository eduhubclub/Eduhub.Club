import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useClasses } from '../classes/ClassContext';
import {
  ATTENDANCE_UPDATED_EVENT,
  filterHereToday,
  isStudentHere,
} from '../attendance/todayPresence';

const SYNC_STORAGE_KEY = 'eduHub.randomizer.syncActivePools';

export const RANDOMIZER_POOL_MODES = [
  'Randomizer',
  'Wheel of Names',
  'Pick a Card',
  'Pull A Name',
];

/** Map Dashboard widget ids → Randomizer mode keys. */
export const WIDGET_POOL_MODE = {
  'wheel-of-names': 'Wheel of Names',
  'randomizer-shuffle': 'Randomizer',
  'pick-a-card': 'Pick a Card',
  'pull-a-name': 'Pull A Name',
};

function readSyncPreference() {
  try {
    return localStorage.getItem(SYNC_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function rosterSignature(roster) {
  return (roster || [])
    .map((s) => s.id)
    .slice()
    .sort()
    .join(',');
}

function hereRoster(classId, roster) {
  return filterHereToday(roster || [], classId);
}

function emptyByMode(roster = []) {
  const list = [...(roster || [])];
  return Object.fromEntries(RANDOMIZER_POOL_MODES.map((mode) => [mode, list]));
}

function intersectPools(pools) {
  if (!pools.length) return [];
  const idSets = pools.map((p) => new Set((p || []).map((s) => s.id)));
  const first = pools[0] || [];
  return first.filter((s) => idSets.every((set) => set.has(s.id)));
}

function prunePoolToHere(pool, classId) {
  return (pool || []).filter((s) => isStudentHere(classId, s.id));
}

const RandomizerPoolContext = createContext(null);

/**
 * Active student pools for Randomizer modes + Dashboard widgets.
 * Optionally sync removals across every randomizer type.
 */
export function RandomizerPoolProvider({ children }) {
  const [syncActivePools, setSyncActivePoolsState] = useState(readSyncPreference);
  const [classPools, setClassPools] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, syncActivePools ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, [syncActivePools]);

  const seedClass = useCallback((classId, roster) => {
    if (!classId) return;
    const available = hereRoster(classId, roster);
    const sig = `${rosterSignature(roster)}|here:${rosterSignature(available)}`;
    setClassPools((prev) => {
      if (prev[classId]?.rosterSig === sig) return prev;
      const byMode = emptyByMode(available);
      return {
        ...prev,
        [classId]: {
          shared: [...available],
          byMode,
          rosterSig: sig,
        },
      };
    });
  }, []);

  const setSyncActivePools = useCallback((next) => {
    const enabled = Boolean(next);
    setSyncActivePoolsState(enabled);
    setClassPools((prev) => {
      const out = {};
      for (const [classId, entry] of Object.entries(prev)) {
        if (enabled) {
          const shared = intersectPools(
            RANDOMIZER_POOL_MODES.map((m) => entry.byMode?.[m] || [])
          );
          const byMode = Object.fromEntries(
            RANDOMIZER_POOL_MODES.map((m) => [m, [...shared]])
          );
          out[classId] = { ...entry, shared, byMode };
        } else {
          const shared = [...(entry.shared || [])];
          const byMode = Object.fromEntries(
            RANDOMIZER_POOL_MODES.map((m) => [m, [...shared]])
          );
          out[classId] = { ...entry, shared, byMode };
        }
      }
      return out;
    });
  }, []);

  const getActiveStudents = useCallback(
    (classId, modeKey) => {
      const entry = classPools[classId];
      if (!entry) return [];
      if (syncActivePools) return entry.shared || [];
      return entry.byMode?.[modeKey] || [];
    },
    [classPools, syncActivePools]
  );

  const setActiveStudentsFor = useCallback(
    (classId, modeKey, updater) => {
      if (!classId) return;
      setClassPools((prev) => {
        const entry = prev[classId];
        if (!entry) return prev;
        const current = syncActivePools
          ? entry.shared || []
          : entry.byMode?.[modeKey] || [];
        const nextList =
          typeof updater === 'function' ? updater(current) : updater;
        if (syncActivePools) {
          const byMode = Object.fromEntries(
            RANDOMIZER_POOL_MODES.map((m) => [m, [...nextList]])
          );
          return {
            ...prev,
            [classId]: { ...entry, shared: [...nextList], byMode },
          };
        }
        return {
          ...prev,
          [classId]: {
            ...entry,
            byMode: { ...entry.byMode, [modeKey]: [...nextList] },
          },
        };
      });
    },
    [syncActivePools]
  );

  const resetActiveFor = useCallback(
    (classId, modeKey, roster) => {
      if (!classId) return;
      const full = hereRoster(classId, roster);
      setClassPools((prev) => {
        const entry = prev[classId];
        if (!entry) return prev;
        if (syncActivePools) {
          const byMode = Object.fromEntries(
            RANDOMIZER_POOL_MODES.map((m) => [m, [...full]])
          );
          return {
            ...prev,
            [classId]: { ...entry, shared: [...full], byMode },
          };
        }
        return {
          ...prev,
          [classId]: {
            ...entry,
            byMode: { ...entry.byMode, [modeKey]: [...full] },
          },
        };
      });
    },
    [syncActivePools]
  );

  // After attendance submit, drop students marked absent/excused from pools.
  useEffect(() => {
    const onAttendance = (e) => {
      const classId = e?.detail?.classId;
      if (!classId) return;
      setClassPools((prev) => {
        const entry = prev[classId];
        if (!entry) return prev;
        const shared = prunePoolToHere(entry.shared, classId);
        const byMode = Object.fromEntries(
          RANDOMIZER_POOL_MODES.map((m) => [
            m,
            prunePoolToHere(entry.byMode?.[m], classId),
          ]),
        );
        return {
          ...prev,
          [classId]: { ...entry, shared, byMode },
        };
      });
    };
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, onAttendance);
    return () =>
      window.removeEventListener(ATTENDANCE_UPDATED_EVENT, onAttendance);
  }, []);

  const value = useMemo(
    () => ({
      syncActivePools,
      setSyncActivePools,
      seedClass,
      getActiveStudents,
      setActiveStudentsFor,
      resetActiveFor,
    }),
    [
      syncActivePools,
      setSyncActivePools,
      seedClass,
      getActiveStudents,
      setActiveStudentsFor,
      resetActiveFor,
    ]
  );

  return (
    <RandomizerPoolContext.Provider value={value}>
      {children}
    </RandomizerPoolContext.Provider>
  );
}

export function useRandomizerPoolSettings() {
  const ctx = useContext(RandomizerPoolContext);
  if (!ctx) {
    throw new Error(
      'useRandomizerPoolSettings must be used within RandomizerPoolProvider'
    );
  }
  return {
    syncActivePools: ctx.syncActivePools,
    setSyncActivePools: ctx.setSyncActivePools,
  };
}

/**
 * Active pool for one Randomizer mode (or Dashboard widget mode key).
 */
export function useRandomizerActivePool(modeKey) {
  const ctx = useContext(RandomizerPoolContext);
  if (!ctx) {
    throw new Error(
      'useRandomizerActivePool must be used within RandomizerPoolProvider'
    );
  }
  const { selectedClass } = useClasses();
  const classId = selectedClass?.id ?? null;
  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass?.studentList]
  );

  useEffect(() => {
    if (classId) ctx.seedClass(classId, roster);
  }, [classId, roster, ctx]);

  const poolStudents = classId ? ctx.getActiveStudents(classId, modeKey) : [];

  // Always resolve active pool entries against the live roster so avatar/profile
  // edits in Classes/Students show up without resetting the pool.
  const activeStudents = useMemo(() => {
    if (!poolStudents.length) return poolStudents;
    const byId = new Map(roster.map((s) => [s.id, s]));
    return poolStudents.map((s) => byId.get(s.id) || s).filter((s) => byId.has(s.id));
  }, [poolStudents, roster]);

  const setActiveStudents = useCallback(
    (updater) => ctx.setActiveStudentsFor(classId, modeKey, updater),
    [ctx, classId, modeKey]
  );

  const resetActive = useCallback(() => {
    ctx.resetActiveFor(classId, modeKey, roster);
  }, [ctx, classId, modeKey, roster]);

  return {
    selectedClass,
    roster,
    activeStudents,
    setActiveStudents,
    resetActive,
    syncActivePools: ctx.syncActivePools,
  };
}
