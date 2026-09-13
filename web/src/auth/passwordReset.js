export const RESET_PATH = '/reset-password';

let recoveryArrival = false;

function hasRecoveryGrant(search, hash) {
  return (
    hash.includes('type=recovery')
    || search.includes('type=recovery')
    || hash.includes('access_token=')
    || search.includes('code=')
  );
}

/**
 * True only for a password-reset return, so a plain visit cannot skip coming soon.
 * @param {{ pathname?: string, search?: string, hash?: string }} location
 */
export function isPasswordResetArrival(location) {
  const path = String(location?.pathname || '/').replace(/\/$/, '') || '/';
  const search = String(location?.search || '');
  const hash = String(location?.hash || '');
  const onResetPath = path === RESET_PATH || path.endsWith(RESET_PATH);
  if (hash.includes('type=recovery') || search.includes('type=recovery')) return true;
  return onResetPath && hasRecoveryGrant(search, hash);
}

export function notePasswordResetArrival(location = window.location) {
  if (isPasswordResetArrival(location)) recoveryArrival = true;
  return recoveryArrival;
}

export function passwordResetWasRequested() {
  return recoveryArrival;
}

export function finishPasswordResetArrival() {
  recoveryArrival = false;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.includes(RESET_PATH)) {
    window.history.replaceState({}, '', '/');
  }
}

/** Local sign-in returns to this computer. The live site returns to the public origin. */
export function passwordResetRedirect(origin = window.location.origin) {
  const here = String(origin || '').replace(/\/$/, '');
  const configured = String(import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
  const local = here.includes('localhost') || here.includes('127.0.0.1');
  const base = local ? here : (configured || here);
  return `${base}${RESET_PATH}`;
}
