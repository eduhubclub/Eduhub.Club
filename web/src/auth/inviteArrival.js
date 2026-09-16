import { isValidRole } from '../data/auth/codes';

const INVITE_KEY = 'invite';

/**
 * Invite links can open the working app while the public homepage stays Coming soon.
 * @param {{ search?: string, hash?: string }} location
 */
export function parseInviteToken(location = typeof window === 'undefined' ? {} : window.location) {
  const search = String(location?.search || '');
  const hash = String(location?.hash || '');
  const fromSearch = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(INVITE_KEY);
  if (fromSearch) return fromSearch.trim();
  const hashBody = hash.startsWith('#') ? hash.slice(1) : hash;
  const hashQuery = hashBody.includes('?') ? hashBody.slice(hashBody.indexOf('?') + 1) : hashBody;
  const fromHash = new URLSearchParams(hashQuery.replace(/^[&#]/, '')).get(INVITE_KEY);
  if (fromHash) return fromHash.trim();
  const prefix = `${INVITE_KEY}=`;
  if (hashBody.startsWith(prefix)) return hashBody.slice(prefix.length).trim();
  return '';
}

export function isInviteArrival(location = typeof window === 'undefined' ? {} : window.location) {
  return Boolean(parseInviteToken(location));
}

export function inviteSignupPath(origin, token) {
  const here = String(origin || '').replace(/\/$/, '');
  return `${here}/?invite=${encodeURIComponent(token)}`;
}

export function invitedRole(invite) {
  return isValidRole(invite?.role) ? invite.role : '';
}
