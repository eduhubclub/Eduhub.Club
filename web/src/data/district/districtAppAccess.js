/**
 * District-level app catalog + blocks.
 * Admins browse by role (Admin / Teachers / Students / Parents) and can block apps.
 */

import { launcherApps } from '../../apps/launcher';
import { isStudentApp, STUDENT_APP_IDS } from '../access/studentApps';

const KEY = 'eduHub.district.appAccess';

/** Tools that stay with district leadership — not teacher / student / parent launchers. */
export const ADMIN_APP_IDS = [
  'district',
  'admin',
  'analytics',
  'mail',
  'support',
  'pacing',
  'class-creator',
  'schedule',
];

/** Admin apps that teachers also open (district path + classroom reality). */
export const ADMIN_AND_TEACHER_APP_IDS = ['pacing', 'class-creator', 'schedule'];

/**
 * Family-facing apps. Grow this list as parent tools ship.
 * Kept separate from student apps even when names overlap later.
 */
export const PARENT_APP_IDS = [];

export const APP_ROLE_FILTERS = [
  { id: 'admin', label: 'Admin' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'student', label: 'Students' },
  { id: 'parent', label: 'Parents' },
];

const ADMIN_SET = new Set(ADMIN_APP_IDS);
const ADMIN_TEACHER_SET = new Set(ADMIN_AND_TEACHER_APP_IDS);
const PARENT_SET = new Set(PARENT_APP_IDS);

export function isAdminApp(appId) {
  return ADMIN_SET.has(String(appId || ''));
}

export function isParentApp(appId) {
  return PARENT_SET.has(String(appId || ''));
}

/** Who this app is meant for in the district catalog. */
export function audiencesForApp(appId) {
  const id = String(appId || '');
  if (!id) return [];
  if (ADMIN_TEACHER_SET.has(id)) return ['admin', 'teacher'];
  if (isAdminApp(id)) return ['admin'];
  if (isParentApp(id) && !isStudentApp(id)) return ['parent'];

  const audiences = ['teacher'];
  if (isStudentApp(id)) audiences.push('student');
  if (isParentApp(id)) audiences.push('parent');
  return audiences;
}

export function roleLabelForApp(appId) {
  const audiences = audiencesForApp(appId);
  if (audiences.includes('admin')) return 'Admin';
  const labels = [];
  if (audiences.includes('teacher')) labels.push('Teachers');
  if (audiences.includes('student')) labels.push('Students');
  if (audiences.includes('parent')) labels.push('Parents');
  return labels.join(' · ') || 'Apps';
}

export function catalogApps() {
  return launcherApps.filter((app) => app.id !== 'hub');
}

export function appsForRoleFilter(filterId) {
  const list = catalogApps();
  if (filterId === 'teacher') {
    return list.filter((app) => audiencesForApp(app.id).includes('teacher'));
  }
  if (filterId === 'student') {
    return list.filter((app) => audiencesForApp(app.id).includes('student'));
  }
  if (filterId === 'admin') {
    return list.filter((app) => audiencesForApp(app.id).includes('admin'));
  }
  if (filterId === 'parent') {
    return list.filter((app) => audiencesForApp(app.id).includes('parent'));
  }
  return list;
}

function cleanIdList(raw) {
  const source = Array.isArray(raw) ? raw : [];
  const next = [];
  const seen = new Set();
  for (const value of source) {
    const id = String(value || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function normalizeDistrictAppAccess(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    blockedTeachers: cleanIdList(source.blockedTeachers),
    blockedStudents: cleanIdList(source.blockedStudents),
    blockedParents: cleanIdList(source.blockedParents),
  };
}

export function readDistrictAppAccess() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return normalizeDistrictAppAccess(parsed);
  } catch {
    return normalizeDistrictAppAccess(null);
  }
}

export function writeDistrictAppAccess(patch) {
  const current = readDistrictAppAccess();
  const next = normalizeDistrictAppAccess({
    blockedTeachers: patch.blockedTeachers ?? current.blockedTeachers,
    blockedStudents: patch.blockedStudents ?? current.blockedStudents,
    blockedParents: patch.blockedParents ?? current.blockedParents,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function isAppBlockedForTeachers(appId, access = readDistrictAppAccess()) {
  const id = String(appId || '');
  if (!id || isAdminApp(id)) return false;
  return (access.blockedTeachers || []).includes(id);
}

export function isAppBlockedForStudents(appId, access = readDistrictAppAccess()) {
  const id = String(appId || '');
  if (!id || !isStudentApp(id)) return false;
  return (access.blockedStudents || []).includes(id);
}

export function isAppBlockedForParents(appId, access = readDistrictAppAccess()) {
  const id = String(appId || '');
  if (!id || !isParentApp(id)) return false;
  return (access.blockedParents || []).includes(id);
}

export function withAppBlocked(access, audience, appId, blocked) {
  const id = String(appId || '');
  const current = normalizeDistrictAppAccess(access);
  if (!id) return current;

  if (audience === 'teacher') {
    if (!audiencesForApp(id).includes('teacher')) return current;
    const set = new Set(current.blockedTeachers);
    if (blocked) set.add(id);
    else set.delete(id);
    return normalizeDistrictAppAccess({
      ...current,
      blockedTeachers: [...set],
    });
  }

  if (audience === 'student') {
    if (!STUDENT_APP_IDS.includes(id)) return current;
    const set = new Set(current.blockedStudents);
    if (blocked) set.add(id);
    else set.delete(id);
    return normalizeDistrictAppAccess({
      ...current,
      blockedStudents: [...set],
    });
  }

  if (audience === 'parent') {
    if (!isParentApp(id)) return current;
    const set = new Set(current.blockedParents);
    if (blocked) set.add(id);
    else set.delete(id);
    return normalizeDistrictAppAccess({
      ...current,
      blockedParents: [...set],
    });
  }

  return current;
}
