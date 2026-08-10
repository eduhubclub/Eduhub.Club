import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { applyBehaviorAwardToBank } from '../bank/bankAccountsStorage';
import {
  seedPointsFromRoster,
  syncPointsWithRoster,
  mergeBehaviorCatalog,
  BEHAVIOR_POINTS_UPDATED_EVENT,
} from './behaviorState';

const SYNC_STORAGE_KEY = 'eduHub.behavior.syncToBank';
export const BEHAVIOR_SYNC_EVENT = 'eduHub.behavior.syncToBankChanged';
const NEEDS_WORK_STORAGE_KEY = 'eduHub.behavior.showNeedsWork';
export const BEHAVIOR_NEEDS_WORK_EVENT = 'eduHub.behavior.showNeedsWorkChanged';
const CUSTOM_BEHAVIORS_KEY = 'eduHub.behavior.customBehaviors';
const POINTS_STORAGE_KEY = 'eduHub.behavior.pointsByClass';
const AWARDS_STORAGE_KEY = 'eduHub.behavior.awardsByClass';
const AWARDS_KEEP = 300;

const BehaviorContext = createContext(null);

export function readBehaviorSyncToBank() {
  try {
    return localStorage.getItem(SYNC_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeBehaviorSyncToBank(value) {
  const next = Boolean(value);
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, next ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(BEHAVIOR_SYNC_EVENT, { detail: { syncToBank: next } }),
    );
  } catch {
    /* ignore */
  }
  return next;
}

/** Defaults on — Needs work feedback is available unless turned off in Settings. */
export function readBehaviorShowNeedsWork() {
  try {
    const raw = localStorage.getItem(NEEDS_WORK_STORAGE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function writeBehaviorShowNeedsWork(value) {
  const next = Boolean(value);
  try {
    localStorage.setItem(NEEDS_WORK_STORAGE_KEY, next ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(BEHAVIOR_NEEDS_WORK_EVENT, {
        detail: { showNeedsWork: next },
      }),
    );
  } catch {
    /* ignore */
  }
  return next;
}

function readCustomBehaviors() {
  try {
    const raw = localStorage.getItem(CUSTOM_BEHAVIORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomBehaviors(list) {
  try {
    localStorage.setItem(CUSTOM_BEHAVIORS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function readPointsMap() {
  try {
    const raw = localStorage.getItem(POINTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePointsMap(map) {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function readAwardsMap() {
  try {
    const raw = localStorage.getItem(AWARDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAwardsMap(map) {
  try {
    localStorage.setItem(AWARDS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function awardsForClass(classId) {
  if (!classId) return [];
  const list = readAwardsMap()[String(classId)];
  return Array.isArray(list) ? list : [];
}

export function BehaviorProvider({ roster, classId, children }) {
  const [points, setPoints] = useState(() => {
    const stored = classId ? readPointsMap()[String(classId)] : null;
    return stored || seedPointsFromRoster(roster);
  });
  const [syncToBank, setSyncToBankState] = useState(readBehaviorSyncToBank);
  const [showNeedsWork, setShowNeedsWorkState] = useState(readBehaviorShowNeedsWork);
  const [customBehaviors, setCustomBehaviors] = useState(readCustomBehaviors);
  const [seededClassId, setSeededClassId] = useState(classId);
  const [recent, setRecent] = useState(() => awardsForClass(classId));

  const catalog = useMemo(
    () => mergeBehaviorCatalog(customBehaviors),
    [customBehaviors],
  );

  useEffect(() => {
    const onSyncPref = (e) => {
      if (typeof e?.detail?.syncToBank === 'boolean') {
        setSyncToBankState(e.detail.syncToBank);
      } else {
        setSyncToBankState(readBehaviorSyncToBank());
      }
    };
    window.addEventListener(BEHAVIOR_SYNC_EVENT, onSyncPref);
    return () => window.removeEventListener(BEHAVIOR_SYNC_EVENT, onSyncPref);
  }, []);

  useEffect(() => {
    const onNeedsWorkPref = (e) => {
      if (typeof e?.detail?.showNeedsWork === 'boolean') {
        setShowNeedsWorkState(e.detail.showNeedsWork);
      } else {
        setShowNeedsWorkState(readBehaviorShowNeedsWork());
      }
    };
    window.addEventListener(BEHAVIOR_NEEDS_WORK_EVENT, onNeedsWorkPref);
    return () =>
      window.removeEventListener(BEHAVIOR_NEEDS_WORK_EVENT, onNeedsWorkPref);
  }, []);

  useEffect(() => {
    const onPoints = (e) => {
      if (!classId) return;
      if (e?.detail?.classId && String(e.detail.classId) !== String(classId)) {
        return;
      }
      if (e?.detail?.points && typeof e.detail.points === 'object') {
        setPoints(syncPointsWithRoster(e.detail.points, roster));
        return;
      }
      const stored = readPointsMap()[String(classId)];
      if (stored) setPoints(syncPointsWithRoster(stored, roster));
    };
    window.addEventListener(BEHAVIOR_POINTS_UPDATED_EVENT, onPoints);
    return () =>
      window.removeEventListener(BEHAVIOR_POINTS_UPDATED_EVENT, onPoints);
  }, [classId, roster]);

  useEffect(() => {
    if (classId !== seededClassId) {
      const stored = readPointsMap()[String(classId)];
      setPoints(stored || seedPointsFromRoster(roster));
      setRecent(awardsForClass(classId));
      setSeededClassId(classId);
      return;
    }
    setPoints((prev) => syncPointsWithRoster(prev, roster));
  }, [roster, classId, seededClassId]);

  useEffect(() => {
    if (!classId) return;
    const all = readPointsMap();
    all[String(classId)] = points;
    writePointsMap(all);
  }, [points, classId]);

  useEffect(() => {
    if (!classId) return;
    const all = readAwardsMap();
    all[String(classId)] = recent.slice(0, AWARDS_KEEP);
    writeAwardsMap(all);
  }, [recent, classId]);

  const setSyncToBank = useCallback((value) => {
    setSyncToBankState(writeBehaviorSyncToBank(value));
  }, []);

  const setShowNeedsWork = useCallback((value) => {
    setShowNeedsWorkState(writeBehaviorShowNeedsWork(value));
  }, []);

  const addBehavior = useCallback(({ name, points, icon, category }) => {
    const trimmed = String(name || '').trim();
    const abs = Math.min(10, Math.max(1, Math.round(Number(points) || 1)));
    const cat = category === 'needsWork' ? 'needsWork' : 'positive';
    if (!trimmed) return null;
    const entry = {
      id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      points: cat === 'needsWork' ? -abs : abs,
      icon: icon || '⭐',
      category: cat,
      custom: true,
    };
    setCustomBehaviors((prev) => {
      const next = [entry, ...prev];
      writeCustomBehaviors(next);
      return next;
    });
    return entry;
  }, []);

  const updateBehavior = useCallback((id, { name, points, icon, category }) => {
    const key = String(id);
    const trimmed = String(name || '').trim();
    const abs = Math.min(10, Math.max(1, Math.round(Number(points) || 1)));
    const cat = category === 'needsWork' ? 'needsWork' : 'positive';
    if (!key || !trimmed) return null;
    const entry = {
      id: key,
      name: trimmed,
      points: cat === 'needsWork' ? -abs : abs,
      icon: icon || '⭐',
      category: cat,
    };
    setCustomBehaviors((prev) => {
      const without = prev.filter((b) => String(b.id) !== key);
      const next = [entry, ...without];
      writeCustomBehaviors(next);
      return next;
    });
    return entry;
  }, []);

  const getPoints = useCallback(
    (studentId) => points[String(studentId)] || 0,
    [points],
  );

  const award = useCallback(
    ({ studentIds, behavior }) => {
      if (!studentIds?.length || !behavior) return { ok: false };
      const selected = new Set(studentIds.map(String));
      const delta = Number(behavior.points) || 0;

      setPoints((prev) => {
        const next = { ...prev };
        for (const id of selected) {
          next[id] = (next[id] || 0) + delta;
        }
        return next;
      });

      setRecent((prev) =>
        [
          {
            id: `aw-${Date.now()}`,
            at: Date.now(),
            behavior: {
              id: behavior.id,
              name: behavior.name,
              icon: behavior.icon,
              points: behavior.points,
              category: behavior.category,
            },
            studentIds: [...selected],
            count: selected.size,
          },
          ...prev,
        ].slice(0, AWARDS_KEEP),
      );

      if (syncToBank) {
        applyBehaviorAwardToBank({
          classId,
          roster,
          studentIds: [...selected],
          behavior,
        });
      }

      try {
        window.dispatchEvent(
          new CustomEvent('eduHub.behavior.pointsUpdated', {
            detail: { classId: String(classId) },
          }),
        );
      } catch {
        /* ignore */
      }

      return { ok: true };
    },
    [classId, roster, syncToBank],
  );

  const value = useMemo(
    () => ({
      points,
      getPoints,
      award,
      syncToBank,
      setSyncToBank,
      showNeedsWork,
      setShowNeedsWork,
      catalog,
      customBehaviors,
      addBehavior,
      updateBehavior,
      recent,
    }),
    [
      points,
      getPoints,
      award,
      syncToBank,
      setSyncToBank,
      showNeedsWork,
      setShowNeedsWork,
      catalog,
      customBehaviors,
      addBehavior,
      updateBehavior,
      recent,
    ],
  );

  return (
    <BehaviorContext.Provider value={value}>{children}</BehaviorContext.Provider>
  );
}

export function useBehavior() {
  const ctx = useContext(BehaviorContext);
  if (!ctx) throw new Error('useBehavior must be used within BehaviorProvider');
  return ctx;
}
