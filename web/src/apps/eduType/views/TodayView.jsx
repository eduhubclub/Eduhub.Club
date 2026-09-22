import { useEffect, useMemo, useRef, useState } from 'react';
import {
  APP_STATIC_BOARD,
  APP_STAGE_PAD,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { EmptyState } from '../../../shared/EmptyState';
import { useAuth } from '../../../data/auth/AuthContext';
import { useClasses } from '../../../data/classes/ClassContext';
import {
  formatActiveTime,
  loadStudentTodayAssignment,
  loadTodayAssignment,
} from '../../../data/eduType/eduTypeApi';
import { ProgressBar } from '../components/ProgressBar';
import { TypingPassage, TypingStats } from '../typing/TypingPassage';
import { SpecialtyShortcutsHint } from '../typing/SpecialtyShortcutsHint';
import { TypingKeyboard } from '../typing/TypingKeyboard';
import { useTypingPersistence } from '../hooks/useTypingPersistence';
import { useTypingKeyboardVisible } from '../hooks/useTypingKeyboardVisible';
import { toolBtnClass } from '../../../shared/toolBtn';
import { Keyboard } from 'lucide-react';

/**
 * Today's teacher-assigned practice passage.
 */
export function TodayView({ theme, isDarkMode }) {
  const { session } = useAuth();
  const isTeacher = session?.role === 'teacher' || Boolean(session?.owner);
  const { classes, selectedClass } = useClasses();
  const toolBtn = toolBtnClass(isDarkMode);
  const { showKeyboard, toggleKeyboard } = useTypingKeyboardVisible();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );
  const teacherClassId = selectedClass?.id || activeClasses[0]?.id || 'local';

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    wpm: 0,
    activeMs: 0,
    accuracy: 1,
  });
  const [doneStats, setDoneStats] = useState(null);
  const resumedRef = useRef(false);
  const segmentRef = useRef({
    activeMs: 0,
    correctKeystrokes: 0,
    errorKeystrokes: 0,
    letterCorrect: 0,
    letterWrong: 0,
  });

  const textId = assignment?.text?.id || null;
  const body = assignment?.text?.body || '';
  const {
    ready,
    progress,
    persist,
    schedulePersist,
    setClassId,
  } = useTypingPersistence({
    contentKind: 'text',
    contentId: textId,
    enabled: Boolean(textId),
  });

  useEffect(() => {
    resumedRef.current = false;
  }, [textId]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      setError('');
      setDoneStats(null);
      try {
        if (isTeacher) {
          const today = await loadTodayAssignment({ classId: teacherClassId });
          if (!cancelled) setAssignment(today);
        } else {
          const today = await loadStudentTodayAssignment();
          if (!cancelled) setAssignment(today);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load today’s practice.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [isTeacher, teacherClassId]);

  useEffect(() => {
    if (assignment?.classId) setClassId(assignment.classId);
    else if (isTeacher) setClassId(teacherClassId);
  }, [assignment?.classId, isTeacher, teacherClassId, setClassId]);

  useEffect(() => {
    if (!ready || !progress || !textId || resumedRef.current) return;
    resumedRef.current = true;
    if (progress.completedAt) {
      setCharIndex(body.length);
      setDoneStats({
        wpm: 0,
        activeMs: progress.activeMs,
        accuracy:
          progress.correctKeystrokes + progress.errorKeystrokes > 0
            ? progress.correctKeystrokes /
              (progress.correctKeystrokes + progress.errorKeystrokes)
            : 1,
      });
      return;
    }
    setCharIndex(progress.charIndex || 0);
  }, [ready, progress, textId, body.length]);

  if (loading) {
    return (
      <div
        className={`flex h-full items-center justify-center ${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Loading today…</p>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Today</h2>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {isTeacher && selectedClass?.name
              ? `Practice for ${selectedClass.name}.`
              : 'Practice the passage your teacher sent for today.'}
          </p>
        </div>
        {assignment ? <TypingStats theme={theme} {...liveMetrics} /> : null}
      </div>

      {error ? (
        <p className={`${TYPE.bodySm} text-red-600`}>{error}</p>
      ) : null}

      {!assignment ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState
            isDarkMode={isDarkMode}
            message={
              isTeacher
                ? 'No passage for today yet. Open Create and choose Save for today.'
                : 'Nothing assigned for today yet. Check back after your teacher sends practice.'
            }
          />
        </div>
      ) : (
        <>
          <div className="shrink-0">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{assignment.text.title}</p>
            <ProgressBar
              theme={theme}
              value={body.length ? charIndex / body.length : 0}
              label="Passage progress"
            />
          </div>
          {!ready ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Loading your place…</p>
          ) : doneStats && charIndex >= body.length ? (
            <div className={`rounded-xl border-[1.5px] p-4 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}>
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Finished!</p>
              <TypingStats
                theme={theme}
                wpm={doneStats.wpm || liveMetrics.wpm}
                activeMs={doneStats.activeMs || progress?.activeMs || 0}
                accuracy={doneStats.accuracy ?? 1}
              />
              <p className={`${TYPE.bodySm} mt-2 whitespace-pre-wrap ${theme.colorOnSurface}`}>
                {body}
              </p>
              <p className={`${TYPE.labelSm} mt-2 ${theme.colorOnSurfaceVariant}`}>
                Time {formatActiveTime(doneStats.activeMs || progress?.activeMs || 0)}
              </p>
            </div>
          ) : (
            <>
              <TypingPassage
                key={textId}
                text={body}
                theme={theme}
                initialCharIndex={charIndex}
                onProgress={({ charIndex: next }) => {
                  setCharIndex(next);
                  schedulePersist({
                    pageIndex: 0,
                    charIndex: next,
                    segmentActiveMs: segmentRef.current.activeMs,
                    segmentCorrect: segmentRef.current.correctKeystrokes,
                    segmentErrors: segmentRef.current.errorKeystrokes,
                    letterCorrect: segmentRef.current.letterCorrect,
                    letterWrong: segmentRef.current.letterWrong,
                  });
                }}
                onMetrics={(m) => {
                  segmentRef.current = {
                    activeMs: m.activeMs || 0,
                    correctKeystrokes: m.correctKeystrokes || 0,
                    errorKeystrokes: m.errorKeystrokes || 0,
                    letterCorrect: m.letterCorrect || 0,
                    letterWrong: m.letterWrong || 0,
                  };
                  setLiveMetrics(m);
                }}
                onComplete={async (stats) => {
                  setDoneStats(stats);
                  await persist({
                    pageIndex: 0,
                    charIndex: body.length,
                    segmentActiveMs: stats.activeMs || 0,
                    segmentCorrect: stats.correctKeystrokes || 0,
                    segmentErrors: stats.errorKeystrokes || 0,
                    letterCorrect: stats.letterCorrect || 0,
                    letterWrong: stats.letterWrong || 0,
                    completed: true,
                    endSession: true,
                    commitSegment: true,
                  });
                }}
                className={`min-h-0 flex-1 overflow-auto ${theme.colorSurfaceVariant} ${theme.colorOutline} border-[1.5px]`}
              />
              <SpecialtyShortcutsHint text={body} theme={theme} />
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={`${toolBtn} ${
                    showKeyboard ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                  }`}
                  onClick={toggleKeyboard}
                  aria-pressed={showKeyboard}
                  aria-label={showKeyboard ? 'Hide keyboard' : 'Show keyboard'}
                >
                  <Keyboard className="h-4 w-4" aria-hidden />
                  Keyboard
                </button>
              </div>
              <TypingKeyboard theme={theme} visible={showKeyboard} />
            </>
          )}
        </>
      )}
    </div>
  );
}
