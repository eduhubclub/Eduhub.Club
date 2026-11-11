/**
 * Class Creator — placement run model (elementary next-grade sorting).
 */

export const GRADE_BANDS = [
  { id: 'k5', label: 'K–5', grades: ['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade'] },
  { id: 'k6', label: 'K–6', grades: ['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade'] },
];

/** Current grade → next destination grade. */
export const NEXT_GRADE = {
  'Pre-K': 'Kindergarten',
  Kindergarten: '1st Grade',
  '1st Grade': '2nd Grade',
  '2nd Grade': '3rd Grade',
  '3rd Grade': '4th Grade',
  '4th Grade': '5th Grade',
  '5th Grade': '6th Grade',
  '6th Grade': '7th Grade',
};

export const DEFAULT_SERVICE_TAGS = [
  { id: 'iep', label: 'IEP' },
  { id: '504', label: '504' },
  { id: 'ml', label: 'ML' },
  { id: 'speech', label: 'Speech' },
  { id: 'ot_pt', label: 'OT/PT' },
  { id: 'reading_intervention', label: 'Reading intervention' },
  { id: 'math_intervention', label: 'Math intervention' },
  { id: 'behavior_plan', label: 'Behavior plan' },
  { id: 'sel_support', label: 'SEL support' },
];

/** Rating scale defaults — muted Edu.Hub blue / green / amber / red. */
export const SCALE_THEME_COLORS = ['#93c5fd', '#6ee7b7', '#fde68a', '#fca5a5'];

/** Default 1–4 scale — muted theme blue / green / yellow / red. */
export const DEFAULT_SCALE = {
  id: 'standard_1_4',
  levels: [
    { value: 4, label: 'Above standard', color: SCALE_THEME_COLORS[0] },
    { value: 3, label: 'Meeting standard', color: SCALE_THEME_COLORS[1] },
    { value: 2, label: 'Approaching standard', color: SCALE_THEME_COLORS[2] },
    { value: 1, label: 'Below standard', color: SCALE_THEME_COLORS[3] },
  ],
};

export const DEFAULT_COLUMNS = [
  { id: 'overall_academics', label: 'Overall Academics', type: 'scale', enabled: true },
  { id: 'reading', label: 'Reading', type: 'scale', enabled: true },
  { id: 'writing', label: 'Writing', type: 'scale', enabled: true },
  { id: 'math', label: 'Math', type: 'scale', enabled: true },
  { id: 'teacher_time', label: 'Teacher time', type: 'scale', enabled: true },
  { id: 'behavior', label: 'Behavior', type: 'scale', enabled: true },
  { id: 'services', label: 'Services', type: 'tags', enabled: true },
  { id: 'notes', label: 'Notes', type: 'text', enabled: true },
];

/** Highest → lowest sort priority (admin can reorder). */
export const DEFAULT_PRIORITY = ['gender', 'overall_academics', 'behavior', 'teacher_time'];

export const PRIORITY_LABELS = {
  gender: 'Gender balance',
  overall_academics: 'Overall Academics',
  reading: 'Reading',
  writing: 'Writing',
  math: 'Math',
  behavior: 'Behavior',
  teacher_time: 'Teacher time',
  services: 'Services ratios',
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Row tint by gender in ratings/placement; off → alternate white/gray. Muted Edu.Hub pink / blue / purple. */
export const DEFAULT_GENDER_COLORS = {
  enabled: false,
  female: '#f9a8d4',
  male: '#93c5fd',
  other: '#d8b4fe',
};

export function defaultSchema() {
  const scale = structuredClone(DEFAULT_SCALE);
  return {
    scale,
    columns: DEFAULT_COLUMNS.map((col) =>
      col.type === 'scale'
        ? { ...structuredClone(col), scale: structuredClone(DEFAULT_SCALE) }
        : structuredClone(col),
    ),
    serviceTags: structuredClone(DEFAULT_SERVICE_TAGS),
    genderColors: structuredClone(DEFAULT_GENDER_COLORS),
  };
}

export function normalizeGenderKey(value) {
  const g = String(value || '').trim().toLowerCase();
  if (!g) return 'other';
  if (g.startsWith('f') || g === 'girl' || g === 'female') return 'female';
  if (g.startsWith('m') || g === 'boy' || g === 'male') return 'male';
  return 'other';
}

/**
 * Background for a student row. When gender colors are off, alternate white/gray.
 * Returns inline style object (backgroundColor) or null.
 */
export function studentRowBackground(schema, student, rowIndex = 0, isDarkMode = false) {
  const colors = schema?.genderColors || DEFAULT_GENDER_COLORS;
  if (!colors.enabled) {
    if (rowIndex % 2 === 0) return null;
    return {
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : '#f8fafc', // slate-50
    };
  }
  const key = normalizeGenderKey(student?.gender);
  const hex =
    key === 'female'
      ? colors.female
      : key === 'male'
        ? colors.male
        : colors.other;
  if (!hex) return null;
  // Soft tint so text stays readable
  return { backgroundColor: `${hex}33` };
}

export function emptyPlacementRun(partial = {}) {
  return {
    id: uid('run'),
    schoolId: '',
    schoolName: '',
    yearLabel: '',
    gradeBand: 'k5',
    /** @deprecated School-wide runs rate the whole band; kept for legacy single-grade data. */
    sourceGrade: '',
    /** @deprecated Prefer destinationGrade on each teacher. */
    destinationGrade: '',
    destinationTeachers: [],
    /** Students from current Edu.Hub classes (school-wide ratings). */
    cohortStudentIds: [],
    /** Snapshot of student demographics for the run (id → fields). */
    students: {},
    /** CSV / Skyward intakes not already on a current roster. */
    externalStudentIds: [],
    locks: {},
    separations: [],
    pairings: [],
    parentRequests: {},
    /** Current-year survey ratings (feeds Place / Results). */
    ratings: {},
    /**
     * Previous-year ratings shown on Dashboard current rosters.
     * Current survey values stay in `ratings` until Results lists are built.
     */
    priorRatings: {},
    draftClasses: {},
    unassigned: [],
    priorityOrder: [...DEFAULT_PRIORITY],
    schema: defaultSchema(),
    /** When true, teachers can open Results and leave feedback. */
    sharedWithTeachers: false,
    /** Teacher comments on the shared draft — keyed by authorKey. */
    teacherFeedback: {},
    /** Grade-swap overrides: staffId → current grade card for this run. */
    staffGradeOverrides: {},
    /** Per-grade staff order for section letters (KA, KB, …). */
    staffOrderByGrade: {},
    /** Optional manual section codes: staffId → "KA". */
    staffSectionCodes: {},
    /** Grade card header colors: grade label → "#rrggbb". */
    gradeColors: {},
    /** Grade card accent shapes: grade label → shape id (Cookie9Sided, …). */
    gradeShapes: {},
    /** Optional display titles for grade cards: grade key → custom title. */
    gradeTitles: {},
    /** Staff unchecked for next-year rooms (still rate their current class). */
    excludedStaffIds: [],
    /** Survey submissions: key → { submittedAt, label }. */
    ratingsSubmissions: {},
    /** Archived year snapshots for Roster → Previous. */
    previousRosters: [],
    status: 'setup',
    archivedAt: '',
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

export function emptyStore() {
  return {
    version: 1,
    activeRunId: null,
    runs: [],
    /** Finalized next-year class lists (Archive tab). */
    archives: [],
  };
}

/** Slim snapshot of a finished placement for the Archive tab. */
export function placementArchiveFromRun(run) {
  if (!run) return null;
  const draftClasses =
    run.draftClasses && typeof run.draftClasses === 'object'
      ? Object.fromEntries(
          Object.entries(run.draftClasses).map(([tid, ids]) => [
            String(tid),
            (ids || []).map(String),
          ]),
        )
      : {};
  const placedIds = new Set(Object.values(draftClasses).flat());
  const students = {};
  for (const id of placedIds) {
    if (run.students?.[id]) students[id] = normalizeStudentSnapshot(run.students[id]);
  }
  for (const id of run.unassigned || []) {
    if (run.students?.[id]) students[String(id)] = normalizeStudentSnapshot(run.students[id]);
  }
  return {
    id: String(run.id),
    yearLabel: String(run.yearLabel || 'Placement'),
    schoolId: String(run.schoolId || ''),
    schoolName: String(run.schoolName || 'School'),
    gradeBand: String(run.gradeBand || 'k5'),
    archivedAt: String(run.archivedAt || new Date().toISOString()),
    destinationTeachers: Array.isArray(run.destinationTeachers)
      ? run.destinationTeachers.map((row) => ({
          id: String(row.id),
          name: String(row.name || 'Teacher'),
          destinationGrade: String(row.destinationGrade || ''),
        }))
      : [],
    draftClasses,
    unassigned: Array.isArray(run.unassigned) ? run.unassigned.map(String) : [],
    students,
  };
}

const LEGACY_SCALE_COLORS = {
  '#2563eb': SCALE_THEME_COLORS[0],
  '#16a34a': SCALE_THEME_COLORS[1],
  '#d97706': SCALE_THEME_COLORS[2],
  '#dc2626': SCALE_THEME_COLORS[3],
  // Prior saturated annotate solids → muted defaults
  '#60a5fa': SCALE_THEME_COLORS[0],
  '#10b981': SCALE_THEME_COLORS[1],
  '#fbbf24': SCALE_THEME_COLORS[2],
  '#f87171': SCALE_THEME_COLORS[3],
};

/** Normalize a 1–n rating scale (values, labels, colors). */
export function normalizeScale(raw, fallback = DEFAULT_SCALE) {
  const base = fallback?.levels?.length ? fallback : DEFAULT_SCALE;
  if (!raw?.levels?.length) return structuredClone(base);
  return {
    id: String(raw.id || base.id || 'scale'),
    levels: raw.levels.map((level) => {
      const rawColor = String(level.color || '#64748b');
      const color = LEGACY_SCALE_COLORS[rawColor.toLowerCase()] || rawColor;
      const value = normalizeScaleValue(level.value);
      return {
        value: value === '' ? Number(level.value) || 0 : value,
        // Keep empty string editable — `|| value` stuck a non-deletable digit in the label field.
        label: String(level.label ?? level.value ?? ''),
        color,
      };
    }),
  };
}

/** Scale for a survey category — per-column override, else shared schema.scale. */
export function scaleForColumn(schema, columnId) {
  const col = (schema?.columns || []).find((row) => row.id === columnId);
  if (col?.type === 'scale' && col.scale?.levels?.length) return col.scale;
  return schema?.scale?.levels?.length ? schema.scale : DEFAULT_SCALE;
}

export function normalizeSchema(raw) {
  const base = defaultSchema();
  if (!raw || typeof raw !== 'object') return base;
  const scale = normalizeScale(raw.scale, base.scale);
  const columns = Array.isArray(raw.columns) && raw.columns.length
    ? raw.columns.map((col) => {
        const type = col.type === 'tags' || col.type === 'text' ? col.type : 'scale';
        const next = {
          id: String(col.id),
          label: String(col.label || col.id),
          type,
          enabled: col.enabled !== false,
        };
        if (type === 'scale') {
          next.scale = normalizeScale(col.scale || raw.scale, scale);
        }
        return next;
      })
    : base.columns.map((col) =>
        col.type === 'scale'
          ? { ...col, scale: normalizeScale(col.scale || scale, scale) }
          : col,
      );
  const serviceTags = Array.isArray(raw.serviceTags) && raw.serviceTags.length
    ? raw.serviceTags.map((tag) => ({
        id: String(tag.id),
        label: String(tag.label || tag.id),
      }))
    : base.serviceTags;
  const gc = raw.genderColors && typeof raw.genderColors === 'object' ? raw.genderColors : {};
  const legacyGenderColor = {
    '#fb7185': DEFAULT_GENDER_COLORS.female,
    '#f472b6': DEFAULT_GENDER_COLORS.female,
    '#60a5fa': DEFAULT_GENDER_COLORS.male,
    '#3b82f6': DEFAULT_GENDER_COLORS.male,
    '#10b981': DEFAULT_GENDER_COLORS.male,
    '#34d399': DEFAULT_GENDER_COLORS.male,
    '#c084fc': DEFAULT_GENDER_COLORS.other,
    '#a78bfa': DEFAULT_GENDER_COLORS.other,
  };
  const mapGenderHex = (rawHex, fallback) => {
    const hex = String(rawHex || fallback).toLowerCase();
    return legacyGenderColor[hex] || String(rawHex || fallback);
  };
  const genderColors = {
    enabled: Boolean(gc.enabled),
    female: mapGenderHex(gc.female, base.genderColors.female),
    male: mapGenderHex(gc.male, base.genderColors.male),
    other: mapGenderHex(gc.other, base.genderColors.other),
  };
  return { scale, columns, serviceTags, genderColors };
}

export function normalizeStudentSnapshot(raw = {}) {
  const firstName = String(raw.firstName || '').trim();
  const lastName = String(raw.lastName || '').trim();
  const name =
    String(raw.name || '').trim() ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    'Student';
  return {
    id: String(raw.id || uid('stu')),
    name,
    firstName: firstName || name.split(/\s+/)[0] || '',
    lastName: lastName || name.split(/\s+/).slice(1).join(' ') || '',
    gender: String(raw.gender || raw.sex || '').trim(),
    grade_level: String(raw.grade_level || raw.grade || '').trim(),
    studentId: String(raw.studentId || raw.sisId || raw.student_id || '').trim(),
    school: String(raw.school || '').trim(),
    source: raw.source === 'csv' || raw.source === 'external' ? 'external' : 'roster',
    services: Array.isArray(raw.services) ? raw.services.map(String) : [],
  };
}

export function normalizePlacementRun(raw) {
  if (!raw || typeof raw !== 'object') return emptyPlacementRun();
  const legacyDestination = String(raw.destinationGrade || '').trim();
  const teachers = Array.isArray(raw.destinationTeachers)
    ? raw.destinationTeachers.map((teacher) => ({
        id: String(teacher.id || uid('tch')),
        name: String(teacher.name || 'Teacher').trim() || 'Teacher',
        isProvisional: Boolean(teacher.isProvisional),
        room: String(teacher.room || '').trim(),
        staffId: String(teacher.staffId || '').trim(),
        currentGrade: String(teacher.currentGrade || '').trim(),
        /** Next-year grade this teacher receives (school-wide runs have many). */
        destinationGrade:
          String(teacher.destinationGrade || '').trim() || legacyDestination,
      }))
    : [];
  const students = {};
  if (raw.students && typeof raw.students === 'object') {
    for (const [id, row] of Object.entries(raw.students)) {
      students[id] = normalizeStudentSnapshot({ ...row, id });
    }
  }
  const draftClasses = {};
  for (const teacher of teachers) {
    const list = raw.draftClasses?.[teacher.id];
    draftClasses[teacher.id] = Array.isArray(list) ? list.map(String) : [];
  }
  return {
    ...emptyPlacementRun(),
    ...raw,
    id: String(raw.id || uid('run')),
    schoolId: String(raw.schoolId || ''),
    schoolName: String(raw.schoolName || ''),
    yearLabel: String(raw.yearLabel || ''),
    gradeBand: raw.gradeBand === 'k6' ? 'k6' : 'k5',
    sourceGrade: String(raw.sourceGrade || ''),
    destinationGrade: String(raw.destinationGrade || ''),
    destinationTeachers: teachers,
    cohortStudentIds: Array.isArray(raw.cohortStudentIds)
      ? raw.cohortStudentIds.map(String)
      : [],
    externalStudentIds: Array.isArray(raw.externalStudentIds)
      ? raw.externalStudentIds.map(String)
      : [],
    students,
    locks:
      raw.locks && typeof raw.locks === 'object'
        ? Object.fromEntries(
            Object.entries(raw.locks).map(([sid, tid]) => [String(sid), String(tid)]),
          )
        : {},
    separations: Array.isArray(raw.separations)
      ? raw.separations.map((row) => ({
          a: String(row.a),
          b: String(row.b),
          reason: String(row.reason || ''),
        }))
      : [],
    pairings: Array.isArray(raw.pairings)
      ? raw.pairings.map((row) => ({
          a: String(row.a),
          b: String(row.b),
          reason: String(row.reason || ''),
        }))
      : [],
    parentRequests:
      raw.parentRequests && typeof raw.parentRequests === 'object'
        ? Object.fromEntries(
            Object.entries(raw.parentRequests).map(([sid, note]) => [
              String(sid),
              String(note || ''),
            ]),
          )
        : {},
    ratings:
      raw.ratings && typeof raw.ratings === 'object'
        ? Object.fromEntries(
            Object.entries(raw.ratings).map(([sid, vals]) => [
              String(sid),
              vals && typeof vals === 'object' ? { ...vals } : {},
            ]),
          )
        : {},
    priorRatings:
      raw.priorRatings && typeof raw.priorRatings === 'object'
        ? Object.fromEntries(
            Object.entries(raw.priorRatings).map(([sid, vals]) => [
              String(sid),
              vals && typeof vals === 'object' ? { ...vals } : {},
            ]),
          )
        : {},
    draftClasses,
    unassigned: Array.isArray(raw.unassigned) ? raw.unassigned.map(String) : [],
    priorityOrder: Array.isArray(raw.priorityOrder) && raw.priorityOrder.length
      ? raw.priorityOrder.map(String)
      : [...DEFAULT_PRIORITY],
    schema: normalizeSchema(raw.schema),
    sharedWithTeachers: Boolean(raw.sharedWithTeachers),
    teacherFeedback: normalizeTeacherFeedback(raw.teacherFeedback),
    staffGradeOverrides:
      raw.staffGradeOverrides && typeof raw.staffGradeOverrides === 'object'
        ? Object.fromEntries(
            Object.entries(raw.staffGradeOverrides).map(([id, grade]) => [
              String(id),
              String(grade || ''),
            ]),
          )
        : {},
    staffOrderByGrade:
      raw.staffOrderByGrade && typeof raw.staffOrderByGrade === 'object'
        ? Object.fromEntries(
            Object.entries(raw.staffOrderByGrade).map(([grade, ids]) => [
              String(grade),
              Array.isArray(ids) ? ids.map(String).filter(Boolean) : [],
            ]),
          )
        : {},
    staffSectionCodes:
      raw.staffSectionCodes && typeof raw.staffSectionCodes === 'object'
        ? Object.fromEntries(
            Object.entries(raw.staffSectionCodes)
              .map(([id, code]) => [
                String(id),
                String(code || '')
                  .trim()
                  .toUpperCase()
                  .slice(0, 4),
              ])
              .filter(([, code]) => code),
          )
        : {},
    gradeColors:
      raw.gradeColors && typeof raw.gradeColors === 'object'
        ? Object.fromEntries(
            Object.entries(raw.gradeColors)
              .map(([grade, color]) => {
                const hex = String(color || '')
                  .trim()
                  .toLowerCase();
                if (!/^#[0-9a-f]{6}$/.test(hex)) return null;
                return [String(grade), hex];
              })
              .filter(Boolean),
          )
        : {},
    gradeShapes:
      raw.gradeShapes && typeof raw.gradeShapes === 'object'
        ? Object.fromEntries(
            Object.entries(raw.gradeShapes)
              .map(([grade, shape]) => {
                const id = String(shape || '').trim();
                if (!id) return null;
                return [String(grade), id];
              })
              .filter(Boolean),
          )
        : {},
    gradeTitles:
      raw.gradeTitles && typeof raw.gradeTitles === 'object'
        ? Object.fromEntries(
            Object.entries(raw.gradeTitles)
              .map(([grade, title]) => [
                String(grade),
                String(title || '').trim(),
              ])
              .filter(([, title]) => title),
          )
        : {},
    excludedStaffIds: Array.isArray(raw.excludedStaffIds)
      ? [...new Set(raw.excludedStaffIds.map(String).filter(Boolean))]
      : [],
    ratingsSubmissions:
      raw.ratingsSubmissions && typeof raw.ratingsSubmissions === 'object'
        ? Object.fromEntries(
            Object.entries(raw.ratingsSubmissions)
              .map(([key, row]) => {
                if (!row || typeof row !== 'object') return null;
                const submittedAt = String(row.submittedAt || '').trim();
                if (!submittedAt) return null;
                return [
                  String(key),
                  {
                    submittedAt,
                    label: String(row.label || '').trim(),
                  },
                ];
              })
              .filter(Boolean),
          )
        : {},
    previousRosters: normalizePreviousRosters(raw.previousRosters),
    status: ['setup', 'rating', 'placed', 'final'].includes(raw.status)
      ? raw.status
      : 'setup',
    archivedAt: String(raw.archivedAt || ''),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

function normalizePlacementArchive(raw = {}) {
  const draftClasses =
    raw.draftClasses && typeof raw.draftClasses === 'object'
      ? Object.fromEntries(
          Object.entries(raw.draftClasses).map(([tid, ids]) => [
            String(tid),
            Array.isArray(ids) ? ids.map(String) : [],
          ]),
        )
      : {};
  const students =
    raw.students && typeof raw.students === 'object'
      ? Object.fromEntries(
          Object.entries(raw.students).map(([id, row]) => [
            String(id),
            normalizeStudentSnapshot(row),
          ]),
        )
      : {};
  return {
    id: String(raw.id || uid('archive')),
    yearLabel: String(raw.yearLabel || 'Placement'),
    schoolId: String(raw.schoolId || ''),
    schoolName: String(raw.schoolName || 'School'),
    gradeBand: String(raw.gradeBand || 'k5'),
    archivedAt: String(raw.archivedAt || ''),
    destinationTeachers: Array.isArray(raw.destinationTeachers)
      ? raw.destinationTeachers.map((row) => ({
          id: String(row.id),
          name: String(row.name || 'Teacher'),
          destinationGrade: String(row.destinationGrade || ''),
        }))
      : [],
    draftClasses,
    unassigned: Array.isArray(raw.unassigned) ? raw.unassigned.map(String) : [],
    students,
  };
}

function normalizePreviousRosters(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    id: String(row?.id || uid('prev')),
    yearLabel: String(row?.yearLabel || 'Previous year'),
    savedAt: String(row?.savedAt || ''),
    grades: Array.isArray(row?.grades)
      ? row.grades.map((gradeRow) => ({
          grade: String(gradeRow?.grade || ''),
          rooms: Array.isArray(gradeRow?.rooms)
            ? gradeRow.rooms.map((room) => ({
                classId: String(room?.classId || ''),
                className: String(room?.className || ''),
                teacherName: String(room?.teacherName || 'Teacher'),
                students: Array.isArray(room?.students)
                  ? room.students.map((student) => normalizeStudentSnapshot(student))
                  : [],
              }))
            : [],
        }))
      : [],
  }));
}

function normalizeTeacherFeedback(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [key, row] of Object.entries(raw)) {
    if (!row || typeof row !== 'object') continue;
    out[String(key)] = {
      authorKey: String(key),
      authorId: String(row.authorId || ''),
      authorName: String(row.authorName || 'Teacher').trim() || 'Teacher',
      className: String(row.className || '').trim(),
      body: String(row.body || '').trim(),
      updatedAt: String(row.updatedAt || ''),
    };
  }
  return out;
}

export function normalizeStore(raw) {
  if (!raw || typeof raw !== 'object') return emptyStore();
  const runs = Array.isArray(raw.runs)
    ? raw.runs.map(normalizePlacementRun)
    : [];
  const activeRunId =
    raw.activeRunId && runs.some((run) => run.id === raw.activeRunId)
      ? raw.activeRunId
      : runs[0]?.id || null;
  const archives = Array.isArray(raw.archives)
    ? raw.archives.map(normalizePlacementArchive)
    : [];
  return { version: 1, activeRunId, runs, archives };
}

export function gradesForBand(bandId) {
  return GRADE_BANDS.find((band) => band.id === bandId)?.grades || GRADE_BANDS[0].grades;
}

export function nextGradeFor(sourceGrade) {
  return NEXT_GRADE[sourceGrade] || '';
}

/**
 * Infer classroom grade from a staff role title ("3rd Grade Teacher", "Kindergarten").
 * @param {string} role
 * @returns {string}
 */
export function gradeFromStaffRole(role) {
  const value = String(role || '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.includes('kindergarten') || /\bk\b/.test(lower) || lower.includes('pre-k')) {
    if (lower.includes('pre-k') || lower.includes('prek')) return 'Pre-K';
    return 'Kindergarten';
  }
  const ordinal = lower.match(/\b(\d+)(st|nd|rd|th)\b/);
  if (ordinal) {
    const n = Number(ordinal[1]);
    const map = {
      1: '1st Grade',
      2: '2nd Grade',
      3: '3rd Grade',
      4: '4th Grade',
      5: '5th Grade',
      6: '6th Grade',
      7: '7th Grade',
      8: '8th Grade',
    };
    return map[n] || '';
  }
  const named = [
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade',
  ];
  for (const grade of named) {
    if (lower.includes(grade.toLowerCase())) return grade;
  }
  return '';
}

/** Short grade token for section codes (Kindergarten → K, 1st Grade → 1). */
export function gradeSectionPrefix(grade) {
  const value = String(grade || '').trim();
  if (!value || value === 'Other / no grade') return '';
  if (value === 'Pre-K' || /^pre-?k/i.test(value)) return 'PK';
  if (value === 'Kindergarten' || /^k(?:indergarten)?$/i.test(value)) return 'K';
  const n = Number(value.match(/\d+/)?.[0]);
  return Number.isFinite(n) ? String(n) : '';
}

/** Class section code from list order (index 0 → KA, 1 → KB, …). */
export function classSectionCode(grade, index) {
  const prefix = gradeSectionPrefix(grade);
  if (!prefix || index < 0) return '';
  if (index >= 26) return `${prefix}${index + 1}`;
  return `${prefix}${String.fromCharCode(65 + index)}`;
}

/** Trailing section letter from a class name (“Kindergarten A” → A). */
export function sectionLetterFromClassName(name) {
  const match = String(name || '')
    .trim()
    .match(/\b([A-Za-z])\s*$/);
  return match ? match[1].toUpperCase() : '';
}

/** Destination grades teachers can receive for a band (K→1 … 5→6). */
export function destinationGradesForBand(bandId) {
  const seen = new Set();
  const out = [];
  for (const grade of gradesForBand(bandId)) {
    const next = nextGradeFor(grade);
    if (next && !seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
  }
  return out;
}

export function gradeBandLabel(bandId) {
  return GRADE_BANDS.find((band) => band.id === bandId)?.label || 'K–5';
}

/**
 * Current school-year start calendar year (Aug–Jul).
 * e.g. Nov 2026 → 2026 (SY 2026–27).
 */
export function currentSchoolYearStart(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? year : year - 1;
}

/**
 * Default grayed-out placement title for the *next* school year (e.g. 2027–2028).
 * Always one year ahead of the current SY so mid-year setup targets the fall that follows.
 */
export function defaultPlacementYearLabel(now = new Date()) {
  const start = currentSchoolYearStart(now) + 1;
  return `${start}–${start + 1}`;
}

/**
 * Current school year short label (e.g. 26–27).
 * Aug–Jul calendar: from August use this calendar year as SY start.
 */
export function currentSchoolYearShort(now = new Date()) {
  return schoolYearShortFromStart(currentSchoolYearStart(now));
}

/** Treat legacy “Next year” as unset so the gray placeholder can show. */
export function displayPlacementYearLabel(yearLabel) {
  const value = String(yearLabel || '').trim();
  if (!value || /^next year$/i.test(value)) return '';
  return value;
}

/** YY–YY from a school-year start calendar year. */
export function schoolYearShortFromStart(start) {
  const y = Number(start);
  if (!Number.isFinite(y)) return '';
  return `${String(y).slice(-2)}–${String(y + 1).slice(-2)}`;
}

/** Parse leading year from labels like 2027–2028, 2027–28, 27–28. */
export function parseSchoolYearStart(yearLabel) {
  const m = String(yearLabel || '').trim().match(/^(\d{2}|\d{4})\s*[–-]/);
  if (!m) return null;
  let y = Number(m[1]);
  if (!Number.isFinite(y)) return null;
  if (y < 100) y += 2000;
  return y;
}

/**
 * Short year for Current Rosters: one school year before the placement title
 * (the classes being sorted / rated this year).
 */
export function currentRosterYearShort(placementYearLabel, now = new Date()) {
  const placement =
    displayPlacementYearLabel(placementYearLabel) || defaultPlacementYearLabel(now);
  const placementStart = parseSchoolYearStart(placement);
  const rosterStart =
    placementStart != null ? placementStart - 1 : currentSchoolYearStart(now);
  return schoolYearShortFromStart(rosterStart);
}

/** Where a student should land next year. */
export function studentDestinationGrade(run, studentId) {
  const student = run?.students?.[studentId];
  const current =
    String(student?.grade_level || '').trim() || String(run?.sourceGrade || '').trim();
  return nextGradeFor(current);
}

/** Teachers who receive a given destination grade (untagged = legacy whole-run pool). */
export function teachersForDestinationGrade(run, destinationGrade) {
  const teachers = run?.destinationTeachers || [];
  if (!destinationGrade) return teachers;
  const anyTagged = teachers.some((teacher) => teacher.destinationGrade);
  if (!anyTagged) {
    if (
      !run?.destinationGrade ||
      String(run.destinationGrade) === String(destinationGrade)
    ) {
      return teachers;
    }
    return [];
  }
  return teachers.filter(
    (teacher) => String(teacher.destinationGrade || '') === String(destinationGrade),
  );
}

/** Parse a scale display value — number (4) or percentage ("90%"). */
export function normalizeScaleValue(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  const pct = s.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (!Number.isFinite(n)) return '';
    return `${n}%`;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n;
}

export function sameScaleValue(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  const left = normalizeScaleValue(a);
  const right = normalizeScaleValue(b);
  if (left === '' || right === '') return false;
  return String(left) === String(right);
}

/** Numeric key for ordering / next-value — strips % when present. */
export function scaleValueSortKey(value) {
  const normalized = normalizeScaleValue(value);
  if (normalized === '') return NaN;
  const s = String(normalized);
  const pct = s.match(/^(\d+(?:\.\d+)?)%/);
  if (pct) return Number(pct[1]);
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function scaleLevel(schema, value, columnId) {
  const levels = scaleForColumn(schema, columnId).levels || DEFAULT_SCALE.levels;
  return levels.find((level) => sameScaleValue(level.value, value)) || null;
}

export function allStudentIds(run) {
  const ids = new Set([
    ...(run.cohortStudentIds || []),
    ...(run.externalStudentIds || []),
  ]);
  return [...ids];
}

export function studentList(run) {
  return allStudentIds(run)
    .map((id) => run.students[id])
    .filter(Boolean);
}
