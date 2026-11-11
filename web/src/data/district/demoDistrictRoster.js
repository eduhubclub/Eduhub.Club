/**
 * Full Storywell demo roster: every elementary has 3 teachers per grade (K–5);
 * middle (6–8) and high (9–12) use the same 3-sections-per-grade pattern and
 * ~24 students per teacher. Deterministic IDs/names so seeds stay stable.
 */

import { createDefaultAvatar, createUploadAvatar } from '../classes/avatar';
import { syncLegacyGuardianFields } from '../classes/guardians';
import { HISTORICAL_PORTRAITS } from '../students/historicalPortraits';
import { normalizeAppDisplayName } from '../students/displayName';
import { departmentForRole } from './staffDepartments';

export const STUDENTS_PER_CLASS = 24;
export const SECTIONS = ['A', 'B', 'C'];

export const DEMO_SCHOOL_META = [
  { id: 'sch-wayside', name: 'Wayside Elementary', level: 'elementary', slug: 'wayside' },
  { id: 'sch-crunchem', name: 'Crunchem Hall Elementary', level: 'elementary', slug: 'crunchem' },
  { id: 'sch-avonlea', name: 'Avonlea Elementary', level: 'elementary', slug: 'avonlea' },
  { id: 'sch-lark-creek', name: 'Lark Creek Elementary', level: 'elementary', slug: 'lark' },
  { id: 'sch-sweet-valley', name: 'Sweet Valley Middle', level: 'middle', slug: 'sv' },
  { id: 'sch-hogwarts', name: 'Hogwarts High', level: 'high', slug: 'hogwarts' },
];

const ELEMENTARY_GRADES = [
  { key: 'k', label: 'Kindergarten', birthYears: ['2020', '2021'] },
  { key: '1', label: '1st Grade', birthYears: ['2019', '2020'] },
  { key: '2', label: '2nd Grade', birthYears: ['2018', '2019'] },
  { key: '3', label: '3rd Grade', birthYears: ['2017', '2018'] },
  { key: '4', label: '4th Grade', birthYears: ['2016', '2017'] },
  { key: '5', label: '5th Grade', birthYears: ['2015', '2016'] },
];

const MIDDLE_GRADES = [
  { key: '6', label: '6th Grade', birthYears: ['2014', '2015'] },
  { key: '7', label: '7th Grade', birthYears: ['2013', '2014'] },
  { key: '8', label: '8th Grade', birthYears: ['2012', '2013'] },
];

const HIGH_GRADES = [
  { key: '9', label: '9th Grade', birthYears: ['2011', '2012'] },
  { key: '10', label: '10th Grade', birthYears: ['2010', '2011'] },
  { key: '11', label: '11th Grade', birthYears: ['2009', '2010'] },
  { key: '12', label: '12th Grade', birthYears: ['2008', '2009'] },
];

/** Popular first names (intentionally reused across last names). */
const FIRST_NAMES = [
  'Ava', 'Mia', 'Liam', 'Noah', 'Olivia', 'Emma', 'Sophia', 'Jackson', 'Lucas', 'Amelia',
  'Harper', 'Evelyn', 'Benjamin', 'Elijah', 'Charlotte', 'Henry', 'Alexander', 'James',
  'Isabella', 'Emily', 'Daniel', 'Mateo', 'Scarlett', 'Grace', 'Chloe', 'Sebastian',
  'Jack', 'Aria', 'Lily', 'Zoe', 'Nathan', 'Samuel', 'Hannah', 'Layla', 'Owen', 'Caleb',
  'Nora', 'Riley', 'Levi', 'Isaac', 'Stella', 'Aurora', 'Hazel', 'Violet', 'Gabriel',
  'Julian', 'Penelope', 'Ellie', 'Maya', 'Aaliyah', 'Kai', 'Nina', 'Omar', 'Sofia',
  'Elena', 'Miles', 'Theo', 'Iris', 'Jade', 'Rowan', 'Quinn', 'Sienna', 'Felix', 'Ada',
  'Mason', 'Logan', 'Ethan', 'Aiden', 'Jayden', 'Wyatt', 'Luke', 'Carter', 'Grayson',
  'Leo', 'Hudson', 'Lincoln', 'Jaxon', 'Asher', 'Ezra', 'Josiah', 'Thomas', 'Charles',
  'Maverick', 'Josie', 'Paisley', 'Brooklyn', 'Savannah', 'Audrey', 'Bella', 'Claire',
  'Skylar', 'Lucy', 'Anna', 'Caroline', 'Genesis', 'Kennedy', 'Kinsley', 'Piper',
  'Allison', 'Madelyn', 'Sarah', 'Cora', 'Ruby', 'Eva', 'Naomi', 'Alice',
  'Ivy', 'Brielle', 'Valentina', 'Emery', 'Lydia', 'Clara', 'Vivian', 'Melanie',
  'Jose', 'Diego', 'Antonio', 'Miguel', 'Luis', 'Carlos', 'Andres', 'Javier',
  'Camila', 'Valeria', 'Lucia', 'Mariana', 'Gabriela', 'Daniela', 'Ximena', 'Renata',
  'Aanya', 'Priya', 'Arjun', 'Rohan', 'Anika', 'Dev', 'Meera', 'Kabir',
  'Wei', 'Jun', 'Mei', 'Yuki', 'Hana', 'Kenji', 'Sora', 'Min',
  'Amara', 'Zuri', 'Malik', 'Imani', 'Nyla', 'Kofi', 'Amina', 'Jelani',
  'Finn', 'Callum', 'Maeve', 'Saoirse', 'Niamh', 'Orion', 'Atlas', 'Nova',
  'Phoenix', 'River', 'Sage', 'Remy', 'Dallas', 'Parker', 'Hayden', 'Reese',
  'Brook', 'Jordan', 'Cameron', 'Alex', 'Casey', 'Morgan', 'Taylor', 'Skyler',
];

const LAST_NAMES = [
  'Anderson', 'Bailey', 'Brooks', 'Carter', 'Chen', 'Coleman', 'Cruz', 'Diaz', 'Edwards',
  'Foster', 'Garcia', 'Hayes', 'Hernandez', 'Hughes', 'Ibrahim', 'Jenkins', 'Kim', 'Lee',
  'Lopez', 'Martinez', 'Moore', 'Nguyen', 'Ortiz', 'Patel', 'Perry', 'Price', 'Reed',
  'Rivera', 'Robinson', 'Ross', 'Sanchez', 'Scott', 'Singh', 'Sullivan', 'Taylor',
  'Thomas', 'Torres', 'Turner', 'Walker', 'White', 'Williams', 'Wong', 'Wright', 'Young',
  'Bennett', 'Clark', 'Duncan', 'Ellis', 'Farley', 'Grant', 'Henderson', 'Ingram',
  'Jensen', 'Kowalski', 'Lambert', 'Murphy', 'Nelson', 'Owens', 'Perez', 'Quintero',
  'Ramirez', 'Stewart', 'Underwood', 'Vargas', 'Walsh', 'Xu', 'Yates', 'Zimmerman',
  'Abbott', 'Bishop', 'Caldwell', 'Delgado', 'Everett', 'Fitzgerald', 'Gibson',
  'Hoffman', 'Iverson', 'Jordan', 'Keller', 'Lawson', 'McCarthy', 'Navarro', 'Olson',
  'Pratt', 'Reyes', 'Simmons', 'Tran', 'Upton', 'Whitaker', 'Yilmaz', 'Ali', 'Bah',
  'Chavez', 'Duarte', 'Espinoza', 'Figueroa', 'Gomez', 'Hassan', 'Ito', 'Jha',
];

const TEACHER_LAST = [
  'Jewls', 'Honey', 'Stacy', 'Edmunds', 'Collins', 'McGonagall', 'Rivera', 'Nguyen',
  'Patel', 'Brooks', 'Okoye', 'Santos', 'Keller', 'Morales', 'Singh', 'Hale', 'Cho',
  'Bennett', 'Park', 'Ali', 'Costa', 'Diaz', 'Ford', 'Gao', 'Ito', 'Jensen', 'Khan',
  'Lewis', 'Mendez', 'Nolan', 'Owens', 'Perez', 'Quinn', 'Rao', 'Shaw', 'Tran',
  'Ueda', 'Vega', 'West', 'Xu', 'Yates', 'Zimmerman', 'Ashford', 'Blair', 'Curtis',
  'Dalton', 'Eastman', 'Frost', 'Gill', 'Hart',
];

const TEACHER_TITLES = ['Ms.', 'Mr.', 'Mrs.', 'Mx.'];

const ADDRESSES = [
  '214 Maple Lane, Maple Valley, WA 98038',
  '88 Cedar Court, Renton, WA 98055',
  '1502 Highlands Dr, Issaquah, WA 98027',
  '47 Pine Street, Covington, WA 98042',
  '901 Lakeview Ave, Kent, WA 98032',
  '12 Aspen Way, Black Diamond, WA 98010',
  '330 River Rd, Auburn, WA 98002',
  '55 Summit Blvd, Enumclaw, WA 98022',
  '19 Birch Ave, Bellevue, WA 98004',
  '640 Rainier Ave, Seattle, WA 98144',
];

const GUARDIAN_FIRST = [
  'Jordan', 'Sam', 'Taylor', 'Jamie', 'Alex', 'Casey', 'Riley', 'Morgan', 'Cameron',
  'Avery', 'Quinn', 'Reese', 'Drew', 'Parker', 'Skyler', 'Dana',
];

/** Binary default; Non-binary is applied sparsely per school (see markSparseOtherGenders). */
const GENDERS = ['Female', 'Male'];

const STAFF_PORTRAITS = [
  'photo-1494790108377-be9c29b29330',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1438761681033-6461ffad8d80',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1544005313-94ddf0286df2',
  'photo-1500648767791-00dcc994a43e',
  'photo-1580489944761-15a19d654956',
  'photo-1534528741775-53994a69daeb',
];

/** Classroom / learning-space covers for class tiles. */
const CLASS_COVERS = [
  'photo-1580582932707-520aed937b7b',
  'photo-1509062522246-3755977927d7',
  'photo-1571260899304-425eee4c7efc',
  'photo-1497633762265-9d179a990aa6',
  'photo-1503676260728-1c00da094a0b',
  'photo-1427504494785-3a9ca7044f45',
];

function classCoverUrl(n) {
  return `https://images.unsplash.com/${pick(CLASS_COVERS, n)}?auto=format&fit=crop&w=800&h=320&q=80`;
}

function gradesForLevel(level) {
  if (level === 'middle') return MIDDLE_GRADES;
  if (level === 'high') return HIGH_GRADES;
  return ELEMENTARY_GRADES;
}

function pick(list, n) {
  return list[Math.abs(n) % list.length];
}

function pad(n, width = 4) {
  return String(n).padStart(width, '0');
}

function slugEmail(first, last) {
  const local = `${first.charAt(0)}${last}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  return `${local || 'student'}@edu.hub`;
}

function teacherEmail(last) {
  return `${String(last).toLowerCase().replace(/[^a-z]/g, '')}@storywell.edu`;
}

function portraitUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=160&h=160&q=80`;
}

function monthDay(n) {
  const month = (n % 12) + 1;
  const day = (n % 27) + 1;
  return `${pad(month, 2)}/${pad(day, 2)}`;
}

function makeGuardians(seed, lastName) {
  const a = pick(GUARDIAN_FIRST, seed);
  const b = pick(GUARDIAN_FIRST, seed + 7);
  const phoneA = `(425) 555-${pad(1000 + (seed % 8000), 4)}`;
  const phoneB = `(253) 555-${pad(2000 + (seed % 7000), 4)}`;
  const rows = [
    {
      id: `demo-g-${seed}-1`,
      name: `${a} ${lastName}`,
      phone: phoneA,
      email: `${a.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      relationship: 'Parent',
    },
  ];
  if (seed % 3 !== 0) {
    rows.push({
      id: `demo-g-${seed}-2`,
      name: `${b} ${lastName}`,
      phone: phoneB,
      email: `${b.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      relationship: seed % 5 === 0 ? 'Grandparent' : 'Parent',
    });
  }
  return syncLegacyGuardianFields(rows);
}

/** Prior school years ending before the current demo year (2026–27). */
function priorSchoolYearLabel(yearsAgo) {
  const end = 2027 - yearsAgo;
  return `${end - 1}–${String(end).slice(-2)}`;
}

function previousTeachersFor({ school, grades, gradeKey, section, studentIndex }) {
  const gradeIndex = grades.findIndex((row) => row.key === gradeKey);
  if (gradeIndex <= 0) return [];
  const prior = grades.slice(0, gradeIndex);
  return prior
    .map((grade, priorIndex) => {
      const yearsAgo = gradeIndex - priorIndex;
      const teacher = teacherNameFor(
        school,
        grade,
        section,
        studentIndex + priorIndex * 11 + gradeIndex * 3,
      );
      const teacherName = `${teacher.title} ${teacher.last}`.replace(/\s+/g, ' ').trim();
      return {
        id: `prev-tch-${school.slug}-${grade.key}-${section}-${pad(studentIndex + 1, 5)}`,
        teacherName,
        yearLabel: priorSchoolYearLabel(yearsAgo),
        grade: grade.label,
        className: `${grade.label} ${section}`,
      };
    })
    .reverse();
}

/**
 * Deterministic unique First+Last from the name banks (popular first names still
 * repeat across different last names).
 */
function allocateGeneratedName(index, usedFullNames) {
  const firstLen = FIRST_NAMES.length;
  const lastLen = LAST_NAMES.length;
  const capacity = firstLen * lastLen;
  for (let attempt = 0; attempt < capacity; attempt += 1) {
    const n = Math.abs(index * 7919 + attempt * 104729) % capacity;
    const firstName = FIRST_NAMES[n % firstLen];
    const lastName = LAST_NAMES[Math.floor(n / firstLen) % lastLen];
    const name = `${firstName} ${lastName}`;
    if (usedFullNames.has(name)) continue;
    usedFullNames.add(name);
    return { firstName, lastName, name };
  }
  const firstName = pick(FIRST_NAMES, index);
  const lastName = `${pick(LAST_NAMES, index + 3)}${pad((index % 97) + 1, 2)}`;
  const name = `${firstName} ${lastName}`;
  usedFullNames.add(name);
  return { firstName, lastName, name };
}

function makeStudent({
  index,
  portraitIndex = null,
  schoolName,
  gradeLabel,
  birthYears,
  forceId = null,
  previousTeachers = [],
  usedFullNames = null,
}) {
  const portrait =
    portraitIndex != null ? HISTORICAL_PORTRAITS[portraitIndex % HISTORICAL_PORTRAITS.length] : null;
  let firstName;
  let lastName;
  let name;
  if (portrait) {
    firstName = portrait.name.split(/\s+/).slice(0, -1).join(' ') || portrait.name;
    lastName = portrait.name.split(/\s+/).slice(-1)[0];
    name = portrait.name;
    usedFullNames?.add(name);
  } else {
    ({ firstName, lastName, name } = allocateGeneratedName(index, usedFullNames || new Set()));
  }
  const nickname = portrait?.nickname || '';
  const gender = portrait?.gender || pick(GENDERS, index);
  const birthYear = pick(birthYears, index);
  const birthMonthDay = portrait?.birthMonthDay || monthDay(index + 3);
  const studentId = String(100250000 + index + 1);
  const id = forceId || `demo-stu-${pad(index + 1, 5)}`;

  return {
    id,
    name,
    firstName,
    lastName,
    nickname,
    appDisplayName: normalizeAppDisplayName(undefined, nickname),
    studentId,
    email: slugEmail(firstName, lastName),
    password: String(1000 + ((index * 137) % 9000)),
    gender,
    grade_level: gradeLabel,
    school: schoolName,
    district: 'Storywell School District',
    managedByDistrict: true,
    siblingIds: [],
    birthdate: `${birthMonthDay}/${birthYear}`,
    guardianAddress: pick(ADDRESSES, index),
    previousTeachers,
    avatar: portrait
      ? createUploadAvatar(portrait.imageUrl, portrait.imageUrl)
      : createDefaultAvatar(),
    ...makeGuardians(index + 11, lastName),
  };
}

/**
 * Mark 1–2 students per school as Non-binary (maps to gender-color “Other / unset”).
 * Leaves Demo Class historical cast untouched.
 */
function markSparseOtherGenders(schoolClasses, school) {
  const eligible = schoolClasses
    .filter((cls) => cls.id !== 'demo-3rd-grade')
    .flatMap((cls) => cls.studentList || []);
  if (!eligible.length) return;
  const count = school.slug.length % 2 === 0 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const student = eligible[(i * 37 + school.slug.length * 11) % eligible.length];
    if (student) student.gender = 'Non-binary';
  }
}

/**
 * Link sibling pairs/trios across grades in one school: shared last name,
 * address, and guardians. Skips Demo Class (historical cast).
 */
function applySiblingFamilies(schoolClasses, school, usedFullNames) {
  const byGrade = new Map();
  for (const cls of schoolClasses) {
    if (cls.id === 'demo-3rd-grade') continue;
    for (const student of cls.studentList || []) {
      const grade = cls.grade || student.grade_level || '';
      if (!byGrade.has(grade)) byGrade.set(grade, []);
      byGrade.get(grade).push(student);
    }
  }
  const grades = [...byGrade.keys()];
  if (grades.length < 2) return;

  const familyTarget =
    school.level === 'elementary' ? 22 : school.level === 'middle' ? 10 : 12;
  const claimed = new Set();

  for (let f = 0; f < familyTarget; f += 1) {
    const size = f % 5 === 0 ? 3 : 2;
    const members = [];
    for (let m = 0; m < size; m += 1) {
      const grade = grades[(f * 3 + m * 5) % grades.length];
      if (members.some((row) => row.grade === grade)) continue;
      const pool = (byGrade.get(grade) || []).filter((s) => !claimed.has(s.id));
      if (!pool.length) continue;
      const student = pool[(f * 11 + m * 17) % pool.length];
      members.push({ student, grade });
    }
    if (members.length < 2) continue;

    const anchor = members[0].student;
    const familyLast = anchor.lastName;
    const address = anchor.guardianAddress;
    const guardians = makeGuardians(9000 + f * 13 + school.slug.length, familyLast);

    for (let m = 0; m < members.length; m += 1) {
      const student = members[m].student;
      claimed.add(student.id);
      if (m > 0) {
        usedFullNames.delete(student.name);
        let firstName = student.firstName;
        let full = `${firstName} ${familyLast}`;
        if (usedFullNames.has(full)) {
          for (let attempt = 0; attempt < FIRST_NAMES.length; attempt += 1) {
            firstName = FIRST_NAMES[(f * 19 + m * 23 + attempt) % FIRST_NAMES.length];
            full = `${firstName} ${familyLast}`;
            if (!usedFullNames.has(full)) break;
          }
        }
        usedFullNames.add(full);
        student.firstName = firstName;
        student.lastName = familyLast;
        student.name = full;
        student.email = slugEmail(firstName, familyLast);
      }
      student.guardianAddress = address;
      Object.assign(student, guardians);
    }

    const ids = members.map((row) => row.student.id);
    for (const { student } of members) {
      student.siblingIds = ids.filter((id) => id !== student.id);
    }
  }
}

/** Famous literary teachers kept in the demo for flavor. */
const SIGNATURE_TEACHERS = {
  'sch-wayside|3|A': { title: 'Mrs.', last: 'Jewls', role: '3rd Grade Teacher', room: 'Room 30' },
  'sch-crunchem|1|A': { title: 'Miss', last: 'Honey', role: '1st Grade Teacher', room: 'Room 1' },
  'sch-avonlea|2|A': { title: 'Miss', last: 'Stacy', role: '2nd Grade Teacher', room: 'Room 2' },
  'sch-lark-creek|4|A': { title: 'Miss', last: 'Edmunds', role: 'Music / 4th Grade', room: 'Room 4' },
  'sch-sweet-valley|7|A': { title: 'Mr.', last: 'Collins', role: '7th Grade English', room: 'Room 108' },
  'sch-hogwarts|9|A': { title: 'Professor', last: 'McGonagall', role: '9th Grade Advisor', room: 'Classroom 1F' },
};

const PRINCIPALS = {
  'sch-wayside': { name: 'Mr. Kidswatter', role: 'Principal', room: 'Office', extension: 'x1001' },
  'sch-crunchem': { name: 'Miss Trunchbull', role: 'Headmistress', room: 'Office', extension: 'x2100' },
  'sch-avonlea': { name: 'Mr. Phillips', role: 'Principal', room: 'Office', extension: 'x2200' },
  'sch-lark-creek': { name: 'Mrs. Myers', role: 'Principal', room: 'Office', extension: 'x2300' },
  'sch-sweet-valley': { name: 'Mrs. Arnette', role: 'Principal', room: 'Office', extension: 'x3001' },
  'sch-hogwarts': { name: 'Albus Dumbledore', role: 'Headmaster', room: 'Head’s Office', extension: 'x4001' },
};

const ASSISTANT_PRINCIPALS = {
  'sch-wayside': {
    name: 'Miss Nogard',
    role: 'Assistant Principal',
    room: 'Office',
    extension: 'x1002',
  },
  'sch-crunchem': {
    name: 'Mrs. Phelps',
    role: 'Assistant Principal',
    room: 'Office',
    extension: 'x2101',
  },
  'sch-avonlea': {
    name: 'Mrs. Lynde',
    role: 'Assistant Principal',
    room: 'Office',
    extension: 'x2201',
  },
  'sch-lark-creek': {
    name: 'Mrs. Aarons',
    role: 'Assistant Principal',
    room: 'Office',
    extension: 'x2301',
  },
  'sch-sweet-valley': {
    name: 'Mrs. Wilber',
    role: 'Assistant Principal',
    room: 'Office',
    extension: 'x3002',
  },
  'sch-hogwarts': {
    name: 'Severus Snape',
    role: 'Deputy Headmaster',
    room: 'Dungeon Office',
    extension: 'x4002',
  },
};

/** Non-classroom roles. Omit `levels` for every school; otherwise match school.level. */
const BUILDING_SUPPORT_ROLES = [
  { key: 'building-manager', role: 'Building Manager', room: 'Facilities' },
  { key: 'admin-assistant', role: 'Admin Assistant', room: 'Main Office' },
  { key: 'office-assistant', role: 'Office Assistant', room: 'Main Office' },
  { key: 'registrar', role: 'Registrar', room: 'Main Office' },
  { key: 'librarian', role: 'Librarian', room: 'Library' },
  { key: 'coach', role: 'Coach', room: 'Gym' },
  { key: 'reading-specialist', role: 'Reading Specialist', room: 'Literacy Lab' },
  { key: 'playground', role: 'Playground Staff', room: 'Playground' },
  { key: 'counselor', role: 'Counselor', room: 'Counseling' },
  { key: 'psychologist', role: 'Psychologist', room: 'Student Services' },
  { key: 'ot-pt-sails', role: 'OT/PT (SAILS)', room: 'SAILS' },
  {
    key: 'security',
    role: 'Security Officer',
    room: 'Security',
    levels: ['middle', 'high'],
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `para-${i + 1}`,
    role: 'Paraeducator',
    room: i < 6 ? `Support ${i + 1}` : 'Resource',
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    key: `cafeteria-${i + 1}`,
    role: 'Cafeteria Staff',
    room: 'Cafeteria',
  })),
  { key: 'custodian-day', role: 'Custodian', room: 'Custodial' },
  { key: 'custodian-eve', role: 'Custodian', room: 'Custodial' },
];

function pushSupportStaff(staff, school, teacherIndexStart) {
  let teacherIndex = teacherIndexStart;
  for (let i = 0; i < BUILDING_SUPPORT_ROLES.length; i += 1) {
    const row = BUILDING_SUPPORT_ROLES[i];
    if (row.levels && !row.levels.includes(school.level)) continue;
    const title = pick(TEACHER_TITLES, teacherIndex + 11);
    const last = pick(TEACHER_LAST, teacherIndex + 29);
    const name = `${title} ${last}`.replace(/\s+/g, ' ').trim();
    staff.push({
      id: `demo-staff-${school.slug}-${row.key}`,
      name,
      role: row.role,
      department: departmentForRole(row.role),
      room: row.room,
      extension: `x${1400 + teacherIndex}`,
      email: teacherEmail(last),
      avatarUrl: portraitUrl(pick(STAFF_PORTRAITS, teacherIndex + 5)),
      classId: '',
    });
    teacherIndex += 1;
  }
  return teacherIndex;
}

function classIdFor(school, grade, section) {
  if (school.id === 'sch-wayside' && grade.key === '3' && section === 'A') return 'demo-3rd-grade';
  return `demo-cls-${school.slug}-${grade.key}-${section.toLowerCase()}`;
}

function teacherNameFor(school, grade, section, teacherIndex) {
  const key = `${school.id}|${grade.key}|${section}`;
  const signature = SIGNATURE_TEACHERS[key];
  if (signature) return signature;
  const title = pick(TEACHER_TITLES, teacherIndex);
  const last = pick(TEACHER_LAST, teacherIndex + 17);
  return {
    title,
    last,
    role: `${grade.label} Teacher`,
    room: `Room ${100 + (teacherIndex % 80)}`,
  };
}

/**
 * Builds classes, staff-by-school, and class→school links for the demo district.
 */
export function buildDemoDistrictRoster() {
  const classes = [];
  const staffBySchool = {};
  const classSchools = {};
  const usedFullNames = new Set();
  let studentIndex = 0;
  let teacherIndex = 0;

  for (const school of DEMO_SCHOOL_META) {
    const staff = [];
    const schoolClasses = [];
    const grades = gradesForLevel(school.level);
    const principal = PRINCIPALS[school.id];
    if (principal) {
      staff.push({
        id: `demo-staff-${school.slug}-principal`,
        name: principal.name,
        role: principal.role,
        department: departmentForRole(principal.role),
        room: principal.room,
        extension: principal.extension,
        email: teacherEmail(principal.name.split(/\s+/).slice(-1)[0]),
        avatarUrl: portraitUrl(pick(STAFF_PORTRAITS, teacherIndex)),
        classId: '',
      });
      teacherIndex += 1;
    }
    const assistant = ASSISTANT_PRINCIPALS[school.id];
    if (assistant) {
      staff.push({
        id: `demo-staff-${school.slug}-assistant`,
        name: assistant.name,
        role: assistant.role,
        department: departmentForRole(assistant.role),
        room: assistant.room,
        extension: assistant.extension,
        email: teacherEmail(assistant.name.split(/\s+/).slice(-1)[0]),
        avatarUrl: portraitUrl(pick(STAFF_PORTRAITS, teacherIndex)),
        classId: '',
      });
      teacherIndex += 1;
    }
    teacherIndex = pushSupportStaff(staff, school, teacherIndex);

    for (const grade of grades) {
      for (const section of SECTIONS) {
        const classId = classIdFor(school, grade, section);
        const teacher = teacherNameFor(school, grade, section, teacherIndex);
        const staffId = `demo-staff-${school.slug}-${grade.key}-${section.toLowerCase()}`;
        const displayName = `${teacher.title} ${teacher.last}`.replace(/\s+/g, ' ').trim();
        const room =
          teacher.room ||
          `Room ${grade.key.toUpperCase()}${section}`;
        const extension = `x${1100 + teacherIndex}`;
        const isJewlsClass = classId === 'demo-3rd-grade';

        staff.push({
          id: staffId,
          name: displayName,
          role: teacher.role,
          department: departmentForRole(teacher.role),
          room,
          extension,
          email: teacherEmail(teacher.last),
          avatarUrl: portraitUrl(pick(STAFF_PORTRAITS, teacherIndex + 3)),
          classId,
        });

        const studentList = [];
        for (let i = 0; i < STUDENTS_PER_CLASS; i += 1) {
          const forceId =
            isJewlsClass && i === 0
              ? 'demo-student-profile'
              : isJewlsClass && i === 1
                ? 'demo-student-2'
                : null;
          studentList.push(
            makeStudent({
              index: studentIndex,
              portraitIndex: isJewlsClass ? i : null,
              schoolName: school.name,
              gradeLabel: grade.label,
              birthYears: grade.birthYears,
              forceId,
              usedFullNames,
              previousTeachers: previousTeachersFor({
                school,
                grades,
                gradeKey: grade.key,
                section,
                studentIndex,
              }),
            }),
          );
          studentIndex += 1;
        }

        const cls = {
          id: classId,
          name: isJewlsClass ? 'Demo Class' : `${grade.label} ${section}`,
          subject: school.level === 'elementary' ? 'Homeroom' : grade.label,
          grade: grade.label,
          icon: 'BookOpen',
          isArchived: false,
          joinCode: isJewlsClass
            ? 'DEM3RD'
            : `${school.slug.slice(0, 2)}${grade.key}${section}${pad(teacherIndex, 2)}`
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6),
          appCodes: {},
          teacherName: displayName,
          room,
          coverUrl: classCoverUrl(teacherIndex),
          studentList,
        };
        schoolClasses.push(cls);
        classes.push(cls);
        classSchools[classId] = school.id;
        teacherIndex += 1;
      }
    }

    applySiblingFamilies(schoolClasses, school, usedFullNames);
    markSparseOtherGenders(schoolClasses, school);
    staffBySchool[school.id] = staff;
  }

  return { classes, staffBySchool, classSchools };
}

/** Lazy singleton so seeds share one build. */
let cached = null;
export function getDemoDistrictRoster() {
  if (!cached) cached = buildDemoDistrictRoster();
  return cached;
}

/** Test helper — rebuild after generator changes. */
export function resetDemoDistrictRosterCache() {
  cached = null;
}
