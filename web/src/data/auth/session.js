import { isValidRole } from './codes';
import { applyOwnerView, isAccountView, isOwnerRole } from './ownerView';

/**
 * Which shell a signed-in role opens.
 * Unknown roles return null so a missing role cannot fall through into the teacher app.
 * Owner is not a shell. The chosen school view is applied before this runs.
 * @param {string} role
 * @returns {'admin' | 'teacher' | 'student' | 'parent' | null}
 */
export function shellForRole(role) {
  return isValidRole(role) ? role : null;
}

/**
 * @param {object} user
 * @param {{ role?: string, display_name?: string, age_band?: string | null } | null} profile
 */
function storedRole(value) {
  return String(value || '').trim().toLowerCase();
}

export function sessionFromUser(user, profile) {
  if (!user?.id) return null;
  const profileRole = storedRole(profile?.role);
  const metadataRole = storedRole(user.user_metadata?.role || user.app_metadata?.role);
  const owner = isOwnerRole(profileRole) || isOwnerRole(metadataRole);
  const schoolRole = [profileRole, metadataRole].find((role) => isValidRole(role)) || '';
  return {
    userId: user.id,
    role: owner ? '' : schoolRole,
    owner,
    displayName:
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email ||
      'Signed in',
    email: user.email || '',
    ageBand: profile?.age_band || null,
  };
}

/**
 * Owner opens the chosen school view. A school account keeps its saved role.
 * If nothing was saved, the sign-in card they used is the view.
 */
export function sessionForShell(session, viewRole) {
  if (!session) return session;
  if (session.owner) {
    if (shellForRole(session.role)) return session;
    return applyOwnerView(session, viewRole);
  }
  if (shellForRole(session.role)) return session;
  if (isAccountView(viewRole)) return { ...session, role: viewRole };
  return session;
}
