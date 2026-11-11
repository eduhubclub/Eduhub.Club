/**
 * Deterministic elementary class placer.
 * Hard: locks, pairings, separations.
 * Soft: priorityOrder (gender, academics, behavior, teacher time, …).
 */

import {
  allStudentIds,
  studentDestinationGrade,
  teachersForDestinationGrade,
} from './classCreatorModel';

function normalizeGender(value) {
  const g = String(value || '').trim().toLowerCase();
  if (!g) return 'u';
  if (g.startsWith('f') || g === 'girl' || g === 'female') return 'f';
  if (g.startsWith('m') || g === 'boy' || g === 'male') return 'm';
  return 'u';
}

function ratingNumber(run, studentId, columnId) {
  const raw = run.ratings?.[studentId]?.[columnId];
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function classStats(run, teacherId, draftClasses) {
  const ids = draftClasses[teacherId] || [];
  const genders = { f: 0, m: 0, u: 0 };
  let academics = 0;
  let academicsN = 0;
  let behavior = 0;
  let behaviorN = 0;
  let teacherTime = 0;
  let teacherTimeN = 0;
  const services = {};

  for (const id of ids) {
    const student = run.students[id];
    if (!student) continue;
    genders[normalizeGender(student.gender)] += 1;
    const oa = ratingNumber(run, id, 'overall_academics');
    if (oa != null) {
      academics += oa;
      academicsN += 1;
    }
    const beh = ratingNumber(run, id, 'behavior');
    if (beh != null) {
      behavior += beh;
      behaviorN += 1;
    }
    const tt = ratingNumber(run, id, 'teacher_time');
    if (tt != null) {
      teacherTime += tt;
      teacherTimeN += 1;
    }
    for (const tag of student.services || []) {
      services[tag] = (services[tag] || 0) + 1;
    }
    const ratedServices = run.ratings?.[id]?.services;
    if (Array.isArray(ratedServices)) {
      for (const tag of ratedServices) {
        services[tag] = (services[tag] || 0) + 1;
      }
    }
  }

  return {
    count: ids.length,
    genders,
    academicsAvg: academicsN ? academics / academicsN : null,
    behaviorAvg: behaviorN ? behavior / behaviorN : null,
    teacherTimeAvg: teacherTimeN ? teacherTime / teacherTimeN : null,
    services,
  };
}

function wouldBreakSeparation(separations, draftClasses, teacherId, studentId) {
  const room = new Set(draftClasses[teacherId] || []);
  for (const edge of separations || []) {
    if (edge.a === studentId && room.has(edge.b)) return true;
    if (edge.b === studentId && room.has(edge.a)) return true;
  }
  return false;
}

function partnerId(pairings, studentId) {
  for (const edge of pairings || []) {
    if (edge.a === studentId) return edge.b;
    if (edge.b === studentId) return edge.a;
  }
  return null;
}

function scoreTeacher(run, teacherId, studentId, draftClasses, priorityOrder) {
  const stats = classStats(run, teacherId, draftClasses);
  const student = run.students[studentId] || {};
  const gender = normalizeGender(student.gender);
  let score = 0;

  // Prefer smaller classes so sizes stay even.
  score += (1000 - stats.count * 40);

  for (let i = 0; i < priorityOrder.length; i += 1) {
    const weight = (priorityOrder.length - i) * 10;
    const key = priorityOrder[i];
    if (key === 'gender') {
      const total = stats.genders.f + stats.genders.m || 1;
      const share = stats.genders[gender] / total;
      score += weight * (1 - share) * 20;
    } else if (key === 'overall_academics' || key === 'behavior' || key === 'teacher_time' || key === 'reading' || key === 'writing' || key === 'math') {
      const value = ratingNumber(run, studentId, key);
      if (value == null) continue;
      const avgKey =
        key === 'overall_academics'
          ? 'academicsAvg'
          : key === 'behavior'
            ? 'behaviorAvg'
            : key === 'teacher_time'
              ? 'teacherTimeAvg'
              : null;
      const avg = avgKey ? stats[avgKey] : null;
      if (avg == null) {
        score += weight * 5;
      } else {
        // Prefer rooms that pull the average toward the middle / balance extremes.
        score += weight * (10 - Math.abs(avg - value) * 2);
      }
    } else if (key === 'services') {
      const tags = [
        ...(student.services || []),
        ...(Array.isArray(run.ratings?.[studentId]?.services)
          ? run.ratings[studentId].services
          : []),
      ];
      let load = 0;
      for (const tag of tags) load += stats.services[tag] || 0;
      score += weight * (10 - load);
    }
  }

  return score;
}

/**
 * Build draft class lists from locks + constraints + priority balance.
 * @returns {{ draftClasses: Record<string, string[]>, unassigned: string[], warnings: string[] }}
 */
export function runPlacement(run) {
  const teachers = run.destinationTeachers || [];
  const warnings = [];
  if (!teachers.length) {
    return {
      draftClasses: {},
      unassigned: allStudentIds(run),
      warnings: ['Add destination teachers before running placement.'],
    };
  }

  const draftClasses = Object.fromEntries(teachers.map((t) => [t.id, []]));
  const placed = new Set();
  const ids = allStudentIds(run);
  const priorityOrder = run.priorityOrder?.length
    ? run.priorityOrder
    : ['gender', 'overall_academics', 'behavior', 'teacher_time'];

  const laneTeachers = (studentId) => {
    const dest = studentDestinationGrade(run, studentId);
    const lane = teachersForDestinationGrade(run, dest);
    return lane.length ? lane : teachers;
  };

  // 1. Locks first.
  for (const [studentId, teacherId] of Object.entries(run.locks || {})) {
    if (!draftClasses[teacherId]) {
      warnings.push(`Lock for ${studentId} points at a missing teacher.`);
      continue;
    }
    if (!ids.includes(studentId)) continue;
    draftClasses[teacherId].push(studentId);
    placed.add(studentId);
  }

  // 2. Place remaining, keeping pairings together and honoring separations.
  //    Students only go to teachers for their next-year grade (school-wide run).
  const remaining = ids.filter((id) => !placed.has(id));

  // Stable order: higher teacher-time / lower academics first (harder kids early).
  remaining.sort((a, b) => {
    const ttA = ratingNumber(run, a, 'teacher_time') ?? 2.5;
    const ttB = ratingNumber(run, b, 'teacher_time') ?? 2.5;
    if (ttA !== ttB) return ttB - ttA;
    const oaA = ratingNumber(run, a, 'overall_academics') ?? 2.5;
    const oaB = ratingNumber(run, b, 'overall_academics') ?? 2.5;
    return oaA - oaB;
  });

  const tryPlace = (studentId, preferredTeacherId = null) => {
    if (placed.has(studentId)) return true;
    const pool = laneTeachers(studentId);
    if (!pool.length) {
      warnings.push(
        `No ${studentDestinationGrade(run, studentId) || 'destination'} teachers for ${
          run.students[studentId]?.name || studentId
        }.`,
      );
      return false;
    }
    const candidates = preferredTeacherId
      ? pool.filter((t) => t.id === preferredTeacherId).concat(
          pool.filter((t) => t.id !== preferredTeacherId),
        )
      : [...pool];

    let best = null;
    let bestScore = -Infinity;
    for (const teacher of candidates) {
      if (wouldBreakSeparation(run.separations, draftClasses, teacher.id, studentId)) {
        continue;
      }
      const score = scoreTeacher(run, teacher.id, studentId, draftClasses, priorityOrder);
      if (score > bestScore) {
        bestScore = score;
        best = teacher.id;
      }
    }
    if (!best) {
      warnings.push(
        `Could not place ${run.students[studentId]?.name || studentId} without breaking a separation.`,
      );
      return false;
    }
    draftClasses[best].push(studentId);
    placed.add(studentId);
    return true;
  };

  for (const studentId of remaining) {
    if (placed.has(studentId)) continue;
    const partner = partnerId(run.pairings, studentId);
    if (partner && !placed.has(partner) && ids.includes(partner)) {
      // Place the harder of the pair first, then force the partner into the same room.
      const first = studentId;
      if (!tryPlace(first)) continue;
      const roomId = Object.keys(draftClasses).find((tid) =>
        draftClasses[tid].includes(first),
      );
      if (roomId && !placed.has(partner)) {
        if (wouldBreakSeparation(run.separations, draftClasses, roomId, partner)) {
          warnings.push(
            `Pairing conflict: ${run.students[first]?.name} and ${run.students[partner]?.name}.`,
          );
        } else {
          draftClasses[roomId].push(partner);
          placed.add(partner);
        }
      }
    } else {
      tryPlace(studentId);
    }
  }

  const unassigned = ids.filter((id) => !placed.has(id));
  return { draftClasses, unassigned, warnings };
}

/**
 * Constraint check after a manual move.
 * @returns {{ ok: boolean, breaks: string[] }}
 */
export function checkMoveConstraints(run, draftClasses, studentId, toTeacherId) {
  const breaks = [];
  const student = run.students[studentId];
  const name = student?.name || studentId;

  if (run.locks?.[studentId] && run.locks[studentId] !== toTeacherId) {
    const lockedTeacher = run.destinationTeachers.find(
      (t) => t.id === run.locks[studentId],
    );
    breaks.push(
      `${name} is locked to ${lockedTeacher?.name || 'another teacher'}.`,
    );
  }

  const room = new Set(draftClasses[toTeacherId] || []);
  for (const edge of run.separations || []) {
    const other = edge.a === studentId ? edge.b : edge.b === studentId ? edge.a : null;
    if (other && room.has(other)) {
      breaks.push(
        `${name} should be separated from ${run.students[other]?.name || other}.`,
      );
    }
  }

  for (const edge of run.pairings || []) {
    const other = edge.a === studentId ? edge.b : edge.b === studentId ? edge.a : null;
    if (!other) continue;
    const partnerRoom = Object.keys(draftClasses).find((tid) =>
      (draftClasses[tid] || []).includes(other),
    );
    if (partnerRoom && partnerRoom !== toTeacherId) {
      breaks.push(
        `${name} is paired with ${run.students[other]?.name || other}.`,
      );
    }
  }

  return { ok: breaks.length === 0, breaks };
}

/**
 * Move a student between draft classes (or unassigned pool via toTeacherId = null).
 */
export function moveStudent(draftClasses, unassigned, studentId, toTeacherId) {
  const nextDraft = Object.fromEntries(
    Object.entries(draftClasses).map(([tid, list]) => [
      tid,
      list.filter((id) => id !== studentId),
    ]),
  );
  let nextUnassigned = unassigned.filter((id) => id !== studentId);
  if (toTeacherId == null) {
    nextUnassigned = [...nextUnassigned, studentId];
  } else {
    nextDraft[toTeacherId] = [...(nextDraft[toTeacherId] || []), studentId];
  }
  return { draftClasses: nextDraft, unassigned: nextUnassigned };
}
