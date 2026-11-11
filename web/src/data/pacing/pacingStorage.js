import {
  isBeforeSchoolStart,
  isPastEndOfDay,
} from './schoolSeed';
import {
  addDays,
  applyDisruption,
  buildDistrictPlacements,
  createPacingFromOnboarding,
  emptyStore,
  ensureTeacherCopies,
  isInstructionalDay,
  normalizeLessonSlot,
  normalizePacing,
  normalizeStore,
  normalizeUnit,
  rebuildDistrictFrom,
  rollOpenPlacements,
  toIsoDate,
} from './pacingModel';

const STORAGE_KEY = 'eduHub.pacing.v1';
export const PACING_UPDATED_EVENT = 'eduHub.pacing.updated';

function notify() {
  window.dispatchEvent(new CustomEvent(PACING_UPDATED_EVENT));
}

export function readPacingStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export function writePacingStore(store) {
  const next = normalizeStore(store);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
  return next;
}

export function updatePacingStore(mutator) {
  const prev = readPacingStore();
  const next = mutator(prev);
  return writePacingStore(next);
}

export function setGradeId(gradeId) {
  return updatePacingStore((s) => ({ ...s, gradeId: String(gradeId) }));
}

export function addPacingFromOnboarding(input) {
  return updatePacingStore((s) => {
    const pacing = createPacingFromOnboarding(input);
    const districtPlacements = [
      ...s.districtPlacements,
      ...buildDistrictPlacements(pacing, s.blockOutDates),
    ];
    return {
      ...s,
      pacings: [...s.pacings, pacing],
      districtPlacements,
    };
  });
}

export function updatePacing(pacingId, patch) {
  return updatePacingStore((s) => {
    const pacings = s.pacings.map((p) => {
      if (p.id !== pacingId) return p;
      return normalizePacing({ ...p, ...patch, id: p.id });
    });
    return { ...s, pacings };
  });
}

export function updateLessonSlot(pacingId, slotId, patch) {
  return updatePacingStore((s) => {
    const pacings = s.pacings.map((pacing) => {
      if (pacing.id !== pacingId) return pacing;
      const units = pacing.units.map((unit) =>
        normalizeUnit({
          ...unit,
          lessons: unit.lessons.map((lesson) => {
            if (lesson.id !== slotId) return lesson;
            return normalizeLessonSlot(
              { ...lesson, ...patch, id: lesson.id },
              pacing.averageLessonMinutes,
            );
          }),
        }),
      );
      return normalizePacing({ ...pacing, units });
    });
    const minutes = patch.averageMinutes;
    let districtPlacements = s.districtPlacements;
    let teacherPlacements = s.teacherPlacements;
    if (minutes != null) {
      const m = Math.max(1, Math.round(Number(minutes) || 1));
      districtPlacements = districtPlacements.map((pl) =>
        pl.pacingId === pacingId && pl.slotId === slotId && pl.status === 'open'
          ? { ...pl, minutesPlanned: m }
          : pl,
      );
      teacherPlacements = teacherPlacements.map((pl) =>
        pl.pacingId === pacingId && pl.slotId === slotId && pl.status === 'open'
          ? { ...pl, minutesPlanned: m }
          : pl,
      );
    }
    return { ...s, pacings, districtPlacements, teacherPlacements };
  });
}

export function deletePacing(pacingId) {
  return updatePacingStore((s) => ({
    ...s,
    pacings: s.pacings.filter((p) => p.id !== pacingId),
    districtPlacements: s.districtPlacements.filter((p) => p.pacingId !== pacingId),
    teacherPlacements: s.teacherPlacements.filter((p) => p.pacingId !== pacingId),
  }));
}

export function addBlockOut(iso) {
  return updatePacingStore((s) => {
    const date = String(iso);
    if (s.blockOutDates.includes(date)) return s;
    const blockOutDates = [...s.blockOutDates, date].sort();
    let districtPlacements = s.districtPlacements;
    for (const pacing of s.pacings) {
      districtPlacements = rebuildDistrictFrom(
        pacing,
        districtPlacements,
        date,
        blockOutDates,
      );
    }
    return { ...s, blockOutDates, districtPlacements };
  });
}

export function removeBlockOut(iso) {
  return updatePacingStore((s) => {
    const date = String(iso);
    const blockOutDates = s.blockOutDates.filter((d) => d !== date);
    let districtPlacements = [];
    for (const pacing of s.pacings) {
      districtPlacements = [
        ...districtPlacements,
        ...buildDistrictPlacements(pacing, blockOutDates),
      ];
    }
    return { ...s, blockOutDates, districtPlacements };
  });
}

function promoteToTeacher(s, placementId, status) {
  let teacherPlacements = [...s.teacherPlacements];
  const existing = teacherPlacements.find((p) => p.id === placementId);
  if (existing) {
    return {
      ...s,
      teacherPlacements: teacherPlacements.map((pl) =>
        pl.id === placementId ? { ...pl, status: status || pl.status } : pl,
      ),
    };
  }
  const d = s.districtPlacements.find((p) => p.id === placementId);
  if (!d) return s;
  teacherPlacements.push({
    ...d,
    id: `tplace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    source: 'teacher',
    status: status || d.status,
  });
  return { ...s, teacherPlacements };
}

export function setTeacherPlacementStatus(placementId, status) {
  return updatePacingStore((s) => promoteToTeacher(s, placementId, status));
}

export function movePlacement(placementId, toDate) {
  return updatePacingStore((s) => {
    const district = s.districtPlacements.find((p) => p.id === placementId);
    const existingTeacher = s.teacherPlacements.find((p) => p.id === placementId);
    if (existingTeacher) {
      return {
        ...s,
        teacherPlacements: s.teacherPlacements.map((pl) =>
          pl.id === placementId
            ? { ...pl, date: String(toDate), status: 'open' }
            : pl,
        ),
      };
    }
    if (district) {
      const copyId = `tplace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      // Drop any prior teacher copy of same slot
      const teacherPlacements = s.teacherPlacements
        .filter(
          (p) =>
            !(p.pacingId === district.pacingId && p.slotId === district.slotId),
        )
        .concat([
          {
            ...district,
            id: copyId,
            source: 'teacher',
            date: String(toDate),
            status: 'open',
          },
        ]);
      return { ...s, teacherPlacements };
    }
    return s;
  });
}

export function disruptPlacement(placementId, minutesUsed) {
  return updatePacingStore((s) => {
    let store = promoteToTeacher(s, placementId, undefined);
    const teacherId =
      store.teacherPlacements.find((p) => p.id === placementId)?.id ||
      store.teacherPlacements[store.teacherPlacements.length - 1]?.id;
    if (!teacherId) return s;
    return applyDisruption(store, teacherId, minutesUsed, store.blockOutDates);
  });
}

export function saveCheckIn(iso, answers) {
  return updatePacingStore((s) => {
    const date = String(iso);
    let teacherPlacements = ensureTeacherCopies(s, date);
    const statusByPlacement = answers?.statuses || {};

    for (const [pid, st] of Object.entries(statusByPlacement)) {
      if (!(st === 'done' || st === 'partial' || st === 'open')) continue;
      const tIdx = teacherPlacements.findIndex((p) => p.id === pid);
      if (tIdx >= 0) {
        teacherPlacements[tIdx] = { ...teacherPlacements[tIdx], status: st };
        continue;
      }
      const d = s.districtPlacements.find((p) => p.id === pid && p.date === date);
      if (d) {
        teacherPlacements.push({
          ...d,
          id: `tplace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          source: 'teacher',
          status: st,
        });
      }
    }

    // Unanswered lessons on that date stay open → roll
    teacherPlacements = rollOpenPlacements(
      teacherPlacements,
      date,
      s.blockOutDates,
    );

    return {
      ...s,
      teacherPlacements,
      checkIns: {
        ...s.checkIns,
        [date]: {
          completedAt: new Date().toISOString(),
          statuses: statusByPlacement,
        },
      },
    };
  });
}

export function getPendingCheckInDate(store, grade) {
  const today = toIsoDate(new Date());
  if (!store.checkIns?.[today] && isPastEndOfDay(grade)) return today;

  if (isBeforeSchoolStart(grade)) {
    const block = new Set(store.blockOutDates || []);
    for (let i = 1; i <= 5; i += 1) {
      const d = addDays(today, -i);
      if (!isInstructionalDay(d, block)) continue;
      if (!store.checkIns?.[d]) return d;
      break;
    }
  }
  return null;
}
