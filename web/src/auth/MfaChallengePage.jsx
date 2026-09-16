import { useState } from 'react';
import { useAuth } from '../data/auth/AuthContext';
import { APP_BOARD_CHROME } from '../shared/layout';
import { LogoHorizontal } from '../shared/Logo';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';

/**
 * Shown after password/OAuth when the account has MFA on but this session is still AAL1.
 */
export function MfaChallengePage() {
  const { verifyMfa, signOut } = useAuth();
  const theme = getTheme('Blue', false);
  const shellBackground = resolveShellBackgroundClass(undefined, false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyMfa(code);
    } catch (err) {
      setError(err?.message || 'That code is not right.');
      setBusy(false);
    }
  }

  return (
    <div className={`flex min-h-dvh items-center justify-center px-4 ${shellBackground}`}>
      <form
        onSubmit={submit}
        className={`${APP_BOARD_CHROME} w-full max-w-md space-y-4 p-6 ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <LogoHorizontal className="h-8 w-auto" />
        <div>
          <h1 className={TYPE.titleLg}>Authenticator code</h1>
          <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Enter the 6-digit code from your authenticator app to finish signing in.
          </p>
        </div>
        <AuthField
          id="mfa-code"
          label="Code"
          theme={theme}
          isDarkMode={false}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
          required
        />
        <AuthError message={error} />
        <button type="submit" disabled={busy || code.length !== 6} className={primaryButtonClass(theme)}>
          {busy ? 'Checking…' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={() => signOut()}
          className={`edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
