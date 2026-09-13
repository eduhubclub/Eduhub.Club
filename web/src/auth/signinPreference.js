import { isValidRole } from '../data/auth/codes';

const COOKIE = 'edu_signin_role';
const YEAR = 60 * 60 * 24 * 365;

/** Last role they chose. Not a session — no password or token. */
export function readSignInRole() {
  if (typeof document === 'undefined') return null;
  const row = document.cookie.split('; ').find((part) => part.startsWith(`${COOKIE}=`));
  if (!row) return null;
  const value = decodeURIComponent(row.slice(COOKIE.length + 1));
  return isValidRole(value) ? value : null;
}

export function rememberSignInRole(role) {
  if (typeof document === 'undefined' || !isValidRole(role)) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${encodeURIComponent(role)}; Max-Age=${YEAR}; Path=/; SameSite=Lax${secure}`;
}
