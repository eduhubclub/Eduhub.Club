import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  RotateCcw,
} from 'lucide-react';
import {
  APP_GRID_CARD,
  APP_STATIC_BOARD,
  APP_STAGE_PAD,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { CLASSICS_CATALOG, classicCharCount, getClassic } from '../classics/catalog';
import { ProgressBar } from '../components/ProgressBar';
import { TypingPassage, TypingStats } from '../typing/TypingPassage';
import { SpecialtyShortcutsHint } from '../typing/SpecialtyShortcutsHint';
import { TypingKeyboard } from '../typing/TypingKeyboard';
import { useTypingPersistence } from '../hooks/useTypingPersistence';
import { useTypingKeyboardVisible } from '../hooks/useTypingKeyboardVisible';
import { computeWpm, formatActiveTime } from '../../../data/eduType/eduTypeApi';
/**
 * Type a Classic — pick a book, type page by page, resume, then read.
 */
export function TypeClassicView({ theme, isDarkMode }) {
  const [classicId, setClassicId] = useState(null);
  const [mode, setMode] = useState('pick'); // pick | type | read
  const [pageIndex, setPageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    wpm: 0,
    activeMs: 0,
    accuracy: 1,
    correctKeystrokes: 0,
    errorKeystrokes: 0,
  });
  const [pageCompleteStats, setPageCompleteStats] = useState(null);
  const [passageEpoch, setPassageEpoch] = useState(0);
  const { showKeyboard, toggleKeyboard } = useTypingKeyboardVisible();
  /** Furthest resume point — Back must not move this backward. */
  const [highWater, setHighWater] = useState({ pageIndex: 0, charIndex: 0 });
  const highWaterRef = useRef({ pageIndex: 0, charIndex: 0 });
  const resumedRef = useRef(false);
  const segmentRef = useRef({
    activeMs: 0,
    correctKeystrokes: 0,
    errorKeystrokes: 0,
    letterCorrect: 0,
    letterWrong: 0,
  });
  const toolBtn = toolBtnClass(isDarkMode);

  const classic = classicId ? getClassic(classicId) : null;
  const {
    ready,
    progress,
    persist,
    schedulePersist,
    resetProgress,
  } = useTypingPersistence({
    contentKind: 'classic',
    contentId: classicId,
    enabled: Boolean(classicId),
  });

  function setHighWaterBoth(next) {
    highWaterRef.current = next;
    setHighWater(next);
  }

  /** Advance saved cursor only forward; returns the cursor that should be persisted. */
  function advanceSavedCursor(page, char) {
    const hw = highWaterRef.current;
    if (page > hw.pageIndex || (page === hw.pageIndex && char > hw.charIndex)) {
      const next = { pageIndex: page, charIndex: char };
      setHighWaterBoth(next);
      return next;
    }
    return hw;
  }

  useEffect(() => {
    resumedRef.current = false;
    setPageCompleteStats(null);
    setHighWaterBoth({ pageIndex: 0, charIndex: 0 });
  }, [classicId]);

  useEffect(() => {
    if (!classicId || !ready || !progress || resumedRef.current) return;
    resumedRef.current = true;
    if (progress.completedAt) {
      setMode('read');
      setPageIndex(0);
      setCharIndex(0);
      return;
    }
    const page = progress.pageIndex || 0;
    const char = progress.charIndex || 0;
    setHighWaterBoth({ pageIndex: page, charIndex: char });
    setPageIndex(page);
    setCharIndex(char);
    setMode('type');
    setPageCompleteStats(null);
  }, [classicId, ready, progress]);

  const pages = classic?.pages || [];
  const page = pages[pageIndex] || null;
  const pageText = page?.text || '';
  const pageDone =
    Boolean(pageCompleteStats) ||
    (pageText.length > 0 && charIndex >= pageText.length);

  useEffect(() => {
    if (!pageText.length) return;
    if (charIndex >= pageText.length && !pageCompleteStats) {
      setPageCompleteStats({ wpm: 0, activeMs: 0 });
    }
  }, [charIndex, pageText, pageCompleteStats]);

  const totalChars = useMemo(() => classicCharCount(classic), [classic]);
  const bookProgress = useMemo(() => {
    if (!classic || totalChars <= 0) return 0;
    let before = 0;
    for (let i = 0; i < highWater.pageIndex; i += 1) {
      before += String(pages[i]?.text || '').length;
    }
    const pageLen = String(pages[highWater.pageIndex]?.text || '').length;
    return (before + Math.min(highWater.charIndex, pageLen)) / totalChars;
  }, [classic, totalChars, highWater, pages]);

  function openClassic(id) {
    setClassicId(id);
    setPageCompleteStats(null);
    setLiveMetrics({
      wpm: 0,
      activeMs: 0,
      accuracy: 1,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
    });
    segmentRef.current = {
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      letterCorrect: 0,
      letterWrong: 0,
    };
  }

  function backToPicker() {
    setClassicId(null);
    setMode('pick');
    setPageIndex(0);
    setCharIndex(0);
    setPageCompleteStats(null);
  }

  async function handleRestart() {
    resumedRef.current = true;
    await resetProgress();
    setHighWaterBoth({ pageIndex: 0, charIndex: 0 });
    setPageIndex(0);
    setCharIndex(0);
    setMode('type');
    setPageCompleteStats(null);
    setPassageEpoch((n) => n + 1);
    segmentRef.current = {
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      letterCorrect: 0,
      letterWrong: 0,
    };
  }

  function onPassageProgress({ charIndex: next }) {
    setCharIndex(next);
    const saved = advanceSavedCursor(pageIndex, next);
    schedulePersist({
      pageIndex: saved.pageIndex,
      charIndex: saved.charIndex,
      segmentActiveMs: segmentRef.current.activeMs,
      segmentCorrect: segmentRef.current.correctKeystrokes,
      segmentErrors: segmentRef.current.errorKeystrokes,
      letterCorrect: segmentRef.current.letterCorrect,
      letterWrong: segmentRef.current.letterWrong,
    });
  }

  function onMetrics(m) {
    segmentRef.current = {
      activeMs: m.activeMs || 0,
      correctKeystrokes: m.correctKeystrokes || 0,
      errorKeystrokes: m.errorKeystrokes || 0,
      letterCorrect: m.letterCorrect || 0,
      letterWrong: m.letterWrong || 0,
    };
    setLiveMetrics(m);
  }

  async function onPageComplete(stats) {
    setPageCompleteStats(stats);
    const saved = advanceSavedCursor(pageIndex, pageText.length);
    await persist({
      pageIndex: saved.pageIndex,
      charIndex: saved.charIndex,
      segmentActiveMs: stats.activeMs || 0,
      segmentCorrect: stats.correctKeystrokes || 0,
      segmentErrors: stats.errorKeystrokes || 0,
      letterCorrect: stats.letterCorrect || 0,
      letterWrong: stats.letterWrong || 0,
      completed: false,
      commitSegment: true,
    });
    segmentRef.current = {
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      letterCorrect: 0,
      letterWrong: 0,
    };
  }

  function goPrevPage() {
    if (pageIndex <= 0) return;
    const prev = pageIndex - 1;
    const prevLen = String(pages[prev]?.text || '').length;
    // Local review only — do not write an earlier cursor to saved progress.
    setPageIndex(prev);
    setCharIndex(prevLen);
    setPageCompleteStats({ wpm: liveMetrics.wpm || 0, activeMs: 0 });
    segmentRef.current = {
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      letterCorrect: 0,
      letterWrong: 0,
    };
  }

  async function goNextPage() {
    if (!pageDone) return;
    const isLast = pageIndex >= pages.length - 1;
    if (isLast) {
      const saved = advanceSavedCursor(pageIndex, pageText.length);
      await persist({
        pageIndex: saved.pageIndex,
        charIndex: saved.charIndex,
        segmentActiveMs: 0,
        segmentCorrect: 0,
        segmentErrors: 0,
        completed: true,
        endSession: true,
      });
      setMode('read');
      return;
    }

    const next = pageIndex + 1;
    const hw = highWaterRef.current;
    let nextChar = 0;
    let doneAlready = false;

    if (next < hw.pageIndex) {
      nextChar = String(pages[next]?.text || '').length;
      doneAlready = true;
    } else if (next === hw.pageIndex) {
      nextChar = hw.charIndex;
      doneAlready = nextChar >= String(pages[next]?.text || '').length;
    } else {
      const saved = advanceSavedCursor(next, 0);
      await persist({
        pageIndex: saved.pageIndex,
        charIndex: saved.charIndex,
        segmentActiveMs: 0,
        segmentCorrect: 0,
        segmentErrors: 0,
      });
      nextChar = 0;
      doneAlready = false;
    }

    setPageIndex(next);
    setCharIndex(nextChar);
    setPageCompleteStats(doneAlready ? { wpm: 0, activeMs: 0 } : null);
    segmentRef.current = {
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      letterCorrect: 0,
      letterWrong: 0,
    };
  }

  if (mode === 'pick' || !classicId) {
    return (
      <div
        className={`flex h-full min-h-0 w-full flex-col gap-4 overflow-auto ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Type a Classic</h2>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Rewrite a classic page by page. Your place is saved so you can pick up later.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLASSICS_CATALOG.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => openClassic(book.id)}
              className={`edu-control text-left overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} hover:opacity-95`}
            >
              <div className={`aspect-[3/4] w-full overflow-hidden ${theme.colorSurfaceVariant}`}>
                <img
                  src={book.coverImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{book.title}</p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{book.author}</p>
                {book.ageBand ? (
                  <p className={`${TYPE.labelSm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                    {book.ageBand} · {book.pages.length} pages
                  </p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={`flex h-full items-center justify-center ${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Loading your place…</p>
      </div>
    );
  }

  if (mode === 'read') {
    const cumWpm = computeWpm(progress?.correctKeystrokes || 0, progress?.activeMs || 0);
    return (
      <div
        className={`flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" className={toolBtn} onClick={backToPicker}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Books
          </button>
          <h2 className={`${TYPE.titleSm} flex-1 ${theme.colorOnSurface}`}>{classic.title}</h2>
          <button type="button" className={toolBtn} onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Type again
          </button>
        </div>
        <div className={`rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}>
          <TypingStats
            theme={theme}
            wpm={cumWpm}
            activeMs={progress?.activeMs || 0}
            correctKeystrokes={progress?.correctKeystrokes || 0}
            errorKeystrokes={progress?.errorKeystrokes || 0}
          />
          <p className={`${TYPE.labelSm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Total time {formatActiveTime(progress?.activeMs || 0)} · You finished the book — read it below.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto space-y-6 pr-1">
          {pages.map((p) => (
            <article key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              {p.image ? (
                <img
                  src={p.image}
                  alt=""
                  className="w-full max-w-[14rem] rounded-xl object-contain mx-auto sm:mx-0"
                />
              ) : null}
              <p className={`${TYPE.bodyMd} whitespace-pre-wrap ${theme.colorOnSurface}`}>{p.text}</p>
            </article>
          ))}
          <p className={`${TYPE.labelSm} pb-4 ${theme.colorOnSurfaceVariant}`}>
            {classic.sourceAttribution}
          </p>
        </div>
      </div>
    );
  }

  // type mode
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" className={toolBtn} onClick={backToPicker}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Books
        </button>
        <div className="min-w-0 flex-1">
          <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>{classic.title}</p>
          <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
            Page {pageIndex + 1} of {pages.length}
          </p>
        </div>
        <TypingStats theme={theme} {...liveMetrics} />
      </div>

      <ProgressBar theme={theme} value={bookProgress} label="Book progress" />

      <div className="min-h-0 flex-1 flex flex-col gap-3 overflow-hidden lg:flex-row">
        {page?.image ? (
          <div className="shrink-0 flex justify-center lg:w-[38%] lg:max-w-sm">
            <img
              src={page.image}
              alt=""
              className="max-h-[28vh] lg:max-h-full w-auto max-w-full object-contain rounded-xl"
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1 flex flex-col gap-2 overflow-auto">
          <TypingPassage
            key={`${classic.id}-${pageIndex}-${passageEpoch}`}
            text={pageText}
            theme={theme}
            initialCharIndex={charIndex}
            onProgress={onPassageProgress}
            onMetrics={onMetrics}
            onComplete={onPageComplete}
            className={`${theme.colorSurfaceVariant} ${theme.colorOutline} border-[1.5px]`}
          />
          {pageCompleteStats && pageCompleteStats.activeMs > 0 ? (
            <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
              Nice page · {Math.round(pageCompleteStats.wpm || 0)} WPM ·{' '}
              {formatActiveTime(pageCompleteStats.activeMs || 0)}
            </p>
          ) : (
            <SpecialtyShortcutsHint text={pageText} theme={theme} />
          )}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className={toolBtn}
              onClick={goPrevPage}
              disabled={pageIndex <= 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
            <button
              type="button"
              className={`${toolBtn} ${
                pageDone
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={goNextPage}
              disabled={!pageDone}
              aria-label={pageIndex >= pages.length - 1 ? 'Finish book' : 'Next page'}
            >
              {pageIndex >= pages.length - 1 ? (
                <>
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Read it
                </>
              ) : (
                <>
                  Forward
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
            <button
              type="button"
              className={`${toolBtn} ${
                showKeyboard ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
              }`}
              onClick={toggleKeyboard}
              aria-pressed={showKeyboard}
              aria-label={showKeyboard ? 'Hide keyboard' : 'Show keyboard'}
              title={showKeyboard ? 'Hide keyboard' : 'Show keyboard'}
            >
              <Keyboard className="h-4 w-4" aria-hidden />
              Keyboard
            </button>
          </div>
          <TypingKeyboard theme={theme} visible={showKeyboard} />
        </div>
      </div>
      <p className={`${TYPE.labelSm} shrink-0 ${theme.colorOnSurfaceVariant}`}>
        {classic.sourceAttribution}
      </p>
    </div>
  );
}
