/**
 * Shared Tests + Grades record.
 * Scoring here is the local source of truth. The Supabase submit function
 * mirrors these rules so a finished attempt is the same on every computer.
 */

export const ITEM_TYPES = [
  'choose_one',
  'choose_many',
  'match',
  'order',
  'number',
  'short_write',
  'long_write',
];

export const AUTO_TYPES = ['choose_one', 'choose_many', 'match', 'order', 'number'];
export const WRITING_TYPES = ['short_write', 'long_write'];

export const DELIVERIES = ['self_paced', 'teacher_paced', 'paper_entry'];
export const PURPOSES = ['formative', 'summative'];
export const SCORE_MODES = ['points', 'proficiency', 'both'];
export const FORMAT_TEMPLATES = ['stage', 'passage', 'live'];
export const RESULT_BLOCKS = ['score', 'missed', 'standards', 'practice', 'note'];

export const DELIVERY_LABELS = {
  self_paced: 'Self-paced',
  teacher_paced: 'Teacher-paced',
  paper_entry: 'Paper entry',
};

export const PURPOSE_LABELS = {
  formative: 'Formative',
  summative: 'Summative',
};

export const SCORE_MODE_LABELS = {
  points: 'Points',
  proficiency: 'Proficiency',
  both: 'Points and proficiency',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isUuid(value) {
  return UUID_RE.test(String(value || ''));
}

export function parseStandardIds(value) {
  const parts = Array.isArray(value) ? value : String(value || '').split(/[,;\n]/);
  const ids = [];
  for (const part of parts) {
    const clean = String(part || '').trim();
    if (clean && !ids.includes(clean)) ids.push(clean);
  }
  return ids;
}

export function defaultResultsTemplate() {
  return {
    blocks: [...RESULT_BLOCKS],
    hidden: [],
    note: '',
  };
}

function asPoints(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 1;
  return Math.round(num * 100) / 100;
}

function cleanChoices(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((choice) => ({
      id: String(choice?.id || newId()),
      label: String(choice?.label || ''),
    }))
    .slice(0, 8);
}

export function blankItem(type = 'choose_one') {
  const kind = ITEM_TYPES.includes(type) ? type : 'choose_one';
  const base = {
    id: newId(),
    type: kind,
    prompt: '',
    points: 1,
    standardIds: [],
    readAloud: true,
  };
  if (kind === 'choose_one' || kind === 'choose_many') {
    return {
      ...base,
      choices: [
        { id: newId(), label: '' },
        { id: newId(), label: '' },
      ],
      correctChoiceId: '',
      correctChoiceIds: [],
    };
  }
  if (kind === 'number') return { ...base, correctNumber: '' };
  if (kind === 'match') return { ...base, pairs: [], correctPairs: [] };
  if (kind === 'order') return { ...base, orderIds: [], correctOrder: [] };
  return base;
}

export function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = ITEM_TYPES.includes(raw.type) ? raw.type : '';
  if (!type) return null;
  const standardIds = parseStandardIds(raw.standardText ?? raw.standardIds);
  const item = {
    id: String(raw.id || newId()),
    type,
    prompt: String(raw.prompt || '').trim(),
    points: asPoints(raw.points),
    standardIds,
    readAloud: raw.readAloud !== false,
  };
  if (type === 'choose_one' || type === 'choose_many') {
    item.choices = cleanChoices(raw.choices).filter((choice) => choice.label.trim());
    item.correctChoiceId = String(raw.correctChoiceId || '');
    item.correctChoiceIds = parseStandardIds(raw.correctChoiceIds);
  }
  if (type === 'number') item.correctNumber = String(raw.correctNumber ?? '').trim();
  if (type === 'match') {
    item.correctPairs = Array.isArray(raw.correctPairs) ? raw.correctPairs : [];
  }
  if (type === 'order') {
    item.correctOrder = Array.isArray(raw.correctOrder)
      ? raw.correctOrder.map((id) => String(id))
      : [];
  }
  return item;
}

export const SHELVES = ['mine', 'district', 'community'];

export function defaultAssessment(ownerId = '') {
  return {
    id: newId(),
    ownerId: String(ownerId || ''),
    title: '',
    subject: '',
    purpose: 'summative',
    scoreMode: 'points',
    formatTemplate: 'stage',
    shelf: 'mine',
    archived: false,
    bridge: null,
    items: [],
    resultsTemplate: defaultResultsTemplate(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeResultsTemplate(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const blocks = Array.isArray(source.blocks)
    ? source.blocks.filter((block) => RESULT_BLOCKS.includes(block))
    : [...RESULT_BLOCKS];
  const hidden = Array.isArray(source.hidden)
    ? source.hidden.filter((block) => RESULT_BLOCKS.includes(block))
    : [];
  return {
    blocks: blocks.length ? blocks : [...RESULT_BLOCKS],
    hidden,
    note: String(source.note || ''),
  };
}

export function normalizeAssessment(raw) {
  const items = Array.isArray(raw?.items)
    ? raw.items.map(normalizeItem).filter(Boolean)
    : [];
  const purpose = raw?.purpose === 'formative' ? 'formative' : 'summative';
  const scoreMode = SCORE_MODES.includes(raw?.scoreMode) ? raw.scoreMode : 'points';
  const formatTemplate = FORMAT_TEMPLATES.includes(raw?.formatTemplate)
    ? raw.formatTemplate
    : 'stage';
  const shelf = SHELVES.includes(raw?.shelf) ? raw.shelf : 'mine';
  return {
    id: String(raw?.id || newId()),
    ownerId: String(raw?.ownerId || ''),
    title: String(raw?.title || '').trim(),
    subject: String(raw?.subject || '').trim(),
    purpose,
    scoreMode,
    formatTemplate,
    shelf,
    archived: Boolean(raw?.archived),
    bridge: raw?.bridge && typeof raw.bridge === 'object' ? raw.bridge : null,
    items,
    resultsTemplate: normalizeResultsTemplate(raw?.resultsTemplate),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || new Date().toISOString(),
  };
}

export function standardIdsOf(assessment) {
  const ids = [];
  for (const item of assessment?.items || []) {
    for (const id of item.standardIds || []) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

export function countsTowardCompile(assessment) {
  return assessment?.purpose !== 'formative';
}

export function validateAssessment(raw) {
  const assessment = normalizeAssessment(raw);
  const errors = [];
  if (!assessment.title) errors.push('Add a title.');
  if (!assessment.subject) errors.push('Add a subject.');
  if (!assessment.items.length) errors.push('Add at least one question.');
  assessment.items.forEach((item, index) => {
    const label = `Question ${index + 1}`;
    if (!item.prompt) errors.push(`${label} needs a prompt.`);
    if (item.type === 'choose_one') {
      if ((item.choices || []).length < 2) errors.push(`${label} needs two choices.`);
      const marked = (item.choices || []).some((choice) => choice.id === item.correctChoiceId);
      if (!marked) errors.push(`${label} needs a correct choice.`);
    }
    if (item.type === 'number' && !item.correctNumber) {
      errors.push(`${label} needs the correct number.`);
    }
    if (!WRITING_TYPES.includes(item.type) && item.type !== 'choose_one' && item.type !== 'number') {
      if (!AUTO_TYPES.includes(item.type)) errors.push(`${label} has an unknown type.`);
    }
  });
  return { assessment, errors };
}

function sameSet(left, right) {
  if (!left?.length || left.length !== right?.length) return false;
  const other = new Set(right);
  return left.every((id) => other.has(id));
}

function sameList(left, right) {
  if (!left?.length || left.length !== right?.length) return false;
  return left.every((id, index) => id === right[index]);
}

function pairKey(pair) {
  return `${pair?.leftId || ''}::${pair?.rightId || ''}`;
}

function samePairs(left, right) {
  if (!left?.length || left.length !== right?.length) return false;
  const given = right.map(pairKey).sort();
  const expected = left.map(pairKey).sort();
  return expected.every((key, index) => key && key === given[index]);
}

export function numbersMatch(given, expected) {
  const left = String(given ?? '').trim();
  const right = String(expected ?? '').trim();
  if (!left || !right) return false;
  const numeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (numeric.test(left) && numeric.test(right)) {
    const leftNum = Number(left);
    const rightNum = Number(right);
    if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) return leftNum === rightNum;
  }
  return left.toLowerCase() === right.toLowerCase();
}

/**
 * Score one item. Writing always waits for a teacher.
 * Match, order, and choose-many score themselves only when a key is present.
 */
export function scoreItem(item, answer) {
  const points = asPoints(item?.points);
  if (!item) return { auto: false, correct: false, points: 0 };
  if (WRITING_TYPES.includes(item.type)) {
    return { auto: false, correct: false, points: 0 };
  }
  if (item.type === 'choose_one') {
    const correct = Boolean(answer?.choiceId) && answer.choiceId === item.correctChoiceId;
    return { auto: true, correct, points: correct ? points : 0 };
  }
  if (item.type === 'number') {
    const correct = numbersMatch(answer?.number, item.correctNumber);
    return { auto: true, correct, points: correct ? points : 0 };
  }
  if (item.type === 'choose_many') {
    const expected = item.correctChoiceIds || [];
    if (!expected.length) return { auto: false, correct: false, points: 0 };
    const correct = sameSet(expected, answer?.choiceIds || []);
    return { auto: true, correct, points: correct ? points : 0 };
  }
  if (item.type === 'order') {
    const expected = item.correctOrder || [];
    if (!expected.length) return { auto: false, correct: false, points: 0 };
    const correct = sameList(expected, answer?.orderIds || []);
    return { auto: true, correct, points: correct ? points : 0 };
  }
  if (item.type === 'match') {
    const expected = item.correctPairs || [];
    if (!expected.length) return { auto: false, correct: false, points: 0 };
    const correct = samePairs(expected, answer?.pairs || []);
    return { auto: true, correct, points: correct ? points : 0 };
  }
  return { auto: false, correct: false, points: 0 };
}

export function pointsPossible(items) {
  return (items || []).reduce((sum, item) => sum + asPoints(item.points), 0);
}

export function scoreAttempt(assessment, answers) {
  const items = assessment?.items || [];
  const stored = {};
  let earned = 0;
  let needsGrading = false;
  for (const item of items) {
    const answer = answers?.[item.id] || {};
    const scored = scoreItem(item, answer);
    if (!scored.auto) needsGrading = true;
    earned += scored.points;
    stored[item.id] = {
      value: answer,
      correct: scored.correct,
      points: scored.points,
      auto: scored.auto,
    };
  }
  const possible = pointsPossible(items);
  return {
    answers: stored,
    pointsEarned: earned,
    pointsPossible: possible,
    status: needsGrading ? 'needs_grading' : 'graded',
    proficiency: null,
  };
}

function formatPoints(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/** Native score label for the grade book. Compilation never replaces this. */
export function formatNativeScore(attempt) {
  if (!attempt || attempt.status === 'not_started') {
    return { label: '—', detail: '' };
  }
  if (attempt.status === 'in_progress') {
    return { label: 'Started', detail: 'In progress' };
  }
  const label = `${formatPoints(attempt.pointsEarned)}/${formatPoints(attempt.pointsPossible)}`;
  if (attempt.status === 'closed') return { label, detail: 'Closed' };
  if (attempt.status === 'needs_grading') return { label, detail: 'Needs grading' };
  return { label, detail: 'Graded' };
}

export function speakScript(item) {
  if (!item) return '';
  const parts = [String(item.prompt || '').trim()];
  if (item.type === 'choose_one' || item.type === 'choose_many') {
    const labels = (item.choices || []).map((choice) => choice.label).filter(Boolean);
    if (labels.length) parts.push(`Choices. ${labels.join('. ')}`);
  } else if (item.type === 'number') {
    parts.push('Enter a number.');
  } else if (WRITING_TYPES.includes(item.type)) {
    parts.push('Write your answer.');
  }
  return parts.filter(Boolean).join(' ');
}

export function finishedStatuses() {
  return ['needs_grading', 'graded', 'closed'];
}

export function isFinished(attempt) {
  return finishedStatuses().includes(attempt?.status);
}

function isoDate(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/** Window, testing days, and the day students receive an assessment. */
export function normalizeSchedule(raw) {
  if (!raw?.assessmentId) return null;
  const windowStart = isoDate(raw.windowStart);
  const windowEnd = isoDate(raw.windowEnd);
  const testingDays = [...new Set((Array.isArray(raw.testingDays) ? raw.testingDays : []).map(isoDate).filter(Boolean))].sort();
  const studentAssignOn = {};
  if (raw.studentAssignOn && typeof raw.studentAssignOn === 'object') {
    for (const [id, date] of Object.entries(raw.studentAssignOn)) {
      const iso = isoDate(date);
      if (id && iso) studentAssignOn[String(id)] = iso;
    }
  }
  return {
    id: String(raw.id || newId()),
    assessmentId: String(raw.assessmentId),
    classId: String(raw.classId || ''),
    scope: raw.scope === 'district' ? 'district' : 'class',
    windowStart,
    windowEnd: windowStart && windowEnd && windowEnd < windowStart ? windowStart : windowEnd,
    testingDays,
    assignOn: isoDate(raw.assignOn),
    studentAssignOn,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/** Testing days stay inside the window. The assign date can sit outside it. */
export function coverSchedule(schedule) {
  if (!schedule) return schedule;
  const span = [schedule.windowStart, schedule.windowEnd, ...(schedule.testingDays || [])]
    .filter(Boolean)
    .sort();
  if (!span.length) return schedule;
  return {
    ...schedule,
    windowStart: span[0],
    windowEnd: span[span.length - 1],
    testingDays: [...(schedule.testingDays || [])].sort(),
  };
}

export function resolveSchedule(store, assessmentId, classId) {
  const rows = store?.schedules || [];
  return (
    rows.find(
      (row) =>
        row.assessmentId === assessmentId && row.scope === 'class' && row.classId === String(classId),
    ) ||
    rows.find((row) => row.assessmentId === assessmentId && row.scope === 'district') ||
    null
  );
}

export function receiveDate(schedule, studentId) {
  if (!schedule) return '';
  const override = studentId ? schedule.studentAssignOn?.[String(studentId)] : '';
  return override || schedule.assignOn || '';
}

/** A schedule with no assign date leaves an existing assignment visible. */
export function studentCanSeeAssignment(schedule, studentId, todayIso) {
  if (!schedule) return true;
  const date = receiveDate(schedule, studentId);
  if (!date) return true;
  return date <= String(todayIso || '');
}

export function scheduleDayMarks(schedule, iso) {
  if (!schedule || !iso) return [];
  const marks = [];
  if (schedule.windowStart && schedule.windowEnd && iso >= schedule.windowStart && iso <= schedule.windowEnd) {
    marks.push('window');
  }
  if ((schedule.testingDays || []).includes(iso)) marks.push('testing');
  if (schedule.assignOn === iso || Object.values(schedule.studentAssignOn || {}).includes(iso)) {
    marks.push('assign');
  }
  return marks;
}
