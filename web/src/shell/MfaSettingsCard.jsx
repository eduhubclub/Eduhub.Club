import { useEffect, useState } from 'react';
import {
  cancelTotpEnroll,
  confirmTotpEnroll,
  listVerifiedTotpFactors,
  startTotpEnroll,
  unenrollTotpFactor,
} from '../data/auth/mfa';
import { TYPE } from '../shared/typography';

/**
 * Optional authenticator app (TOTP). Teachers turn this on in Settings;
 * after that, sign-in asks for a code.
 */
export function MfaSettingsCard({ theme, isDarkMode, session }) {
  const muted = theme.colorOnSurfaceVariant;
  const ink = theme.colorOnSurface;
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canUse =
    session
    && session.userId
    && session.userId !== 'demo'
    && !session.demo;

  async function refresh() {
    if (!canUse) {
      setFactors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setFactors(await listVerifiedTotpFactors());
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load authenticator settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canUse) {
        if (!cancelled) {
          setFactors([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const next = await listVerifiedTotpFactors();
        if (!cancelled) {
          setFactors(next);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load authenticator settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.userId, canUse]);

  async function beginEnroll() {
    setError('');
    setStatus('');
    setBusy(true);
    try {
      const next = await startTotpEnroll();
      setEnrolling(next);
      setCode('');
    } catch (err) {
      setError(err?.message || 'Could not start authenticator setup.');
    } finally {
      setBusy(false);
    }
  }

  async function finishEnroll(event) {
    event.preventDefault();
    if (!enrolling) return;
    setError('');
    setBusy(true);
    try {
      await confirmTotpEnroll(enrolling.factorId, code);
      setEnrolling(null);
      setCode('');
      setStatus('Authenticator is on for this account.');
      await refresh();
    } catch (err) {
      setError(err?.message || 'That code is not right.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnroll() {
    const factorId = enrolling?.factorId;
    setEnrolling(null);
    setCode('');
    setError('');
    if (factorId) await cancelTotpEnroll(factorId);
  }

  async function turnOff(factorId) {
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await unenrollTotpFactor(factorId);
      setStatus('Authenticator is off for this account.');
      await refresh();
    } catch (err) {
      setError(err?.message || 'Could not turn off the authenticator.');
    } finally {
      setBusy(false);
    }
  }

  if (!canUse) {
    return (
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className={`${TYPE.bodySm} ${muted}`}>
          Authenticator sign-in is available on a real Edu.Hub account, not the local demo.
        </p>
      </div>
    );
  }

  const enabled = factors.length > 0;

  return (
    <div className="px-5 py-5 sm:px-6 sm:py-6">
      {loading ? <p className={`${TYPE.bodySm} ${muted}`}>Loading authenticator…</p> : null}

      {!loading && !enrolling ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`${TYPE.titleSm} ${ink}`}>
                {enabled ? 'Authenticator is on' : 'Authenticator is off'}
              </p>
              <p className={`${TYPE.bodySm} mt-1 ${muted}`}>
                Optional. When on, you enter a code from an authenticator app after your password.
                Classroom PIN and QR sign-in for students are unchanged.
              </p>
            </div>
            {!enabled ? (
              <button
                type="button"
                disabled={busy}
                onClick={beginEnroll}
                className={`edu-control shrink-0 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Turn on
              </button>
            ) : null}
          </div>
          {enabled
            ? factors.map((factor) => (
                <div
                  key={factor.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] px-3 py-3 ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
                >
                  <p className={`${TYPE.bodySm} ${ink}`}>
                    {factor.friendly_name || 'Authenticator app'}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => turnOff(factor.id)}
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelSm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                  >
                    Turn off
                  </button>
                </div>
              ))
            : null}
        </div>
      ) : null}

      {enrolling ? (
        <form onSubmit={finishEnroll} className="flex flex-col gap-4">
          <p className={`${TYPE.bodySm} ${muted}`}>
            Scan this QR code with Google Authenticator, 1Password, Authy, or another TOTP app.
            Then enter the 6-digit code to finish.
          </p>
          {enrolling.qr ? (
            <img
              src={enrolling.qr}
              alt="Authenticator QR code"
              className="mx-auto h-48 w-48 rounded-xl bg-white p-2"
            />
          ) : null}
          {enrolling.secret ? (
            <p className={`${TYPE.bodySm} ${ink}`}>
              Can&apos;t scan? Enter this key:{' '}
              <span className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {enrolling.secret}
              </span>
            </p>
          ) : null}
          <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
            6-digit code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              {busy ? 'Checking…' : 'Confirm and turn on'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancelEnroll}
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {status ? <p className={`mt-3 ${TYPE.bodySm} ${ink}`}>{status}</p> : null}
      {error ? (
        <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnErrorContainer}`}>{error}</p>
      ) : null}
    </div>
  );
}
