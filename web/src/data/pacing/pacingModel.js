/**
 * Pacing domain: pacings → units → lesson slots; district vs teacher placements.
 */

export const LESSON_STATUSES = ['open', 'partial', 'done'];
export const PACE_SOURCES = ['district', 'teacher'];

export function newId(prefix = 'pac') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso) {
  const [y, m, d] = String(iso || '')
    .split('-')
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function addDays(iso, delta) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
}

/** Skip weekends; blockOutSet is Set of ISO dates. */
export function nextInstructionalDay(iso, blockOutSet = new Set(), maxSteps = 60) {
  let cur = iso;
  for (let i = 0; i < maxSteps; i += 1) {
    cur = addDays(cur, 1);
    const d = parseIsoDate(cur);
    if (!d) return cur;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (blockOutSet.has(cur)) continue;
    return cur;
  }
  return addDays(iso, 1);
}

export function isInstructionalDay(iso, blockOutSet = new Set()) {
  const d = parseIsoDate(iso);
  if (!d) return false;
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  if (blockOutSet.has(iso)) return false;
  return true;
}

/**
 * @returns {{
 *   id: string,
 *   title: string,
 *   notes: string,
 *   links: { id: string, label: string, url: string }[],
 *   imageUrl: string,
 *   averageMinutes: number,
 * }}
 */
export function normalizeLessonSlot(raw, fallbackMinutes = 45) {
  if (!raw || typeof raw !== 'object') return null;
  const links = (Array.isArray(raw.links) ? raw.links : [])
    .map((l) => ({
      id: String(l?.id || newId('lnk')),
      label: String(l?.label || '').trim() || 'Link',
      url: String(l?.url || '').trim(),
    }))
    .filter((l) => l.url);
  return {
    id: String(raw.id || newId('slot')),
    title: String(raw.title || '').trim() || 'Lesson',
    notes: String(raw.notes || ''),
    links,
    imageUrl: String(raw.imageUrl || '').trim(),
    averageMinutes: Math.max(
      1,
      Math.round(Number(raw.averageMinutes) || fallbackMinutes),
    ),
  };
}

export function normalizeUnit(raw, fallbackMinutes = 45) {
  if (!raw || typeof raw !== 'object') return null;
  const lessons = (Array.isArray(raw.lessons) ? raw.lessons : [])
    .map((l) => normalizeLessonSlot(l, fallbackMinutes))
    .filter(Boolean);
  return {
    id: String(raw.id || newId('unit')),
    title: String(raw.title || '').trim() || 'Unit',
    lessons,
  };
}

/**
 * @returns {{
 *   id: string,
 *   title: string,
 *   contentKey: string,
 *   averageLessonMinutes: number,
 *   units: object[],
 *   startDate: string,
 * }}
 */
export function normalizePacing(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const averageLessonMinutes = Math.max(
    1,
    Math.round(Number(raw.averageLessonMinutes) || 45),
  );
  const units = (Array.isArray(raw.units) ? raw.units : [])
    .map((u) => normalizeUnit(u, averageLessonMinutes))
    .filter(Boolean);
  return {
    id: String(raw.id || newId('pacing')),
    title: String(raw.title || '').trim() || 'Curriculum',
    contentKey: String(raw.contentKey || '').trim(),
    averageLessonMinutes,
    units,
    startDate: String(raw.startDate || toIsoDate(new Date())),
  };
}

/**
 * Placement of a lesson slot onto a calendar day (district or teacher path).
 * @returns {{
 *   id: string,
 *   pacingId: string,
 *   slotId: string,
 *   date: string,
 *   contentKey: string,
 *   status: 'open'|'partial'|'done',
 *   source: 'district'|'teacher',
 *   minutesPlanned: number,
 *   notes: string,
 * }}
 */
export function normalizePlacement(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const status = LESSON_STATUSES.includes(raw.status) ? raw.status : 'open';
  const source = raw.source === 'teacher' ? 'teacher' : 'district';
  return {
    id: String(raw.id || newId('place')),
    pacingId: String(raw.pacingId || ''),
    slotId: String(raw.slotId || ''),
    date: String(raw.date || ''),
    contentKey: String(raw.contentKey || ''),
    status,
    source,
    minutesPlanned: Math.max(0, Math.round(Number(raw.minutesPlanned) || 0)),
    notes: String(raw.notes || ''),
  };
}

export function flattenSlots(pacing) {
  const out = [];
  for (const unit of pacing?.units || []) {
    for (const lesson of unit.lessons || []) {
      out.push({ unitId: unit.id, unitTitle: unit.title, lesson });
    }
  }
  return out;
}

/**
 * Build sequential district placements from startDate, one slot per instructional day.
 */
export function buildDistrictPlacements(pacing, blockOutDates = []) {
  const blockOutSet = new Set(blockOutDates.map(String));
  const slots = flattenSlots(pacing);
  if (!slots.length) return [];
  let date = pacing.startDate;
  if (!isInstructionalDay(date, blockOutSet)) {
    date = nextInstructionalDay(addDays(date, -1), blockOutSet);
  }
  const placements = [];
  for (const { lesson } of slots) {
    placements.push(
      normalizePlacement({
        id: newId('dplace'),
        pacingId: pacing.id,
        slotId: lesson.id,
        date,
        contentKey: pacing.contentKey,
        status: 'open',
        source: 'district',
        minutesPlanned: lesson.averageMinutes,
      }),
    );
    date = nextInstructionalDay(date, blockOutSet);
  }
  return placements;
}

/**
 * Rebuild district placements from a given date forward, keeping earlier ones.
 * Done/partial on district path stay; open ones from fromDate are replaced.
 */
export function rebuildDistrictFrom(pacing, existingPlacements, fromDate, blockOutDates = []) {
  const blockOutSet = new Set(blockOutDates.map(String));
  const kept = (existingPlacements || []).filter(
    (pl) =>
      pl.pacingId === pacing.id &&
      pl.source === 'district' &&
      pl.date < fromDate,
  );
  const placedSlotIds = new Set(kept.map((p) => p.slotId));
  const remaining = flattenSlots(pacing).filter(
    (s) => !placedSlotIds.has(s.lesson.id),
  );
  let date = fromDate;
  if (!isInstructionalDay(date, blockOutSet)) {
    date = nextInstructionalDay(addDays(date, -1), blockOutSet);
  }
  const fresh = remaining.map(({ lesson }) =>
    normalizePlacement({
      id: newId('dplace'),
      pacingId: pacing.id,
      slotId: lesson.id,
      date: (() => {
        const d = date;
        date = nextInstructionalDay(date, blockOutSet);
        return d;
      })(),
      contentKey: pacing.contentKey,
      status: 'open',
      source: 'district',
      minutesPlanned: lesson.averageMinutes,
    }),
  );
  const other = (existingPlacements || []).filter(
    (pl) => !(pl.pacingId === pacing.id && pl.source === 'district'),
  );
  return [...other, ...kept, ...fresh];
}

/**
 * Teacher view of a day: teacher placements override district for same slot.
 */
export function placementsForDate(store, date, { preferTeacher = true } = {}) {
  const day = String(date);
  const district = (store.districtPlacements || []).filter((p) => p.date === day);
  const teacher = (store.teacherPlacements || []).filter((p) => p.date === day);
  if (!preferTeacher) return [...district, ...teacher];
  const teacherBySlot = new Map(teacher.map((p) => [`${p.pacingId}:${p.slotId}`, p]));
  const merged = [];
  for (const d of district) {
    const key = `${d.pacingId}:${d.slotId}`;
    merged.push(teacherBySlot.get(key) || d);
    teacherBySlot.delete(key);
  }
  for (const t of teacherBySlot.values()) merged.push(t);
  return merged;
}

export function findSlot(store, pacingId, slotId) {
  const pacing = (store.pacings || []).find((p) => p.id === pacingId);
  if (!pacing) return null;
  for (const unit of pacing.units) {
    const lesson = unit.lessons.find((l) => l.id === slotId);
    if (lesson) return { pacing, unit, lesson };
  }
  return null;
}

/**
 * Create pacings framework from onboarding answers.
 */
export function createPacingFromOnboarding({
  title,
  contentKey,
  averageLessonMinutes,
  unitLessonCounts,
  startDate,
}) {
  const avg = Math.max(1, Math.round(Number(averageLessonMinutes) || 45));
  const counts = Array.isArray(unitLessonCounts) ? unitLessonCounts : [];
  const units = counts.map((n, i) => {
    const count = Math.max(0, Math.round(Number(n) || 0));
    return normalizeUnit({
      id: newId('unit'),
      title: `Unit ${i + 1}`,
      lessons: Array.from({ length: count }, (_, j) =>
        normalizeLessonSlot({
          id: newId('slot'),
          title: `Lesson ${j + 1}`,
          averageMinutes: avg,
        }),
      ),
    });
  });
  return normalizePacing({
    id: newId('pacing'),
    title: String(title || '').trim() || 'Curriculum',
    contentKey: String(contentKey || '').trim(),
    averageLessonMinutes: avg,
    units,
    startDate: startDate || toIsoDate(new Date()),
  });
}

/**
 * Roll open/partial teacher placements from `fromDate` to next instructional day.
 */
export function rollOpenPlacements(teacherPlacements, fromDate, blockOutDates = []) {
  const blockOutSet = new Set(blockOutDates.map(String));
  const next = nextInstructionalDay(fromDate, blockOutSet);
  return (teacherPlacements || []).map((pl) => {
    if (pl.date !== fromDate) return pl;
    if (pl.status === 'done') return pl;
    return { ...pl, date: next, status: 'open' };
  });
}

/**
 * Ensure teacher placements exist for today's district items (copy-on-write).
 */
export function ensureTeacherCopies(store, date) {
  const day = String(date);
  const existing = new Set(
    (store.teacherPlacements || [])
      .filter((p) => p.date === day)
      .map((p) => `${p.pacingId}:${p.slotId}`),
  );
  const copies = [];
  for (const d of store.districtPlacements || []) {
    if (d.date !== day) continue;
    const key = `${d.pacingId}:${d.slotId}`;
    if (existing.has(key)) continue;
    copies.push(
      normalizePlacement({
        ...d,
        id: newId('tplace'),
        source: 'teacher',
        status: 'open',
      }),
    );
  }
  return [...(store.teacherPlacements || []), ...copies];
}

export function setTeacherStatus(store, placementId, status) {
  if (!LESSON_STATUSES.includes(status)) return store;
  const teacherPlacements = (store.teacherPlacements || []).map((pl) =>
    pl.id === placementId ? { ...pl, status } : pl,
  );
  return { ...store, teacherPlacements };
}

/**
 * Move a teacher placement to a target date (reinstate / stretch).
 */
export function moveTeacherPlacement(store, placementId, toDate) {
  const teacherPlacements = (store.teacherPlacements || []).map((pl) =>
    pl.id === placementId ? { ...pl, date: String(toDate), status: 'open' } : pl,
  );
  return { ...store, teacherPlacements };
}

/**
 * Insert a disruption: shrink minutes on a placement; remainder creates/extends next day.
 */
export function applyDisruption(store, placementId, minutesUsed, blockOutDates = []) {
  const blockOutSet = new Set(blockOutDates.map(String));
  const pl = (store.teacherPlacements || []).find((p) => p.id === placementId);
  if (!pl) return store;
  const used = Math.max(0, Math.round(Number(minutesUsed) || 0));
  if (used >= pl.minutesPlanned) {
    return setTeacherStatus(store, placementId, 'done');
  }
  const remainder = pl.minutesPlanned - used;
  const next = nextInstructionalDay(pl.date, blockOutSet);
  const teacherPlacements = (store.teacherPlacements || []).map((p) => {
    if (p.id !== placementId) return p;
    return { ...p, minutesPlanned: used, status: 'partial' };
  });
  teacherPlacements.push(
    normalizePlacement({
      id: newId('tplace'),
      pacingId: pl.pacingId,
      slotId: pl.slotId,
      date: next,
      contentKey: pl.contentKey,
      status: 'open',
      source: 'teacher',
      minutesPlanned: remainder,
      notes: 'Remainder after disruption',
    }),
  );
  return { ...store, teacherPlacements };
}

/**
 * Pace lag in instructional days: teacher furthest open vs district expected for today.
 */
export function paceLagDays(store, todayIso, blockOutDates = []) {
  const blockOutSet = new Set(blockOutDates.map(String));
  let maxLag = 0;
  for (const pacing of store.pacings || []) {
    const district = (store.districtPlacements || [])
      .filter((p) => p.pacingId === pacing.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    const expected = district.find((p) => p.date >= todayIso) || district[district.length - 1];
    if (!expected) continue;
    const teacherOpen = (store.teacherPlacements || [])
      .filter((p) => p.pacingId === pacing.id && p.status !== 'done')
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    const teacherDate = teacherOpen?.date || expected.date;
    // Count instructional days teacherDate is behind expected.date
    let lag = 0;
    let cursor = teacherDate;
    while (cursor < expected.date && lag < 40) {
      cursor = nextInstructionalDay(cursor, blockOutSet);
      lag += 1;
    }
    if (teacherDate > expected.date) lag = 0;
    if (lag > maxLag) maxLag = lag;
  }
  return maxLag;
}

export function emptyStore() {
  return {
    schoolId: 'tes',
    gradeId: 'g3',
    pacings: [],
    districtPlacements: [],
    teacherPlacements: [],
    blockOutDates: [],
    checkIns: {},
  };
}

export function normalizeStore(raw) {
  const base = emptyStore();
  if (!raw || typeof raw !== 'object') return base;
  return {
    schoolId: String(raw.schoolId || 'tes'),
    gradeId: String(raw.gradeId || 'g3'),
    pacings: (Array.isArray(raw.pacings) ? raw.pacings : [])
      .map(normalizePacing)
      .filter(Boolean),
    districtPlacements: (Array.isArray(raw.districtPlacements)
      ? raw.districtPlacements
      : []
    )
      .map(normalizePlacement)
      .filter(Boolean),
    teacherPlacements: (Array.isArray(raw.teacherPlacements)
      ? raw.teacherPlacements
      : []
    )
      .map(normalizePlacement)
      .filter(Boolean),
    blockOutDates: (Array.isArray(raw.blockOutDates) ? raw.blockOutDates : [])
      .map(String)
      .filter(Boolean),
    checkIns:
      raw.checkIns && typeof raw.checkIns === 'object' ? { ...raw.checkIns } : {},
  };
}

/** Monday ISO of the week containing iso. */
export function weekMonday(iso) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

export function weekDates(mondayIso) {
  return [0, 1, 2, 3, 4].map((i) => addDays(mondayIso, i));
}
