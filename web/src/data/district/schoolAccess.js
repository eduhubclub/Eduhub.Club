/**
 * Per-school access policy — who may change what in the building workspace.
 * District admins / principals configure this on the Access tab.
 */

export const ACCESS_ACTORS = [
  { id: 'districtAdmin', label: 'District admin' },
  { id: 'principal', label: 'Principal' },
  { id: 'assistantPrincipal', label: 'Assistant principal' },
  { id: 'registrar', label: 'Registrar' },
  { id: 'officeAssistant', label: 'Office assistant' },
  { id: 'teacher', label: 'Teachers' },
];

export const ACCESS_CAPABILITIES = [
  {
    id: 'addStudents',
    label: 'Add students',
    description: 'Create or import students onto a class roster.',
  },
  {
    id: 'addStaff',
    label: 'Add staff',
    description: 'Add people to the building directory, including CSV import.',
  },
  {
    id: 'addClasses',
    label: 'Add classes',
    description: 'Create new homerooms and sections at this school.',
  },
  {
    id: 'addDepartments',
    label: 'Add departments',
    description: 'Create department groups used to organize staff.',
  },
  {
    id: 'editSchedule',
    label: 'Edit schedule',
    description: 'Change the school day, periods, and content blocks.',
  },
  {
    id: 'editAccess',
    label: 'Change access',
    description: 'Update who is allowed to make changes in this building.',
  },
];

const ACTOR_IDS = new Set(ACCESS_ACTORS.map((row) => row.id));
const CAPABILITY_IDS = new Set(ACCESS_CAPABILITIES.map((row) => row.id));

/** Sensible defaults — registrar owns enrollment; teachers do not add students. */
export const DEFAULT_SCHOOL_ACCESS = {
  addStudents: ['districtAdmin', 'principal', 'assistantPrincipal', 'registrar'],
  addStaff: ['districtAdmin', 'principal', 'assistantPrincipal'],
  addClasses: ['districtAdmin', 'principal', 'assistantPrincipal'],
  addDepartments: ['districtAdmin', 'principal'],
  editSchedule: ['districtAdmin', 'principal', 'assistantPrincipal'],
  editAccess: ['districtAdmin', 'principal'],
};

function cleanActorList(raw, fallback) {
  const source = Array.isArray(raw) ? raw : fallback;
  const next = [];
  const seen = new Set();
  for (const value of source) {
    const id = String(value || '').trim();
    if (!ACTOR_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next.length ? next : [...fallback];
}

export function normalizeSchoolAccess(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const policy = {};
  for (const capability of ACCESS_CAPABILITIES) {
    policy[capability.id] = cleanActorList(
      source[capability.id],
      DEFAULT_SCHOOL_ACCESS[capability.id],
    );
  }
  return policy;
}

export function accessPolicyForSchool(org, schoolId) {
  if (!schoolId) return normalizeSchoolAccess(null);
  return normalizeSchoolAccess(org?.accessPolicies?.[schoolId]);
}

/** Map the signed-in session onto an access actor. */
export function sessionAccessActor(session) {
  if (session?.role === 'admin') return 'districtAdmin';
  const title = String(session?.staffRole || session?.title || '').toLowerCase();
  if (title.includes('registrar')) return 'registrar';
  if (title.includes('assistant principal') || title.includes('vice principal')) {
    return 'assistantPrincipal';
  }
  if (title.includes('principal') || title.includes('headmaster') || title.includes('headmistress')) {
    return 'principal';
  }
  if (title.includes('office') || title.includes('admin assistant')) return 'officeAssistant';
  return 'teacher';
}

export function canUseCapability(policy, capabilityId, actorId) {
  if (!CAPABILITY_IDS.has(capabilityId)) return false;
  const allowed = normalizeSchoolAccess(policy)[capabilityId] || [];
  return allowed.includes(actorId);
}

export function withAccessCapabilityActors(policy, capabilityId, actorIds) {
  if (!CAPABILITY_IDS.has(capabilityId)) return normalizeSchoolAccess(policy);
  return normalizeSchoolAccess({
    ...policy,
    [capabilityId]: actorIds,
  });
}
