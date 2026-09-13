import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';
import { parseSlidesJoinPayload } from '../../../data/slides/types';
import { getDeck } from '../../../data/slides/storage';
import {
  findSessionByCode,
  readSession,
  subscribeSession,
} from '../../../data/slides/session';
import { SlideCanvas } from '../SlideCanvas';

/**
 * Student follow-along. Same-machine via BroadcastChannel until a sync backend exists.
 */
export function FollowView({
  theme,
  isDarkMode,
  settings,
  roster,
  classLabel,
}) {
  const [session, setSession] = useState(() => readSession());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [followerId, setFollowerId] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);
  const field = `edu-control w-full max-w-xs rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  useEffect(() => {
    return subscribeSession((next) => setSession(next));
  }, []);

  const deck = session ? getDeck(session.deckId) : null;
  const slide = deck?.slides[session?.slideIndex || 0] || null;

  const join = (raw) => {
    setError('');
    const parsed = parseSlidesJoinPayload(raw);
    const needle = parsed?.code || parsed?.sessionId || String(raw || '').trim();
    const found = findSessionByCode(needle) || (parsed?.sessionId ? readSession() : null);
    if (parsed?.sessionId && found && found.id !== parsed.sessionId && found.joinCode !== parsed.code) {
      setError('That code is for a different session on this computer.');
      return;
    }
    if (!found) {
      setError(
        'No live session on this computer. Follow works in a second window on the teacher machine until school sync is available.',
      );
      return;
    }
    setSession(found);
  };

  const followers = useMemo(() => roster || [], [roster]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Follow"
        description="Join with the code or QR on the board. This preview updates live in another window on this computer."
        isDarkMode={isDarkMode}
      />

      {!session || !slide ? (
        <div className={`p-5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Join a session</p>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              join(code);
            }}
          >
            <label className="block">
              <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Join code</span>
              <input
                className={`${field} mt-1 uppercase tracking-widest`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AB12"
                autoCapitalize="characters"
              />
            </label>
            <button type="submit" className={toolBtn}>
              Join
            </button>
          </form>
          {error ? (
            <p className={`${TYPE.bodySm} mt-3 text-rose-600`} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <p className={`${TYPE.bodySm} mb-3 ${theme.colorOnSurfaceVariant}`}>
            {deck?.name} · {(session.slideIndex || 0) + 1} / {deck.slides.length}
            {classLabel ? ` · ${classLabel}` : ''}
          </p>
          <div className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}>
            <SlideCanvas slide={slide} theme={theme} aspect={settings.aspect} presentMode />
          </div>
        </>
      )}

      {followers.length ? (
        <section className={`mt-4 p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Class roster</p>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Signed-in students in this class can follow. Tap a name on this device to mark who is watching.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {followers.map((student) => {
              const active = followerId === student.id;
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                      active
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                    }`}
                    onClick={() => setFollowerId(student.id)}
                  >
                    {studentDisplayName(student)}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <EmptyState
          isDarkMode={isDarkMode}
          className="mt-4"
          message="Select a class to show who can follow from the roster."
        />
      )}
    </div>
  );
}
