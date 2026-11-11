/**
 * Building staff departments — every staff member is assigned one.
 * Built-in catalog plus optional school-custom departments.
 */

export const STAFF_DEPARTMENTS = [
  { id: 'administration', label: 'Administration' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'student-support', label: 'Student Support' },
  { id: 'athletics', label: 'Athletics' },
  { id: 'library', label: 'Library' },
  { id: 'food-services', label: 'Food Services' },
  { id: 'operations', label: 'Operations' },
];

const BUILTIN_IDS = new Set(STAFF_DEPARTMENTS.map((row) => row.id));

export function isBuiltinDepartmentId(value) {
  return BUILTIN_IDS.has(String(value || ''));
}

/** @deprecated use isBuiltinDepartmentId */
export function isStaffDepartmentId(value) {
  return isBuiltinDepartmentId(value);
}

export function slugDepartmentId(label) {
  const slug = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || `dept-${Date.now().toString(36)}`;
}

export function normalizeDepartment(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const label = String(raw.label ?? raw.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!label) return null;
  const id =
    String(raw.id || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || slugDepartmentId(label);
  if (BUILTIN_IDS.has(id)) {
    return STAFF_DEPARTMENTS.find((row) => row.id === id) || { id, label };
  }
  return { id, label };
}

export function staffDepartmentLabel(id, catalog = STAFF_DEPARTMENTS) {
  const key = String(id || '');
  const fromCatalog = (catalog || []).find((row) => row.id === key);
  if (fromCatalog?.label) return fromCatalog.label;
  return STAFF_DEPARTMENTS.find((row) => row.id === key)?.label || '';
}

/** Infer department from a role title when none is stored yet. */
export function departmentForRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return 'operations';

  if (
    value === 'principal' ||
    value === 'headmaster' ||
    value === 'headmistress' ||
    value === 'head of school' ||
    value === 'admin assistant' ||
    value === 'office assistant' ||
    value === 'registrar' ||
    (/\b(assistant|vice|deputy)\b/.test(value) &&
      /\b(principal|head|headmaster|headmistress)\b/.test(value)) ||
    /\bprincipal\b/.test(value)
  ) {
    return 'administration';
  }

  if (value === 'librarian' || value.includes('library')) return 'library';
  if (value === 'coach' || value.includes('athletic')) return 'athletics';
  if (value === 'cafeteria staff' || value.includes('cafeteria') || value.includes('food')) {
    return 'food-services';
  }

  if (
    value === 'counselor' ||
    value === 'psychologist' ||
    value === 'paraeducator' ||
    value === 'reading specialist' ||
    value.includes('ot/pt') ||
    value.includes('sails') ||
    value.includes('specialist')
  ) {
    return 'student-support';
  }

  if (
    value === 'building manager' ||
    value === 'custodian' ||
    value === 'playground staff' ||
    value === 'security officer' ||
    value.includes('custod') ||
    value.includes('security') ||
    value.includes('facilities')
  ) {
    return 'operations';
  }

  if (
    value.includes('teacher') ||
    value.includes('advisor') ||
    value.includes('homeroom') ||
    /\bgrade\b/.test(value)
  ) {
    return 'teaching';
  }

  return 'operations';
}

export function normalizeStaffDepartment(rawDepartment, role) {
  const id = String(rawDepartment || '').trim();
  if (isBuiltinDepartmentId(id)) return id;
  // Custom school departments use slug ids.
  if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) return id;
  return departmentForRole(role);
}

/** Built-in catalog plus any custom departments stored on the school. */
export function departmentsForSchool(org, schoolId) {
  const custom = Array.isArray(org?.departments?.[schoolId]) ? org.departments[schoolId] : [];
  const byId = new Map(STAFF_DEPARTMENTS.map((row) => [row.id, row]));
  for (const row of custom) {
    const dept = normalizeDepartment(row);
    if (!dept || byId.has(dept.id)) continue;
    byId.set(dept.id, dept);
  }
  return [...byId.values()];
}
