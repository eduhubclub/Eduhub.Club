import { useEffect, useMemo, useState } from 'react';
import { createAccountInvite, loadMyInvites } from '../data/auth/inviteApi';
import { inviteSignupPath } from '../auth/inviteArrival';
import { TYPE } from '../shared/typography';

function rolesFor(session) {
  if (session?.owner || session?.role === 'admin') return ['teacher', 'parent', 'admin'];
  if (session?.role === 'teacher') return ['parent'];
  return [];
}

/**
 * Teachers invite parents. Admin/owner can also invite teachers and admins.
 */
export function InvitesCard({ theme, session }) {
  const ink = theme.colorOnSurface;
  const muted = theme.colorOnSurfaceVariant;
  const roles = useMemo(() => rolesFor(session), [session?.role, session?.owner]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(roles[0] || 'parent');
  const [invites, setInvites] = useState([]);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (roles.length && !roles.includes(role)) setRole(roles[0]);
  }, [roles, role]);

  useEffect(() => {
    if (!roles.length) return undefined;
    let cancelled = false;
    loadMyInvites()
      .then((rows) => {
        if (!cancelled) setInvites(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load invites.');
      });
    return () => {
      cancelled = true;
    };
  }, [roles.length]);

  if (!roles.length) return null;

  async function send(event) {
    event.preventDefault();
    setError('');
    setLink('');
    setBusy(true);
    try {
      const created = await createAccountInvite(email, role);
      const nextLink = inviteSignupPath(window.location.origin, created.token);
      setLink(nextLink);
      setEmail('');
      const rows = await loadMyInvites();
      setInvites(rows);
    } catch (err) {
      setError(err?.message || 'Could not create that invite.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 py-5 sm:px-6 sm:py-6">
      <p className={`${TYPE.bodySm} ${muted}`}>
        Send a link so someone can create the right kind of account. The public site still shows
        Coming soon; this link opens sign-up for that person.
      </p>
      <form onSubmit={send} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className={`flex min-w-[12rem] flex-1 flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
          />
        </label>
        <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          {busy ? 'Please wait…' : 'Create invite'}
        </button>
      </form>
      {link ? (
        <p className={`${TYPE.bodySm} mt-3 break-all ${ink}`}>
          Copy this link:{' '}
          <span className="font-mono">{link}</span>
        </p>
      ) : null}
      {error ? (
        <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnErrorContainer}`}>{error}</p>
      ) : null}
      {invites.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {invites.map((row) => (
            <li
              key={row.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border-[1.5px] px-3 py-2 ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
            >
              <span className={`${TYPE.bodySm} ${ink}`}>
                {row.email} · {row.role}
              </span>
              <span className={`${TYPE.labelSm} ${muted}`}>
                {row.accepted_at ? 'Joined' : 'Waiting'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
