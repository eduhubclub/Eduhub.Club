import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../data/auth/AuthContext';
import {
  clearProgress,
  flushSession,
  formatActiveTime,
  loadProgress,
  loadStudentClassId,
  saveProgress,
} from '../../../data/eduType/eduTypeApi';

/**
 * Debounced cloud/local progress + session flush for a typing activity.
 * `base*` = completed prior pages; `segment*` = current page/passage only.
 * Saved totals = base + segment (segment is not added repeatedly).
 */
export function useTypingPersistence({
  contentKind,
  contentId,
  enabled = true,
}) {
  const { session } = useAuth();
  const studentId = session?.userId || 'local';
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(null);
  const [classId, setClassId] = useState(null);
  const sessionIdRef = useRef(null);
  const startedAtRef = useRef(null);
  const baseRef = useRef({
    activeMs: 0,
    correctKeystrokes: 0,
    errorKeystrokes: 0,
  });
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    sessionIdRef.current = null;
    startedAtRef.current = null;

    async function boot() {
      if (!enabled || !contentId) {
        setProgress(null);
        setReady(true);
        return;
      }
      const [prog, memberClass] = await Promise.all([
        loadProgress({ studentId, contentKind, contentId }),
        session?.role === 'student' ? loadStudentClassId() : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setProgress(prog);
      setClassId(memberClass || prog.classId || null);
      baseRef.current = {
        activeMs: prog.activeMs || 0,
        correctKeystrokes: prog.correctKeystrokes || 0,
        errorKeystrokes: prog.errorKeystrokes || 0,
      };
      setReady(true);
    }

    boot();
    return () => {
      cancelled = true;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [studentId, contentKind, contentId, enabled, session?.role]);

  const persist = useCallback(
    async ({
      pageIndex,
      charIndex,
      segmentActiveMs = 0,
      segmentCorrect = 0,
      segmentErrors = 0,
      letterCorrect = 0,
      letterWrong = 0,
      completed = false,
      endSession = false,
      commitSegment = false,
    }) => {
      if (!enabled || !contentId) return;

      const totalActive = (baseRef.current.activeMs || 0) + Math.max(0, segmentActiveMs);
      const totalCorrect =
        (baseRef.current.correctKeystrokes || 0) + Math.max(0, segmentCorrect);
      const totalErrors =
        (baseRef.current.errorKeystrokes || 0) + Math.max(0, segmentErrors);

      if (!startedAtRef.current && (segmentCorrect > 0 || segmentErrors > 0 || segmentActiveMs > 0)) {
        startedAtRef.current = new Date().toISOString();
        sessionIdRef.current = crypto.randomUUID();
      }

      const completedAt = completed
        ? new Date().toISOString()
        : progress?.completedAt || null;

      await saveProgress({
        studentId,
        contentKind,
        contentId,
        classId,
        pageIndex,
        charIndex,
        activeMs: totalActive,
        correctKeystrokes: totalCorrect,
        errorKeystrokes: totalErrors,
        completedAt,
      });

      if (startedAtRef.current && sessionIdRef.current) {
        await flushSession({
          sessionId: sessionIdRef.current,
          studentId,
          classId,
          contentKind,
          contentId,
          startedAt: startedAtRef.current,
          endedAt: endSession || completed ? new Date().toISOString() : null,
          activeMs: segmentActiveMs,
          correctKeystrokes: segmentCorrect,
          errorKeystrokes: segmentErrors,
          letterCorrect,
          letterWrong,
        });
      }

      if (commitSegment) {
        baseRef.current = {
          activeMs: totalActive,
          correctKeystrokes: totalCorrect,
          errorKeystrokes: totalErrors,
        };
      }

      setProgress((prev) => ({
        ...(prev || {}),
        pageIndex,
        charIndex,
        activeMs: totalActive,
        correctKeystrokes: totalCorrect,
        errorKeystrokes: totalErrors,
        completedAt,
        classId,
      }));
    },
    [enabled, contentId, contentKind, studentId, classId, progress?.completedAt],
  );

  const schedulePersist = useCallback(
    (args) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        persist(args).catch(() => {});
      }, 600);
    },
    [persist],
  );

  const resetProgress = useCallback(async () => {
    await clearProgress({ studentId, contentKind, contentId });
    sessionIdRef.current = null;
    startedAtRef.current = null;
    baseRef.current = { activeMs: 0, correctKeystrokes: 0, errorKeystrokes: 0 };
    setProgress({
      pageIndex: 0,
      charIndex: 0,
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      completedAt: null,
      classId,
      source: 'local',
    });
  }, [studentId, contentKind, contentId, classId]);

  return {
    ready,
    progress,
    studentId,
    classId,
    setClassId,
    persist,
    schedulePersist,
    resetProgress,
    formatActiveTime,
  };
}
