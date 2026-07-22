import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Maximize, Minimize, RotateCcw, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ButtonRow } from '../../../shared/ButtonRow';
import { APP_STATIC_BOARD, APP_STAGE_PAD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { LetterCombinationModal } from '../components/LetterCombinationModal';
import {
  blendWord,
  buildColumnsFromSelection,
  createDefaultSelectedKeys,
  emptySelections,
} from '../blendingBoardData';

const FULLSCREEN_Z = 'z-[240]';
/** Pause before logging a stable blended word into the Words created list. */
const WORD_LOG_MS = 550;
const MIN_WORD_LEN = 2;

function tileSurface(kind, isDarkMode, { empty = false, inTray = false } = {}) {
  if (empty) {
    return isDarkMode
      ? 'bg-slate-800/60 border-slate-600 border-dashed text-transparent'
      : 'bg-slate-50 border-slate-300 border-dashed text-transparent';
  }

  const base = {
    consonant: isDarkMode
      ? 'bg-sky-900/55 text-sky-50 border-sky-700'
      : 'bg-sky-100 text-sky-950 border-sky-200',
    coda: isDarkMode
      ? 'bg-emerald-900/50 text-emerald-50 border-emerald-700'
      : 'bg-emerald-100 text-emerald-950 border-emerald-200',
    vowel: isDarkMode
      ? 'bg-amber-900/45 text-amber-50 border-amber-700'
      : 'bg-amber-100 text-amber-950 border-amber-200',
    suffix: isDarkMode
      ? 'bg-rose-900/45 text-rose-50 border-rose-700'
      : 'bg-rose-100 text-rose-950 border-rose-200',
  }[kind];

  const lift = inTray ? 'shadow-md scale-105' : 'shadow-sm';
  return `${base} ${lift}`;
}

function LetterTile({
  label,
  kind,
  isDarkMode,
  depleted = false,
  size = 'md',
  onClick,
  ariaLabel,
}) {
  const emptyVisual = depleted || label === '';
  const multi = label.length > 2;
  const sizeClass =
    size === 'lg'
      ? multi
        ? 'min-w-[3.5rem] h-12 sm:min-w-[4rem] sm:h-14 text-lg sm:text-xl px-1.5'
        : 'min-w-[2.75rem] h-12 sm:min-w-[3.25rem] sm:h-14 text-xl sm:text-2xl px-1'
      : multi
        ? 'min-w-[2.4rem] h-8 sm:min-w-[2.75rem] sm:h-9 text-xs sm:text-sm px-1'
        : 'min-w-[1.85rem] h-8 sm:min-w-[2.15rem] sm:h-9 text-base sm:text-lg px-0.5';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={depleted}
      className={`edu-control inline-flex items-center justify-center rounded-xl border-[1.5px] font-bold leading-none transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${sizeClass} ${tileSurface(
        kind,
        isDarkMode,
        { empty: emptyVisual, inTray: size === 'lg' && !emptyVisual },
      )} ${depleted ? 'opacity-70' : 'hover:brightness-[0.98]'}`}
    >
      {emptyVisual ? '\u00a0' : label}
    </button>
  );
}

/**
 * Letter-block blending board — select one grapheme per column to build a word.
 */
export function BlendingBoardView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const [selectedKeys, setSelectedKeys] = useState(createDefaultSelectedKeys);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [createdWords, setCreatedWords] = useState([]);
  const toolBtn = toolBtnClass(isDarkMode);

  const columns = useMemo(
    () => buildColumnsFromSelection(selectedKeys),
    [selectedKeys],
  );

  const [selections, setSelections] = useState(() => emptySelections(columns));

  // Reset tray picks when the available grapheme set changes.
  useEffect(() => {
    setSelections(emptySelections(columns));
  }, [columns]);

  const word = useMemo(
    () => blendWord(columns, selections),
    [columns, selections],
  );

  useEffect(() => {
    if (!word) return;
    announce(word);
  }, [word, announce]);

  // Log stable words into the side list (word-chain friendly).
  useEffect(() => {
    if (!word || word.length < MIN_WORD_LEN) return undefined;
    const timer = window.setTimeout(() => {
      setCreatedWords((prev) => {
        if (prev[prev.length - 1] === word) return prev;
        return [...prev, word];
      });
    }, WORD_LOG_MS);
    return () => window.clearTimeout(timer);
  }, [word]);

  useEffect(() => {
    if (!isFullScreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullScreen]);

  const selectGrapheme = (columnId, index) => {
    setSelections((prev) => {
      const current = prev[columnId];
      if (current === index) {
        return { ...prev, [columnId]: null };
      }
      return { ...prev, [columnId]: index };
    });
  };

  const clearTraySlot = (columnId) => {
    setSelections((prev) => ({ ...prev, [columnId]: null }));
  };

  const handleClear = () => setSelections(emptySelections(columns));

  const clearCreatedWords = () => setCreatedWords([]);

  const removeCreatedWord = (index) => {
    setCreatedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyCombinations = (nextKeys) => {
    setSelectedKeys(nextKeys);
    announce(`${nextKeys.size} letter combinations selected`);
  };

  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const divider = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  const board = (
    <div
      className={
        isFullScreen
          ? `fixed inset-0 ${FULLSCREEN_Z} flex flex-col overflow-hidden ${surface}`
          : `relative w-full flex-1 min-h-0 ${APP_STATIC_BOARD} ${surface}`
      }
    >
      {isFullScreen ? (
        <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComboOpen(true)}
            className={`p-2.5 rounded-full shadow-sm transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Letter combinations"
            aria-label="Select letter combinations"
          >
            <LayoutGrid size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={`p-2.5 rounded-full shadow-sm transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Clear"
            aria-label="Clear board"
          >
            <RotateCcw size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className={`p-2.5 rounded-full shadow-sm transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Exit Full Screen"
            aria-label="Exit full screen"
          >
            <Minimize size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 flex gap-0 overflow-hidden">
        <div className={`flex-1 min-w-0 min-h-0 flex flex-col gap-3 sm:gap-5 ${APP_STAGE_PAD} overflow-hidden`}>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <p
              className={`${TYPE.labelMicro} ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Blended word
            </p>
            <div
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-12"
              role="group"
              aria-label="Selected letters"
            >
              {columns.map((col) => {
                const idx = selections[col.id];
                const hasPick = idx != null;
                const label = hasPick ? col.graphemes[idx] : '';
                return (
                  <LetterTile
                    key={`tray-${col.id}`}
                    label={label}
                    kind={col.kind}
                    isDarkMode={isDarkMode}
                    size="lg"
                    onClick={() => clearTraySlot(col.id)}
                    ariaLabel={
                      hasPick
                        ? `${col.label}: ${label || 'blank'}. Click to clear.`
                        : `${col.label}: empty`
                    }
                  />
                );
              })}
            </div>
            <p
              className={`text-center ${TYPE.displaySm} min-h-[2rem] ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
              aria-live="polite"
            >
              {word || (
                <span
                  className={`${TYPE.bodyMd} font-normal ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Tap letter blocks to build a word
                </span>
              )}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center overflow-x-auto overflow-y-hidden">
            <div className="flex flex-nowrap items-start justify-center gap-4 sm:gap-6 lg:gap-8 px-1 py-2">
              {columns.map((col) => (
                <div
                  key={col.id}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <p
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {col.label}
                  </p>
                  <div
                    className="grid gap-1 sm:gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${col.cols}, minmax(0, 1fr))`,
                    }}
                    role="group"
                    aria-label={`${col.label} letters`}
                  >
                    {col.graphemes.map((g, index) => {
                      const selected = selections[col.id] === index;
                      return (
                        <LetterTile
                          key={`${col.id}-${index}-${g || 'blank'}`}
                          label={g}
                          kind={col.kind}
                          isDarkMode={isDarkMode}
                          depleted={selected}
                          onClick={() => selectGrapheme(col.id, index)}
                          ariaLabel={
                            g ? `${col.label} ${g}` : `${col.label} blank`
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside
          className={`w-[5.75rem] sm:w-28 shrink-0 flex flex-col border-l min-h-0 ${divider}`}
          aria-label="Words created"
        >
          <div
            className={`flex items-start justify-between gap-1 px-2 pt-3 pb-2 shrink-0 ${
              isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/80'
            }`}
          >
            <p
              className={`${TYPE.labelMicro} leading-tight ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Words
              <br />
              created
            </p>
            {createdWords.length > 0 ? (
              <button
                type="button"
                onClick={clearCreatedWords}
                className={`p-0.5 rounded transition-colors shrink-0 ${
                  isDarkMode
                    ? 'text-slate-500 hover:text-slate-300'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Clear word list"
                aria-label="Clear words created"
              >
                <RotateCcw size={12} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
          <ul className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1">
            {createdWords.length === 0 ? (
              <li
                className={`${TYPE.bodySm} ${
                  isDarkMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                —
              </li>
            ) : (
              createdWords.map((w, index) => (
                <li key={`${w}-${index}`}>
                  <button
                    type="button"
                    onClick={() => removeCreatedWord(index)}
                    title={`Remove ${w}`}
                    aria-label={`Remove ${w}`}
                    className={`group w-full flex items-center justify-between gap-0.5 rounded-lg px-1.5 py-1 text-left transition-colors ${TYPE.titleSm} ${
                      isDarkMode
                        ? 'text-slate-100 hover:bg-slate-800'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate font-bold tracking-wide">{w}</span>
                    <X
                      size={12}
                      strokeWidth={2.5}
                      className={`shrink-0 opacity-0 group-hover:opacity-60 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
      {!isFullScreen ? (
        <ButtonRow>
          <button
            type="button"
            onClick={() => setIsComboOpen(true)}
            className={toolBtn}
          >
            <LayoutGrid size={16} strokeWidth={2.5} />
            Letters
          </button>
          <button type="button" onClick={handleClear} className={toolBtn}>
            <RotateCcw size={16} strokeWidth={2.5} />
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className={toolBtn}
          >
            <Maximize size={16} strokeWidth={2.5} />
            Full Screen
          </button>
        </ButtonRow>
      ) : null}

      {isFullScreen && typeof document !== 'undefined'
        ? createPortal(board, document.body)
        : board}

      <LetterCombinationModal
        isOpen={isComboOpen}
        onClose={() => setIsComboOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        selectedKeys={selectedKeys}
        onApply={handleApplyCombinations}
      />
    </div>
  );
}
