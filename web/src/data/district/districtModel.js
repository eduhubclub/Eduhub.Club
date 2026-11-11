/**
 * District org: schools, building schedules, and class↔school links.
 *
 * Periods are the bell. Content blocks claim teaching periods (one period,
 * one block). Teaching minutes are what a pacing guide has to fit.
 * Class links live here because class records are session state.
 */

import { SCHEDULE_SWATCHES } from '../schedule/scheduleModel';
import { getDemoDistrictRoster } from './demoDistrictRoster';
import { normalizeDepartment, normalizeStaffDepartment } from './staffDepartments';
import { normalizeSchoolAccess } from './schoolAccess';

export {
  STAFF_DEPARTMENTS,
  departmentForRole,
  departmentsForSchool,
  normalizeDepartment,
  staffDepartmentLabel,
} from './staffDepartments';

export {
  ACCESS_ACTORS,
  ACCESS_CAPABILITIES,
  DEFAULT_SCHOOL_ACCESS,
  accessPolicyForSchool,
  canUseCapability,
  normalizeSchoolAccess,
  sessionAccessActor,
  withAccessCapabilityActors,
} from './schoolAccess';

export const CONTENT_AREAS = [
  { id: 'literacy', label: 'Literacy' },
  { id: 'math', label: 'Math' },
  { id: 'science', label: 'Science' },
  { id: 'socialStudies', label: 'Social studies' },
  { id: 'specials', label: 'Specials' },
  { id: 'intervention', label: 'Intervention' },
  { id: 'other', label: 'Other' },
];

const CONTENT_AREA_IDS = new Set(CONTENT_AREAS.map((area) => area.id));

export function newDistrictId(prefix = 'dist') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Minutes from midnight, or null when the clock value is incomplete. */
export function parseClockMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function clockOrEmpty(value) {
  const minutes = parseClockMinutes(value);
  if (minutes == null) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** Keep trailing spaces so a name can be typed word by word. */
function labelText(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

export function formatMinutes(minutes) {
  const n = Math.max(0, Math.round(Number(minutes) || 0));
  return `${n} min`;
}

export function periodMinutes(period) {
  const start = parseClockMinutes(period?.startTime);
  const end = parseClockMinutes(period?.endTime);
  if (start == null || end == null || end <= start) return 0;
  return end - start;
}

/** http(s) or data:image URLs only — keeps banner src safe for <img>. */
export function normalizeBannerUrl(value) {
  const url = cleanText(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url;
  return '';
}

export function normalizeStaffMember(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanText(raw.name);
  if (!name) return null;
  const role = cleanText(raw.role) || 'Teacher';
  return {
    id: String(raw.id || newDistrictId('staff')),
    name,
    role,
    department: normalizeStaffDepartment(raw.department, role),
    room: cleanText(raw.room),
    extension: cleanText(raw.extension),
    email: cleanText(raw.email),
    avatarUrl: normalizeBannerUrl(raw.avatarUrl),
    classId: raw.classId ? String(raw.classId) : '',
  };
}

export function staffForSchool(org, schoolId) {
  if (!org || !schoolId) return [];
  const rows = org.staff?.[schoolId];
  return Array.isArray(rows) ? rows : [];
}

export function normalizeSchool(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanText(raw.name);
  if (!name) return null;
  return {
    id: String(raw.id || newDistrictId('sch')),
    name,
    address: cleanText(raw.address),
    phone: cleanText(raw.phone),
    bannerUrl: normalizeBannerUrl(raw.bannerUrl),
  };
}

export function normalizePeriod(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const order = Number.isFinite(Number(raw.order)) ? Number(raw.order) : index;
  return {
    id: String(raw.id || newDistrictId('per')),
    label: labelText(raw.label),
    startTime: clockOrEmpty(raw.startTime),
    endTime: clockOrEmpty(raw.endTime),
    kind: raw.kind === 'nonInstruction' ? 'nonInstruction' : 'instruction',
    order,
  };
}

export function normalizeBlock(raw, index = 0, instructionIds = null) {
  if (!raw || typeof raw !== 'object') return null;
  const order = Number.isFinite(Number(raw.order)) ? Number(raw.order) : index;
  const contentArea = CONTENT_AREA_IDS.has(raw.contentArea) ? raw.contentArea : 'other';
  let periodIds = Array.isArray(raw.periodIds) ? raw.periodIds.map(String) : [];
  if (instructionIds) periodIds = periodIds.filter((id) => instructionIds.has(id));
  const color =
    typeof raw.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.color)
      ? raw.color
      : SCHEDULE_SWATCHES[Math.abs(order) % SCHEDULE_SWATCHES.length];
  return {
    id: String(raw.id || newDistrictId('blk')),
    label: labelText(raw.label),
    contentArea,
    periodIds,
    order,
    color,
  };
}

function periodSortKey(period) {
  const start = parseClockMinutes(period.startTime);
  if (start == null) return 24 * 60 * 1000 + period.order;
  return start * 1000 + period.order;
}

function formatClockFromMinutes(total) {
  if (total == null || !Number.isFinite(total)) return '';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function deriveDayBounds(periods) {
  let start = null;
  let end = null;
  for (const period of periods) {
    const periodStart = parseClockMinutes(period.startTime);
    const periodEnd = parseClockMinutes(period.endTime);
    if (periodStart != null && (start == null || periodStart < start)) start = periodStart;
    if (periodEnd != null && (end == null || periodEnd > end)) end = periodEnd;
  }
  return {
    dayStart: formatClockFromMinutes(start),
    dayEnd: formatClockFromMinutes(end),
  };
}

export function schoolDayMinutes(schedule) {
  const start = parseClockMinutes(schedule?.dayStart);
  const end = parseClockMinutes(schedule?.dayEnd);
  if (start == null || end == null || end <= start) return 0;
  return end - start;
}

export function normalizeBuildingSchedule(raw) {
  const periods = (Array.isArray(raw?.periods) ? raw.periods : [])
    .map((period, index) => normalizePeriod(period, index))
    .filter(Boolean)
    .sort((a, b) => periodSortKey(a) - periodSortKey(b))
    .map((period, index) => ({ ...period, order: index }));

  const instructionIds = new Set(
    periods.filter((period) => period.kind === 'instruction').map((period) => period.id),
  );
  const claimed = new Set();
  const blocks = (Array.isArray(raw?.blocks) ? raw.blocks : [])
    .map((block, index) => normalizeBlock(block, index, instructionIds))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((block, index) => {
      const periodIds = [];
      for (const id of block.periodIds) {
        if (claimed.has(id)) continue;
        claimed.add(id);
        periodIds.push(id);
      }
      return {
        ...block,
        order: index,
        periodIds,
        color: SCHEDULE_SWATCHES[index % SCHEDULE_SWATCHES.length],
      };
    });

  const derived = deriveDayBounds(periods);
  const dayStart = clockOrEmpty(raw?.dayStart) || derived.dayStart;
  const dayEnd = clockOrEmpty(raw?.dayEnd) || derived.dayEnd;

  return { dayStart, dayEnd, periods, blocks };
}

export function normalizeDistrict(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const schools = [];
  const seen = new Set();
  for (const row of Array.isArray(source.schools) ? source.schools : []) {
    const school = normalizeSchool(row);
    if (!school || seen.has(school.id)) continue;
    seen.add(school.id);
    schools.push(school);
  }

  const schedules = {};
  for (const school of schools) {
    schedules[school.id] = normalizeBuildingSchedule(source.schedules?.[school.id]);
  }

  const classSchools = {};
  const links = source.classSchools && typeof source.classSchools === 'object'
    ? source.classSchools
    : {};
  for (const [classId, schoolId] of Object.entries(links)) {
    if (!classId) continue;
    if (typeof schoolId === 'string' && seen.has(schoolId)) classSchools[classId] = schoolId;
    else classSchools[classId] = null;
  }

  const staff = {};
  const staffSource = source.staff && typeof source.staff === 'object' ? source.staff : {};
  for (const school of schools) {
    const rows = Array.isArray(staffSource[school.id]) ? staffSource[school.id] : [];
    staff[school.id] = rows.map((row) => normalizeStaffMember(row)).filter(Boolean);
  }

  const departments = {};
  const deptSource =
    source.departments && typeof source.departments === 'object' ? source.departments : {};
  for (const school of schools) {
    const rows = Array.isArray(deptSource[school.id]) ? deptSource[school.id] : [];
    const seenDept = new Set();
    departments[school.id] = [];
    for (const row of rows) {
      const dept = normalizeDepartment(row);
      if (!dept || seenDept.has(dept.id)) continue;
      seenDept.add(dept.id);
      departments[school.id].push(dept);
    }
  }

  const accessPolicies = {};
  const accessSource =
    source.accessPolicies && typeof source.accessPolicies === 'object'
      ? source.accessPolicies
      : {};
  for (const school of schools) {
    accessPolicies[school.id] = normalizeSchoolAccess(accessSource[school.id]);
  }

  return {
    id: String(source.id || newDistrictId('dist')),
    name: cleanText(source.name) || 'District',
    schools,
    schedules,
    classSchools,
    staff,
    departments,
    accessPolicies,
  };
}

/** Demo home school for the shared class roster (Wayside Elementary). */
export const DEMO_DISTRICT_SCHOOL_ID = 'sch-wayside';

function elementaryDay(prefix) {
  const p = (id) => `${prefix}-${id}`;
  return {
    dayStart: '08:00',
    dayEnd: '14:30',
    periods: [
      { id: p('arrival'), label: 'Arrival', startTime: '08:00', endTime: '08:20', kind: 'nonInstruction', order: 0 },
      { id: p('lit'), label: 'Literacy', startTime: '08:20', endTime: '09:50', kind: 'instruction', order: 1 },
      { id: p('recess'), label: 'Recess', startTime: '09:50', endTime: '10:05', kind: 'nonInstruction', order: 2 },
      { id: p('math'), label: 'Math', startTime: '10:05', endTime: '11:05', kind: 'instruction', order: 3 },
      { id: p('lunch'), label: 'Lunch', startTime: '11:05', endTime: '11:45', kind: 'nonInstruction', order: 4 },
      { id: p('read'), label: 'Reading workshop', startTime: '11:45', endTime: '12:45', kind: 'instruction', order: 5 },
      { id: p('specials'), label: 'Specials', startTime: '12:45', endTime: '13:30', kind: 'instruction', order: 6 },
      { id: p('write'), label: 'Writing', startTime: '13:30', endTime: '14:15', kind: 'instruction', order: 7 },
      { id: p('dismiss'), label: 'Dismissal', startTime: '14:15', endTime: '14:30', kind: 'nonInstruction', order: 8 },
    ],
    blocks: [
      { id: p('b-lit'), label: 'Literacy block', contentArea: 'literacy', periodIds: [p('lit')], order: 0 },
      { id: p('b-math'), label: 'Math', contentArea: 'math', periodIds: [p('math')], order: 1 },
      { id: p('b-read'), label: 'Reading workshop', contentArea: 'literacy', periodIds: [p('read')], order: 2 },
      { id: p('b-specials'), label: 'Specials', contentArea: 'specials', periodIds: [p('specials')], order: 3 },
      { id: p('b-write'), label: 'Writing', contentArea: 'literacy', periodIds: [p('write')], order: 4 },
    ],
  };
}

function secondaryDay(prefix) {
  const p = (id) => `${prefix}-${id}`;
  return {
    dayStart: '08:00',
    dayEnd: '14:25',
    periods: [
      { id: p('homeroom'), label: 'Homeroom', startTime: '08:00', endTime: '08:15', kind: 'nonInstruction', order: 0 },
      { id: p('p1'), label: 'Period 1', startTime: '08:20', endTime: '09:10', kind: 'instruction', order: 1 },
      { id: p('p2'), label: 'Period 2', startTime: '09:15', endTime: '10:05', kind: 'instruction', order: 2 },
      { id: p('p3'), label: 'Period 3', startTime: '10:10', endTime: '11:00', kind: 'instruction', order: 3 },
      { id: p('lunch'), label: 'Lunch', startTime: '11:00', endTime: '11:40', kind: 'nonInstruction', order: 4 },
      { id: p('p4'), label: 'Period 4', startTime: '11:45', endTime: '12:35', kind: 'instruction', order: 5 },
      { id: p('p5'), label: 'Period 5', startTime: '12:40', endTime: '13:30', kind: 'instruction', order: 6 },
      { id: p('p6'), label: 'Period 6', startTime: '13:35', endTime: '14:25', kind: 'instruction', order: 7 },
    ],
    blocks: [
      { id: p('b-core-am'), label: 'Morning core', contentArea: 'other', periodIds: [p('p1'), p('p2'), p('p3')], order: 0 },
      { id: p('b-core-pm'), label: 'Afternoon core', contentArea: 'other', periodIds: [p('p4'), p('p5'), p('p6')], order: 1 },
    ],
  };
}

/** Cropped Unsplash banner for demo school cards. */
function seedBanner(photoId) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=320&q=80`;
}

/**
 * Demo district from literary schools: 4 elementary, 1 middle, 1 high.
 * Staff + class links come from the full Storywell roster generator
 * (3 teachers × grade at elementary; same pattern at middle/high).
 */
export function seedDistrictOrg() {
  const roster = getDemoDistrictRoster();
  return normalizeDistrict({
    id: 'dist-storywell',
    name: 'Storywell School District',
    schools: [
      {
        id: 'sch-wayside',
        name: 'Wayside Elementary',
        address: '30 Stories Way, Wayside, CA 90210',
        phone: '(555) 010-0030',
        bannerUrl: seedBanner('photo-1498243691581-b145c3f54a5a'),
      },
      {
        id: 'sch-crunchem',
        name: 'Crunchem Hall Elementary',
        address: '1 Crunchem Lane, Bramfield',
        phone: '(555) 010-1988',
        bannerUrl: seedBanner('photo-1562774053-701939374585'),
      },
      {
        id: 'sch-avonlea',
        name: 'Avonlea Elementary',
        address: '100 Green Gables Rd, Avonlea, PE',
        phone: '(555) 010-1908',
        bannerUrl: seedBanner('photo-1476514525535-07fb3b4ae5f1'),
      },
      {
        id: 'sch-lark-creek',
        name: 'Lark Creek Elementary',
        address: '42 Terabithia Trail, Lark Creek, VA',
        phone: '(555) 010-1977',
        bannerUrl: seedBanner('photo-1441974231531-c6227db76b6e'),
      },
      {
        id: 'sch-sweet-valley',
        name: 'Sweet Valley Middle',
        address: '98 Twin Palms Blvd, Sweet Valley, CA',
        phone: '(555) 010-1983',
        bannerUrl: seedBanner('photo-1607237138185-eedd9c632b0b'),
      },
      {
        id: 'sch-hogwarts',
        name: 'Hogwarts High',
        address: 'Castle Grounds, Scottish Highlands',
        phone: '(555) 010-1997',
        bannerUrl: seedBanner('photo-1564501049412-61c2a3083791'),
      },
    ],
    schedules: {
      'sch-wayside': elementaryDay('wayside'),
      'sch-crunchem': elementaryDay('crunchem'),
      'sch-avonlea': elementaryDay('avonlea'),
      'sch-lark-creek': elementaryDay('lark'),
      'sch-sweet-valley': secondaryDay('sv'),
      'sch-hogwarts': secondaryDay('hogwarts'),
    },
    classSchools: roster.classSchools,
    staff: roster.staffBySchool,
  });
}

export function scheduleForSchool(org, schoolId) {
  if (!org || !schoolId) return normalizeBuildingSchedule(null);
  return org.schedules?.[schoolId] || normalizeBuildingSchedule(null);
}

export function blockMinutes(block, periods) {
  const byId = new Map((periods || []).map((period) => [period.id, period]));
  let total = 0;
  const seen = new Set();
  for (const id of block?.periodIds || []) {
    if (seen.has(id)) continue;
    seen.add(id);
    const period = byId.get(id);
    if (!period || period.kind !== 'instruction') continue;
    total += periodMinutes(period);
  }
  return total;
}

export function teachingSummary(schedule) {
  const periods = schedule?.periods || [];
  let teachingMin = 0;
  let nonTeachingMin = 0;
  for (const period of periods) {
    const minutes = periodMinutes(period);
    if (period.kind === 'nonInstruction') nonTeachingMin += minutes;
    else teachingMin += minutes;
  }

  const linked = new Set();
  const byAreaTotals = new Map();
  for (const block of schedule?.blocks || []) {
    byAreaTotals.set(
      block.contentArea,
      (byAreaTotals.get(block.contentArea) || 0) + blockMinutes(block, periods),
    );
    for (const id of block.periodIds || []) linked.add(id);
  }

  const unassignedPeriods = [];
  let unassignedMin = 0;
  for (const period of periods) {
    if (period.kind !== 'instruction' || linked.has(period.id)) continue;
    unassignedPeriods.push(period);
    unassignedMin += periodMinutes(period);
  }

  const byArea = CONTENT_AREAS.map((area) => ({
    id: area.id,
    label: area.label,
    minutes: byAreaTotals.get(area.id) || 0,
  })).filter((area) => area.minutes > 0);

  return { teachingMin, nonTeachingMin, unassignedMin, unassignedPeriods, byArea };
}

export function withPeriodPatch(schedule, periodId, patch) {
  const kindChange = patch?.kind === 'nonInstruction';
  return normalizeBuildingSchedule({
    ...schedule,
    periods: (schedule?.periods || []).map((period) =>
      period.id === periodId ? { ...period, ...patch } : period,
    ),
    blocks: kindChange
      ? (schedule?.blocks || []).map((block) => ({
          ...block,
          periodIds: (block.periodIds || []).filter((id) => id !== periodId),
        }))
      : schedule?.blocks,
  });
}

export function withPeriodRemoved(schedule, periodId) {
  return normalizeBuildingSchedule({
    ...schedule,
    periods: (schedule?.periods || []).filter((period) => period.id !== periodId),
    blocks: (schedule?.blocks || []).map((block) => ({
      ...block,
      periodIds: (block.periodIds || []).filter((id) => id !== periodId),
    })),
  });
}

export function withDayTimes(schedule, patch) {
  return normalizeBuildingSchedule({
    ...schedule,
    dayStart: patch?.dayStart ?? schedule?.dayStart,
    dayEnd: patch?.dayEnd ?? schedule?.dayEnd,
  });
}

export function withNewPeriod(schedule) {
  return normalizeBuildingSchedule({
    ...schedule,
    periods: [
      ...(schedule?.periods || []),
      {
        label: '',
        startTime: '',
        endTime: '',
        kind: 'instruction',
        order: schedule?.periods?.length || 0,
      },
    ],
  });
}

export function withBlockPatch(schedule, blockId, patch) {
  return normalizeBuildingSchedule({
    ...schedule,
    blocks: (schedule?.blocks || []).map((block) =>
      block.id === blockId ? { ...block, ...patch } : block,
    ),
  });
}

export function withBlockRemoved(schedule, blockId) {
  return normalizeBuildingSchedule({
    ...schedule,
    blocks: (schedule?.blocks || []).filter((block) => block.id !== blockId),
  });
}

export function withNewBlock(schedule) {
  const order = schedule?.blocks?.length || 0;
  return normalizeBuildingSchedule({
    ...schedule,
    blocks: [
      ...(schedule?.blocks || []),
      {
        label: '',
        contentArea: 'other',
        periodIds: [],
        order,
      },
    ],
  });
}

/** Give these periods to one block and take them off every other block. */
export function withBlockPeriods(schedule, blockId, periodIds) {
  const wanted = new Set((periodIds || []).map(String));
  return normalizeBuildingSchedule({
    ...schedule,
    blocks: (schedule?.blocks || []).map((block) =>
      block.id === blockId
        ? { ...block, periodIds: [...wanted] }
        : {
            ...block,
            periodIds: (block.periodIds || []).filter((id) => !wanted.has(id)),
          },
    ),
  });
}

/**
 * Explicit link wins. `null` means unlinked on purpose.
 * `undefined` means infer from student school names.
 */
export function resolveClassSchoolId(cls, org) {
  if (!cls) return undefined;
  const key = String(cls.id);
  if (org?.classSchools && Object.prototype.hasOwnProperty.call(org.classSchools, key)) {
    const value = org.classSchools[key];
    if (value == null || value === '') return null;
    return String(value);
  }
  if (cls.schoolId == null || cls.schoolId === '') return cls.schoolId === null ? null : undefined;
  return String(cls.schoolId);
}

export function classMatchesSchool(cls, school, org) {
  if (!cls || !school || cls.isArchived) return false;
  const resolved = resolveClassSchoolId(cls, org);
  if (resolved === null) return false;
  if (resolved) return resolved === school.id;
  const schoolName = cleanText(school.name).toLowerCase();
  if (!schoolName) return false;
  return (cls.studentList || []).some(
    (student) => cleanText(student?.school).toLowerCase() === schoolName,
  );
}

export function classesAtSchool(classes, school, org) {
  return (classes || []).filter((cls) => classMatchesSchool(cls, school, org));
}

export function classesOutsideSchool(classes, school, org) {
  return (classes || []).filter((cls) => !cls.isArchived && !classMatchesSchool(cls, school, org));
}

/** Schools linked to the teacher's live classes (roster school name or explicit link). */
export function teacherSchoolIds(classes, org) {
  const ids = [];
  for (const school of org?.schools || []) {
    if (classesAtSchool(classes, school, org).length) ids.push(school.id);
  }
  return ids;
}

/**
 * Admin edits the district. Teachers can open every school, but only their
 * own school is more than a surface summary.
 * @returns {'edit'|'own'|'surface'}
 */
export function schoolAccessMode(canEdit, schoolId, mySchoolIds) {
  if (canEdit) return 'edit';
  if (schoolId && (mySchoolIds || []).includes(schoolId)) return 'own';
  return 'surface';
}

export function canEditDistrict(session) {
  return session?.role === 'admin';
}

export function studentsAtSchool(classes, school, org) {
  const byKey = new Map();
  for (const cls of classesAtSchool(classes, school, org)) {
    const className = cls.name || 'Class';
    for (const student of cls.studentList || []) {
      const key = student?.id != null ? `id:${student.id}` : `name:${student?.name || ''}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { student, classNames: [className] });
        continue;
      }
      if (!existing.classNames.includes(className)) existing.classNames.push(className);
    }
  }
  return [...byKey.values()];
}
