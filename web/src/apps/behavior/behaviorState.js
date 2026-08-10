/**
 * Behavior catalog + point helpers (ClassDojo-style tracker).
 */

export const BEHAVIORS = {
  positive: [
    { id: 'p1', name: 'Helping Others', points: 1, icon: '🤝' },
    { id: 'p2', name: 'On Task', points: 1, icon: '🎯' },
    { id: 'p3', name: 'Teamwork', points: 2, icon: '👥' },
    { id: 'p4', name: 'Participating', points: 1, icon: '🙋' },
    { id: 'p5', name: 'Perseverance', points: 2, icon: '🧗' },
    { id: 'p6', name: 'Working Hard', points: 1, icon: '💪' },
  ],
  needsWork: [
    { id: 'n1', name: 'Off Task', points: -1, icon: '😴' },
    { id: 'n2', name: 'Talking Out', points: -1, icon: '🗣️' },
    { id: 'n3', name: 'Unprepared', points: -1, icon: '🎒' },
    { id: 'n4', name: 'Disrespectful', points: -2, icon: '😠' },
  ],
};

/** Classroom-friendly icons for custom behaviors. */
export const BEHAVIOR_ICON_CHOICES = [
  '🤝',
  '🎯',
  '👥',
  '🙋',
  '🧗',
  '💪',
  '⭐',
  '🌟',
  '📚',
  '✏️',
  '🧠',
  '💡',
  '🎨',
  '🎵',
  '🏃',
  '🧼',
  '🧹',
  '⏰',
  '👂',
  '👀',
  '😊',
  '😄',
  '😴',
  '🗣️',
  '🎒',
  '😠',
  '📱',
  '🚫',
  '💔',
  '🌪️',
];

export function allBehaviors() {
  return [...BEHAVIORS.positive, ...BEHAVIORS.needsWork];
}

/**
 * Merge built-in catalog with teacher-created / edited behaviors.
 * Entries in `custom` with a built-in id replace that default; new ids append.
 * @param {{ id: string, name: string, points: number, icon: string, category?: string }[]} [custom]
 */
export function mergeBehaviorCatalog(custom = []) {
  const posMap = new Map(
    BEHAVIORS.positive.map((b) => [b.id, { ...b, category: 'positive' }]),
  );
  const negMap = new Map(
    BEHAVIORS.needsWork.map((b) => [b.id, { ...b, category: 'needsWork' }]),
  );

  for (const item of custom) {
    if (!item?.id || !item?.name) continue;
    const entry = {
      id: String(item.id),
      name: String(item.name),
      points: Number(item.points) || 0,
      icon: item.icon || '⭐',
      category: item.category === 'needsWork' ? 'needsWork' : 'positive',
    };
    const isBuiltIn =
      BEHAVIORS.positive.some((b) => b.id === entry.id) ||
      BEHAVIORS.needsWork.some((b) => b.id === entry.id);
    entry.custom = !isBuiltIn;

    posMap.delete(entry.id);
    negMap.delete(entry.id);
    if (entry.category === 'needsWork') negMap.set(entry.id, entry);
    else posMap.set(entry.id, entry);
  }

  return {
    positive: [...posMap.values()],
    needsWork: [...negMap.values()],
  };
}

export function seedPointsFromRoster(roster = []) {
  const points = {};
  for (const student of roster) {
    const id = String(student.id);
    let h = 0;
    for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    points[id] = h % 10;
  }
  return points;
}

export function syncPointsWithRoster(points, roster = []) {
  const next = { ...points };
  const ids = new Set(roster.map((s) => String(s.id)));
  for (const id of Object.keys(next)) {
    if (!ids.has(id)) delete next[id];
  }
  for (const student of roster) {
    const id = String(student.id);
    if (next[id] == null) next[id] = 0;
  }
  return next;
}

const POINTS_STORAGE_KEY = 'eduHub.behavior.pointsByClass';
const AWARDS_STORAGE_KEY = 'eduHub.behavior.awardsByClass';
const AWARDS_KEEP = 300;

export const BEHAVIOR_POINTS_UPDATED_EVENT = 'eduHub.behavior.pointsUpdated';

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

export function getBehaviorPoints(classId, studentId) {
  if (!classId) return 0;
  const map = readPointsMap()[String(classId)] || {};
  return Number(map[String(studentId)]) || 0;
}

/**
 * Deduct behavior points for a store redeem (storage-level).
 */
export function spendBehaviorPoints({
  classId,
  roster,
  studentIds,
  amount,
  itemName,
}) {
  if (!classId || !studentIds?.length) {
    return { ok: false, error: 'Missing class or students.' };
  }
  const pts = Math.max(0, Math.round(Number(amount) || 0));
  if (!pts) return { ok: false, error: 'Price must be greater than zero.' };

  const allPoints = readPointsMap();
  let classPoints = syncPointsWithRoster(
    allPoints[String(classId)] || seedPointsFromRoster(roster),
    roster,
  );
  const selected = studentIds.map(String);
  const failed = [];
  const redeemedIds = [];

  for (const id of selected) {
    const current = Number(classPoints[id]) || 0;
    if (current < pts) {
      failed.push({ studentId: id, error: 'Insufficient points.' });
      continue;
    }
    classPoints = { ...classPoints, [id]: current - pts };
    redeemedIds.push(id);
  }

  if (!redeemedIds.length) {
    return { ok: false, error: failed[0]?.error || 'Redeem failed.', failed };
  }

  allPoints[String(classId)] = classPoints;
  writePointsMap(allPoints);

  const allAwards = readAwardsMap();
  const recent = Array.isArray(allAwards[String(classId)])
    ? allAwards[String(classId)]
    : [];
  const entry = {
    id: `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
    type: 'store_redeem',
    itemName: itemName || 'Item',
    points: -pts,
    studentIds: redeemedIds,
  };
  allAwards[String(classId)] = [entry, ...recent].slice(0, AWARDS_KEEP);
  writeAwardsMap(allAwards);

  try {
    window.dispatchEvent(
      new CustomEvent(BEHAVIOR_POINTS_UPDATED_EVENT, {
        detail: { classId: String(classId), points: classPoints },
      }),
    );
  } catch {
    /* ignore */
  }

  return { ok: true, redeemedIds, failed };
}
