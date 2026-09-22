import { useEffect, useRef, useState } from 'react';
import { TYPE } from '../../../shared/typography';
import { computeAccuracy, computeWpm } from '../../../data/eduType/eduTypeApi';
import {
  EDU_TYPE_SETTINGS_EVENT,
  readAccuracyMode,
  resolveAccuracy,
} from '../../../data/eduType/settings';
import { applySpecialtyKey, specialtyForChar } from './specialtyPunctuation';

const IDLE_MS = 3000;

function matchedLength(target, typed) {
  let i = 0;
  const n = Math.min(target.length, typed.length);
  while (i < n && typed[i] === target[i]) i += 1;
  return i;
}

function letterStats(target, typed) {
  let correct = 0;
  let wrong = 0;
  const n = typed.length;
  for (let i = 0; i < n; i += 1) {
    if (i < target.length && typed[i] === target[i]) correct += 1;
    else wrong += 1;
  }
  return { letterCorrect: correct, letterWrong: wrong };
}

function isFullyCorrect(target, typed) {
  if (typed.length !== target.length || !target.length) return false;
  for (let i = 0; i < target.length; i += 1) {
    if (typed[i] !== target[i]) return false;
  }
  return true;
}

function isPrintableKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key === 'Enter') return true;
  return e.key.length === 1;
}

function expectedChar(target, index) {
  if (index >= target.length) return null;
  return target[index];
}

/** Count consecutive newlines starting at `from` (paragraph breaks kids shouldn't have to Enter through). */
function leadingNewlines(target, from) {
  let i = from;
  while (i < target.length && target[i] === '\n') i += 1;
  return i - from;
}

/**
 * Ghost-fill typing surface: each typed index is marked correct/incorrect on its own
 * (no cascade from earlier typos). Specialty shortcuts e.g. -- → —.
 * Newlines between paragraphs are filled automatically when the next letter is typed.
 */
export function TypingPassage({
  text,
  theme,
  initialCharIndex = 0,
  disabled = false,
  onProgress,
  onComplete,
  onMetrics,
  className = '',
}) {
  const target = String(text || '');
  const startIndex = Math.min(Math.max(0, initialCharIndex), target.length);
  const [typed, setTyped] = useState(() => target.slice(0, startIndex));
  const [pending, setPending] = useState('');
  const [correctKeys, setCorrectKeys] = useState(0);
  const [errorKeys, setErrorKeys] = useState(0);
  const [activeMs, setActiveMs] = useState(0);
  const [focused, setFocused] = useState(false);
  const lastKeyAtRef = useRef(0);
  const completedRef = useRef(false);
  const pendingRef = useRef('');
  const typedRef = useRef(typed);
  const containerRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onMetricsRef = useRef(onMetrics);
  onProgressRef.current = onProgress;
  onCompleteRef.current = onComplete;
  onMetricsRef.current = onMetrics;
  typedRef.current = typed;

  // Reset only when the passage text changes (new page). Parent charIndex updates
  // must not remount/reset mid-typing or focus is lost after the first key.
  useEffect(() => {
    const next = target.slice(0, Math.min(Math.max(0, initialCharIndex), target.length));
    setTyped(next);
    typedRef.current = next;
    pendingRef.current = '';
    setPending('');
    setCorrectKeys(0);
    setErrorKeys(0);
    setActiveMs(0);
    lastKeyAtRef.current = 0;
    completedRef.current = next.length >= target.length && target.length > 0 && isFullyCorrect(target, next);
    // Focus after mount / page change so typing keeps working.
    queueMicrotask(() => containerRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialCharIndex only applied when text changes
  }, [target]);

  const matched = matchedLength(target, typed);
  const done = isFullyCorrect(target, typed);
  const letters = letterStats(target, typed);
  const expect = expectedChar(target, typed.length);
  const expectSpecialty = expect ? specialtyForChar(expect) : null;

  useEffect(() => {
    const keystrokeAccuracy = computeAccuracy(correctKeys, errorKeys);
    const letterAccuracy = resolveAccuracy('letters', letters);
    onMetricsRef.current?.({
      activeMs,
      correctKeystrokes: correctKeys,
      errorKeystrokes: errorKeys,
      letterCorrect: letters.letterCorrect,
      letterWrong: letters.letterWrong,
      keystrokeAccuracy,
      letterAccuracy,
      wpm: computeWpm(correctKeys, activeMs),
      accuracy: keystrokeAccuracy,
      matched,
    });
    onProgressRef.current?.({ charIndex: matched, done });
  }, [typed, correctKeys, errorKeys, activeMs, matched, done, letters.letterCorrect, letters.letterWrong]);

  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      const keystrokeAccuracy = computeAccuracy(correctKeys, errorKeys);
      onCompleteRef.current?.({
        activeMs,
        correctKeystrokes: correctKeys,
        errorKeystrokes: errorKeys,
        letterCorrect: letters.letterCorrect,
        letterWrong: letters.letterWrong,
        keystrokeAccuracy,
        letterAccuracy: resolveAccuracy('letters', letters),
        wpm: computeWpm(correctKeys, activeMs),
        accuracy: keystrokeAccuracy,
      });
    }
  }, [done, activeMs, correctKeys, errorKeys, letters.letterCorrect, letters.letterWrong]);

  function bumpActive() {
    const now = Date.now();
    const last = lastKeyAtRef.current;
    if (last > 0) {
      const delta = now - last;
      if (delta > 0 && delta < IDLE_MS) {
        setActiveMs((ms) => ms + delta);
      }
    }
    lastKeyAtRef.current = now;
  }

  function setPendingBoth(value) {
    pendingRef.current = value;
    setPending(value);
  }

  function commitTyped(next) {
    typedRef.current = next;
    setTyped(next);
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Tab') return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      bumpActive();
      if (pendingRef.current) {
        setPendingBoth(pendingRef.current.slice(0, -1));
        return;
      }
      if (!typedRef.current.length) return;
      commitTyped(typedRef.current.slice(0, -1));
      completedRef.current = false;
      return;
    }

    if (!isPrintableKey(e)) return;
    e.preventDefault();
    if (done) return;

    const ch = e.key === 'Enter' ? '\n' : e.key;
    bumpActive();
    const current = typedRef.current;
    let at = current.length;
    let prefix = '';

    // Auto-advance through paragraph breaks when typing the next real character.
    if (ch !== '\n' && expectedChar(target, at) === '\n') {
      const skip = leadingNewlines(target, at);
      if (skip > 0) {
        prefix = '\n'.repeat(skip);
        at += skip;
      }
    }

    const nextExpect = expectedChar(target, at);

    if (nextExpect != null && ch === nextExpect) {
      setPendingBoth('');
      setCorrectKeys((n) => n + 1);
      commitTyped(current + prefix + ch);
      return;
    }

    if (nextExpect != null && specialtyForChar(nextExpect)) {
      const result = applySpecialtyKey(nextExpect, pendingRef.current, ch);
      if (result.correct && result.insert) {
        setPendingBoth('');
        setCorrectKeys((n) => n + 1);
        commitTyped(current + prefix + result.insert);
        return;
      }
      if (!result.error) {
        setPendingBoth(result.pending);
        return;
      }
      const bad = `${pendingRef.current}${ch}`;
      setPendingBoth('');
      setErrorKeys((n) => n + 1);
      commitTyped(current + prefix + bad);
      return;
    }

    if (nextExpect == null) {
      setPendingBoth('');
      setErrorKeys((n) => n + 1);
      commitTyped(current + ch);
      return;
    }

    setPendingBoth('');
    setErrorKeys((n) => n + 1);
    commitTyped(current + (prefix || '') + ch);
  }

  const ghost = theme.colorOnSurfaceVariant || 'text-slate-400';
  const ink = theme.colorOnSurface || 'text-slate-900';
  let caretAt = typed.length;
  if (!pending) {
    while (caretAt < target.length && target[caretAt] === '\n') caretAt += 1;
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="textbox"
      aria-multiline="true"
      aria-label="Typing passage"
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => containerRef.current?.focus()}
      className={`edu-control w-full min-h-[8rem] outline-none rounded-xl p-3 sm:p-4 ${TYPE.bodyMd} leading-relaxed whitespace-pre-wrap break-words cursor-text ${
        focused ? 'ring-2 ring-violet-500/60 ring-offset-1' : ''
      } ${className}`}
    >
      {target.split('').map((ch, i) => {
        const typedCh = typed[i];
        const isCaret = !pending && i === caretAt && typedCh == null;
        const isPendingCaret = i === typed.length && Boolean(pending);

        if (typedCh == null) {
          return (
            <span
              key={i}
              className={`${ghost} opacity-50 ${
                isCaret && focused ? 'border-l-2 border-current pl-0.5 -ml-0.5' : ''
              }`}
            >
              {ch === ' ' ? '\u00a0' : ch}
              {isPendingCaret ? (
                <span
                  className={`ml-0.5 rounded-sm px-0.5 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                >
                  {pending}
                </span>
              ) : null}
            </span>
          );
        }

        const accurate = typedCh === ch;
        if (accurate) {
          return (
            <span key={i} className={ink}>
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          );
        }

        return (
          <span
            key={i}
            className="rounded-sm bg-red-500/80 text-white px-[0.05em]"
            aria-invalid="true"
          >
            {typedCh === ' ' ? '\u00a0' : typedCh}
          </span>
        );
      })}
      {typed.length > target.length
        ? typed.slice(target.length).split('').map((ch, i) => (
            <span
              key={`extra-${i}`}
              className="rounded-sm bg-red-500/80 text-white px-[0.05em]"
            >
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          ))
        : null}
      {typed.length === target.length && pending ? (
        <span className={`rounded-sm px-0.5 ${theme.colorPrimary} ${theme.colorOnPrimary}`}>
          {pending}
        </span>
      ) : null}
      {!target.length ? (
        <span className={`${ghost} opacity-60`}>Nothing to type.</span>
      ) : null}
      {pending && expectSpecialty && focused ? (
        <span className="sr-only">
          Shortcut in progress for {expectSpecialty.name}: typed {pending}, need{' '}
          {expectSpecialty.shortcut}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Compact WPM / time / accuracy strip.
 * Accuracy mode comes from Edu.Type settings (wrong keys vs letters).
 */
export function TypingStats({
  wpm = 0,
  activeMs = 0,
  correctKeystrokes = 0,
  errorKeystrokes = 0,
  letterCorrect = 0,
  letterWrong = 0,
  keystrokeAccuracy,
  letterAccuracy,
  accuracy,
  theme,
}) {
  const [mode, setMode] = useState(readAccuracyMode);

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail?.accuracyMode) setMode(e.detail.accuracyMode);
      else setMode(readAccuracyMode());
    };
    window.addEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
  }, []);

  const displayAccuracy =
    mode === 'letters'
      ? (letterAccuracy ??
        resolveAccuracy('letters', { letterCorrect, letterWrong }))
      : (keystrokeAccuracy ??
        resolveAccuracy('keystroke', { correctKeystrokes, errorKeystrokes }) ??
        accuracy ??
        1);

  const pct = Math.round((displayAccuracy || 0) * 100);
  const totalSec = Math.max(0, Math.round((activeMs || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const timeLabel = m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;

  return (
    <div className={`flex flex-wrap gap-3 ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
      <span>
        <span className={`font-semibold ${theme.colorOnSurface}`}>{Math.round(wpm) || 0}</span> WPM
      </span>
      <span>
        <span className={`font-semibold ${theme.colorOnSurface}`}>{timeLabel}</span> time
      </span>
      <span>
        <span className={`font-semibold ${theme.colorOnSurface}`}>{pct}%</span> accuracy
      </span>
    </div>
  );
}
