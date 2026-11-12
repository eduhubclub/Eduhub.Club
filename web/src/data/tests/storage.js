import { getSupabase } from '../auth/supabaseClient';
import { publishSchedule } from './calendarSync';
import {
  isUuid,
  newId,
  coverSchedule,
  normalizeAssessment,
  normalizeSchedule,
  pointsPossible,
  scoreAttempt,
  standardIdsOf,
} from './model';

const KEY = 'eduHub.tests.v1';
export const TESTS_STORE_EVENT = 'eduHub.tests.changed';

function emptyStore() {
  return { assessments: [], assignments: [], attempts: [], schedules: [] };
}

function readJson() {
  try {
    if (typeof localStorage === 'undefined') return emptyStore();
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
    };
  } catch {
    return emptyStore();
  }
}

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(TESTS_STORE_EVENT));
}

export function readStore() {
  const store = readJson();
  return {
    assessments: store.assessments.map((row) => normalizeAssessment(row)),
    assignments: store.assignments.map(normalizeAssignment).filter(Boolean),
    attempts: store.attempts.map(normalizeAttempt).filter(Boolean),
    schedules: (store.schedules || []).map(normalizeSchedule).filter(Boolean),
  };
}

function writeStore(store) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(store));
    }
  } catch {
    /* ignore quota */
  }
  emit();
  return readStore();
}

function clientOrNull() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

function newer(left, right) {
  return String(left || '') >= String(right || '');
}

export function normalizeAssignment(raw) {
  if (!raw?.id || !raw.assessmentId || !raw.classId) return null;
  const delivery = ['self_paced', 'teacher_paced', 'paper_entry'].includes(raw.delivery)
    ? raw.delivery
    : 'self_paced';
  return {
    id: String(raw.id),
    assessmentId: String(raw.assessmentId),
    classId: String(raw.classId),
    delivery,
    assignedAt: raw.assignedAt || new Date().toISOString(),
  };
}

export function normalizeAttempt(raw) {
  if (!raw?.id || !raw.assignmentId || !raw.studentId) return null;
  return {
    id: String(raw.id),
    assignmentId: String(raw.assignmentId),
    studentId: String(raw.studentId),
    status: raw.status || 'not_started',
    answers: raw.answers && typeof raw.answers === 'object' ? raw.answers : {},
    pointsEarned: raw.pointsEarned == null ? null : Number(raw.pointsEarned),
    pointsPossible: raw.pointsPossible == null ? null : Number(raw.pointsPossible),
    proficiency: raw.proficiency || null,
    teacherEntered: Boolean(raw.teacherEntered),
    closedAt: raw.closedAt || null,
    submittedAt: raw.submittedAt || null,
    resultsSnapshot: raw.resultsSnapshot && typeof raw.resultsSnapshot === 'object'
      ? raw.resultsSnapshot
      : null,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function assessmentFromRow(row) {
  if (!row) return null;
  return normalizeAssessment({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    subject: row.subject,
    purpose: row.purpose,
    scoreMode: row.score_mode,
    formatTemplate: row.format_template,
    shelf: row.shelf,
    archived: row.archived,
    bridge: row.bridge,
    items: row.items,
    resultsTemplate: row.results_template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function assignmentFromRow(row) {
  return normalizeAssignment({
    id: row.id,
    assessmentId: row.assessment_id,
    classId: row.class_id,
    delivery: row.delivery,
    assignedAt: row.assigned_at,
  });
}

function attemptFromRow(row) {
  if (!row) return null;
  const answers = row.answers || {};
  const flat = {};
  for (const [itemId, stored] of Object.entries(answers)) {
    flat[itemId] = stored?.value && typeof stored.value === 'object' ? stored.value : stored;
  }
  return normalizeAttempt({
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    status: row.status,
    answers: row.status === 'in_progress' ? answers : flat,
    pointsEarned: row.points_earned,
    pointsPossible: row.points_possible,
    proficiency: row.proficiency,
    teacherEntered: row.teacher_entered,
    closedAt: row.closed_at,
    submittedAt: row.submitted_at,
    resultsSnapshot: row.results_snapshot,
    updatedAt: row.updated_at,
  });
}

function mergeById(localRows, cloudRows) {
  const map = new Map(localRows.map((row) => [row.id, row]));
  for (const row of cloudRows) {
    if (!row?.id) continue;
    const current = map.get(row.id);
    if (!current || newer(row.updatedAt || row.assignedAt, current.updatedAt || current.assignedAt)) {
      map.set(row.id, row);
    }
  }
  return [...map.values()];
}

export async function hydrateStore(ownerId) {
  const local = readStore();
  const supabase = clientOrNull();
  if (!supabase || !isUuid(ownerId)) return local;
  try {
    const [assessments, assignments, attempts] = await Promise.all([
      supabase.from('assessments').select('*'),
      supabase.from('assessment_assignments').select('*'),
      supabase.from('assessment_attempts').select('*'),
    ]);
    if (assessments.error || assignments.error || attempts.error) return local;
    const next = {
      assessments: mergeById(
        local.assessments,
        (assessments.data || []).map(assessmentFromRow).filter(Boolean),
      ),
      assignments: mergeById(
        local.assignments,
        (assignments.data || []).map(assignmentFromRow).filter(Boolean),
      ),
      attempts: mergeById(
        local.attempts,
        (attempts.data || []).map(attemptFromRow).filter(Boolean),
      ),
      schedules: local.schedules || [],
    };
    return writeStore(next);
  } catch {
    return local;
  }
}

function assessmentRow(assessment) {
  return {
    id: assessment.id,
    owner_id: assessment.ownerId,
    title: assessment.title,
    subject: assessment.subject,
    purpose: assessment.purpose,
    score_mode: assessment.scoreMode,
    format_template: assessment.formatTemplate,
    shelf: assessment.shelf,
    archived: assessment.archived,
    bridge: assessment.bridge,
    items: assessment.items,
    results_template: assessment.resultsTemplate,
    standard_ids: standardIdsOf(assessment),
    updated_at: assessment.updatedAt,
  };
}

async function pushAssessment(assessment) {
  const supabase = clientOrNull();
  if (!supabase || !isUuid(assessment.ownerId) || !isUuid(assessment.id)) return;
  await supabase.from('assessments').upsert(assessmentRow(assessment));
}

async function pushAssignment(assignment) {
  const supabase = clientOrNull();
  if (!supabase || !isUuid(assignment.id) || !isUuid(assignment.assessmentId)) return;
  await supabase.from('assessment_assignments').upsert({
    id: assignment.id,
    assessment_id: assignment.assessmentId,
    class_id: assignment.classId,
    delivery: assignment.delivery,
    assigned_at: assignment.assignedAt,
  });
}

export function upsertAssessment(raw) {
  const assessment = normalizeAssessment({
    ...raw,
    updatedAt: new Date().toISOString(),
  });
  const store = readStore();
  const rest = store.assessments.filter((row) => row.id !== assessment.id);
  writeStore({ ...store, assessments: [assessment, ...rest] });
  pushAssessment(assessment).catch(() => {});
  return assessment;
}

export function assignmentForClass(store, assessmentId, classId) {
  return (
    store.assignments.find(
      (row) => row.assessmentId === assessmentId && row.classId === classId,
    ) || null
  );
}

export function assignAssessment({ assessmentId, classId, delivery = 'self_paced' }) {
  const store = readStore();
  const existing = assignmentForClass(store, assessmentId, classId);
  if (existing) return existing;
  const assignment = normalizeAssignment({
    id: newId(),
    assessmentId,
    classId,
    delivery,
    assignedAt: new Date().toISOString(),
  });
  writeStore({ ...store, assignments: [assignment, ...store.assignments] });
  pushAssignment(assignment).catch(() => {});
  return assignment;
}

export function attemptFor(store, assignmentId, studentId) {
  return (
    store.attempts.find(
      (row) => row.assignmentId === assignmentId && row.studentId === String(studentId),
    ) || null
  );
}

function putAttempt(attempt) {
  const store = readStore();
  const rest = store.attempts.filter((row) => row.id !== attempt.id);
  writeStore({ ...store, attempts: [attempt, ...rest] });
  return attempt;
}

function rawAnswers(answers) {
  const raw = {};
  for (const [itemId, stored] of Object.entries(answers || {})) {
    raw[itemId] = stored?.value && typeof stored.value === 'object' ? stored.value : stored;
  }
  return raw;
}

export async function saveProgress({ assignment, studentId, actorId, answers }) {
  const existing = attemptFor(readStore(), assignment.id, studentId);
  if (existing && ['needs_grading', 'graded', 'closed'].includes(existing.status)) {
    return existing;
  }
  const attempt = normalizeAttempt({
    id: existing?.id || newId(),
    assignmentId: assignment.id,
    studentId,
    status: 'in_progress',
    answers: rawAnswers(answers),
    pointsEarned: null,
    pointsPossible: null,
    proficiency: null,
    teacherEntered: false,
    closedAt: null,
    submittedAt: null,
    resultsSnapshot: null,
    updatedAt: new Date().toISOString(),
  });
  putAttempt(attempt);
  const supabase = clientOrNull();
  if (supabase && isUuid(actorId) && actorId === String(studentId) && isUuid(assignment.id)) {
    try {
      await supabase.rpc('save_assessment_progress', {
        p_assignment_id: assignment.id,
        p_answers: rawAnswers(answers),
      });
    } catch {
      /* local attempt still stands */
    }
  }
  return attempt;
}

export async function submitAttempt({ assessment, assignment, studentId, actorId, answers }) {
  const existing = attemptFor(readStore(), assignment.id, studentId);
  if (existing?.status === 'closed') return existing;
  const scored = scoreAttempt(assessment, rawAnswers(answers));
  const attempt = normalizeAttempt({
    id: existing?.id || newId(),
    assignmentId: assignment.id,
    studentId,
    status: scored.status,
    answers: scored.answers,
    pointsEarned: scored.pointsEarned,
    pointsPossible: scored.pointsPossible,
    proficiency: null,
    teacherEntered: false,
    closedAt: null,
    submittedAt: new Date().toISOString(),
    resultsSnapshot: null,
    updatedAt: new Date().toISOString(),
  });
  putAttempt(attempt);

  const supabase = clientOrNull();
  if (supabase && isUuid(actorId) && actorId === String(studentId) && isUuid(assignment.id)) {
    try {
      const { data, error } = await supabase.rpc('submit_assessment_attempt', {
        p_assignment_id: assignment.id,
        p_answers: rawAnswers(answers),
      });
      if (!error && data) {
        const cloud = attemptFromRow(data);
        if (cloud) {
          cloud.answers = scored.answers;
          return putAttempt({ ...attempt, ...cloud, id: cloud.id || attempt.id });
        }
      }
    } catch {
      /* local score still stands */
    }
  }
  return attempt;
}

export async function closeAttempt({
  assignment,
  studentId,
  actorId,
  pointsEarned,
  pointsPossible,
}) {
  const existing = attemptFor(readStore(), assignment.id, studentId);
  const earned = Number(pointsEarned);
  const possible = Number(pointsPossible);
  const attempt = normalizeAttempt({
    id: existing?.id || newId(),
    assignmentId: assignment.id,
    studentId,
    status: 'closed',
    answers: existing?.answers || {},
    pointsEarned: Number.isFinite(earned) ? earned : 0,
    pointsPossible: Number.isFinite(possible) ? possible : pointsPossibleOfAssignment(assignment),
    proficiency: existing?.proficiency || null,
    teacherEntered: true,
    closedAt: new Date().toISOString(),
    submittedAt: existing?.submittedAt || null,
    resultsSnapshot: existing?.resultsSnapshot || null,
    updatedAt: new Date().toISOString(),
  });
  putAttempt(attempt);

  const supabase = clientOrNull();
  if (supabase && isUuid(actorId) && isUuid(assignment.id)) {
    try {
      const { data, error } = await supabase.rpc('close_assessment_attempt', {
        p_assignment_id: assignment.id,
        p_student_id: String(studentId),
        p_points_earned: attempt.pointsEarned,
        p_points_possible: attempt.pointsPossible,
      });
      if (!error && data) {
        const cloud = attemptFromRow(data);
        if (cloud) return putAttempt({ ...attempt, ...cloud, answers: attempt.answers });
      }
    } catch {
      /* local close still stands */
    }
  }
  return attempt;
}

function pointsPossibleOfAssignment(assignment) {
  const assessment = readStore().assessments.find((row) => row.id === assignment.assessmentId);
  return assessment ? pointsPossible(assessment.items) : 0;
}

export function upsertSchedule(raw, { title = 'Assessment', classIds = [] } = {}) {
  const schedule = coverSchedule(
    normalizeSchedule({ ...raw, updatedAt: new Date().toISOString() }),
  );
  if (!schedule) return null;
  const store = readStore();
  const rest = (store.schedules || []).filter((row) => row.id !== schedule.id);
  const schedules = [schedule, ...rest];
  writeStore({ ...store, schedules });
  publishSchedule(schedule, title, classIds, schedules);
  const targets =
    schedule.scope === 'district'
      ? classIds.filter(
          (classId) =>
            !schedules.some(
              (row) =>
                row.scope === 'class' &&
                row.classId === String(classId) &&
                row.assessmentId === schedule.assessmentId,
            ),
        )
      : schedule.assignOn || Object.keys(schedule.studentAssignOn).length
        ? [schedule.classId]
        : [];
  if (schedule.assignOn || Object.keys(schedule.studentAssignOn).length) {
    for (const classId of targets) {
      if (classId) {
        assignAssessment({
          assessmentId: schedule.assessmentId,
          classId,
          delivery: 'self_paced',
        });
      }
    }
  }
  return schedule;
}

export function assessmentsForOwner(store, ownerId) {
  return store.assessments.filter((row) => row.ownerId === ownerId);
}

export function assessmentsInLibrary(store, { ownerId, shelf, archived = false }) {
  return store.assessments.filter((row) => {
    if (row.shelf !== shelf) return false;
    if (Boolean(row.archived) !== Boolean(archived)) return false;
    if (shelf === 'mine' && row.ownerId !== ownerId) return false;
    return true;
  });
}

export function setAssessmentArchived(id, archived) {
  const current = readStore().assessments.find((row) => row.id === id);
  if (!current || current.shelf !== 'mine') return null;
  return upsertAssessment({ ...current, archived: Boolean(archived) });
}

export function copyAssessment(source, ownerId) {
  const base = normalizeAssessment(source);
  return upsertAssessment({
    ...base,
    id: newId(),
    ownerId: String(ownerId || ''),
    shelf: 'mine',
    archived: false,
    title: base.title ? `${base.title} copy` : 'Copy',
    createdAt: new Date().toISOString(),
  });
}
