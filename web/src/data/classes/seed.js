/**
 * Canonical student shape used across Edu.Hub.
 * Apps should pull only the fields they need via selectors.
 *
 * Includes one demo class so new teachers see a sample roster.
 * The empty state appears only after that class is deleted.
 *
 * Bump SEED_REVISION whenever seed content should replace in-memory state.
 */
import { syncLegacyGuardianFields } from './guardians';
import { createUploadAvatar } from './avatar';
import { HISTORICAL_PORTRAITS } from '../students/historicalPortraits';
import { normalizeAppDisplayName, studentDisplayName } from '../students/displayName';

export const SEED_REVISION = 21;

function g(id, name, phone, email, relationship = 'Parent') {
  return { id, name, phone, email, relationship };
}

/** Keep fictional modern guardians; cycle a few templates across the cast. */
const GUARDIAN_TEMPLATES = [
  [
    g('hg-1', 'Jordan Hayes', '(425) 555-0101', 'jordan.hayes@example.com'),
    g('hg-2', 'Sam Hayes', '(425) 555-0201', 'sam.hayes@example.com'),
  ],
  [
    g('hg-3', 'Taylor Brooks', '(425) 555-0102', 'taylor.brooks@example.com'),
    g('hg-4', 'Jamie Brooks', '(425) 555-0202', 'jamie.brooks@example.com'),
  ],
  [
    g('hg-5', 'Mei Chen', '(425) 555-0103', 'mei.chen@example.com'),
    g('hg-6', 'Wei Chen', '(425) 555-0203', 'wei.chen@example.com'),
  ],
  [g('hg-7', 'Sam Davis', '(253) 555-0104', 'sam.davis@example.com')],
  [
    g('hg-8', 'Casey Edwards', '(253) 555-0105', 'casey.edwards@example.com'),
    g('hg-9', 'Reese Edwards', '(253) 555-0205', 'reese.edwards@example.com'),
  ],
  [
    g('hg-10', 'Alex Foster', '(360) 555-0106', 'alex.foster@example.com'),
    g('hg-11', 'Cameron Foster', '(360) 555-0206', 'cameron.foster@example.com'),
    g('hg-12', 'Ruth Foster', '(360) 555-0306', 'ruth.foster@example.com', 'Grandparent'),
  ],
];

const DEMO_ADDRESSES = [
  '214 Maple Lane, Maple Valley, WA 98038',
  '88 Cedar Court, Renton, WA 98055',
  '1502 Highlands Dr, Issaquah, WA 98027',
  '47 Pine Street, Covington, WA 98042',
  '901 Lakeview Ave, Kent, WA 98032',
  '12 Aspen Way, Black Diamond, WA 98010',
  '330 River Rd, Auburn, WA 98002',
  '55 Summit Blvd, Enumclaw, WA 98022',
];

/** Alternate elementary years so ages stay classroom-plausible. */
const DEMO_BIRTH_YEARS = ['2016', '2017'];

/**
 * Demo roster: historical figures with public-domain portraits.
 * Guardians / addresses stay fictional for demo plumbing.
 * Birth month/day follows the figure when known; year stays modern demo age.
 */
const DEMO_STUDENTS = HISTORICAL_PORTRAITS.map((figure, i) => ({
  name: figure.name,
  nickname: figure.nickname || '',
  appDisplayName: normalizeAppDisplayName(undefined, figure.nickname),
  gender: figure.gender,
  birthdate: `${figure.birthMonthDay || '01/01'}/${DEMO_BIRTH_YEARS[i % DEMO_BIRTH_YEARS.length]}`,
  guardianAddress: DEMO_ADDRESSES[i % DEMO_ADDRESSES.length],
  guardians: GUARDIAN_TEMPLATES[i % GUARDIAN_TEMPLATES.length].map((row, j) => ({
    ...row,
    id: `hist-g-${i + 1}-${j + 1}`,
  })),
}));

function buildDummyStudentList() {
  return DEMO_STUDENTS.map((student, i) => {
    const legacy = syncLegacyGuardianFields(student.guardians || []);
    const parts = student.name.split(/\s+/);
    const first = parts[0] || '';
    const last = parts[parts.length - 1] || '';
    const local = `${first.charAt(0)}${last}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
    const studentId = String(100250000 + i + 1);
    const password = String(1000 + ((i * 137) % 9000));
    const portrait = HISTORICAL_PORTRAITS[i];
    // Same id as Edu.Students demo profile so directory ↔ class ↔ Bank stay linked
    const isLead = i === 0;
    return {
      id: isLead ? 'demo-student-profile' : `demo-student-${i + 1}`,
      grade_level: '3rd Grade',
      studentId,
      email: `${local || `student${i + 1}`}@edu.hub`,
      password: isLead ? '4821' : password,
      avatar: createUploadAvatar(portrait.imageUrl, portrait.imageUrl),
      school: 'Tahoma Elementary',
      district: 'Tahoma School District',
      managedByDistrict: true,
      ...student,
      ...legacy,
    };
  });
}

export const SEED_CLASSES = [
  {
    id: 'demo-3rd-grade',
    name: 'Demo Class',
    subject: 'Homeroom',
    grade: '3rd Grade',
    icon: 'BookOpen',
    isArchived: false,
    joinCode: 'DEM3RD',
    appCodes: {},
    studentList: buildDummyStudentList(),
  },
];

/** Apps that only need names (Randomizer, Groups, etc.) */
export function getStudentNames(cls) {
  return (cls?.studentList || []).map((s) => studentDisplayName(s));
}

/** Full roster for the given class */
export function getStudents(cls) {
  return cls?.studentList || [];
}

export function findClassById(classes, id) {
  return classes.find((c) => c.id === id) || null;
}

export function sortStudentsByLastName(students, order = 'asc') {
  const getParts = (name) => {
    if (!name) return { first: '', last: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(' ') };
    }
    return { last: parts[0], first: '' };
  };

  return [...students].sort((a, b) => {
    const partsA = getParts(a.name);
    const partsB = getParts(b.name);
    const lastCmp = partsA.last.toLowerCase().localeCompare(partsB.last.toLowerCase());
    if (lastCmp !== 0) return order === 'asc' ? lastCmp : -lastCmp;
    const firstCmp = partsA.first.toLowerCase().localeCompare(partsB.first.toLowerCase());
    return order === 'asc' ? firstCmp : -firstCmp;
  });
}

export function studentInitials(name) {
  if (!name) return 'ST';
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function parseManualStudentLines(text) {
  return text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: `manual-${Date.now()}-${i}`,
      name,
      avatar: createDefaultAvatar(),
    }));
}
