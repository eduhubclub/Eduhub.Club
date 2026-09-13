import { useAuth } from '../data/auth/AuthContext';
import { sessionForShell, shellForRole } from '../data/auth/session';
import { LogoHorizontal } from '../shared/Logo';
import { resolveShellBackgroundClass } from '../shared/theme';
import { AppShell } from '../shell/AppShell';
import { LandingPage } from './LandingPage';
import { passwordResetWasRequested } from './passwordReset';
import { ResetLinkFailed, SetPasswordPage } from './SetPasswordPage';
import { RoleShell } from './RoleShell';
import { StudentHome } from './StudentHome';

function Splash() {
  const shellBackground = resolveShellBackgroundClass(undefined, false);
  return (
    <div className={`flex min-h-dvh items-center justify-center ${shellBackground}`}>
      <LogoHorizontal className="h-10 w-auto" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function AuthGate() {
  const { ready, session, recovery, signOut } = useAuth();
  if (!ready) return <Splash />;
  if (recovery && session) return <SetPasswordPage />;
  if (passwordResetWasRequested() && !session) return <ResetLinkFailed onSignOut={signOut} />;
  if (!session) return <LandingPage />;

  const view = sessionForShell(session);
  const shell = shellForRole(view.role);
  if (shell === 'teacher') return <AppShell />;
  if (shell === 'admin' || shell === 'parent') return <RoleShell role={shell} />;
  if (shell === 'student') return <StudentHome />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <p>This account does not have a role yet.</p>
      {session.email ? (
        <p>{session.email}</p>
      ) : null}
      <button type="button" className="edu-control rounded-xl px-4 py-2" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
