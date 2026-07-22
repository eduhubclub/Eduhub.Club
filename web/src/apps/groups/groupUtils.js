/** Common elementary subjects — teachers can also enter a custom name. */
export const GROUP_SUBJECT_OPTIONS = [
  'Reading',
  'Writing',
  'Math',
  'Science',
  'Social Studies',
  'Art',
  'Music',
  'PE',
  'Centers',
];

export const CUSTOM_SUBJECT_VALUE = '__custom__';

export function shuffleArray(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function defaultGroupName(index) {
  return `Group ${index + 1}`;
}

export function defaultGroupNames(count) {
  return Array.from({ length: count }, (_, i) => defaultGroupName(i));
}

export function resolveGroupName(names, index) {
  const label = (names?.[index] || '').trim();
  return label || defaultGroupName(index);
}

/** Undirected together / separate maps from stored per-student prefs. Separate wins ties. */
export function normalizePairingEdges(students, pairingPreferences) {
  const ids = new Set(students.map((s) => s.id));
  const separate = new Map();
  const together = new Map();
  const touch = (map, a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a).add(b);
    map.get(b).add(a);
  };

  for (const student of students) {
    const prefs = pairingPreferences[student.id];
    if (!prefs) continue;
    for (const otherId of prefs.separate || []) {
      if (ids.has(otherId) && otherId !== student.id) touch(separate, student.id, otherId);
    }
  }
  for (const student of students) {
    const prefs = pairingPreferences[student.id];
    if (!prefs) continue;
    for (const otherId of prefs.together || []) {
      if (!ids.has(otherId) || otherId === student.id) continue;
      if (separate.get(student.id)?.has(otherId)) continue;
      touch(together, student.id, otherId);
    }
  }
  return { together, separate };
}

function findTogetherClusters(students, together) {
  const byId = new Map(students.map((s) => [s.id, s]));
  const visited = new Set();
  const clusters = [];

  for (const student of students) {
    if (visited.has(student.id)) continue;
    const queue = [student.id];
    const clusterIds = [];
    visited.add(student.id);
    while (queue.length) {
      const id = queue.shift();
      clusterIds.push(id);
      for (const nextId of together.get(id) || []) {
        if (!visited.has(nextId) && byId.has(nextId)) {
          visited.add(nextId);
          queue.push(nextId);
        }
      }
    }
    clusters.push(shuffleArray(clusterIds.map((id) => byId.get(id))));
  }

  return shuffleArray(clusters);
}

function groupConflictsWithStudent(group, studentId, separate) {
  const forbidden = separate.get(studentId);
  if (!forbidden?.size) return false;
  return group.some((member) => forbidden.has(member.id));
}

function scoreGroupForStudent(group, studentId, together, separate, groupSize) {
  if (group.length >= groupSize) return -Infinity;
  if (groupConflictsWithStudent(group, studentId, separate)) return -Infinity;
  let score = groupSize - group.length;
  for (const member of group) {
    if (together.get(studentId)?.has(member.id)) score += 100;
  }
  return score;
}

/**
 * Shuffle into groups while honoring Pair / Separate prefs when possible.
 */
export function createGroupsWithPairings(students, groupSize, pairingPreferences = {}) {
  const n = Number(groupSize);
  if (!students.length || !Number.isFinite(n) || n < 1) return [];

  const { together, separate } = normalizePairingEdges(students, pairingPreferences);
  const clusters = findTogetherClusters(students, together);
  const groupCount = Math.ceil(students.length / n);
  const groups = Array.from({ length: groupCount }, () => []);

  const placeStudent = (student) => {
    let bestIndex = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < groups.length; i++) {
      const score = scoreGroupForStudent(groups[i], student.id, together, separate, n);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex < 0 || bestScore === -Infinity) {
      bestIndex = groups.reduce(
        (best, group, i, arr) => (group.length < arr[best].length ? i : best),
        0
      );
    }
    groups[bestIndex].push(student);
  };

  for (const cluster of clusters) {
    if (cluster.length > 1 && cluster.length <= n) {
      let bestIndex = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (group.length + cluster.length > n) continue;
        const blocked = cluster.some((student) =>
          groupConflictsWithStudent(group, student.id, separate)
        );
        if (blocked) continue;
        const score = n - group.length + cluster.length * 10;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      if (bestIndex >= 0) {
        groups[bestIndex].push(...cluster);
        continue;
      }
    }
    for (const student of cluster) placeStudent(student);
  }

  return groups.filter((group) => group.length > 0);
}

/** Keep Pair / Separate prefs mirrored on both students. */
export function syncPairingPreferences(prev, studentId, togetherIds, separateIds, rosterIds) {
  const next = { ...prev };
  const ensure = (id) => {
    const existing = next[id] || { together: [], separate: [] };
    next[id] = {
      together: [...existing.together],
      separate: [...existing.separate],
    };
    return next[id];
  };

  const previous = prev[studentId] || { together: [], separate: [] };
  const prevTogether = new Set(previous.together || []);
  const prevSeparate = new Set(previous.separate || []);
  const nextTogether = new Set(togetherIds);
  const nextSeparate = new Set(separateIds);

  ensure(studentId).together = [...nextTogether];
  ensure(studentId).separate = [...nextSeparate];

  for (const otherId of nextTogether) {
    if (!rosterIds.has(otherId)) continue;
    const other = ensure(otherId);
    if (!other.together.includes(studentId)) other.together.push(studentId);
    other.separate = other.separate.filter((id) => id !== studentId);
  }
  for (const otherId of nextSeparate) {
    if (!rosterIds.has(otherId)) continue;
    const other = ensure(otherId);
    if (!other.separate.includes(studentId)) other.separate.push(studentId);
    other.together = other.together.filter((id) => id !== studentId);
  }

  for (const otherId of prevTogether) {
    if (nextTogether.has(otherId) || !rosterIds.has(otherId)) continue;
    const other = ensure(otherId);
    other.together = other.together.filter((id) => id !== studentId);
  }
  for (const otherId of prevSeparate) {
    if (nextSeparate.has(otherId) || !rosterIds.has(otherId)) continue;
    const other = ensure(otherId);
    other.separate = other.separate.filter((id) => id !== studentId);
  }

  return next;
}
