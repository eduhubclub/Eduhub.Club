import { useState } from 'react';
import { canSelfServeSignup, passwordError } from '../data/auth/codes';
import { useAuth } from '../data/auth/AuthContext';
import { DEMO_EMAIL } from './demoAccount';
import { Modal } from '../shared/Modal';
import { themeForRole } from './roleTheme';
import { TYPE } from '../shared/typography';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';
import { StudentLoginPanel } from './StudentLoginPanel';

const COPY = {
  admin: {
    title: 'Admin sign in',
    signupTitle: 'Create an admin account',
    blurb: 'Email and password for school administrators. New admin accounts need an invite.',
  },
  teacher: {
    title: 'Teacher sign in',
    signupTitle: 'Create a teacher account',
    blurb: 'Email and password for your classroom.',
  },
  student: {
    title: 'Student sign in',
    signupTitle: 'Create a student account',
    blurb: 'Use your class code and PIN, or a student card. Ask your teacher if you need an account.',
  },
  parent: {
    title: 'Parent sign in',
    signupTitle: 'Create a parent account',
    blurb: 'Email and password for families.',
  },
};

export function RoleLoginModal({
  role,
  isDarkMode,
  onClose,
  initialMode = 'login',
  initialEmail = '',
  initialPassword = '',
  inviteToken = '',
}) {
  const auth = useAuth();
  const theme = themeForRole(role, isDarkMode);
  const copy = COPY[role];
  const signupAllowed = canSelfServeSignup(role) || Boolean(inviteToken);
  const [mode, setMode] = useState(
    initialMode === 'signup' && signupAllowed ? 'signup' : 'login',
  );
  const [sent, setSent] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(task) {
    setError('');
    setBusy(true);
    try {
      await task();
    } catch (err) {
      setError(err?.message || 'That did not work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === 'signup';
  const forgot = mode === 'forgot';
  const demoSignIn = !signup && !forgot && email.trim() === DEMO_EMAIL;

  function submitSignIn(values = { email, password }) {
    if (demoSignIn) return auth.enterDemo(role);
    return auth.signIn({ ...values, viewRole: role });
  }

  return (
    <Modal
      isOpen
      title={forgot ? 'Reset password' : signup ? copy.signupTitle : copy.title}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 px-6 py-5">
        {!auth.configured ? (
          <AuthError message="Sign-in is not connected yet." />
        ) : null}
        {forgot ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {sent
              ? 'Check your email for a link to choose a new password.'
              : 'We’ll email a link to choose a new password.'}
          </p>
        ) : copy.blurb ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{copy.blurb}</p>
        ) : null}

        {forgot ? (
          sent ? null : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                run(async () => {
                  await auth.requestPasswordReset(email);
                  setSent(true);
                });
              }}
            >
              <AuthField
                id={`${role}-reset-email`}
                label="Email"
                theme={theme}
                isDarkMode={isDarkMode}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
              <AuthError message={error} />
              <button type="submit" disabled={busy} className={primaryButtonClass(theme)}>
                {busy ? 'Please wait…' : 'Send reset link'}
              </button>
            </form>
          )
        ) : role === 'student' && !signup ? (
          <StudentLoginPanel
            theme={theme}
            isDarkMode={isDarkMode}
            busy={busy}
            initialIdentity={initialEmail}
            initialSecret={initialPassword}
            onClassCode={(values) => run(() => auth.signInWithClassCode(values))}
            onQr={(token) => run(() => auth.signInWithQr(token))}
            onClever={() => run(() => auth.signInWithClever())}
            onGoogle={() => run(() => auth.signInWithGoogle())}
            onMicrosoft={() => run(() => auth.signInWithMicrosoft())}
            onEmail={(values) => run(() => submitSignIn(values))}
            onForgot={(address) => {
              if (address) setEmail(address);
              setMode('forgot');
              setSent(false);
              setError('');
            }}
          />
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const issue = signup ? passwordError(password) : '';
              if (issue) {
                setError(issue);
                return;
              }
              if (signup && password !== confirm) {
                setError('Those passwords do not match.');
                return;
              }
              if (signup && !displayName.trim()) {
                setError('Add your name.');
                return;
              }
              run(() =>
                signup
                  ? auth.signUp({ email, password, displayName, role, inviteToken })
                  : submitSignIn(),
              );
            }}
          >
            {signup ? (
              <AuthField
                id={`${role}-name`}
                label="Name"
                theme={theme}
                isDarkMode={isDarkMode}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                required
              />
            ) : null}
            <AuthField
              id={`${role}-email`}
              label="Email"
              theme={theme}
              isDarkMode={isDarkMode}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              readOnly={Boolean(inviteToken && signup)}
            />
            <AuthField
              id={`${role}-password`}
              label="Password"
              theme={theme}
              isDarkMode={isDarkMode}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={signup ? 'new-password' : 'current-password'}
              required
            />
            {signup ? (
              <AuthField
                id={`${role}-confirm`}
                label="Confirm password"
                theme={theme}
                isDarkMode={isDarkMode}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
            ) : null}
            {signup ? null : (
              <p className="text-right">
                <button
                  type="button"
                  className={`edu-control ${TYPE.labelMd} underline-offset-2 hover:underline ${theme.text}`}
                  onClick={() => {
                    setMode('forgot');
                    setSent(false);
                    setError('');
                  }}
                >
                  Forgot password?
                </button>
              </p>
            )}
            <AuthError message={error} />
            <button type="submit" disabled={busy} className={primaryButtonClass(theme)}>
              {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {forgot || signupAllowed ? (
        <p className={`text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {forgot ? 'Remembered it?' : signup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className={`edu-control ${TYPE.labelMd} underline-offset-2 hover:underline ${theme.text}`}
            onClick={() => {
              setMode(forgot || signup ? 'login' : 'signup');
              setSent(false);
              setError('');
            }}
          >
            {forgot || signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        ) : role === 'student' ? (
          <p className={`text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Your teacher gives you a class code and PIN, or a student card.
          </p>
        ) : (
          <p className={`text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            New admin accounts need an invite from the school.
          </p>
        )}
      </div>
    </Modal>
  );
}
