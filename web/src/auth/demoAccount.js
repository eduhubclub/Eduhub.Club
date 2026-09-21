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

/**
 * Site demo (and offline fallback) should use client-side open policies —
 * not the remote class board, which stays closed until a teacher flips apps on.
 * Owner → Student preview uses the same open board for demos.
 */
export function isLocalDemoSession(session) {
  if (!session) return false;
  if (session.userId === 'demo' || session.demo) return true;
  if (String(session.email || '').toLowerCase() === DEMO_EMAIL) return true;
  if (session.owner && session.role === 'student') return true;
  return false;
}
