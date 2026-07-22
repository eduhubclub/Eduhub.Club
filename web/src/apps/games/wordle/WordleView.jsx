import { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, RotateCcw, Settings2 } from 'lucide-react';
import { ButtonRow } from '../../../shared/ButtonRow';
import { APP_STATIC_BOARD, APP_STAGE_PAD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { fetchDefinition } from './definitions';
import { HEART_WORDS, pickRandomWord, wordsForLength } from './wordBank';
import {
  KEYBOARD_ROWS,
  evaluateGuess,
  maxGuessesForLength,
  mergeKeyStatuses,
} from './wordleLogic';
import { WordleSettingsModal } from './WordleSettingsModal';

const STORAGE_KEY = 'eduHub.games.wordle.wordLength';

function loadWordLength() {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY));
    if (n >= 2 && n <= 8 && wordsForLength(n).length) return n;
  } catch {
    /* ignore */
  }
  return 5;
}

function statusTileClass(status, isDarkMode) {
  if (status === 'correct') return 'bg-emerald-500 text-white border-emerald-600';
  if (status === 'present') return 'bg-amber-400 text-slate-900 border-amber-500';
  if (status === 'absent') {
    return isDarkMode
      ? 'bg-slate-700 text-slate-300 border-slate-600'
      : 'bg-slate-300 text-slate-700 border-slate-400';
  }
  return isDarkMode
    ? 'bg-slate-900 text-white border-slate-600'
    : 'bg-white text-slate-900 border-slate-300';
}

function keyClass(status, isDarkMode) {
  if (status === 'correct') return 'bg-emerald-500 text-white';
  if (status === 'present') return 'bg-amber-400 text-slate-900';
  if (status === 'absent') {
    return isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-300 text-slate-600';
  }
  return isDarkMode
    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300';
}

/**
 * Classroom Wordle — high-frequency & heart words, adjustable length 2–8.
 */
export function WordleView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const toolBtn = toolBtnClass(isDarkMode);

  const [wordLength, setWordLength] = useState(loadWordLength);
  const [answer, setAnswer] = useState(() => pickRandomWord(loadWordLength()) || 'said');
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState('');
  const [keyStatuses, setKeyStatuses] = useState({});
  const [status, setStatus] = useState(/** @type {'playing' | 'won' | 'lost'} */ ('playing'));
  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const maxGuesses = maxGuessesForLength(wordLength);
  const bank = useMemo(() => new Set(wordsForLength(wordLength)), [wordLength]);
  const isHeart = HEART_WORDS.has(answer);

  const startNewGame = useCallback(
    (len = wordLength) => {
      const next = pickRandomWord(len);
      if (!next) {
        setMessage(`No ${len}-letter words in the bank.`);
        return;
      }
      setAnswer(next);
      setGuesses([]);
      setCurrent('');
      setKeyStatuses({});
      setStatus('playing');
      setMessage('');
      setDefinition(null);
      setDefinitionLoading(false);
      announce('New Wordle puzzle');
    },
    [announce, wordLength],
  );

  const applyLength = (len) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(len));
    } catch {
      /* ignore */
    }
    setWordLength(len);
    startNewGame(len);
  };

  // Load definition when the round ends.
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return undefined;
    let cancelled = false;
    setDefinitionLoading(true);
    fetchDefinition(answer).then((def) => {
      if (cancelled) return;
      setDefinition(def);
      setDefinitionLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [status, answer]);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 1600);
  };

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    if (current.length !== wordLength) {
      flash(`Need ${wordLength} letters`);
      return;
    }
    if (!bank.has(current)) {
      flash('Not in word list');
      announce('Not in word list');
      return;
    }

    const result = evaluateGuess(current, answer);
    const nextGuesses = [...guesses, { word: current, result }];
    setGuesses(nextGuesses);
    setKeyStatuses((prev) => mergeKeyStatuses(prev, current, result));
    setCurrent('');

    if (current === answer) {
      setStatus('won');
      announce(`Correct! The word is ${answer}`);
      return;
    }
    if (nextGuesses.length >= maxGuesses) {
      setStatus('lost');
      announce(`The word was ${answer}`);
      return;
    }
  }, [
    announce,
    answer,
    bank,
    current,
    guesses,
    maxGuesses,
    status,
    wordLength,
  ]);

  const onKey = useCallback(
    (key) => {
      if (status !== 'playing') return;
      if (key === 'enter') {
        submitGuess();
        return;
      }
      if (key === 'back' || key === 'backspace') {
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (!/^[a-z]$/.test(key)) return;
      setCurrent((c) => (c.length < wordLength ? c + key : c));
    },
    [status, submitGuess, wordLength],
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (settingsOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') {
        e.preventDefault();
        onKey('enter');
      } else if (k === 'backspace') {
        e.preventDefault();
        onKey('back');
      } else if (/^[a-z]$/.test(k)) {
        e.preventDefault();
        onKey(k);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKey, settingsOpen]);

  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const rows = Array.from({ length: maxGuesses }, (_, i) => {
    if (guesses[i]) return guesses[i];
    if (i === guesses.length && status === 'playing') {
      return {
        word: current.padEnd(wordLength, ' '),
        result: null,
        isCurrent: true,
      };
    }
    return { word: ' '.repeat(wordLength), result: null };
  });

  const tileSize =
    wordLength <= 4
      ? 'w-10 h-10 sm:w-12 sm:h-12 text-xl'
      : wordLength <= 6
        ? 'w-8 h-8 sm:w-10 sm:h-10 text-lg'
        : 'w-7 h-7 sm:w-9 sm:h-9 text-sm sm:text-base';

  return (
    <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
      <ButtonRow>
        <button type="button" onClick={() => startNewGame()} className={toolBtn}>
          <RotateCcw size={16} strokeWidth={2.5} />
          New word
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={toolBtn}
        >
          <Settings2 size={16} strokeWidth={2.5} />
          Settings
        </button>
      </ButtonRow>

      <div
        className={`relative w-full flex-1 min-h-0 ${APP_STATIC_BOARD} ${surface} flex flex-col overflow-hidden`}
      >
        <div className={`flex-1 min-h-0 flex flex-col gap-2 ${APP_STAGE_PAD} overflow-hidden`}>
          <div className="flex-1 min-h-0 flex flex-row items-center justify-center gap-3 sm:gap-5 overflow-hidden">
            {/* Guess board */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {wordLength} letters · {guesses.length}/{maxGuesses} guesses
                </p>
                {isHeart && status !== 'playing' ? (
                  <span
                    className={`inline-flex items-center gap-1 ${TYPE.labelMicro} ${
                      isDarkMode ? 'text-rose-300' : 'text-rose-500'
                    }`}
                  >
                    <Heart size={12} fill="currentColor" />
                    Heart word
                  </span>
                ) : null}
              </div>

              <div
                className="flex flex-col gap-1"
                role="group"
                aria-label="Guess grid"
              >
                {rows.map((row, ri) => (
                  <div key={ri} className="flex gap-1 justify-center">
                    {Array.from({ length: wordLength }, (_, ci) => {
                      const ch = row.word[ci] === ' ' ? '' : row.word[ci];
                      const st = row.result?.[ci] || null;
                      const filled = Boolean(ch);
                      return (
                        <div
                          key={ci}
                          className={`${tileSize} rounded-lg border-[1.5px] flex items-center justify-center font-bold uppercase transition-colors ${statusTileClass(
                            st,
                            isDarkMode,
                          )} ${
                            !st && filled && row.isCurrent
                              ? isDarkMode
                                ? 'border-slate-400'
                                : 'border-slate-500'
                              : ''
                          }`}
                        >
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <p
                className={`min-h-[1.1rem] text-center ${TYPE.bodySm} ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
                aria-live="polite"
              >
                {message ||
                  (status === 'won'
                    ? 'You got it!'
                    : status === 'lost'
                      ? `The word was ${answer.toUpperCase()}`
                      : '\u00a0')}
              </p>
            </div>

            {/* Keyboard */}
            <div className="flex flex-col justify-center gap-1 min-w-0 shrink">
              {KEYBOARD_ROWS.map((row) => (
                <div
                  key={row.join('-')}
                  className="flex justify-center gap-0.5 sm:gap-1"
                >
                  {row.map((key) => {
                    const wide = key === 'enter' || key === 'back';
                    const label =
                      key === 'enter' ? 'Enter' : key === 'back' ? '⌫' : key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onKey(key)}
                        className={`edu-control h-9 sm:h-10 rounded-md ${TYPE.labelMd} uppercase transition-colors ${
                          wide
                            ? 'px-1.5 sm:px-2.5 min-w-[2.5rem] sm:min-w-[3rem] text-[10px] sm:text-xs'
                            : 'w-6 sm:w-8'
                        } ${keyClass(keyStatuses[key], isDarkMode)}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Definition reveal */}
          {(status === 'won' || status === 'lost') && (
            <div
              className={`w-full shrink-0 rounded-xl border-[1.5px] px-3 py-2.5 max-h-[28%] overflow-y-auto ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <p
                  className={`${TYPE.titleMd} uppercase tracking-wide ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {answer}
                </p>
                {isHeart ? (
                  <Heart
                    size={16}
                    className={isDarkMode ? 'text-rose-300' : 'text-rose-500'}
                    fill="currentColor"
                  />
                ) : null}
              </div>
              {definitionLoading ? (
                <p
                  className={`${TYPE.bodySm} mt-1 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Looking up definition…
                </p>
              ) : definition ? (
                <div className="mt-1 space-y-1">
                  {definition.partOfSpeech ? (
                    <p
                      className={`${TYPE.labelMicro} ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {definition.partOfSpeech}
                    </p>
                  ) : null}
                  <p
                    className={`${TYPE.bodyMd} ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {definition.definition}
                  </p>
                  {definition.example ? (
                    <p
                      className={`${TYPE.bodySm} italic ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      “{definition.example}”
                    </p>
                  ) : null}
                </div>
              ) : (
                <p
                  className={`${TYPE.bodySm} mt-1 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  No definition found — try talking about this word together.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <WordleSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        wordLength={wordLength}
        onApply={applyLength}
      />
    </div>
  );
}
