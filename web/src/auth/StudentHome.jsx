import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { launcherApps } from '../apps/launcher';
import { OwnerFacetSwitch } from './OwnerFacetSwitch';
import { StudentAppFrame } from './StudentAppFrame';
import { useAuth } from '../data/auth/AuthContext';
import { canEnterApp } from '../data/access/accessCopy';
import { accessErrorMessage, ensureDemoClass, loadStudentBoard } from '../data/access/studentAccessApi';
import { localDemoBoard } from '../data/access/demoAccess';
import { isLocalDemoSession } from './demoAccount';
import { STUDENT_APP_IDS, STUDENT_APP_NAMES } from '../data/access/studentApps';
import { LogoHorizontal } from '../shared/Logo';
import { APP_GRID_CARD } from '../shared/layout';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';

const APP_META = Object.fromEntries(launcherApps.map((app) => [app.id, app]));

function LockDialog({ appName, detail, theme, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Close"
          onClick={onClose}
        />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-lock-title"
        className={`${APP_GRID_CARD} relative w-full max-w-sm p-5 ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <h2 id="app-lock-title" className={TYPE.titleSm}>
          {appName}
        </h2>
        <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          {detail || 'This app is locked.'}
        </p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className={`edu-control mt-5 rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function StudentHome() {
  const { session, signOut, switchView } = useAuth();
  const theme = getTheme('Blue', false);
  const shellBackground = resolveShellBackgroundClass(undefined, false);
  const localDemo = isLocalDemoSession(session);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [activeAppId, setActiveAppId] = useState('');

  const refresh = useCallback(async () => {
    if (localDemo) {
      setBoard(localDemoBoard());
      setLoading(false);
      return;
    }
    setError('');
    let rows = await loadStudentBoard();
    const missingClass = rows.length > 0 && rows.every((row) => row.reason === 'no_class');
    if (missingClass) {
      try {
        await ensureDemoClass();
        rows = await loadStudentBoard();
      } catch (err) {
        const message = err?.message || '';
        if (!/not allowed/i.test(message)) throw err;
      }
    }
    setBoard(rows);
    setLoading(false);
  }, [localDemo, session?.demo, session?.owner]);

  useEffect(() => {
    let cancelled = false;
    refresh().catch((err) => {
      if (!cancelled) {
        setError(accessErrorMessage(err));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const statusFor = useCallback(
    (appId) => board.find((row) => row.app_id === appId),
    [board],
  );

  const showLock = useCallback((appId, status) => {
    setDialog({
      appId,
      detail: status?.detail || 'This app is locked.',
    });
  }, []);

  const onLocked = useCallback((status) => {
    setActiveAppId('');
    setDialog({
      appId: status?.app_id,
      detail: status?.detail || 'This app is locked.',
    });
    refresh().catch(() => {});
  }, [refresh]);

  if (activeAppId) {
    return (
      <>
        <StudentAppFrame
          appId={activeAppId}
          session={session}
          onBack={() => {
            setActiveAppId('');
            refresh().catch(() => {});
          }}
          onLocked={onLocked}
          onSignOut={signOut}
          onSwitchView={switchView}
        />
        {dialog ? (
          <LockDialog
            appName={STUDENT_APP_NAMES[dialog.appId] || 'App'}
            detail={dialog.detail}
            theme={theme}
            onClose={() => setDialog(null)}
          />
        ) : null}
      </>
    );
  }

  const noClass = !loading && !error && board.length > 0 && board.every((row) => row.reason === 'no_class');
  const waitingOnRoster = !loading && !error && noClass && !session?.demo && !session?.owner;

  return (
    <div className={`min-h-dvh ${shellBackground} ${theme.colorOnBackground}`}>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5">
        <LogoHorizontal className="h-8 w-auto" />
        <button
          type="button"
          onClick={signOut}
          className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          Sign out
        </button>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-10">
        <h1 className={TYPE.titleLg}>Hi, {session?.displayName || 'there'}</h1>
        {loading ? (
          <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Loading your apps…</p>
        ) : null}
        {error ? (
          <p className={`mt-2 max-w-md ${TYPE.bodyMd} ${theme.colorOnErrorContainer}`}>{error}</p>
        ) : null}
        {waitingOnRoster ? (
          <p className={`mt-2 max-w-sm ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            This sign-in is not on a class. To see Demo Class here, use the site demo and choose Student. Leave the owner account in the other window.
          </p>
        ) : null}
        {!loading && !error && !waitingOnRoster ? (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {STUDENT_APP_IDS.map((appId) => {
              const status = statusFor(appId);
              const open = canEnterApp(status);
              const meta = APP_META[appId];
              const Icon = meta?.icon;
              return (
                <li key={appId}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (open) {
                        setDialog(null);
                        setActiveAppId(appId);
                        return;
                      }
                      if (localDemo) {
                        showLock(appId, statusFor(appId) || status);
                        return;
                      }
                      try {
                        const rows = await loadStudentBoard();
                        setBoard(rows);
                        showLock(
                          appId,
                          rows.find((row) => row.app_id === appId) || status,
                        );
                      } catch {
                        showLock(appId, status);
                      }
                    }}
                    className={`edu-control flex h-full w-full flex-col items-start gap-3 p-4 text-left ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
                  >
                    <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white ${meta?.color || theme.colorPrimary}`}>
                      {Icon ? <Icon size={22} aria-hidden="true" /> : null}
                      {open ? null : (
                        <span className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full ${theme.colorSurface} ${theme.colorOnSurface}`}>
                          <Lock size={12} aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span>
                      <span className={`block ${TYPE.labelMd}`}>{STUDENT_APP_NAMES[appId]}</span>
                      <span className={`block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        {open ? 'Open' : 'Locked'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {session?.owner ? (
          <OwnerFacetSwitch
            activeRole={session.role}
            theme={theme}
            onSwitch={switchView}
            className="mt-8 w-full max-w-xs"
          />
        ) : null}
      </main>
      {dialog ? (
        <LockDialog
          appName={STUDENT_APP_NAMES[dialog.appId] || 'App'}
          detail={dialog.detail}
          theme={theme}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
