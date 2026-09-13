import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { isValidPin, normalizeJoinCode } from '../data/auth/codes';
import { TYPE } from '../shared/typography';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';
import { CleverMark, GoogleMark, MicrosoftMark } from './brandMarks';
import { QrSignIn } from './QrSignIn';

function OrDivider({ theme }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className={`h-px flex-1 border-t-[1.5px] ${theme.colorOutline}`} />
      <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>or</span>
      <span className={`h-px flex-1 border-t-[1.5px] ${theme.colorOutline}`} />
    </div>
  );
}

export function StudentLoginPanel({
  theme,
  isDarkMode,
  busy,
  onClassCode,
  onQr,
  onClever,
  onGoogle,
  onMicrosoft,
  onEmail,
  onForgot,
  initialIdentity = '',
  initialSecret = '',
}) {
  const [identity, setIdentity] = useState(initialIdentity);
  const [secret, setSecret] = useState(initialSecret);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState('');

  async function run(task) {
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err?.message || 'That did not work. Try again.');
    }
  }

  function signIn(event) {
    event.preventDefault();
    if (showQr) return;
    const id = identity.trim();
    const code = normalizeJoinCode(id);
    const emailSignIn = id.includes('@');

    if (!id || !secret) {
      setError('Enter your email and password, or a class code and PIN.');
      return;
    }
    if (!emailSignIn && code && isValidPin(secret)) {
      run(() => onClassCode({ joinCode: id, pin: secret }));
      return;
    }
    if (!emailSignIn) {
      setError('Enter the class code and a 4 to 6 digit PIN.');
      return;
    }
    run(() => onEmail({ email: id, password: secret }));
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={signIn}
      >
        <AuthField
          id="student-email"
          label="Email or class code"
          theme={theme}
          isDarkMode={isDarkMode}
          type="text"
          value={identity}
          onChange={(event) => setIdentity(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          end={
            <button
              type="button"
              aria-pressed={showQr}
              aria-expanded={showQr}
              aria-label={showQr ? 'Hide QR scanner' : 'Scan a QR code'}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowQr((open) => !open);
              }}
              className={`edu-control flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-[1.5px] ${
                showQr
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                  : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
              }`}
            >
              <QrCode size={20} />
            </button>
          }
        />
        <div className="relative space-y-4">
          <div className={`space-y-3 ${showQr ? 'invisible pointer-events-none' : ''}`} aria-hidden={showQr}>
            <AuthField
              id="student-password"
              label="Password or PIN"
              theme={theme}
              isDarkMode={isDarkMode}
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="current-password"
              required={!showQr}
              tabIndex={showQr ? -1 : undefined}
            />
            {onForgot ? (
              <p className="text-right">
                <button
                  type="button"
                  className={`edu-control ${TYPE.labelMd} underline-offset-2 hover:underline ${theme.text}`}
                  onClick={() => onForgot(identity.includes('@') ? identity.trim() : '')}
                  tabIndex={showQr ? -1 : undefined}
                >
                  Forgot password?
                </button>
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              tabIndex={showQr ? -1 : undefined}
              className={primaryButtonClass(theme)}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          <div className={showQr ? 'invisible pointer-events-none' : undefined} aria-hidden={showQr}>
            <OrDivider theme={theme} />
          </div>

          <div
            className={`flex flex-col items-center gap-2 sm:flex-row sm:justify-center ${showQr ? 'invisible pointer-events-none' : ''}`}
            aria-hidden={showQr}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onGoogle)}
              aria-label="Continue with Google"
              title="Continue with Google"
              tabIndex={showQr ? -1 : undefined}
              className="edu-control flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-[#747775] bg-white text-[#1f1f1f] disabled:opacity-60"
            >
              <GoogleMark className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onClever)}
              aria-label="Continue with Clever"
              title="Continue with Clever"
              tabIndex={showQr ? -1 : undefined}
              className="edu-control flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-[#747775] bg-white text-[#1464FF] disabled:opacity-60"
            >
              <CleverMark size={20} />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(onMicrosoft)}
              aria-label="Continue with Microsoft 365"
              title="Continue with Microsoft 365"
              tabIndex={showQr ? -1 : undefined}
              className="edu-control flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-[#8C8C8C] bg-white disabled:opacity-60"
            >
              <MicrosoftMark className="h-5 w-5" />
            </button>
          </div>

          {showQr ? (
            <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl">
              <QrSignIn
                fill
                theme={theme}
                isDarkMode={isDarkMode}
                disabled={busy}
                onToken={(token) => run(() => onQr(token))}
              />
            </div>
          ) : null}
        </div>
      </form>

      <AuthError message={error} />
    </div>
  );
}
