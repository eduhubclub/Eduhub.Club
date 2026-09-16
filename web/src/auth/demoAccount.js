/**
 * Shared preview account. The landing demo signs in with these
 * credentials, then opens the role that was selected.
 */
export const DEMO_EMAIL = 'demo@eduhub.club';
export const DEMO_PASSWORD = 'EduHub-demo-2026';

const LABELS = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export function demoDisplayName(role) {
  return LABELS[role] ? `Demo ${LABELS[role]}` : 'Demo';
}

export function localDemoSession(role) {
  return {
    userId: 'demo',
    role,
    displayName: demoDisplayName(role),
    email: DEMO_EMAIL,
    ageBand: null,
    demo: true,
  };
}

export function applyDemoRole(session, role) {
  if (!session || !role) return session;
  return {
    ...session,
    role,
    displayName: demoDisplayName(role),
    demo: true,
  };
}
