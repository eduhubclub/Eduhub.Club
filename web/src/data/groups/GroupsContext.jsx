import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useClasses } from '../classes/ClassContext';
import {
  createGroupsWithPairings,
  defaultGroupNames,
  syncPairingPreferences,
} from '../../apps/groups/groupUtils';

const STORAGE_KEY = 'eduHub.groups.workshop';

const GroupsContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      savedGroupings: Array.isArray(parsed.savedGroupings) ? parsed.savedGroupings : [],
      pairingPreferences:
        parsed.pairingPreferences && typeof parsed.pairingPreferences === 'object'
          ? parsed.pairingPreferences
          : {},
    };
  } catch {
    return null;
  }
}

/**
 * Shared Groups workshop state for the Groups app and Dashboard widgets.
 */
export function GroupsProvider({ children }) {
  const { selectedClass } = useClasses();
  const stored = readStored();
  const [savedGroupings, setSavedGroupings] = useState(stored?.savedGroupings || []);
  const [pairingPreferences, setPairingPreferences] = useState(
    stored?.pairingPreferences || {}
  );
  const [generatedGroups, setGeneratedGroups] = useState([]);
  const [generatedGroupNames, setGeneratedGroupNames] = useState([]);
  const [currentGroupSize, setCurrentGroupSize] = useState(null);
  const prevClassIdRef = useRef(selectedClass?.id);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedGroupings, pairingPreferences })
      );
    } catch {
      /* ignore */
    }
  }, [savedGroupings, pairingPreferences]);

  useEffect(() => {
    if (prevClassIdRef.current === selectedClass?.id) return;
    prevClassIdRef.current = selectedClass?.id;
    setGeneratedGroups([]);
    setGeneratedGroupNames([]);
    setCurrentGroupSize(null);
  }, [selectedClass?.id]);

  const savePairingPreferences = useCallback((studentId, togetherIds, separateIds, rosterIds) => {
    setPairingPreferences((prev) =>
      syncPairingPreferences(prev, studentId, togetherIds, separateIds, rosterIds)
    );
  }, []);

  const generateGroups = useCallback(
    (roster, size) => {
      const n = Number(size);
      if (!roster?.length || !Number.isFinite(n) || n < 1) return null;
      const newGroups = createGroupsWithPairings(roster, n, pairingPreferences);
      setGeneratedGroups(newGroups);
      setGeneratedGroupNames(defaultGroupNames(newGroups.length));
      setCurrentGroupSize(n);
      return newGroups;
    },
    [pairingPreferences]
  );

  const saveGrouping = useCallback(
    ({ name, groups, groupNames, unassigned = [], classId, subject = '' }) => {
      if (!name?.trim() || !groups?.length) return null;
      const labels = groups.map((_, i) => {
        const label = (groupNames?.[i] || '').trim();
        return label || `Group ${i + 1}`;
      });
      const entry = {
        id: Date.now(),
        name: name.trim(),
        subject: (subject || '').trim(),
        groups,
        groupNames: labels,
        unassigned,
        date: new Date().toLocaleDateString(),
        classId,
        isArchived: false,
      };
      setSavedGroupings((prev) => [entry, ...prev]);
      return entry;
    },
    []
  );

  const toggleSavedGroupingArchived = useCallback((id) => {
    setSavedGroupings((prev) =>
      prev.map((saved) =>
        saved.id === id ? { ...saved, isArchived: !saved.isArchived } : saved
      )
    );
  }, []);

  const updateSavedGrouping = useCallback((id, patch) => {
    setSavedGroupings((prev) =>
      prev.map((saved) => (saved.id === id ? { ...saved, ...patch } : saved))
    );
  }, []);

  const value = useMemo(
    () => ({
      savedGroupings,
      setSavedGroupings,
      pairingPreferences,
      setPairingPreferences,
      savePairingPreferences,
      generatedGroups,
      setGeneratedGroups,
      generatedGroupNames,
      setGeneratedGroupNames,
      currentGroupSize,
      setCurrentGroupSize,
      generateGroups,
      saveGrouping,
      toggleSavedGroupingArchived,
      updateSavedGrouping,
    }),
    [
      savedGroupings,
      pairingPreferences,
      savePairingPreferences,
      generatedGroups,
      generatedGroupNames,
      currentGroupSize,
      generateGroups,
      saveGrouping,
      toggleSavedGroupingArchived,
      updateSavedGrouping,
    ]
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroupsWorkshop() {
  const ctx = useContext(GroupsContext);
  if (!ctx) {
    throw new Error('useGroupsWorkshop must be used within GroupsProvider');
  }
  return ctx;
}
