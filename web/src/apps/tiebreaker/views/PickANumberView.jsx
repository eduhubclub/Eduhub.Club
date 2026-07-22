import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Hash, RotateCcw, Settings2 } from 'lucide-react';
import { ButtonRow } from '../../../shared/ButtonRow';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PRIMARY_KEYS, primaryPalettes } from '../../../shared/theme';
import { APP_STATIC_BOARD_MD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { formatAnnounceList, useAnnounce } from '../../../shared/LiveAnnouncer';

const PLAYER_OPTIONS = [2, 3, 4];

/** Preferred alternate primaries when filling 4 player slots. */
const MARKER_PRIMARY_ORDER = [
  'Blue',
  'Pink',
  'Purple',
  'Amber',
  'Indigo',
  'Orange',
  'Brown',
  'Red',
  'Emerald',
];

function emptyGuesses(count) {
  return Array.from({ length: count }, () => null);
}

/** Which PRIMARY_KEYS entry matches the app theme (if any). */
function findAppPrimaryKey(theme) {
  return (
    PRIMARY_KEYS.find(
      (key) => primaryPalettes[key].colorPrimary === theme.colorPrimary
    ) ?? null
  );
}

/** Four other app primary palettes — never the color chosen for this app. */
function getMarkerPalettes(theme) {
  const exclude = findAppPrimaryKey(theme);
  const pool = PRIMARY_KEYS.filter((key) => key !== exclude);
  const ordered = [
    ...MARKER_PRIMARY_ORDER.filter((key) => pool.includes(key)),
    ...pool.filter((key) => !MARKER_PRIMARY_ORDER.includes(key)),
  ];
  return ordered.slice(0, 4).map((key) => primaryPalettes[key]);
}

function getMarkerStyle(index, theme) {
  const palettes = getMarkerPalettes(theme);
  const palette = palettes[index] ?? palettes[0];
  return `${palette.colorPrimary} ${palette.colorOnPrimary}`;
}

function getChipStyle(index, theme) {
  return getMarkerStyle(index, theme);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function valueFromClientX(clientX, trackEl, range) {
  if (!trackEl) return range.min;
  const rect = trackEl.getBoundingClientRect();
  if (rect.width <= 0) return range.min;
  const t = clamp((clientX - rect.left) / rect.width, 0, 1);
  return Math.round(range.min + t * (range.max - range.min));
}

function percentFromValue(value, range) {
  const span = range.max - range.min;
  if (value === null || span <= 0) return null;
  return clamp(((value - range.min) / span) * 100, 0, 100);
}

/**
 * Pick a random number in a configurable range.
 * With the slider on: people place guesses on the line, then reveal — closest wins.
 */
export function PickANumberView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const [randomNumber, setRandomNumber] = useState(null);
  /** Target marker on the slider — only set when the roll finishes. */
  const [sliderNumber, setSliderNumber] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [range, setRange] = useState({ min: 0, max: 100 });
  const [showSlider, setShowSlider] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempRange, setTempRange] = useState({ min: 0, max: 100 });
  const [tempShowSlider, setTempShowSlider] = useState(true);
  const [tempPlayerCount, setTempPlayerCount] = useState(2);

  /** Player guesses on the number line (null = not placed yet). */
  const [guesses, setGuesses] = useState(() => emptyGuesses(2));
  /** Marker following the pointer until dropped on the line. */
  const [lifted, setLifted] = useState(null);
  // { index, x, y, originValue: number | null }
  const trackRef = useRef(null);
  const liftedRef = useRef(null);
  const suppressCardClickRef = useRef(false);
  const lastWinnerAnnounceRef = useRef('');
  liftedRef.current = lifted;

  const allGuessed = guesses.every((g) => g !== null);

  // Only after the roll finishes — avoid flashing Winner while the number spins.
  const winnerIndexes = useMemo(() => {
    if (isRolling || sliderNumber === null || !allGuessed) return [];
    const distances = guesses.map((g) => Math.abs(g - sliderNumber));
    const best = Math.min(...distances);
    return distances
      .map((d, i) => (d === best ? i : -1))
      .filter((i) => i >= 0);
  }, [isRolling, sliderNumber, allGuessed, guesses]);

  useEffect(() => {
    if (!showSlider || winnerIndexes.length === 0 || sliderNumber === null) {
      if (winnerIndexes.length === 0) lastWinnerAnnounceRef.current = '';
      return;
    }
    const key = `${sliderNumber}:${winnerIndexes.join(',')}`;
    if (lastWinnerAnnounceRef.current === key) return;
    lastWinnerAnnounceRef.current = key;
    const people = formatAnnounceList(winnerIndexes.map((i) => `Person ${i + 1}`));
    announce(
      winnerIndexes.length === 1
        ? `${people} wins. The number was ${sliderNumber}.`
        : `${people} tie. The number was ${sliderNumber}.`,
    );
  }, [showSlider, winnerIndexes, sliderNumber, announce]);

  const rollIntervalRef = useRef(null);

  useEffect(
    () => () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    },
    [],
  );

  const handlePickNumber = () => {
    if (suppressCardClickRef.current) {
      suppressCardClickRef.current = false;
      return;
    }
    if (isRolling) return;
    if (showSlider && !allGuessed) return;

    setIsRolling(true);
    let count = 0;
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = setInterval(() => {
      setRandomNumber(
        Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      );
      count += 1;
      if (count > 10) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
        const final =
          Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        setRandomNumber(final);
        setSliderNumber(final);
        setIsRolling(false);
        if (!showSlider) announce(`The number is ${final}`);
      }
    }, 50);
  };

  const handleReset = () => {
    if (isRolling) return;
    lastWinnerAnnounceRef.current = '';
    setGuesses(emptyGuesses(playerCount));
    setRandomNumber(null);
    setSliderNumber(null);
    setLifted(null);
  };

  const openSettings = () => {
    setTempRange({ ...range });
    setTempShowSlider(showSlider);
    setTempPlayerCount(playerCount);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    const min = parseInt(tempRange.min, 10);
    const max = parseInt(tempRange.max, 10);
    if (!Number.isNaN(min) && !Number.isNaN(max) && max > min) {
      const rangeChanged = min !== range.min || max !== range.max;
      const count = PLAYER_OPTIONS.includes(tempPlayerCount) ? tempPlayerCount : 2;
      const countChanged = count !== playerCount;
      setRange({ min, max });
      setShowSlider(tempShowSlider);
      setPlayerCount(count);
      setIsSettingsOpen(false);
      if (rangeChanged || countChanged || !tempShowSlider) {
        setRandomNumber(null);
        setSliderNumber(null);
        setGuesses(emptyGuesses(count));
      }
    }
  };

  const isOverTrack = (clientX, clientY) => {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return false;
    const padY = 48;
    return (
      clientX >= track.left &&
      clientX <= track.right &&
      clientY >= track.top - padY &&
      clientY <= track.bottom + padY
    );
  };

  const pickUpMarker = (index, e, originValue) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRolling) return;
    // Lift off the line so it follows the pointer freely until dropped
    if (originValue !== null) {
      setGuesses((prev) => {
        const copy = [...prev];
        copy[index] = null;
        return copy;
      });
    }
    setLifted({
      index,
      x: e.clientX,
      y: e.clientY,
      originValue,
    });
  };

  useEffect(() => {
    if (!lifted) return undefined;

    const onMove = (e) => {
      setLifted((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
      );
    };

    const onUp = (e) => {
      const current = liftedRef.current;
      if (!current) return;

      if (isOverTrack(e.clientX, e.clientY)) {
        const next = valueFromClientX(e.clientX, trackRef.current, range);
        setGuesses((prev) => {
          const copy = [...prev];
          copy[current.index] = next;
          return copy;
        });
      } else if (current.originValue !== null) {
        // Dropped away from the line — restore previous placement
        setGuesses((prev) => {
          const copy = [...prev];
          copy[current.index] = current.originValue;
          return copy;
        });
      }
      // Block only the ghost click from this pointer gesture (not the next intentional tap).
      suppressCardClickRef.current = true;
      window.setTimeout(() => {
        suppressCardClickRef.current = false;
      }, 50);
      setLifted(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [lifted !== null, range]);

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';

  const span = range.max - range.min;
  const sliderPercent =
    sliderNumber === null || span <= 0
      ? null
      : Math.min(100, Math.max(0, ((sliderNumber - range.min) / span) * 100));

  const toolBtn = toolBtnClass(isDarkMode);

  const canReveal = !showSlider || allGuessed;

  // Group markers that visually overlap (within ~marker diameter on the track).
  const overlapStacks = useMemo(() => {
    const placed = guesses
      .map((value, index) => {
        if (value === null) return null;
        const percent = percentFromValue(value, range);
        if (percent === null) return null;
        return { index, percent };
      })
      .filter(Boolean)
      .sort((a, b) => a.percent - b.percent || a.index - b.index);

    /** % of track width ≈ one 32px marker at typical card sizes */
    const OVERLAP_PCT = 7;
    const clusters = [];
    for (const item of placed) {
      const last = clusters[clusters.length - 1];
      if (
        last &&
        item.percent - last[last.length - 1].percent < OVERLAP_PCT
      ) {
        last.push(item);
      } else {
        clusters.push([item]);
      }
    }

    const stackByIndex = {};
    for (const cluster of clusters) {
      cluster.forEach((item, stackIndex) => {
        stackByIndex[item.index] = {
          stackIndex,
          stackCount: cluster.length,
        };
      });
    }
    return stackByIndex;
  }, [guesses, range]);

  const renderGuessMarker = (index) => {
    const value = guesses[index];
    if (value === null) return null;
    if (lifted?.index === index) return null;
    const left = percentFromValue(value, range);
    if (left === null) return null;
    const isWinner = winnerIndexes.includes(index);
    const { stackIndex = 0, stackCount = 1 } = overlapStacks[index] ?? {};
    // Offset enough that full circles + numbers stay readable when stacked
    const STACK_GAP_PX = 30;
    const marginTop =
      stackCount > 1
        ? (stackIndex - (stackCount - 1) / 2) * STACK_GAP_PX
        : 0;
    const winnerBelow = marginTop > 0;

    return (
      <div
        key={`guess-${index}`}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 touch-none pointer-events-none"
        style={{
          left: `${left}%`,
          marginTop,
          zIndex: 20 + stackIndex,
        }}
      >
        {isWinner ? (
          <span
            className={`absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${TYPE.labelMicro} whitespace-nowrap ${getMarkerStyle(index, theme)} ${
              winnerBelow ? 'top-full mt-1' : 'bottom-full mb-1'
            }`}
          >
            <Crown size={10} strokeWidth={2.5} aria-hidden />
            Winner
          </span>
        ) : null}
        <button
          type="button"
          aria-label={`Person ${index + 1} guess ${value}`}
          onPointerDown={(e) => pickUpMarker(index, e, value)}
          className={`pointer-events-auto w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-black tabular-nums cursor-grab active:cursor-grabbing select-none ${getMarkerStyle(index, theme)}`}
        >
          {value}
        </button>
      </div>
    );
  };

  const liftedPreviewLabel = (() => {
    if (!lifted) return null;
    if (isOverTrack(lifted.x, lifted.y)) {
      return valueFromClientX(lifted.x, trackRef.current, range);
    }
    return lifted.originValue ?? `P${lifted.index + 1}`;
  })();

  const floatingMarker = lifted
    ? createPortal(
        <div
          className="fixed z-[300] pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: lifted.x, top: lifted.y }}
          aria-hidden
        >
          <div
            className={`w-9 h-9 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[11px] font-black tabular-nums scale-110 ${getMarkerStyle(lifted.index, theme)}`}
          >
            {liftedPreviewLabel}
          </div>
        </div>,
        document.body,
      )
    : null;

  const numberLine = showSlider ? (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-4 sm:px-6 pb-2">
        <div className="flex items-center gap-2 sm:gap-3 h-20">
          <span className={`${TYPE.labelMd} tabular-nums shrink-0 ${theme.text}`}>
            {range.min}
          </span>
          {/* Horizontal inset so guess circles at 0%/100% stay inside the card */}
          <div className="relative flex-1 h-full px-5 sm:px-6 flex items-center">
            <div
              ref={trackRef}
              className={`relative w-full h-2 rounded-full ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}
              style={{ touchAction: 'none' }}
            >
              {/* Midpoint tick */}
              <div
                className={`absolute left-1/2 top-1/2 z-[1] h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${theme.colorPrimaryVariant}`}
              />
              {sliderPercent !== null ? (
                <>
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full opacity-40 ${theme.colorPrimary}`}
                    style={{ width: `${sliderPercent}%` }}
                  />
                  <div
                    className={`absolute top-1/2 z-[3] -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 shadow-sm ${theme.colorPrimary} border-white`}
                    style={{ left: `${sliderPercent}%` }}
                    title="Target"
                  />
                </>
              ) : null}
              {guesses.map((_, index) => renderGuessMarker(index))}
            </div>
          </div>
          <span className={`${TYPE.labelMd} tabular-nums shrink-0 ${theme.text}`}>
            {range.max}
          </span>
        </div>
      </div>

      {/* Home base dock for unplaced markers */}
      <div
        className={`py-3 flex items-center justify-center gap-3 border-t ${
          isDarkMode ? 'border-slate-600' : 'border-slate-300'
        }`}
        aria-label="Marker home base"
      >
        {guesses.map((value, index) =>
          value === null && lifted?.index !== index ? (
            <button
              key={`chip-${index}`}
              type="button"
              aria-label={`Place Person ${index + 1} guess`}
              onPointerDown={(e) => pickUpMarker(index, e, null)}
              className={`w-9 h-9 rounded-full shadow-sm flex items-center justify-center ${TYPE.labelMicro} cursor-grab active:cursor-grabbing select-none touch-none ${getChipStyle(index, theme)}`}
            >
              P{index + 1}
            </button>
          ) : (
            <span key={`chip-spacer-${index}`} className="w-9 h-9" aria-hidden />
          )
        )}
      </div>
    </div>
  ) : null;

  const cardShell = `relative ${APP_STATIC_BOARD_MD} items-center justify-center transition-all ${surface}`;

  return (
    <>
      {floatingMarker}
      <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
        <ButtonRow>
          {showSlider ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={isRolling}
              className={`${toolBtn} disabled:opacity-50`}
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              Reset
            </button>
          ) : null}
          <button type="button" onClick={openSettings} className={toolBtn}>
            <Settings2 size={16} strokeWidth={2.5} />
            Settings
          </button>
        </ButtonRow>

        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {showSlider ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handlePickNumber}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePickNumber();
                }
              }}
              aria-disabled={!canReveal || isRolling}
              className={`${cardShell} ${
                canReveal && !isRolling ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="absolute top-5 md:top-6 w-full text-center px-4 z-20 pointer-events-none">
                <h2
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  Pick a number between{' '}
                  <span className={theme.text}>{range.min}</span> and{' '}
                  <span className={theme.text}>{range.max}</span>
                </h2>
              </div>

              <div
                className="absolute inset-x-0 top-12 md:top-14 bottom-[9.75rem] flex items-center justify-center z-10 pointer-events-none"
                style={{ containerType: 'size' }}
              >
                {randomNumber !== null ? (
                  <div
                    className={`font-black tabular-nums leading-none ${theme.text}`}
                    style={{
                      fontSize: 'min(70cqh, 28cqw, 12rem)',
                    }}
                  >
                    {randomNumber}
                  </div>
                ) : (
                  <Hash
                    className="text-slate-200"
                    style={{
                      width: 'min(45cqh, 18cqw, 6rem)',
                      height: 'min(45cqh, 18cqw, 6rem)',
                    }}
                  />
                )}
              </div>

              {numberLine}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePickNumber}
              className={cardShell}
            >
              <div className="absolute top-6 md:top-8 w-full text-center px-4 z-20">
                <h2
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  Pick a number between{' '}
                  <span className={theme.text}>{range.min}</span> and{' '}
                  <span className={theme.text}>{range.max}</span>
                </h2>
              </div>
              <div
                className="absolute inset-0 top-14 bottom-8 flex items-center justify-center"
                style={{ containerType: 'size' }}
              >
                {randomNumber !== null ? (
                  <div
                    className={`font-black tabular-nums leading-none ${theme.text}`}
                    style={{
                      fontSize: 'min(70cqh, 28cqw, 12rem)',
                    }}
                  >
                    {randomNumber}
                  </div>
                ) : (
                  <Hash
                    className="text-slate-200"
                    style={{
                      width: 'min(45cqh, 18cqw, 6rem)',
                      height: 'min(45cqh, 18cqw, 6rem)',
                    }}
                  />
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={isSettingsOpen}
        title="Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={saveSettings}>
              Apply Changes
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {['min', 'max'].map((field) => (
              <div key={field}>
                <label
                  className={`block ${TYPE.titleSm} mb-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {field === 'min' ? 'Minimum' : 'Maximum'}
                </label>
                <input
                  type="number"
                  value={tempRange[field]}
                  onChange={(e) =>
                    setTempRange({ ...tempRange, [field]: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            ))}
          </div>

          <div
            className={`flex items-center justify-between gap-4 pt-4 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            <div className="min-w-0">
              <p
                className={`${TYPE.titleSm} ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Show range slider
              </p>
              <p
                className={`${TYPE.bodySm} mt-1 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Place guesses on the line, then reveal — closest wins
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={tempShowSlider}
              aria-label="Show range slider"
              onClick={() => setTempShowSlider(!tempShowSlider)}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                tempShowSlider
                  ? theme.colorPrimary
                  : isDarkMode
                    ? 'bg-slate-700'
                    : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  tempShowSlider ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {tempShowSlider ? (
            <div>
              <p
                className={`${TYPE.titleSm} mb-1 ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                How many selectors?
              </p>
              <p
                className={`${TYPE.bodySm} mb-4 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                One guess per person on the line — up to 4.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_OPTIONS.map((num) => {
                  const active = tempPlayerCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTempPlayerCount(num)}
                      className={`py-3 px-2 rounded-xl ${TYPE.labelLg} transition-all border-2 ${
                        active
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                          : isDarkMode
                            ? 'bg-slate-800 text-slate-200 border-transparent hover:border-slate-600'
                            : 'bg-slate-50 text-slate-700 border-transparent hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
