import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccessibilityPreferences } from '../../data/settings/AccessibilityPreferencesContext';
import {
  BUMPER_FINAL_INDEX,
  BUMPER_SLIDER_CHS,
  BUMPER_WORDS,
} from './bumperApps';
import './BrandBumper.css';

const SCROLL_SETTLE_PX = 40;
const WORD_MS = 1800;
const REEL_MS = 600;
/** Soft mask only — keep tiny so it doesn’t eat the centered word. */
const EDGE_FADE_PX = 3;

/** Pixel row height — same value for window, word, and translate (no em drift). */
function useRowPx() {
  const [rowPx, setRowPx] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
      ? 48
      : 36
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setRowPx(mq.matches ? 48 : 36);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return rowPx;
}

/**
 * Overview title bumper → static Edu.BrandGuidelines.
 * Vertical reel in a hard-clipped window; index steps move the strip in px.
 */
export function BrandBumper({ isDarkMode }) {
  const { reduceMotion } = useAccessibilityPreferences();
  const rowPx = useRowPx();
  const [phase, setPhase] = useState(() => (reduceMotion ? 'settled' : 'playing'));
  const [reelIndex, setReelIndex] = useState(() =>
    reduceMotion ? BUMPER_FINAL_INDEX : 0
  );

  const settledRef = useRef(reduceMotion);
  const indexRef = useRef(reduceMotion ? BUMPER_FINAL_INDEX : 0);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const goTo = useCallback((next) => {
    indexRef.current = next;
    setReelIndex(next);
  }, []);

  const settle = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    clearTimers();
    goTo(BUMPER_FINAL_INDEX);
    schedule(() => setPhase('settled'), REEL_MS);
  }, [clearTimers, goTo, schedule]);

  useEffect(() => {
    if (reduceMotion || phase !== 'playing') return undefined;

    settledRef.current = false;
    indexRef.current = 0;
    setReelIndex(0);

    const startId = setTimeout(() => {
      let current = 0;
      const tick = () => {
        if (settledRef.current) return;
        const next = current + 1;
        if (next > BUMPER_FINAL_INDEX) {
          settle();
          return;
        }
        goTo(next);
        current = next;

        if (next === BUMPER_FINAL_INDEX) {
          schedule(() => {
            settledRef.current = true;
            setPhase('settled');
          }, 1000);
          return;
        }
        schedule(tick, WORD_MS);
      };
      schedule(tick, WORD_MS);
    }, 1400);

    timers.current.push(startId);
    return () => clearTimers();
  }, [phase, reduceMotion, goTo, settle, clearTimers, schedule]);

  useEffect(() => {
    if (reduceMotion || phase === 'settled') return undefined;

    const main = document.getElementById('main-content');
    if (!main) return undefined;

    // Do not call on mount — avoids settling from a restored scroll position.
    const onScroll = () => {
      if (main.scrollTop >= SCROLL_SETTLE_PX) settle();
    };

    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [phase, reduceMotion, settle]);

  useEffect(() => {
    if (!reduceMotion) return;
    settledRef.current = true;
    clearTimers();
    goTo(BUMPER_FINAL_INDEX);
    setPhase('settled');
  }, [reduceMotion, clearTimers, goTo]);

  const prefixClass = isDarkMode ? 'text-stone-100' : 'text-slate-900';
  const isSettled = phase === 'settled';

  return (
    <h1
      className={`edu-bumper-stage${isSettled ? ' is-settled' : ' is-playing'}`}
      style={{ '--bumper-row': `${rowPx}px`, '--bumper-edge-fade': `${EDGE_FADE_PX}px` }}
      aria-label="Edu.BrandGuidelines"
    >
      <div className="edu-bumper-cluster" style={{ height: rowPx }}>
        <svg
          viewBox="0 0 44 44"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className="edu-bumper-svg"
          style={{ width: rowPx, height: rowPx }}
          aria-hidden
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            className="text-rose-500 edu-bumper-shape edu-bumper-shape-1"
          />
          <path
            d="M34 2 L42 18 H26 L34 2 Z"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            className="text-amber-500 edu-bumper-shape edu-bumper-shape-2"
          />
          <rect
            x="2"
            y="26"
            width="16"
            height="16"
            rx="3"
            className="text-emerald-500 edu-bumper-shape edu-bumper-shape-3"
          />
          <path
            d="M34 26 C 40 26, 42 32, 39 36 C 34 41, 27 37, 28 31 C 29 27, 38 30, 37 34 C 36 38, 30 37, 31 32 C 32 28, 37 31, 34 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sky-500 edu-bumper-shape edu-bumper-shape-4"
          />
        </svg>

        <div className="edu-bumper-text" style={{ height: rowPx, fontSize: rowPx }}>
          <span className={`edu-bumper-prefix ${prefixClass}`}>Edu.</span>
          <div
            className="edu-bumper-window"
            style={{
              width: `${BUMPER_SLIDER_CHS}ch`,
              height: rowPx,
            }}
            aria-live="polite"
          >
            <div
              className="edu-bumper-reel"
              style={{
                transform: `translateY(${-reelIndex * rowPx}px)`,
                transition:
                  isSettled || reduceMotion
                    ? 'none'
                    : `transform ${REEL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              {BUMPER_WORDS.map((app) => (
                <span
                  key={app.name}
                  className={`edu-bumper-word ${app.colorClass}`}
                  style={{
                    height: rowPx,
                    maxHeight: rowPx,
                    lineHeight: `${rowPx}px`,
                    fontSize: rowPx,
                  }}
                >
                  {app.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </h1>
  );
}
