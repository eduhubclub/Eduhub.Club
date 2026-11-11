/**
 * Per-user Admin Dashboard layout (widgets + preferred leadership role).
 */

import { ADMIN_ROLES } from './adminRoles';

const KEY = 'eduHub.district.adminDashboard';

export const ADMIN_DASHBOARD_WIDGETS = [
  {
    id: 'schools',
    label: 'Schools',
    description: 'How many schools are in the district.',
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Staff across every building.',
  },
  {
    id: 'students',
    label: 'Students',
    description: 'Students enrolled in district classes.',
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    description: 'Jump into a school.',
  },
];

const DEFAULT_ORDER = ADMIN_DASHBOARD_WIDGETS.map((widget) => widget.id);

function readRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeRaw(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readAdminDashboardPrefs() {
  const raw = readRaw() || {};
  const roleId = ADMIN_ROLES.some((role) => role.id === raw.roleId)
    ? raw.roleId
    : 'superintendent';
  const hidden = new Set(
    Array.isArray(raw.hidden) ? raw.hidden.map(String) : [],
  );
  const order = [];
  for (const id of Array.isArray(raw.order) ? raw.order.map(String) : DEFAULT_ORDER) {
    if (DEFAULT_ORDER.includes(id) && !order.includes(id)) order.push(id);
  }
  for (const id of DEFAULT_ORDER) {
    if (!order.includes(id)) order.push(id);
  }
  return {
    roleId,
    order,
    hidden: [...hidden].filter((id) => DEFAULT_ORDER.includes(id)),
  };
}

export function writeAdminDashboardPrefs(patch) {
  const current = readAdminDashboardPrefs();
  const next = {
    roleId: patch.roleId ?? current.roleId,
    order: patch.order ?? current.order,
    hidden: patch.hidden ?? current.hidden,
  };
  if (!ADMIN_ROLES.some((role) => role.id === next.roleId)) {
    next.roleId = current.roleId;
  }
  writeRaw(next);
  return next;
}

export function visibleAdminWidgets(prefs = readAdminDashboardPrefs()) {
  const hidden = new Set(prefs.hidden || []);
  return (prefs.order || DEFAULT_ORDER).filter((id) => !hidden.has(id));
}
