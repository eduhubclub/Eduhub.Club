/** Company account. Opens every school role with the same email. */
export const OWNER_ROLE = 'owner';

export const OWNER_VIEWS = [
  { id: 'admin', label: 'Admin' },
  { id: 'teacher', label: 'Teacher' },
  { id: 'student', label: 'Student' },
  { id: 'parent', label: 'Parent' },
];

const VIEW_IDS = OWNER_VIEWS.map((view) => view.id);

export function isOwnerRole(value) {
  return value === OWNER_ROLE;
}

export function isAccountView(value) {
  return VIEW_IDS.includes(value);
}

/**
 * Owners keep their account, and the selected school role becomes the open view.
 * A missing choice opens the teacher app, which is the full tool set.
 */
export function applyOwnerView(session, viewRole) {
  if (!session?.owner) return session;
  return {
    ...session,
    role: isAccountView(viewRole) ? viewRole : 'teacher',
    owner: true,
  };
}
