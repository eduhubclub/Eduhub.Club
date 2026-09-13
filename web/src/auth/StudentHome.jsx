import { OwnerFacetSwitch } from './OwnerFacetSwitch';
import { useAuth } from '../data/auth/AuthContext';
import { LogoHorizontal } from '../shared/Logo';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';

export function StudentHome() {
  const { session, signOut, switchView } = useAuth();
  const theme = getTheme('Blue', false);
  const shellBackground = resolveShellBackgroundClass(undefined, false);

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center px-4 ${shellBackground} ${theme.colorOnBackground}`}
    >
      <LogoHorizontal className="h-10 w-auto" />
      <h1 className={`mt-6 ${TYPE.titleLg}`}>Hi, {session?.displayName || 'there'}</h1>
      <p className={`mt-2 max-w-sm text-center ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
        You are signed in. Your class page will grow here.
      </p>
      {session?.owner ? (
        <OwnerFacetSwitch
          activeRole={session.role}
          theme={theme}
          onSwitch={switchView}
          className="mt-8 w-full max-w-xs"
        />
      ) : null}
      <button
        type="button"
        onClick={signOut}
        className={`edu-control mt-8 rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      >
        Sign out
      </button>
    </div>
  );
}
