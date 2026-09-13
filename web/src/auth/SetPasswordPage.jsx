import { useState } from 'react';
import { passwordError } from '../data/auth/codes';
import { useAuth } from '../data/auth/AuthContext';
import { APP_BOARD_CHROME } from '../shared/layout';
import { LogoHorizontal } from '../shared/Logo';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';

export function SetPasswordPage() {
  const { updatePassword } = useAuth();
  const theme = getTheme('Blue', false);
  const shellBackground = resolveShellBackgroundClass(undefined, false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const issue = passwordError(password);
    if (issue) {
      setError(issue);
      return;
    }
    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await updatePassword(password);
    } catch (err) {
      setError(err?.message || 'Could not save that password.');
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
          <h1 className={TYPE.titleLg}>Choose a new password</h1>
          <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            This replaces the password on your account.
          </p>
        </div>
        <AuthField
          id="new-password"
          label="New password"
          theme={theme}
          isDarkMode={false}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <AuthField
          id="confirm-password"
          label="Confirm password"
          theme={theme}
          isDarkMode={false}
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
        />
        <AuthError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass(theme)}>
          {busy ? 'Please wait…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}

export function ResetLinkFailed({ onSignOut }) {
  const theme = getTheme('Blue', false);
  const shellBackground = resolveShellBackgroundClass(undefined, false);

  return (
    <div className={`flex min-h-dvh items-center justify-center px-4 ${shellBackground}`}>
      <div className={`${APP_BOARD_CHROME} w-full max-w-md space-y-4 p-6 ${theme.colorSurface} ${theme.colorOutline}`}>
        <LogoHorizontal className="h-8 w-auto" />
        <h1 className={TYPE.titleLg}>That link did not work</h1>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Ask for a new password link and open the newest email.
        </p>
        <button type="button" onClick={onSignOut} className={primaryButtonClass(theme)}>
          Close
        </button>
      </div>
    </div>
  );
}
