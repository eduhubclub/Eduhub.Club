import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { expandOccurrencesForRange } from '../../data/calendar/expandOccurrences';
import {
  CALENDAR_UPDATED_EVENT,
  ensureSpecialistSeed,
  readAcademic,
  readClosures,
  readCountdowns,
  readEvents,
  readLayers,
  readUiPrefs,
  removeCountdown,
  removeEvent,
  removeLayer,
  upsertCountdown,
  upsertEvent,
  upsertLayer,
  writeAcademic,
  writeClosures,
  writeCountdowns,
  writeEvents,
  writeLayers,
  writeUiPrefs,
} from '../../data/calendar/calendarStorage';
import { toIsoDate, isSpecialistLayer, specialistRotationSeed } from '../../data/calendar/calendarModel';

const CalendarContext = createContext(null);

function reloadClassBundle(classId) {
  if (!classId) {
    return {
      academic: readAcademic(''),
      closures: [],
      layers: [],
      events: [],
      countdowns: [],
    };
  }
  return {
    academic: readAcademic(classId),
    closures: readClosures(classId),
    layers: readLayers(classId),
    events: readEvents(classId),
    countdowns: readCountdowns(classId),
  };
}

export function CalendarProvider({ classes = [], classId, children }) {
  const classIdsKey = (classes || [])
    .filter((c) => !c.isArchived)
    .map((c) => String(c.id))
    .join('|');
  const classIds = useMemo(
    () => (classIdsKey ? classIdsKey.split('|') : []),
    [classIdsKey],
  );
  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    // Recompute when membership changes; names follow latest `classes` when key matches.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- classIdsKey is the stable membership signal
    [classIdsKey, classes],
  );
  const classMetaById = useMemo(() => {
    const map = {};
    for (const c of activeClasses) map[String(c.id)] = c;
    return map;
  }, [activeClasses]);

  const [prefs, setPrefs] = useState(() => readUiPrefs(classIds));
  const [bundle, setBundle] = useState(() => reloadClassBundle(classId));
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setBundle(reloadClassBundle(classId));
    setPrefs(readUiPrefs(classIds));
    setTick((n) => n + 1);
  }, [classId, classIdsKey]);

  useEffect(() => {
    setBundle(reloadClassBundle(classId));
    setPrefs(readUiPrefs(classIds));
  }, [classId, classIdsKey]);

  useEffect(() => {
    const onUpdate = (event) => {
      // Prefs writes notify too — avoid re-entry loops; still reload class data.
      if (event?.detail?.type === 'uiPrefs') {
        setPrefs(readUiPrefs(classIds));
        return;
      }
      refresh();
    };
    window.addEventListener(CALENDAR_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(CALENDAR_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refresh, classIds]);

  // Align visible classes when the roster of active classes changes.
  useEffect(() => {
    if (!classIds.length) return;
    setPrefs((prev) => {
      const visible = (prev.visibleClassIds || []).filter((id) =>
        classIds.includes(String(id)),
      );
      if (!visible.length) {
        return writeUiPrefs(
          {
            ...prev,
            visibleClassIds: [String(classId || classIds[0])],
          },
          classIds,
        );
      }
      if (visible.length !== prev.visibleClassIds.length) {
        return writeUiPrefs({ ...prev, visibleClassIds: visible }, classIds);
      }
      return prev;
    });
  }, [classIdsKey, classId]);

  const updatePrefs = useCallback(
    (patch) => {
      const next = writeUiPrefs({ ...prefs, ...patch }, classIds);
      setPrefs(next);
      return next;
    },
    [prefs, classIds],
  );

  const toggleVisibleClass = useCallback(
    (id) => {
      const sid = String(id);
      const cur = prefs.visibleClassIds.map(String);
      const has = cur.includes(sid);
      let nextIds;
      if (has) {
        nextIds = cur.filter((x) => x !== sid);
        if (!nextIds.length) nextIds = [sid];
      } else {
        nextIds = [...cur, sid];
      }
      return updatePrefs({ visibleClassIds: nextIds });
    },
    [prefs.visibleClassIds, updatePrefs],
  );

  const saveAcademic = useCallback(
    (academic) => {
      writeAcademic(classId, academic);
      refresh();
    },
    [classId, refresh],
  );

  const saveClosures = useCallback(
    (closures) => {
      writeClosures(classId, closures);
      refresh();
    },
    [classId, refresh],
  );

  const saveLayer = useCallback(
    (layer) => {
      upsertLayer(classId, layer);
      refresh();
    },
    [classId, refresh],
  );

  const deleteLayer = useCallback(
    (layerId) => {
      removeLayer(classId, layerId);
      refresh();
    },
    [classId, refresh],
  );

  const setLayers = useCallback(
    (layers) => {
      writeLayers(classId, layers);
      refresh();
    },
    [classId, refresh],
  );

  const saveEvent = useCallback(
    (event) => {
      upsertEvent(classId, event);
      refresh();
    },
    [classId, refresh],
  );

  const deleteEvent = useCallback(
    (eventId) => {
      removeEvent(classId, eventId);
      refresh();
    },
    [classId, refresh],
  );

  const setEvents = useCallback(
    (events) => {
      writeEvents(classId, events);
      refresh();
    },
    [classId, refresh],
  );

  const saveCountdown = useCallback(
    (countdown) => {
      upsertCountdown(classId, countdown);
      refresh();
    },
    [classId, refresh],
  );

  const deleteCountdown = useCallback(
    (countdownId) => {
      removeCountdown(classId, countdownId);
      refresh();
    },
    [classId, refresh],
  );

  const seedSpecialists = useCallback(() => {
    const seeded = ensureSpecialistSeed(classId);
    refresh();
    return seeded;
  }, [classId, refresh]);

  /** Whether any visible class has a visible specialist / rotation layer. */
  const specialistVisible = useMemo(() => {
    const ids = (prefs.visibleClassIds || []).map(String);
    for (const id of ids) {
      for (const layer of readLayers(id)) {
        if (!isSpecialistLayer(layer)) continue;
        if (layer.visible !== false) return true;
      }
    }
    return false;
  }, [prefs.visibleClassIds, tick]);

  const setSpecialistVisible = useCallback(
    (visible) => {
      const ids = (prefs.visibleClassIds || []).map(String);
      const targets = ids.length ? ids : classId ? [String(classId)] : [];
      for (const id of targets) {
        let layers = readLayers(id);
        const hasSpec = layers.some(isSpecialistLayer);
        if (visible && !hasSpec) {
          const seed = specialistRotationSeed();
          writeLayers(id, [...layers, seed]);
          layers = readLayers(id);
        }
        writeLayers(
          id,
          layers.map((l) =>
            isSpecialistLayer(l) ? { ...l, visible: Boolean(visible) } : l,
          ),
        );
      }
      refresh();
    },
    [prefs.visibleClassIds, classId, refresh],
  );

  const getOccurrences = useCallback(
    (rangeStart, rangeEnd, visibleIds) => {
      const ids = (visibleIds || prefs.visibleClassIds || []).map(String);
      return expandOccurrencesForRange({
        rangeStart,
        rangeEnd,
        classIds: ids,
        classMetaById,
        getAcademic: readAcademic,
        getClosures: readClosures,
        getLayers: readLayers,
        getEvents: readEvents,
      });
    },
    [prefs.visibleClassIds, classMetaById, tick],
  );

  const value = {
    classId,
    classes: activeClasses,
    classMetaById,
    prefs,
    updatePrefs,
    toggleVisibleClass,
    academic: bundle.academic,
    closures: bundle.closures,
    layers: bundle.layers,
    events: bundle.events,
    countdowns: bundle.countdowns,
    saveAcademic,
    saveClosures,
    saveLayer,
    deleteLayer,
    setLayers,
    saveEvent,
    deleteEvent,
    setEvents,
    saveCountdown,
    deleteCountdown,
    seedSpecialists,
    specialistVisible,
    setSpecialistVisible,
    getOccurrences,
    todayIso: toIsoDate(new Date()),
    refresh,
  };

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
}
