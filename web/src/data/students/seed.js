import {
  AVATAR_IMAGE_LIBRARY,
  AVATAR_TYPES,
  createDefaultAvatar,
  createEmojiAvatar,
  createLibraryAvatar,
  normalizeAvatar,
} from '../classes/avatar';
import { syncLegacyGuardianFields } from '../classes/guardians';

/**
 * Shared student directory seed.
 * Bump SEED_REVISION when seed content should replace in-memory state.
 */
export const SEED_REVISION = 7;

export const DISTRICT_OPTIONS = ['Tahoma School District'];

/** District-rostered students cannot be deleted by teachers. */
export function isStudentManagedByDistrict(student) {
  return Boolean(student?.managedByDistrict);
}

export const SCHOOL_OPTIONS = [
  'Tahoma Elementary',
  'Rock Creek Elementary',
  'Glacier Park Elementary',
  'Shadow Lake Elementary',
  'Cedar River Middle School',
  'Summit Trail Middle School',
  'Tahoma High School',
];

const DEMO_GUARDIANS = [
  {
    id: 'demo-g-1',
    name: 'Jordan Anderson',
    phone: '(425) 555-0101',
    email: 'jordan.anderson@example.com',
    relationship: 'Parent',
  },
  {
    id: 'demo-g-2',
    name: 'Sam Anderson',
    phone: '(425) 555-0201',
    email: 'sam.anderson@example.com',
    relationship: 'Parent',
  },
  {
    id: 'demo-g-3',
    name: 'Helen Anderson',
    phone: '(425) 555-0301',
    email: 'helen.anderson@example.com',
    relationship: 'Grandparent',
  },
];

export const SEED_STUDENTS = [
  {
    id: 'demo-student-profile',
    name: 'Harper Anderson',
    firstName: 'Harper',
    lastName: 'Anderson',
    nickname: 'Harps',
    studentId: '100250001',
    email: 'handerson@edu.hub',
    password: '4821',
    gender: 'Female',
    grade_level: '3rd Grade',
    school: 'Tahoma Elementary',
    district: 'Tahoma School District',
    managedByDistrict: true,
    siblingIds: ['demo-sibling-liam'],
    birthdate: '04/12/2017',
    guardianAddress: '214 Maple Lane, Maple Valley, WA 98038',
    avatar: createEmojiAvatar('🐶'),
    ...syncLegacyGuardianFields(DEMO_GUARDIANS),
  },
  {
    id: 'demo-sibling-liam',
    name: 'Liam Anderson',
    firstName: 'Liam',
    lastName: 'Anderson',
    nickname: '',
    studentId: '100250010',
    email: 'landerson@edu.hub',
    password: '3917',
    gender: 'Male',
    grade_level: '6th Grade',
    school: 'Tahoma Elementary',
    district: 'Tahoma School District',
    managedByDistrict: true,
    siblingIds: ['demo-student-profile'],
    birthdate: '09/03/2014',
    guardianAddress: '214 Maple Lane, Maple Valley, WA 98038',
    avatar: createLibraryAvatar(
      AVATAR_IMAGE_LIBRARY[1].id,
      AVATAR_IMAGE_LIBRARY[1].imageUrl
    ),
    ...syncLegacyGuardianFields(DEMO_GUARDIANS),
  },
];

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'];

export { GENDER_OPTIONS };

/** Normalize a roster/class student into a directory record. */
export function normalizeDirectoryStudent(raw, extras = {}) {
  const name = (raw.name || '').trim();
  const parts = name.split(/\s+/);
  const firstName = raw.firstName || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]) || '';
  const lastName = raw.lastName || (parts.length > 1 ? parts[parts.length - 1] : '') || '';

  return {
    id: raw.id || `student-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    nickname: raw.nickname || '',
    studentId: raw.studentId || '',
    email: raw.email || '',
    password: raw.password || '',
    gender: raw.gender || '',
    grade_level: raw.grade_level || extras.grade_level || '',
    school: raw.school || extras.school || '',
    district: raw.district || extras.district || '',
    managedByDistrict: Boolean(raw.managedByDistrict ?? extras.managedByDistrict),
    siblingIds: Array.isArray(raw.siblingIds) ? raw.siblingIds : [],
    birthdate: raw.birthdate || '',
    guardianAddress: raw.guardianAddress || raw.address || '',
    avatar: raw.avatar || createDefaultAvatar(),
    guardians: raw.guardians,
    guardianName: raw.guardianName,
    guardianPhone: raw.guardianPhone,
    guardianEmail: raw.guardianEmail,
    ...syncLegacyGuardianFields(
      Array.isArray(raw.guardians) && raw.guardians.length
        ? raw.guardians
        : raw.guardianName || raw.guardianPhone || raw.guardianEmail
          ? [
              {
                id: 'g-legacy',
                name: raw.guardianName || '',
                phone: raw.guardianPhone || '',
                email: raw.guardianEmail || '',
                relationship: 'Parent',
              },
            ]
          : []
    ),
  };
}

/** Prefer a chosen avatar (emoji/upload/library) over blank initials. */
function preferAvatar(incoming, existing) {
  const next = normalizeAvatar({ avatar: incoming });
  if (next.type !== AVATAR_TYPES.initials) return incoming || existing;
  return existing || incoming;
}

/**
 * Merge incoming students into the directory without wiping richer profile data.
 */
export function mergeDirectoryStudents(existing, incoming, extras = {}) {
  const next = [...existing];
  for (const raw of incoming) {
    const normalized = normalizeDirectoryStudent(raw, extras);
    const idx = next.findIndex(
      (p) =>
        p.id === normalized.id ||
        (p.name.toLowerCase() === normalized.name.toLowerCase() &&
          (!normalized.school || !p.school || p.school === normalized.school))
    );
    if (idx === -1) {
      next.push(normalized);
      continue;
    }
    const prev = next[idx];
    next[idx] = {
      ...normalized,
      ...prev,
      // Prefer non-empty incoming fields for roster-driven updates
      name: normalized.name || prev.name,
      grade_level: normalized.grade_level || prev.grade_level,
      gender: normalized.gender || prev.gender,
      school: prev.school || normalized.school,
      district: prev.district || normalized.district,
      managedByDistrict: prev.managedByDistrict || normalized.managedByDistrict,
      siblingIds:
        prev.siblingIds?.length > 0 ? prev.siblingIds : normalized.siblingIds || [],
      studentId: prev.studentId || normalized.studentId,
      email: prev.email || normalized.email,
      password: prev.password || normalized.password,
      nickname: prev.nickname || normalized.nickname,
      birthdate: prev.birthdate || normalized.birthdate,
      guardianAddress: prev.guardianAddress || normalized.guardianAddress,
      guardians: prev.guardians?.length ? prev.guardians : normalized.guardians,
      avatar: preferAvatar(normalized.avatar, prev.avatar),
      id: prev.id,
    };
  }
  return next;
}

/**
 * Build a canonical student record from the Add Student form.
 * Required: firstName, lastName, gender, grade.
 */
export function buildStudentFromForm(form) {
  const firstName = (form.firstName || '').trim();
  const lastName = (form.lastName || '').trim();
  const name = `${firstName} ${lastName}`.trim();

  const guardians = [0, 1]
    .map((i) => ({
      id: `g-${Date.now()}-${i}`,
      name: (form[`parent${i + 1}Name`] || '').trim(),
      phone: (form[`parent${i + 1}Phone`] || '').trim(),
      email: (form[`parent${i + 1}Email`] || '').trim(),
      relationship: 'Parent',
    }))
    .filter((g) => g.name || g.phone || g.email);

  const siblingIds = Array.isArray(form.siblingIds) ? form.siblingIds : [];

  return {
    id: `student-${Date.now()}`,
    name,
    firstName,
    lastName,
    nickname: (form.nickname || '').trim(),
    studentId: (form.studentId || '').trim(),
    email: (form.email || '').trim(),
    password: (form.password || '').trim(),
    gender: form.gender || '',
    grade_level: form.grade || '',
    school: (form.school || '').trim(),
    district: (form.district || '').trim(),
    managedByDistrict: false,
    siblingIds,
    birthdate: (form.birthdate || '').trim(),
    guardianAddress: (form.guardianAddress || '').trim(),
    avatar: createDefaultAvatar(),
    ...syncLegacyGuardianFields(guardians),
  };
}

export function isAddStudentFormValid(form) {
  return Boolean(
    (form.firstName || '').trim() &&
      (form.lastName || '').trim() &&
      form.gender &&
      form.grade
  );
}

export const EMPTY_ADD_STUDENT_FORM = {
  firstName: '',
  lastName: '',
  nickname: '',
  studentId: '',
  email: '',
  password: '',
  gender: '',
  grade: '',
  school: '',
  district: '',
  siblingIds: [],
  birthdate: '',
  guardianAddress: '',
  parent1Name: '',
  parent1Phone: '',
  parent1Email: '',
  parent2Name: '',
  parent2Phone: '',
  parent2Email: '',
};
