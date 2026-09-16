import { useEffect, useRef, useState } from 'react';
import { OwnerFacetSwitch } from './OwnerFacetSwitch';
import { apps } from '../apps/index';
import { canEnterApp } from '../data/access/accessCopy';
import { touchLocalDemoApp } from '../data/access/demoAccess';
import { StudentPartAccessProvider } from '../data/access/StudentPartAccess';
import { HEARTBEAT_SECONDS, touchStudentApp } from '../data/access/studentAccessApi';
import {
  appParts,
  normalizeParts,
  partByTab,
  partEnabled,
  STUDENT_APP_NAMES,
} from '../data/access/studentApps';
import { getTheme } from '../shared/theme';
import { TYPE } from '../shared/typography';

/**
 * Thin student chrome around an allowed app.
 * Arcade and the other student apps stay inside the window and daily limit
 * because this frame asks the server before the app mounts, then about every 30 seconds.
 */
export function StudentAppFrame({
  appId,
  session,
  onBack,
  onLocked,
  onSignOut,
  onSwitchView,
}) {
  const app = apps[appId];
  const [activeTab, setActiveTab] = useState(app?.defaultView || '');
  const [ready, setReady] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(null);
  const [parts, setParts] = useState({});
  const [partNotice, setPartNotice] = useState('');
  const lockedRef = useRef(onLocked);
  const theme = getTheme(app?.themeKey || 'Blue', false);
  lockedRef.current = onLocked;

  useEffect(() => {
    setActiveTab(app?.defaultView || '');
    setReady(false);
  }, [app, app?.defaultView]);

  useEffect(() => {
    let stopped = false;
    let last = Date.now();

    async function beat(seconds) {
      const status =
        session?.userId === 'demo'
          ? touchLocalDemoApp(appId, seconds)
          : await touchStudentApp(appId, seconds);
      if (stopped) return;
      last = Date.now();
      setMinutesLeft(status?.daily_minutes == null ? null : status.minutes_left);
      setParts(normalizeParts(status?.parts));
      if (!canEnterApp(status)) {
        setReady(false);
        lockedRef.current(status);
        return;
      }
      setReady(true);
    }

    beat(0).catch((error) => {
      if (stopped) return;
      lockedRef.current({
        open: false,
        app_id: appId,
        detail: error.message || 'This app is locked.',
      });
    });

    const id = window.setInterval(() => {
      beat(HEARTBEAT_SECONDS).catch(() => {});
    }, HEARTBEAT_SECONDS * 1000);

    return () => {
      stopped = true;
      window.clearInterval(id);
      const extra = Math.min(45, Math.round((Date.now() - last) / 1000));
      if (extra >= 5 && session?.userId !== 'demo') touchStudentApp(appId, extra).catch(() => {});
      if (extra >= 5 && session?.userId === 'demo') touchLocalDemoApp(appId, extra);
    };
  }, [appId, session?.userId]);

  const View = app?.View;
  const partsForApp = appParts(appId);
  const currentPart = partByTab(appId, activeTab);
  const tabClosed = Boolean(currentPart && !partEnabled(parts, currentPart.id));
  const minutesLabel =
    minutesLeft == null
      ? ''
      : minutesLeft === 1
        ? '1 minute left'
        : `${minutesLeft} minutes left`;

  function explainPart(name) {
    setPartNotice(
      name
        ? `${name} is closed. Your teacher has this turned off.`
        : 'Your teacher has this turned off.',
    );
  }

  function chooseTab(tab) {
    const part = partByTab(appId, tab);
    if (part && !partEnabled(parts, part.id)) {
      explainPart(part.name);
      return;
    }
    setPartNotice('');
    setActiveTab(tab);
  }

  return (
    <StudentPartAccessProvider appId={appId} parts={parts} onExplain={explainPart}>
    <div className={`flex h-dvh min-h-0 flex-col ${theme.colorBackground} ${theme.colorOnBackground}`}>
      <header
        className={`flex shrink-0 flex-wrap items-center gap-3 border-b-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <button
          type="button"
          onClick={onBack}
          className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
        >
          Back
        </button>
        <p className={`min-w-0 flex-1 truncate ${TYPE.titleSm}`}>
          {STUDENT_APP_NAMES[appId] || app?.name || 'App'}
        </p>
        {minutesLabel ? (
          <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`} aria-live="polite">
            {minutesLabel}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onSignOut}
          className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          Sign out
        </button>
        {session?.owner ? (
          <OwnerFacetSwitch
            activeRole={session.role}
            theme={theme}
            onSwitch={onSwitchView}
            className="w-full"
          />
        ) : null}
      </header>
      {partsForApp.length > 0 ? (
        <div
          className={`flex shrink-0 flex-wrap gap-2 border-b-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          {partsForApp.map((part) => {
            const on = partEnabled(parts, part.id);
            const selected = activeTab === part.tab;
            return (
              <button
                key={part.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseTab(part.tab)}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelSm} ${
                  !on
                    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} ${theme.colorOutline}`
                    : selected
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                      : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                }`}
              >
                {part.name}
                {on ? '' : ' · closed'}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!ready ? (
          <p className={`p-6 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Checking this app…</p>
        ) : tabClosed ? (
          <p className={`p-6 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
            {currentPart.name} is closed. Your teacher has this turned off.
          </p>
        ) : View ? (
          <View
            activeTab={activeTab}
            isDarkMode={false}
            theme={theme}
            isLeft
            isDesktop
            onSetActiveTab={chooseTab}
          />
        ) : (
          <p className={`p-6 ${TYPE.bodyMd}`}>This app is not available yet.</p>
        )}
      </div>
      {partNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-part-lock-title"
            className={`w-full max-w-sm rounded-2xl border-[1.5px] p-5 ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <h2 id="student-part-lock-title" className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Closed
            </h2>
            <p className={`${TYPE.bodyMd} mt-2 ${theme.colorOnSurfaceVariant}`}>{partNotice}</p>
            <button
              type="button"
              onClick={() => setPartNotice('')}
              className={`edu-control mt-4 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
    </StudentPartAccessProvider>
  );
}
