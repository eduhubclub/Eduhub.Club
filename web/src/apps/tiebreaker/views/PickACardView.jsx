import { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Settings2 } from 'lucide-react';
import { ButtonRow } from '../../../shared/ButtonRow';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { LogoIcon2x2 } from '../../../shared/Logo';
import { APP_EMPTY_SLOT, APP_STATIC_BOARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { formatAnnounceList, useAnnounce } from '../../../shared/LiveAnnouncer';

const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, i) => [rank, i]));
const PLAYER_OPTIONS = [2, 3, 4];
const WIN_MODES = [
  { id: 'highest', label: 'Highest wins' },
  { id: 'lowest', label: 'Lowest wins' },
];
const FLIP_MS = 700;
const DEAL_MS = 450;
const GAP_REM = 1.25;

function emptyPiles(count) {
  return Array.from({ length: count }, () => null);
}

function drawRandomCard(isDarkMode) {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const isRed = suit === '♥' || suit === '♦';
  const color = isRed ? 'text-rose-500' : isDarkMode ? 'text-slate-100' : 'text-slate-800';
  return { rank, suit, color, id: `${rank}${suit}-${Date.now()}` };
}

/** Winning person indexes (ties included). Ace is high. */
function getWinnerIndexes(piles, winMode) {
  if (!piles.length || piles.some((c) => !c)) return [];
  const scores = piles.map((card, index) => ({
    index,
    value: RANK_VALUE[card.rank] ?? 0,
  }));
  const best =
    winMode === 'lowest'
      ? Math.min(...scores.map((s) => s.value))
      : Math.max(...scores.map((s) => s.value));
  return scores.filter((s) => s.value === best).map((s) => s.index);
}

/** Typography scales with how many cards share the row (draw + people). */
function getCardSize(playerCount) {
  const slots = playerCount + 1;
  if (slots <= 3) {
    return {
      maxRem: 12,
      rank: 'text-3xl sm:text-4xl',
      suit: 'text-6xl sm:text-7xl',
      logo: 'w-14 h-14 sm:w-16 sm:h-16',
      pad: 'p-3 sm:p-3.5',
    };
  }
  if (slots === 4) {
    return {
      maxRem: 10,
      rank: 'text-2xl sm:text-3xl',
      suit: 'text-5xl sm:text-6xl',
      logo: 'w-12 h-12 sm:w-14 sm:h-14',
      pad: 'p-2.5 sm:p-3',
    };
  }
  return {
    maxRem: 8.5,
    rank: 'text-xl sm:text-2xl',
    suit: 'text-4xl sm:text-5xl',
    logo: 'w-11 h-11 sm:w-12 sm:h-12',
    pad: 'p-2 sm:p-2.5',
  };
}

function cardWidthStyle(playerCount, size) {
  const slots = playerCount + 1;
  const gaps = (slots - 1) * GAP_REM;
  return {
    width: `min(${size.maxRem}rem, calc((100% - ${gaps}rem) / ${slots}))`,
  };
}

function CardBack({ theme, size }) {
  return (
    <div
      className={`absolute inset-0 rounded-2xl border-4 flex flex-col items-center justify-center shadow-md ${theme.colorPrimary} ${theme.border} ${theme.colorOnPrimary}`}
      style={{ backfaceVisibility: 'hidden' }}
    >
      <LogoIcon2x2 monochrome className={`${size.logo} text-white`} />
    </div>
  );
}

function CardFace({ card, isDarkMode, size }) {
  if (!card) return null;
  return (
    <div
      className={`absolute inset-0 rounded-2xl border-4 flex flex-col justify-between shadow-md ${size.pad} ${
        isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-200'
      }`}
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
    >
      <div className={`${size.rank} font-black leading-none ${card.color}`}>{card.rank}</div>
      <div className={`${size.suit} self-center leading-none ${card.color}`}>{card.suit}</div>
      <div className={`${size.rank} font-black self-end rotate-180 leading-none ${card.color}`}>
        {card.rank}
      </div>
    </div>
  );
}

function SettledCard({ card, theme, isDarkMode, size, personLabel }) {
  if (!card) {
    return (
      <div
        className={`w-full h-full ${APP_EMPTY_SLOT} flex items-center justify-center ${
          isDarkMode
            ? 'border-slate-600 bg-slate-800/40'
            : 'border-slate-300 bg-slate-50'
        }`}
      >
        <span
          className={`${TYPE.labelMicro} ${
            isDarkMode ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          {personLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div
        className={`absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border-4 ${
          isDarkMode
            ? 'bg-slate-800 border-slate-600'
            : `${theme.colorPrimaryContainer} border-transparent`
        }`}
        aria-hidden
      />
      <div
        className={`relative w-full h-full rounded-2xl border-4 flex flex-col justify-between shadow-md ${size.pad} ${
          isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`${size.rank} font-black leading-none ${card.color}`}>{card.rank}</div>
        <div className={`${size.suit} self-center leading-none ${card.color}`}>{card.suit}</div>
        <div className={`${size.rank} font-black self-end rotate-180 leading-none ${card.color}`}>
          {card.rank}
        </div>
      </div>
    </div>
  );
}

function PersonSlot({
  index,
  card,
  emphasize,
  isWinner,
  theme,
  isDarkMode,
  size,
  widthStyle,
}) {
  return (
    <div className="relative z-0 flex flex-col items-center gap-3 shrink-0" style={widthStyle}>
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${TYPE.labelMicro} ${
          isWinner
            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
            : 'invisible'
        }`}
        aria-hidden={!isWinner}
      >
        <Crown size={12} strokeWidth={2.5} aria-hidden />
        Winner
        <Crown size={12} strokeWidth={2.5} aria-hidden />
      </span>
      <div
        className={`relative w-full aspect-[5/7] transition-transform duration-300 ${
          emphasize || isWinner ? 'scale-105' : ''
        }`}
      >
        <SettledCard
          card={card}
          theme={theme}
          isDarkMode={isDarkMode}
          size={size}
          personLabel={`Person ${index + 1}`}
        />
      </div>
    </div>
  );
}

/**
 * Draw cards for 2–4 people: flip from the draw pile, then deal into each slot.
 * Layout: one centered horizontal row — draw pile, then Person 1…N.
 */
export function PickACardView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const [playerCount, setPlayerCount] = useState(2);
  const [tempPlayerCount, setTempPlayerCount] = useState(2);
  const [winMode, setWinMode] = useState('highest'); // highest | lowest
  const [tempWinMode, setTempWinMode] = useState('highest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [piles, setPiles] = useState(() => emptyPiles(2));
  const [flightCard, setFlightCard] = useState(null);
  const [flightTarget, setFlightTarget] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | flipping | dealing
  const [flipRotation, setFlipRotation] = useState(0);
  const lastWinnerAnnounceRef = useRef('');
  const drawTimersRef = useRef([]);

  const clearDrawTimers = () => {
    drawTimersRef.current.forEach((id) => window.clearTimeout(id));
    drawTimersRef.current = [];
  };

  useEffect(() => () => clearDrawTimers(), []);

  const isBusy = phase !== 'idle';
  const nextIndex = piles.findIndex((c) => !c);
  const allFilled = nextIndex === -1;

  const winnerIndexes = useMemo(
    () => (allFilled ? getWinnerIndexes(piles, winMode) : []),
    [allFilled, piles, winMode]
  );

  useEffect(() => {
    if (winnerIndexes.length === 0) {
      lastWinnerAnnounceRef.current = '';
      return;
    }
    const cards = winnerIndexes
      .map((i) => piles[i])
      .filter(Boolean)
      .map((c) => `${c.rank}${c.suit}`);
    const key = `${winMode}:${winnerIndexes.join(',')}:${cards.join('|')}`;
    if (lastWinnerAnnounceRef.current === key) return;
    lastWinnerAnnounceRef.current = key;
    const people = formatAnnounceList(winnerIndexes.map((i) => `Person ${i + 1}`));
    announce(
      winnerIndexes.length === 1 ? `${people} wins` : `${people} tie`,
    );
  }, [winnerIndexes, piles, winMode, announce]);

  const buttonLabel = allFilled ? 'New Round' : 'Draw';

  const toolBtn = toolBtnClass(isDarkMode);

  const openSettings = () => {
    if (isBusy) return;
    setTempPlayerCount(playerCount);
    setTempWinMode(winMode);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    clearDrawTimers();
    const count = PLAYER_OPTIONS.includes(tempPlayerCount) ? tempPlayerCount : 2;
    const mode = tempWinMode === 'lowest' ? 'lowest' : 'highest';
    setPlayerCount(count);
    setWinMode(mode);
    setPiles(emptyPiles(count));
    setFlightCard(null);
    setFlightTarget(null);
    setPhase('idle');
    setFlipRotation(0);
    setIsSettingsOpen(false);
  };

  const handleDraw = () => {
    if (isBusy) return;

    if (allFilled) {
      clearDrawTimers();
      setPiles(emptyPiles(playerCount));
      setFlightCard(null);
      setFlightTarget(null);
      setFlipRotation(0);
      return;
    }

    const target = nextIndex;
    const card = drawRandomCard(isDarkMode);
    clearDrawTimers();
    setFlightTarget(target);
    setFlightCard(card);
    setPhase('flipping');
    setFlipRotation(0);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setFlipRotation(180);
      });
    });

    drawTimersRef.current.push(
      window.setTimeout(() => {
        setPhase('dealing');
      }, FLIP_MS),
    );

    drawTimersRef.current.push(
      window.setTimeout(() => {
        setPiles((prev) => prev.map((c, i) => (i === target ? card : c)));
        setFlightCard(null);
        setFlightTarget(null);
        setPhase('idle');
        setFlipRotation(0);
      }, FLIP_MS + DEAL_MS),
    );
  };

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';

  const cardSize = getCardSize(playerCount);
  const widthStyle = cardWidthStyle(playerCount, cardSize);

  // Row order: [Draw, P1, P2, …] — deal slides from draw (index 0) to person i (index i+1).
  const dealTranslateX =
    phase === 'dealing' && flightTarget !== null
      ? `calc(${flightTarget + 1} * (100% + ${GAP_REM}rem))`
      : '0';

  return (
    <>
      <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
        <ButtonRow>
          <button
            type="button"
            onClick={openSettings}
            disabled={isBusy}
            className={`${toolBtn} disabled:opacity-50`}
          >
            <Settings2 size={16} strokeWidth={2.5} />
            Settings
          </button>
        </ButtonRow>

        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
          <div
            className={`${APP_STATIC_BOARD} ${surface} ${
              flightCard ? '!overflow-visible' : ''
            }`}
          >
            <div className="flex-1 min-h-0 flex items-center justify-center px-2 sm:px-3 py-3 sm:py-4">
              <div
                className="relative flex items-end justify-center w-full"
                style={{ gap: `${GAP_REM}rem` }}
              >
                {/* Draw pile — elevated while a card is in flight so it passes over person slots */}
                <div
                  className={`flex flex-col items-center gap-3 shrink-0 ${
                    flightCard ? 'relative z-30' : 'relative z-10'
                  }`}
                  style={widthStyle}
                >
                  {/* Spacer matches Winner label height above person slots */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${TYPE.labelMicro} invisible`}
                    aria-hidden
                  >
                    <Crown size={12} strokeWidth={2.5} aria-hidden />
                    Winner
                    <Crown size={12} strokeWidth={2.5} aria-hidden />
                  </span>
                  <div
                    className="relative w-full aspect-[5/7]"
                    style={{ perspective: '1000px' }}
                  >
                    {/* Stationary draw pile — always visible under the dealt card */}
                    <CardBack theme={theme} size={cardSize} />

                    {flightCard ? (
                      <div
                        className="absolute inset-0 z-30"
                        style={{
                          transform:
                            phase === 'dealing'
                              ? `translateX(${dealTranslateX})`
                              : 'translateX(0)',
                          transition:
                            phase === 'dealing'
                              ? `transform ${DEAL_MS}ms cubic-bezier(0.22, 0.9, 0.3, 1)`
                              : 'none',
                        }}
                      >
                        <div
                          className="w-full h-full relative"
                          style={{
                            transformStyle: 'preserve-3d',
                            transform: `rotateY(${flipRotation}deg)`,
                            transition:
                              phase === 'flipping'
                                ? `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
                                : 'none',
                          }}
                        >
                          <CardBack theme={theme} size={cardSize} />
                          <CardFace
                            card={flightCard}
                            isDarkMode={isDarkMode}
                            size={cardSize}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {piles.map((card, index) => (
                  <PersonSlot
                    key={`pile-${index}`}
                    index={index}
                    card={card}
                    emphasize={flightTarget === index && phase === 'dealing'}
                    isWinner={winnerIndexes.includes(index)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    size={cardSize}
                    widthStyle={widthStyle}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pb-5 sm:pb-6 shrink-0">
              <button
                type="button"
                onClick={handleDraw}
                disabled={isBusy}
                className={`px-5 py-2.5 ${TYPE.labelLg} rounded-xl shadow-sm inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                {buttonLabel}
              </button>
              <p
                className={`${TYPE.bodySm} ${
                  isDarkMode ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {winMode === 'lowest' ? 'lowest card wins' : 'highest card wins'}
              </p>
            </div>
          </div>
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
          <div>
            <p
              className={`${TYPE.titleSm} mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              How many people?
            </p>
            <p
              className={`${TYPE.bodySm} mb-4 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Draw and compare up to 4 cards — one pile per person.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PLAYER_OPTIONS.map((num) => {
                const active = tempPlayerCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTempPlayerCount(num)}
                    className={`py-4 rounded-xl ${TYPE.titleMd} transition-all border-2 ${
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

          <div
            className={`pt-4 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            <p
              className={`${TYPE.titleSm} mb-1 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-900'
              }`}
            >
              Who wins?
            </p>
            <p
              className={`${TYPE.bodySm} mb-3 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Compare ranks when every person has a card. Ace is high.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WIN_MODES.map((mode) => {
                const active = tempWinMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTempWinMode(mode.id)}
                    className={`py-3 px-2 rounded-xl ${TYPE.labelLg} transition-all border-2 ${
                      active
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-200 border-transparent hover:border-slate-600'
                          : 'bg-slate-50 text-slate-700 border-transparent hover:border-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
