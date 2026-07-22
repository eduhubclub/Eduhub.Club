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
import {
  AVATAR_IMAGE_LIBRARY,
  createDefaultAvatar,
  createEmojiAvatar,
  createLibraryAvatar,
  createUploadAvatar,
} from './avatar';

export const SEED_REVISION = 12;

const DEMO_EMOJI_AVATARS = ['🐶', '🦊', '🦄', '🌟', '🐸', '🚀', '🍕', '🌈', '🐯', '🦋', '⚽', '🎨'];

/** Cycle initials / emoji / library / upload so other apps show a mix. */
function demoAvatarForIndex(i) {
  const kind = i % 4;
  if (kind === 0) {
    return createDefaultAvatar();
  }
  if (kind === 1) {
    return createEmojiAvatar(DEMO_EMOJI_AVATARS[i % DEMO_EMOJI_AVATARS.length]);
  }
  if (kind === 2) {
    const lib = AVATAR_IMAGE_LIBRARY[i % AVATAR_IMAGE_LIBRARY.length];
    return createLibraryAvatar(lib.id, lib.imageUrl);
  }
  const uploaded = AVATAR_IMAGE_LIBRARY[(i + 7) % AVATAR_IMAGE_LIBRARY.length];
  return createUploadAvatar(uploaded.imageUrl);
}

function g(id, name, phone, email, relationship = 'Parent') {
  return { id, name, phone, email, relationship };
}

/**
 * Demo roster: most students have 1–2 parents (grid-visible).
 * A few also include grandparents (profile-only extras beyond slot 2).
 */
const DEMO_STUDENTS = [
  {
    name: 'Harper Anderson',
    nickname: '',
    gender: 'Female',
    birthdate: '04/12/2017',
    guardianAddress: '214 Maple Lane, Maple Valley, WA 98038',
    guardians: [
      g('ha-1', 'Jordan Anderson', '(425) 555-0101', 'jordan.anderson@example.com'),
      g('ha-2', 'Sam Anderson', '(425) 555-0201', 'sam.anderson@example.com'),
      g('ha-3', 'Helen Anderson', '(425) 555-0301', 'helen.anderson@example.com', 'Grandparent'),
    ],
  },
  {
    name: 'Mason Brooks',
    nickname: '',
    gender: 'Male',
    birthdate: '09/03/2016',
    guardianAddress: '88 Cedar Court, Renton, WA 98055',
    guardians: [
      g('mb-1', 'Taylor Brooks', '(425) 555-0102', 'taylor.brooks@example.com'),
      g('mb-2', 'Jamie Brooks', '(425) 555-0202', 'jamie.brooks@example.com'),
    ],
  },
  {
    name: 'Olivia Chen',
    nickname: 'Liv',
    gender: 'Female',
    birthdate: '01/22/2017',
    guardianAddress: '1502 Highlands Dr, Issaquah, WA 98027',
    guardians: [
      g('oc-1', 'Mei Chen', '(425) 555-0103', 'mei.chen@example.com'),
      g('oc-2', 'Wei Chen', '(425) 555-0203', 'wei.chen@example.com'),
    ],
  },
  {
    name: 'Ethan Davis',
    nickname: '',
    gender: 'Male',
    birthdate: '11/15/2016',
    guardianAddress: '47 Pine Street, Covington, WA 98042',
    guardians: [g('ed-1', 'Sam Davis', '(253) 555-0104', 'sam.davis@example.com')],
  },
  {
    name: 'Ava Edwards',
    nickname: '',
    gender: 'Female',
    birthdate: '06/08/2017',
    guardianAddress: '901 Lakeview Ave, Kent, WA 98032',
    guardians: [
      g('ae-1', 'Casey Edwards', '(253) 555-0105', 'casey.edwards@example.com'),
      g('ae-2', 'Reese Edwards', '(253) 555-0205', 'reese.edwards@example.com'),
    ],
  },
  {
    name: 'Liam Foster',
    nickname: '',
    gender: 'Male',
    birthdate: '02/28/2017',
    guardianAddress: '12 Aspen Way, Black Diamond, WA 98010',
    guardians: [
      g('lf-1', 'Alex Foster', '(360) 555-0106', 'alex.foster@example.com'),
      g('lf-2', 'Cameron Foster', '(360) 555-0206', 'cameron.foster@example.com'),
      g('lf-3', 'Ruth Foster', '(360) 555-0306', 'ruth.foster@example.com', 'Grandparent'),
    ],
  },
  {
    name: 'Sophia Garcia',
    nickname: '',
    gender: 'Female',
    birthdate: '08/19/2016',
    guardianAddress: '330 River Rd, Auburn, WA 98002',
    guardians: [
      g('sg-1', 'Maria Garcia', '(253) 555-0107', 'maria.garcia@example.com'),
      g('sg-2', 'Luis Garcia', '(253) 555-0207', 'luis.garcia@example.com'),
    ],
  },
  {
    name: 'Noah Harris',
    nickname: '',
    gender: 'Male',
    birthdate: '12/01/2016',
    guardianAddress: '76 Sunset Blvd, Enumclaw, WA 98022',
    guardians: [g('nh-1', 'Pat Harris', '(360) 555-0108', 'pat.harris@example.com')],
  },
  {
    name: 'Isabella Johnson',
    nickname: 'Bella',
    gender: 'Female',
    birthdate: '03/14/2017',
    guardianAddress: '455 Oak Terrace, Bellevue, WA 98004',
    guardians: [
      g('ij-1', 'Chris Johnson', '(425) 555-0109', 'chris.johnson@example.com'),
      g('ij-2', 'Morgan Johnson', '(425) 555-0209', 'morgan.johnson@example.com'),
    ],
  },
  {
    name: 'Lucas Kim',
    nickname: 'Luke',
    gender: 'Male',
    birthdate: '07/27/2016',
    guardianAddress: '18 Summit Pl, Sammamish, WA 98074',
    guardians: [
      g('lk-1', 'Sora Kim', '(425) 555-0110', 'sora.kim@example.com'),
      g('lk-2', 'Jin Kim', '(425) 555-0210', 'jin.kim@example.com'),
    ],
  },
  {
    name: 'Mia Lopez',
    nickname: '',
    gender: 'Female',
    birthdate: '10/05/2016',
    guardianAddress: '622 Valley View, Newcastle, WA 98056',
    guardians: [
      g('ml-1', 'Elena Lopez', '(425) 555-0111', 'elena.lopez@example.com'),
      g('ml-2', 'Carlos Lopez', '(425) 555-0211', 'carlos.lopez@example.com'),
    ],
  },
  {
    name: 'Jackson Martinez',
    nickname: 'Jack',
    gender: 'Male',
    birthdate: '05/21/2017',
    guardianAddress: '29 Birch Ave, SeaTac, WA 98188',
    guardians: [
      g('jm-1', 'Diego Martinez', '(206) 555-0112', 'diego.martinez@example.com'),
      g('jm-2', 'Ana Martinez', '(206) 555-0212', 'ana.martinez@example.com'),
    ],
  },
  {
    name: 'Charlotte Nguyen',
    nickname: 'Charlie',
    gender: 'Female',
    birthdate: '09/09/2016',
    guardianAddress: '801 Pacific Hwy, Federal Way, WA 98003',
    guardians: [
      g('cn-1', 'Anh Nguyen', '(253) 555-0113', 'anh.nguyen@example.com'),
      g('cn-2', 'Minh Nguyen', '(253) 555-0213', 'minh.nguyen@example.com'),
      g('cn-3', 'Lan Nguyen', '(253) 555-0313', 'lan.nguyen@example.com', 'Grandparent'),
    ],
  },
  {
    name: 'Aiden Patel',
    nickname: '',
    gender: 'Male',
    birthdate: '01/30/2017',
    guardianAddress: '104 Crescent St, Mercer Island, WA 98040',
    guardians: [
      g('ap-1', 'Priya Patel', '(206) 555-0114', 'priya.patel@example.com'),
      g('ap-2', 'Raj Patel', '(206) 555-0214', 'raj.patel@example.com'),
    ],
  },
  {
    name: 'Amelia Robinson',
    nickname: 'Amy',
    gender: 'Female',
    birthdate: '04/17/2016',
    guardianAddress: '560 Forest Ridge, Redmond, WA 98052',
    guardians: [
      g('ar-1', 'Jamie Robinson', '(425) 555-0115', 'jamie.robinson@example.com'),
      g('ar-2', 'Taylor Robinson', '(425) 555-0215', 'taylor.robinson@example.com'),
    ],
  },
  {
    name: 'Elijah Singh',
    nickname: 'Eli',
    gender: 'Male',
    birthdate: '11/23/2016',
    guardianAddress: '93 Meadowbrook Ln, Kirkland, WA 98033',
    guardians: [
      g('es-1', 'Ravi Singh', '(425) 555-0116', 'ravi.singh@example.com'),
      g('es-2', 'Anita Singh', '(425) 555-0216', 'anita.singh@example.com'),
    ],
  },
  {
    name: 'Emily Taylor',
    nickname: '',
    gender: 'Female',
    birthdate: '06/02/2017',
    guardianAddress: '712 Cascade Ave, Snoqualmie, WA 98065',
    guardians: [g('et-1', 'Morgan Taylor', '(425) 555-0117', 'morgan.taylor@example.com')],
  },
  {
    name: 'Benjamin Upton',
    nickname: 'Ben',
    gender: 'Male',
    birthdate: '08/11/2016',
    guardianAddress: '41 Highland Park Rd, North Bend, WA 98045',
    guardians: [
      g('bu-1', 'Riley Upton', '(425) 555-0118', 'riley.upton@example.com'),
      g('bu-2', 'Avery Upton', '(425) 555-0218', 'avery.upton@example.com'),
    ],
  },
  {
    name: 'Abigail Vasquez',
    nickname: 'Abby',
    gender: 'Female',
    birthdate: '02/07/2017',
    guardianAddress: '288 Rainier Blvd, Tukwila, WA 98188',
    guardians: [
      g('av-1', 'Sofia Vasquez', '(206) 555-0119', 'sofia.vasquez@example.com'),
      g('av-2', 'Miguel Vasquez', '(206) 555-0219', 'miguel.vasquez@example.com'),
    ],
  },
  {
    name: 'Henry Walker',
    nickname: '',
    gender: 'Male',
    birthdate: '12/19/2016',
    guardianAddress: '15 Glacier Way, Carnation, WA 98014',
    guardians: [
      g('hw-1', 'Drew Walker', '(425) 555-0120', 'drew.walker@example.com'),
      g('hw-2', 'Casey Walker', '(425) 555-0220', 'casey.walker@example.com'),
    ],
  },
  {
    name: 'Ella Young',
    nickname: 'Ellie',
    gender: 'Female',
    birthdate: '07/04/2017',
    guardianAddress: '409 Evergreen Ct, Duvall, WA 98019',
    guardians: [
      g('ey-1', 'Quinn Young', '(425) 555-0121', 'quinn.young@example.com'),
      g('ey-2', 'Blake Young', '(425) 555-0221', 'blake.young@example.com'),
    ],
  },
  {
    name: 'Daniel Zhang',
    nickname: '',
    gender: 'Male',
    birthdate: '03/26/2016',
    guardianAddress: '67 Lake Hills Blvd, Bellevue, WA 98005',
    guardians: [
      g('dz-1', 'Wei Zhang', '(425) 555-0122', 'wei.zhang@example.com'),
      g('dz-2', 'Li Zhang', '(425) 555-0222', 'li.zhang@example.com'),
    ],
  },
  {
    name: 'Grace Wilson',
    nickname: 'Gracie',
    gender: 'Female',
    birthdate: '10/13/2016',
    guardianAddress: '1204 Tahoma St, Maple Valley, WA 98038',
    guardians: [
      g('gw-1', 'Avery Wilson', '(425) 555-0123', 'avery.wilson@example.com'),
      g('gw-2', 'Jordan Wilson', '(425) 555-0223', 'jordan.wilson@example.com'),
      g('gw-3', 'Margaret Wilson', '(425) 555-0323', 'margaret.wilson@example.com', 'Grandparent'),
    ],
  },
];

function buildDummyStudentList() {
  return DEMO_STUDENTS.map((student, i) => {
    const legacy = syncLegacyGuardianFields(student.guardians || []);
    const [first = '', last = ''] = student.name.split(/\s+/);
    const local = `${first.charAt(0)}${last}`.toLowerCase().replace(/[^a-z]/g, '');
    // Nine-digit school ID, e.g. 100250001
    const studentId = String(100250000 + i + 1);
    // Deterministic 4-digit PIN (1000–9999 range, unique per student index)
    const password = String(1000 + ((i * 137) % 9000));
    return {
      id: `demo-student-${i + 1}`,
      grade_level: '3rd Grade',
      studentId,
      email: `${local}@edu.hub`,
      password,
      avatar: demoAvatarForIndex(i),
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
    appCodes: {},
    studentList: buildDummyStudentList(),
  },
];

/** Apps that only need names (Randomizer, Groups, etc.) */
export function getStudentNames(cls) {
  return (cls?.studentList || []).map((s) => s.name);
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
