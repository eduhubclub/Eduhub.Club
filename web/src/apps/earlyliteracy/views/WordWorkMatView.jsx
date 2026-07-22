import { useEffect, useMemo, useState } from 'react';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { APP_STATIC_BOARD, APP_STAGE_PAD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { SegmentControl } from '../../../shared/SegmentControl';
import {
  MAT_MODES,
  resolveTileKind,
  sectionsForMode,
} from '../wordWorkMatData';

const FULLSCREEN_Z = 'z-[240]';
const EMPTY_SLOTS = 5;

function tileSurface(kind, isDarkMode, { empty = false, inMat = false } = {}) {
  if (empty) {
    return isDarkMode
      ? 'bg-slate-800/60 border-slate-600 border-dashed text-transparent'
      : 'bg-slate-50 border-slate-300 border-dashed text-transparent';
  }

  const base = {
    consonant: isDarkMode
      ? 'bg-sky-900/55 text-sky-50 border-sky-700'
      : 'bg-sky-100 text-sky-950 border-sky-200',
    vowel: isDarkMode
      ? 'bg-amber-900/45 text-amber-50 border-amber-700'
      : 'bg-amber-100 text-amber-950 border-amber-200',
    digraph: isDarkMode
      ? 'bg-emerald-900/50 text-emerald-50 border-emerald-700'
      : 'bg-emerald-100 text-emerald-950 border-emerald-200',
    rcontrolled: isDarkMode
      ? 'bg-amber-900/45 text-amber-50 border-amber-700'
      : 'bg-amber-100 text-amber-950 border-amber-200',
    vowelteam: isDarkMode
      ? 'bg-rose-900/45 text-rose-50 border-rose-700'
      : 'bg-rose-100 text-rose-950 border-rose-200',
    other: isDarkMode
      ? 'bg-slate-700 text-slate-100 border-slate-500'
      : 'bg-white text-slate-800 border-slate-300',
  }[kind];

  const lift = inMat ? 'shadow-md' : 'shadow-sm';
  return `${base} ${lift}`;
}

function MatTile({
  label,
  kind,
  isDarkMode,
  size = 'md',
  empty = false,
  onClick,
  ariaLabel,
  disabled = false,
}) {
  const multi = (label || '').length > 2;
  const sizeClass =
    size === 'lg'
      ? multi
        ? 'min-w-[3.25rem] h-12 sm:min-w-[3.75rem] sm:h-14 text-lg sm:text-xl px-1.5'
        : 'min-w-[2.75rem] h-12 sm:min-w-[3.25rem] sm:h-14 text-xl sm:text-2xl px-1'
      : multi
        ? 'min-w-[2.35rem] h-9 px-1 text-xs sm:text-sm'
        : 'min-w-[2rem] h-9 px-0.5 text-base sm:text-lg';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || empty}
      aria-label={ariaLabel}
      className={`edu-control inline-flex items-center justify-center rounded-xl border-[1.5px] font-bold leading-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${sizeClass} ${tileSurface(
        kind || 'consonant',
        isDarkMode,
        { empty, inMat: size === 'lg' && !empty },
      )} ${
        empty || disabled
          ? 'cursor-default'
          : 'active:scale-95 hover:brightness-[0.98]'
      }`}
    >
      {empty ? '\u00a0' : label}
    </button>
  );
}

/**
 * Word Work Mat — tap tiles to build a word (Beginner / Intermediate banks).
 */
export function WordWorkMatView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const [mode, setMode] = useState('beginner');
  const [placed, setPlaced] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const toolBtn = toolBtnClass(isDarkMode);

  const sections = useMemo(() => sectionsForMode(mode), [mode]);

  const word = useMemo(
    () => placed.map((t) => t.label).join(''),
    [placed],
  );

  useEffect(() => {
    setPlaced([]);
  }, [mode]);

  useEffect(() => {
    if (!word) return;
    announce(word);
  }, [word, announce]);

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

  const addTile = (label, kind) => {
    setPlaced((prev) => [
      ...prev,
      { id: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label, kind },
    ]);
  };

  const removeTile = (id) => {
    setPlaced((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClear = () => setPlaced([]);

  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const matSlots = [
    ...placed,
    ...Array.from({ length: Math.max(EMPTY_SLOTS - placed.length, 1) }, (_, i) => ({
      id: `empty-${i}`,
      empty: true,
    })),
  ];

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
            onClick={handleClear}
            className={`p-2.5 rounded-full shadow-sm transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Clear"
            aria-label="Clear mat"
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

      <div className={`flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 ${APP_STAGE_PAD} overflow-hidden`}>
        {/* My Word */}
        <div
          className={`shrink-0 rounded-xl border-[1.5px] px-3 py-3 sm:px-4 sm:py-4 ${
            isDarkMode
              ? 'border-slate-700 bg-slate-900/40'
              : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p
              className={`${TYPE.labelMicro} ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              My word
            </p>
            {placed.length > 0 ? (
              <button
                type="button"
                onClick={handleClear}
                className={`inline-flex items-center gap-1 ${TYPE.labelMd} ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <RotateCcw size={12} strokeWidth={2.5} />
                Clear
              </button>
            ) : null}
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-14"
            role="group"
            aria-label="My word tiles"
          >
            {matSlots.map((slot) =>
              slot.empty ? (
                <MatTile
                  key={slot.id}
                  label=""
                  kind="consonant"
                  isDarkMode={isDarkMode}
                  size="lg"
                  empty
                  ariaLabel="Empty slot"
                />
              ) : (
                <MatTile
                  key={slot.id}
                  label={slot.label}
                  kind={slot.kind}
                  isDarkMode={isDarkMode}
                  size="lg"
                  onClick={() => removeTile(slot.id)}
                  ariaLabel={`Remove ${slot.label}`}
                />
              ),
            )}
          </div>
          <p
            className={`mt-2 text-center ${TYPE.displaySm} min-h-[2rem] ${
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
                Tap tiles below to build a word
              </span>
            )}
          </p>
        </div>

        {/* Tile banks */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <p
                className={`${TYPE.labelMicro} mb-1.5 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {section.label}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={section.label}
              >
                {section.graphemes.map((g) => {
                  const kind = resolveTileKind(section, g);
                  return (
                    <MatTile
                      key={`${section.id}-${g}`}
                      label={g}
                      kind={kind}
                      isDarkMode={isDarkMode}
                      onClick={() => addTile(g, kind)}
                      ariaLabel={`Add ${g}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
      {!isFullScreen ? (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <SegmentControl
            isDarkMode={isDarkMode}
            theme={theme}
            value={mode}
            onChange={setMode}
            options={MAT_MODES}
          />
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>
      ) : null}

      {isFullScreen && typeof document !== 'undefined'
        ? createPortal(board, document.body)
        : board}
    </div>
  );
}
