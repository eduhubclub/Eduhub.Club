/**
 * Demo-only next-year draft for teachers — mock ratings from the current class roster.
 */

import {
  DEFAULT_SCALE,
  nextGradeFor,
  normalizeStudentSnapshot,
} from './classCreatorModel';
import { runPlacement } from './placementEngine';

const MOCK_DEST_NAMES = ['Ms. Avery', 'Mr. Brooks', 'Mrs. Castillo'];

function hashString(value) {
  let h = 0;
  const s = String(value || '');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic 1–4 from student id + column (stable across reloads). */
export function mockRatingValue(studentId, columnId) {
  const n = hashString(`${studentId}:${columnId}`);
  return (n % 4) + 1;
}

const PRIOR_SERVICE_POOL = ['iep', '504', 'ml', 'speech', 'reading_intervention'];

/** Prior-year scale columns for Dashboard roster summaries / chips. */
export const PRIOR_SCALE_COLUMNS = [
  'overall_academics',
  'reading',
  'writing',
  'math',
  'teacher_time',
  'behavior',
];

/** Prior-year ratings for Dashboard current rosters (all scale categories + occasional services). */
export function seedPriorRating(studentId) {
  const id = String(studentId || '');
  const services = [];
  if (hashString(`prior:svc:${id}`) % 5 === 0) {
    services.push(PRIOR_SERVICE_POOL[hashString(`prior:svcPick:${id}`) % PRIOR_SERVICE_POOL.length]);
  }
  const scales = Object.fromEntries(
    PRIOR_SCALE_COLUMNS.map((col) => [col, mockRatingValue(id, `prior:${col}`)]),
  );
  return {
    ...scales,
    ...(services.length ? { services } : {}),
  };
}

/** Ensure prior-year scale chips (mock) — keeps any richer stored fields. */
export function ensurePriorRating(existing, studentId) {
  const seeded = seedPriorRating(studentId);
  if (!existing || typeof existing !== 'object') return seeded;
  const scales = Object.fromEntries(
    PRIOR_SCALE_COLUMNS.map((col) => [col, seeded[col]]),
  );
  return {
    ...existing,
    ...scales,
    services:
      Array.isArray(existing.services) && existing.services.length
        ? existing.services
        : seeded.services,
  };
}

function mockGender(student, index) {
  const g = String(student.gender || '').trim();
  if (g) return g;
  return index % 2 === 0 ? 'F' : 'M';
}

/**
 * Build a preview placement run from a teacher's current class.
 * @param {object} cls — selected / Demo Class
 * @param {{ yearLabel?: string }} [opts]
 */
export function buildDemoTeacherResults(cls, opts = {}) {
  const studentsList = cls?.studentList || [];
  if (!studentsList.length) return null;

  const sourceGrade = String(cls.grade || '3rd Grade');
  const destinationGrade = nextGradeFor(sourceGrade) || '4th Grade';
  const teacherCount = Math.min(3, Math.max(2, Math.ceil(studentsList.length / 8)));

  const students = {};
  const cohortStudentIds = [];
  const ratings = {};

  studentsList.forEach((raw, index) => {
    const snap = normalizeStudentSnapshot({
      ...raw,
      gender: mockGender(raw, index),
      grade_level: raw.grade_level || sourceGrade,
      source: 'roster',
    });
    students[snap.id] = snap;
    cohortStudentIds.push(snap.id);
    ratings[snap.id] = {
      overall_academics: mockRatingValue(snap.id, 'overall_academics'),
      reading: mockRatingValue(snap.id, 'reading'),
      writing: mockRatingValue(snap.id, 'writing'),
      math: mockRatingValue(snap.id, 'math'),
      teacher_time: mockRatingValue(snap.id, 'teacher_time'),
      behavior: mockRatingValue(snap.id, 'behavior'),
      notes: '',
    };
  });

  const destinationTeachers = MOCK_DEST_NAMES.slice(0, teacherCount).map((name, i) => ({
    id: `demo-dest-${i + 1}`,
    name,
    room: '',
    isProvisional: false,
    staffId: '',
    currentGrade: sourceGrade,
    destinationGrade,
  }));

  const seedRun = {
    destinationTeachers,
    students,
    cohortStudentIds,
    externalStudentIds: [],
    locks: {},
    separations: [],
    pairings: [],
    ratings,
    priorityOrder: ['gender', 'overall_academics', 'behavior', 'teacher_time'],
    draftClasses: {},
    unassigned: [],
  };

  const placed = runPlacement(seedRun);

  return {
    id: 'demo-teacher-preview',
    schoolName: cls.school || 'Demo school',
    yearLabel: opts.yearLabel || 'Next year',
    gradeBand: 'k5',
    sourceGrade,
    destinationGrade,
    destinationTeachers,
    students,
    cohortStudentIds,
    ratings,
    draftClasses: placed.draftClasses,
    unassigned: placed.unassigned,
    sharedWithTeachers: true,
    teacherFeedback: {},
    isDemoPreview: true,
    schema: { scale: DEFAULT_SCALE },
  };
}

export function scaleLabelForValue(value) {
  const level = DEFAULT_SCALE.levels.find((row) => row.value === Number(value));
  return level?.label || String(value);
}
