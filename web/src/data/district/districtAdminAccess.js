/**
 * DistrictHub App Access — what each role can see, and who may change what.
 * School Access still fine-tunes a building; this is the district-wide package.
 */

import { isStudentApp } from '../access/studentApps';
import { appsForRoleFilter } from './districtAppAccess';
import {
  ACCESS_ACTORS,
  ACCESS_CAPABILITIES,
  DEFAULT_SCHOOL_ACCESS,
  normalizeSchoolAccess,
  sessionAccessActor,
} from './schoolAccess';

const KEY = 'eduHub.district.adminAccess';

/** Principal / AP / district admin may edit this matrix. */
export const ADMIN_ACCESS_EDITORS = ['districtAdmin', 'principal', 'assistantPrincipal'];

export function canConfigureAdminAccess(session) {
  return ADMIN_ACCESS_EDITORS.includes(sessionAccessActor(session));
}

/** Staff + student + parent — used for App Access role focus and app columns. */
export const APP_ACCESS_ACTORS = [
  ...ACCESS_ACTORS,
  { id: 'student', label: 'Students' },
  { id: 'parent', label: 'Parents' },
];

/** Roles that get classroom tools by default (not registrar / office). */
export const DEFAULT_CLASSROOM_APP_ACTORS = [
  'districtAdmin',
  'principal',
  'assistantPrincipal',
  'teacher',
];

/** Student-facing apps — staff managers plus the student role. */
export const DEFAULT_STUDENT_APP_ACTORS = [...DEFAULT_CLASSROOM_APP_ACTORS, 'student'];

/** Family apps — staff managers plus the parent role. */
export const DEFAULT_PARENT_APP_ACTORS = [
  'districtAdmin',
  'principal',
  'assistantPrincipal',
  'parent',
];

export function managedTeacherApps() {
  return appsForRoleFilter('teacher').map((app) => ({
    id: app.id,
    label: app.name,
    description: app.description,
    kind: 'app',
    toolAppId: app.id,
  }));
}

export function managedStudentApps() {
  return appsForRoleFilter('student').map((app) => ({
    id: app.id,
    label: app.name,
    description: app.description,
    kind: 'app',
    toolAppId: app.id,
  }));
}

export function managedParentApps() {
  return appsForRoleFilter('parent').map((app) => ({
    id: app.id,
    label: app.name,
    description: app.description,
    kind: 'app',
    toolAppId: app.id,
  }));
}

export function ADMIN_ACCESS_SURFACES() {
  return [
    {
      id: 'districtHub',
      label: 'DistrictHub',
      description: 'Dashboard, schools directory, and district Apps catalog.',
    },
    {
      id: 'insights',
      label: 'Insights',
      description: 'District counts, trends, and building comparisons.',
    },
    {
      id: 'schoolWorkspace',
      label: 'School workspace',
      description: 'Staff, departments, classes, students, and schedule inside a building.',
      tasks: ACCESS_CAPABILITIES.map((capability) => ({
        id: capability.id,
        label: capability.label,
        description: capability.description,
        kind: 'change',
        capabilityId: capability.id,
      })),
    },
    {
      id: 'teacherApps',
      label: 'Teacher apps',
      description: 'Classroom tools teachers use — turn roles on or off per app.',
      tasks: managedTeacherApps(),
    },
    {
      id: 'studentApps',
      label: 'Student apps',
      description: 'Apps students open from their home — control staff and student access per app.',
      tasks: managedStudentApps(),
    },
    {
      id: 'parentApps',
      label: 'Parent apps',
      description: 'Family tools parents open — grows as parent apps ship.',
      tasks: managedParentApps(),
    },
    {
      id: 'adminAccess',
      label: 'App Access',
      description: 'Configure this permission matrix.',
    },
  ];
}

/**
 * Flattened table rows: app header + optional sub-task / tool-app rows.
 */
export function adminAccessTableRows() {
  const rows = [];
  for (const app of ADMIN_ACCESS_SURFACES()) {
    rows.push({
      id: `app:${app.id}`,
      appId: app.id,
      label: app.label,
      description: app.description,
      depth: 0,
      kind: 'surface',
      surfaceId: app.id,
    });
    for (const task of app.tasks || []) {
      rows.push({
        id: `task:${app.id}:${task.id}`,
        appId: app.id,
        label: task.label,
        description: task.description,
        depth: 1,
        kind: task.kind || 'change',
        surfaceId: app.id,
        capabilityId: task.capabilityId,
        toolAppId: task.toolAppId,
      });
    }
  }
  return rows;
}

export const APP_ACCESS_ROLE_FOCUS = [
  { id: 'all', label: 'All roles' },
  ...APP_ACCESS_ACTORS.map((row) => ({ id: row.id, label: row.label })),
];

function rowEnabledForActor(access, row, actorId) {
  if (row.kind === 'surface') return roleHasSurface(access, actorId, row.surfaceId);
  if (row.kind === 'change') return roleHasChangeCapability(access, actorId, row.capabilityId);
  if (row.kind === 'app') return roleHasToolApp(access, actorId, row.toolAppId, row.surfaceId);
  return false;
}

/**
 * Rows for the App Access table. When focusing a role with connectedOnly,
 * only apps/tasks that role already has stay in the list.
 */
export function adminAccessTableRowsForFocus(access, focusRoleId, connectedOnly = true) {
  let rows = adminAccessTableRows();
  // Students and parents never get school change tasks or App Access config.
  if (focusRoleId === 'student' || focusRoleId === 'parent') {
    rows = rows.filter((row) => row.kind !== 'change' && row.surfaceId !== 'adminAccess');
  }
  if (!focusRoleId || focusRoleId === 'all' || !connectedOnly) return rows;

  const enabledIds = new Set();
  for (const row of rows) {
    if (rowEnabledForActor(access, row, focusRoleId)) enabledIds.add(row.id);
  }
  // Keep a parent surface row if any of its children are connected.
  for (const row of rows) {
    if (row.depth !== 0) continue;
    const hasChild = rows.some(
      (child) => child.depth === 1 && child.appId === row.appId && enabledIds.has(child.id),
    );
    if (hasChild) enabledIds.add(row.id);
  }
  return rows.filter((row) => enabledIds.has(row.id));
}

const SURFACE_IDS = new Set([
  'districtHub',
  'insights',
  'schoolWorkspace',
  'teacherApps',
  'studentApps',
  'parentApps',
  'adminAccess',
]);

const STAFF_ACTOR_IDS = new Set(ACCESS_ACTORS.map((row) => row.id));
const APP_ACCESS_ACTOR_IDS = new Set(APP_ACCESS_ACTORS.map((row) => row.id));

/** Defaults — registrar runs enrollment, not classroom tools. */
export const DEFAULT_ROLE_SURFACES = {
  districtAdmin: [
    'districtHub',
    'insights',
    'schoolWorkspace',
    'teacherApps',
    'studentApps',
    'parentApps',
    'adminAccess',
  ],
  principal: [
    'districtHub',
    'insights',
    'schoolWorkspace',
    'teacherApps',
    'studentApps',
    'parentApps',
  ],
  assistantPrincipal: [
    'districtHub',
    'insights',
    'schoolWorkspace',
    'teacherApps',
    'studentApps',
    'parentApps',
  ],
  registrar: ['districtHub', 'schoolWorkspace'],
  officeAssistant: ['districtHub', 'schoolWorkspace'],
  teacher: ['teacherApps', 'studentApps'],
  student: ['studentApps'],
  parent: ['parentApps'],
};

function cleanSurfaceList(raw, fallback) {
  const source = Array.isArray(raw) ? raw : fallback;
  const next = [];
  const seen = new Set();
  for (const value of source) {
    const id = String(value || '').trim();
    if (!SURFACE_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next.length ? next : [...fallback];
}

export function normalizeRoleSurfaces(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const policy = {};
  for (const actor of APP_ACCESS_ACTORS) {
    policy[actor.id] = cleanSurfaceList(
      source[actor.id],
      DEFAULT_ROLE_SURFACES[actor.id] || ['parentApps'],
    );
  }
  return policy;
}

function knownToolAppIds() {
  const ids = new Set();
  for (const app of managedTeacherApps()) ids.add(app.id);
  for (const app of managedStudentApps()) ids.add(app.id);
  for (const app of managedParentApps()) ids.add(app.id);
  return ids;
}

function cleanActorList(raw, fallback, allowedIds = APP_ACCESS_ACTOR_IDS) {
  const source = Array.isArray(raw) ? raw : fallback;
  const next = [];
  const seen = new Set();
  for (const value of source) {
    const id = String(value || '').trim();
    if (!allowedIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next.length ? next : [...fallback];
}

/** Per tool-app: which roles may use it. */
export function normalizeAppActors(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const known = knownToolAppIds();
  const policy = {};
  for (const appId of known) {
    let fallback = DEFAULT_CLASSROOM_APP_ACTORS;
    if (isStudentApp(appId)) fallback = DEFAULT_STUDENT_APP_ACTORS;
    if (managedParentApps().some((app) => app.id === appId)) {
      fallback = DEFAULT_PARENT_APP_ACTORS;
    }
    policy[appId] = cleanActorList(source[appId], fallback);
  }
  return policy;
}

export function normalizeDistrictAdminAccess(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    roleSurfaces: normalizeRoleSurfaces(source.roleSurfaces),
    changePolicy: normalizeSchoolAccess(source.changePolicy || DEFAULT_SCHOOL_ACCESS),
    appActors: normalizeAppActors(source.appActors),
  };
}

export function readDistrictAdminAccess() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return normalizeDistrictAdminAccess(parsed);
  } catch {
    return normalizeDistrictAdminAccess(null);
  }
}

export function writeDistrictAdminAccess(patch) {
  const current = readDistrictAdminAccess();
  const next = normalizeDistrictAdminAccess({
    roleSurfaces: patch.roleSurfaces ?? current.roleSurfaces,
    changePolicy: patch.changePolicy ?? current.changePolicy,
    appActors: patch.appActors ?? current.appActors,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function roleHasSurface(access, actorId, surfaceId) {
  const policy = normalizeDistrictAdminAccess(access);
  return (policy.roleSurfaces[actorId] || []).includes(surfaceId);
}

export function withRoleSurface(access, actorId, surfaceId, enabled) {
  const current = normalizeDistrictAdminAccess(access);
  if (!APP_ACCESS_ACTOR_IDS.has(actorId) || !SURFACE_IDS.has(surfaceId)) {
    return current;
  }
  const set = new Set(current.roleSurfaces[actorId] || []);
  if (enabled) set.add(surfaceId);
  else set.delete(surfaceId);
  // Keep a minimum package so a role is never locked out entirely.
  if (set.size === 0) {
    if (actorId === 'student') set.add('studentApps');
    else if (actorId === 'parent') set.add('parentApps');
    else set.add('districtHub');
  }
  return normalizeDistrictAdminAccess({
    ...current,
    roleSurfaces: {
      ...current.roleSurfaces,
      [actorId]: [...set],
    },
  });
}

export function withChangeCapabilityActors(access, capabilityId, actorIds) {
  const current = normalizeDistrictAdminAccess(access);
  return normalizeDistrictAdminAccess({
    ...current,
    changePolicy: {
      ...current.changePolicy,
      [capabilityId]: actorIds,
    },
  });
}

export function roleHasChangeCapability(access, actorId, capabilityId) {
  const policy = normalizeDistrictAdminAccess(access);
  return (policy.changePolicy[capabilityId] || []).includes(actorId);
}

export function withChangeCapabilityToggle(access, capabilityId, actorId, enabled) {
  // School change tasks stay staff-only — students never appear on those rows.
  if (!STAFF_ACTOR_IDS.has(actorId)) return normalizeDistrictAdminAccess(access);
  const current = normalizeDistrictAdminAccess(access);
  const set = new Set(current.changePolicy[capabilityId] || []);
  if (enabled) set.add(actorId);
  else set.delete(actorId);
  if (set.size === 0) return current;
  return withChangeCapabilityActors(access, capabilityId, [...set]);
}

export function roleHasToolApp(access, actorId, toolAppId, surfaceId) {
  const policy = normalizeDistrictAdminAccess(access);
  if (surfaceId && !roleHasSurface(policy, actorId, surfaceId)) return false;
  return (policy.appActors[toolAppId] || []).includes(actorId);
}

export function withToolAppActorToggle(access, toolAppId, actorId, enabled, surfaceId) {
  let current = normalizeDistrictAdminAccess(access);
  if (!knownToolAppIds().has(toolAppId) || !APP_ACCESS_ACTOR_IDS.has(actorId)) return current;

  // Turning an app on for a role also opens that role’s teacher/student apps package.
  if (enabled && surfaceId && !roleHasSurface(current, actorId, surfaceId)) {
    current = withRoleSurface(current, actorId, surfaceId, true);
  }

  const set = new Set(current.appActors[toolAppId] || []);
  if (enabled) set.add(actorId);
  else set.delete(actorId);
  if (set.size === 0) return current;

  return normalizeDistrictAdminAccess({
    ...current,
    appActors: {
      ...current.appActors,
      [toolAppId]: [...set],
    },
  });
}

export { ACCESS_ACTORS, ACCESS_CAPABILITIES };
