import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Fish, Settings, Shuffle, X } from 'lucide-react';
import { SolitaireCard } from '../solitaire/SolitaireCard';
import {
  CARD_BACK_OPTIONS,
  CardBackArt,
  DEFAULT_CARD_BACK,
} from '../solitaire/cardBacks';
import {
  askForRank,
  beginTurn,
  bookDisplayCard,
  bookLabel,
  chooseAiAsk,
  deferBooksToHands,
  applyBookLanding,
  drawFromPond,
  emptyGoFishTable,
  normalizePlayMode,
  prepareGoFishDeal,
  refillBooksFromDeals,
  refillDealOrder,
  resolvePlayerName,
  stripRefillDeals,
} from './goFishLogic';
import '../solitaire/Solitaire.css';

const PLAYER_COUNT_KEY = 'edu-arcade-gofish-players';
const PLAYER_NAMES_KEY = 'edu-arcade-gofish-names';
const BOOK_SIZE_KEY = 'edu-arcade-gofish-book-size';
const PLAY_MODE_KEY = 'edu-arcade-gofish-play-mode';
const FEED_VIEW_KEY = 'edu-arcade-gofish-feed-view';
const CARD_BACK_STORAGE_KEY = 'edu-arcade-solitaire-card-back';
const H_PEEK = 34;
const V_PEEK = 16;
const DEAL_FLY_MS = 180;
const GO_FISH_FLASH_MS = 1500;
const BOOK_ANIM_MS = 720;
const BOOK_MEET_MS = 500;
const BOOK_TO_PILE_MS = 500;
/** Wait before pulsing the pond to start an undealt game. */
const DEAL_NUDGE_DELAY_MS = 15000;
/** Matches .arcade-deal-nudge: 1.2s × 3. */
const DEAL_NUDGE_ANIM_MS = 3600;
const BOOK_CENTER_MS = 1000;
const MATCH_REVEAL_MS = 1800;
const AI_THINK_MS = 2000;
const AI_DRAW_MS = 1200;
const ANNOUNCE_TURN_MS = 2200;
const ANNOUNCE_ASK_MS = 2200;
const ANNOUNCE_RESULT_MS = 2400;
const BOOK_PILE_PEEK = 10;
const MAX_NAME_LEN = 16;
const EVENT_LOG_MAX = 12;

function countWord(n) {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four'];
  return words[n] || String(n);
}

function turnPossessive(name) {
  const n = (name || 'Player').trim() || 'Player';
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
}

function normalizeFeedView(view) {
  return view === 'log' ? 'log' : 'announcer';
}

/** Detailed tropical pixel fish for the Go Fish callout. */
function PixelFish({ className = '' }) {
  // Outline, shadow, mid, light, highlight, yellow accent, belly, eye, glint
  const C = {
    k: '#1c0a00',
    d: '#9a3412',
    m: '#ea580c',
    l: '#fb923c',
    h: '#fdba74',
    y: '#fbbf24',
    b: '#fef3c7',
    e: '#0f172a',
    g: '#fff7ed',
  };

  // 28×16 sprite facing right — dark outline, 3+ shades, fin texture.
  const rows = [
    '..........kk.kkk............',
    '........kkmlkhhykk..........',
    '.......kdmlhhhyyyk..........',
    '..kk..kdmmllhhyyyyk.........',
    '.kmdkkdmmllhhhyybbk.........',
    'kdmmmmlmllhhhhybbbdk........',
    'kmmmlmmllhhhhhybbbmdkk......',
    'kmmlmmllhhhgeyybbbmmmdk.....',
    'kmmlmmllhhhgeyybbbmmmmdk....',
    'kmmmlmmllhhhhhybbbmmmdk.....',
    'kdmmmmlmllhhhhybbbmdkk......',
    '.kmdkkdmmllhhhyybbk.........',
    '..kk..kdmmllhhyyyyk.........',
    '.......kdmlhhhyyyk..........',
    '........kkmlkhhykk..........',
    '..........kk.kkk............',
  ];

  const pixels = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.' && C[ch]) {
        pixels.push({ x, y, fill: C[ch] });
      }
    });
  });

  return (
    <svg
      className={className}
      viewBox="0 0 28 16"
      width="140"
      height="80"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {pixels.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill={p.fill}
        />
      ))}
    </svg>
  );
}

function readPlayerCount() {
  try {
    const n = Number(window.localStorage.getItem(PLAYER_COUNT_KEY));
    if (n >= 2 && n <= 4) return n;
  } catch {
    /* ignore */
  }
  return 2;
}

function writePlayerCount(n) {
  try {
    window.localStorage.setItem(PLAYER_COUNT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function readPlayerNames() {
  try {
    const raw = window.localStorage.getItem(PLAYER_NAMES_KEY);
    if (!raw) return ['', '', '', ''];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ['', '', '', ''];
    return [0, 1, 2, 3].map((i) =>
      typeof parsed[i] === 'string' ? parsed[i].slice(0, MAX_NAME_LEN) : '',
    );
  } catch {
    return ['', '', '', ''];
  }
}

function writePlayerNames(names) {
  try {
    window.localStorage.setItem(
      PLAYER_NAMES_KEY,
      JSON.stringify(
        [0, 1, 2, 3].map((i) =>
          typeof names[i] === 'string' ? names[i].slice(0, MAX_NAME_LEN) : '',
        ),
      ),
    );
  } catch {
    /* ignore */
  }
}

function readBookSize() {
  try {
    const n = Number(window.localStorage.getItem(BOOK_SIZE_KEY));
    if (n === 2 || n === 4) return n;
  } catch {
    /* ignore */
  }
  return 4;
}

function writeBookSize(n) {
  try {
    window.localStorage.setItem(BOOK_SIZE_KEY, String(n === 2 ? 2 : 4));
  } catch {
    /* ignore */
  }
}

function readPlayMode() {
  try {
    const raw = window.localStorage.getItem(PLAY_MODE_KEY);
    if (raw === 'live' || raw === 'computer') return raw;
  } catch {
    /* ignore */
  }
  return 'computer';
}

function writePlayMode(mode) {
  try {
    window.localStorage.setItem(PLAY_MODE_KEY, normalizePlayMode(mode));
  } catch {
    /* ignore */
  }
}

function readFeedView() {
  try {
    const raw = window.localStorage.getItem(FEED_VIEW_KEY);
    if (raw === 'log' || raw === 'announcer') return raw;
  } catch {
    /* ignore */
  }
  return 'announcer';
}

function writeFeedView(view) {
  try {
    window.localStorage.setItem(FEED_VIEW_KEY, normalizeFeedView(view));
  } catch {
    /* ignore */
  }
}

function readStoredCardBack() {
  try {
    const id = window.localStorage.getItem(CARD_BACK_STORAGE_KEY);
    if (CARD_BACK_OPTIONS.some((o) => o.id === id)) return id;
  } catch {
    /* ignore */
  }
  return DEFAULT_CARD_BACK;
}

/** Seat players around the table relative to the current (bottom) player. */
function seatPlayers(players, currentPlayerId) {
  const n = players.length;
  const ordered = [];
  for (let i = 0; i < n; i += 1) {
    ordered.push(players[(currentPlayerId + i) % n]);
  }
  if (n === 2) {
    return { bottom: ordered[0], top: ordered[1], left: null, right: null };
  }
  if (n === 3) {
    return {
      bottom: ordered[0],
      left: ordered[1],
      top: ordered[2],
      right: null,
    };
  }
  return {
    bottom: ordered[0],
    left: ordered[1],
    top: ordered[2],
    right: ordered[3],
  };
}

/** Fixed seats for computer mode — human (player 0) always at bottom. */
function seatPlayersFixed(players) {
  return seatPlayers(players, 0);
}

/** During the opening deal, dealer (player 0) sits at bottom. */
function seatKeyForPlayer(playerId, playerCount) {
  const players = Array.from({ length: playerCount }, (_, id) => ({ id }));
  const seats = seatPlayersFixed(players);
  for (const key of ['bottom', 'top', 'left', 'right']) {
    if (seats[key]?.id === playerId) return key;
  }
  return 'bottom';
}

function namePlaceholder(playMode, index) {
  if (playMode === 'computer') {
    return index === 0 ? 'You' : `Computer ${index}`;
  }
  return `Player ${index + 1}`;
}

function HandFan({
  cards,
  faceUp,
  cardBack,
  axis = 'horizontal',
  selectedRank = null,
  onCardClick,
  dimmed = false,
}) {
  const peek = axis === 'horizontal' ? H_PEEK : V_PEEK;
  const n = cards.length;
  if (!n) {
    return <div className="arcade-slot opacity-40" aria-label="Empty hand" />;
  }

  const width =
    axis === 'horizontal'
      ? `calc(var(--arcade-card-w) + ${Math.max(0, n - 1)} * ${peek}px)`
      : 'var(--arcade-card-w)';
  const height =
    axis === 'vertical'
      ? `calc(var(--arcade-card-h) + ${Math.max(0, n - 1)} * ${peek}px)`
      : 'var(--arcade-card-h)';

  return (
    <div className="relative overflow-visible" style={{ width, height }}>
      {cards.map((card, i) => {
        const isSelected = faceUp && selectedRank === card.rank;
        return (
          <div
            key={card.id}
            className={`absolute arcade-gofish-hand-card ${
              isSelected ? 'arcade-gofish-card-raised' : ''
            }`}
            style={
              axis === 'horizontal'
                ? { left: i * peek, top: 0, zIndex: isSelected ? 24 : i + 1 }
                : { top: i * peek, left: 0, zIndex: isSelected ? 24 : i + 1 }
            }
          >
            <SolitaireCard
              card={
                faceUp ? card : { ...card, faceUp: false, id: `${card.id}-back` }
              }
              cardBack={cardBack}
              selected={isSelected}
              onClick={
                faceUp && onCardClick ? () => onCardClick(card.rank) : undefined
              }
              dimmed={dimmed}
            />
          </div>
        );
      })}
    </div>
  );
}

const pileLabelClass = 'text-[6px] leading-none text-[#bbf7d0]';
/** Space between a hand/books stack and its caption (any orientation). */
const pileLabelGapClass = 'gap-2.5';
const SIDE_PILE_LABEL_EXTRA_H = 16;

/** Left/right: hand + books in one row, then rotate the row to face the pond. */
function SideSeatRow({ side, cards, books, cardBack, handRef, pileRef }) {
  const handCount = cards.length;
  const bookCount = books.length;
  const gapPx = 12;
  const handWidth = handCount
    ? `calc(var(--arcade-card-w) + ${(handCount - 1) * H_PEEK}px)`
    : 'var(--arcade-card-w)';
  const bookWidth = bookCount
    ? `calc(var(--arcade-card-w) + ${(bookCount - 1) * BOOK_PILE_PEEK}px)`
    : 'var(--arcade-card-w)';
  // Extra height for Hand / books labels under each stack.
  const rowWidth = `calc(${handWidth} + ${gapPx}px + ${bookWidth})`;
  const rowHeight = `calc(var(--arcade-card-h) + ${SIDE_PILE_LABEL_EXTRA_H}px)`;

  return (
    <div
      className="relative"
      style={{ width: rowHeight, height: rowWidth }}
    >
      <div
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-end ${
          side === 'left' ? 'rotate-90' : '-rotate-90'
        }`}
        style={{ width: rowWidth, height: rowHeight, gap: gapPx }}
      >
        <div
          ref={handRef}
          className={`flex flex-col items-center ${pileLabelGapClass}`}
          style={{ width: handWidth }}
        >
          {handCount ? (
            <HandFan
              cards={cards}
              faceUp={false}
              cardBack={cardBack}
              axis="horizontal"
            />
          ) : (
            <div className="arcade-slot opacity-40" aria-label="Empty hand" />
          )}
          <span className={pileLabelClass}>Hand</span>
        </div>
        <div
          ref={pileRef}
          className={`flex flex-col items-center ${pileLabelGapClass}`}
          style={{ width: bookWidth }}
        >
          <BookStack books={books} faceUp={false} cardBack={cardBack} />
          <span className={pileLabelClass}>
            {bookCount} book{bookCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SeatLabel({
  player,
  isTurn = false,
  isTarget = false,
  isYou,
  onSelect,
  disabled,
}) {
  const tone = isTurn
    ? 'arcade-btn-turn'
    : isTarget
      ? 'arcade-btn-target'
      : '';
  return (
    <button
      type="button"
      disabled={!isYou && disabled}
      onClick={isYou ? undefined : onSelect}
      className={`edu-control arcade-btn px-2 py-1 ${tone} ${
        isYou ? 'pointer-events-none opacity-100' : ''
      }`}
      aria-pressed={isTarget}
      aria-current={isTurn ? 'true' : undefined}
    >
      <span className="block text-[7px] sm:text-[8px]">
        {isYou ? `${player.name} (you)` : player.name}
      </span>
    </button>
  );
}

function BookStack({ books, faceUp = false, cardBack }) {
  const n = books.length;
  const width = n
    ? `calc(var(--arcade-card-w) + ${Math.max(0, n - 1)} * ${BOOK_PILE_PEEK}px)`
    : 'var(--arcade-card-w)';

  return (
    <div className="relative" style={{ width, height: 'var(--arcade-card-h)' }}>
      {n === 0 ? (
        <div className="arcade-slot opacity-25" aria-label="No books yet" />
      ) : (
        books.map((rank, i) => (
          <div
            key={`${rank}-${i}`}
            className="absolute top-0"
            style={{ left: i * BOOK_PILE_PEEK, zIndex: i + 1 }}
          >
            <SolitaireCard
              card={
                faceUp
                  ? bookDisplayCard(rank, i)
                  : { id: `book-back-${rank}-${i}`, faceUp: false }
              }
              cardBack={cardBack}
            />
          </div>
        ))
      )}
    </div>
  );
}

function BookPile({
  books,
  faceUp = false,
  cardBack,
  pileRef,
  /** 'upright' | 'top' — rotates card stack for the top seat. */
  orientation = 'upright',
  /** Place the books count above the stack (top seat). */
  labelPosition = 'below',
}) {
  const n = books.length;
  const stack = (
    <BookStack books={books} faceUp={faceUp} cardBack={cardBack} />
  );
  const label = (
    <span className={pileLabelClass}>
      {n} book{n === 1 ? '' : 's'}
    </span>
  );

  return (
    <div className={`flex flex-col items-center ${pileLabelGapClass}`}>
      {labelPosition === 'above' ? label : null}
      <div ref={pileRef}>
        {orientation === 'top' ? (
          <div className="rotate-180">{stack}</div>
        ) : (
          stack
        )}
      </div>
      {labelPosition === 'below' ? label : null}
    </div>
  );
}

function HandPile({
  children,
  handRef,
  labelPosition = 'below',
  className = '',
}) {
  const label = <span className={pileLabelClass}>Hand</span>;
  return (
    <div className={`flex flex-col items-center ${pileLabelGapClass} ${className}`}>
      {labelPosition === 'above' ? label : null}
      <div ref={handRef} className="overflow-visible">
        {children}
      </div>
      {labelPosition === 'below' ? label : null}
    </div>
  );
}

/** Resolve which seat a player occupies for the current table layout. */
function seatKeyForSeatedPlayer(playerId, seats) {
  for (const key of ['bottom', 'top', 'left', 'right']) {
    if (seats[key]?.id === playerId) return key;
  }
  return 'bottom';
}

/**
 * Go Fish — computer (default) or live hot-seat.
 */
export function GoFishView({ isDarkMode }) {
  const [playerCount, setPlayerCount] = useState(readPlayerCount);
  const [playerNames, setPlayerNames] = useState(readPlayerNames);
  const [bookSize, setBookSize] = useState(readBookSize);
  const [playMode, setPlayMode] = useState(readPlayMode);
  const [feedView, setFeedView] = useState(readFeedView);
  const [game, setGame] = useState(() =>
    emptyGoFishTable(
      readPlayerCount(),
      readBookSize(),
      readPlayerNames(),
      readPlayMode(),
    ),
  );
  const [pendingDeal, setPendingDeal] = useState(() => {
    const names = readPlayerNames();
    const mode = readPlayMode();
    const { game: finalGame, dealOrder, openingBooks } = prepareGoFishDeal(
      readPlayerCount(),
      { bookSize: readBookSize(), names, playMode: mode },
    );
    return { finalGame, dealOrder, openingBooks };
  });
  const [dealAnim, setDealAnim] = useState(null);
  const [flyingDeal, setFlyingDeal] = useState(null);
  const [drawFly, setDrawFly] = useState(null);
  const [bookQueue, setBookQueue] = useState([]);
  const [flyingBook, setFlyingBook] = useState(null);
  const [askRank, setAskRank] = useState(null);
  const [askTarget, setAskTarget] = useState(null);
  const [matchReveal, setMatchReveal] = useState(null);
  const [bookCenterReveal, setBookCenterReveal] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [announce, setAnnounce] = useState(null);
  const [bookAnnounce, setBookAnnounce] = useState(null);
  const [goFishFlash, setGoFishFlash] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [namesExpanded, setNamesExpanded] = useState(false);
  const [cardBack, setCardBack] = useState(readStoredCardBack);
  const [showDealNudge, setShowDealNudge] = useState(false);

  const boardRef = useRef(null);
  const pondRef = useRef(null);
  const seatTopRef = useRef(null);
  const seatLeftRef = useRef(null);
  const seatRightRef = useRef(null);
  const seatBottomRef = useRef(null);
  const bookTopRef = useRef(null);
  const bookLeftRef = useRef(null);
  const bookRightRef = useRef(null);
  const bookBottomRef = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const announceQueueRef = useRef([]);
  const announceTimerRef = useRef(0);
  const announceTurnKeyRef = useRef(null);
  const feedViewRef = useRef(feedView);
  feedViewRef.current = feedView;
  const seatRefByKey = {
    top: seatTopRef,
    left: seatLeftRef,
    right: seatRightRef,
    bottom: seatBottomRef,
  };
  const bookRefByKey = {
    top: bookTopRef,
    left: bookLeftRef,
    right: bookRightRef,
    bottom: bookBottomRef,
  };
  const bookAnimLockRef = useRef(false);

  const felt = isDarkMode ? 'arcade-felt-dark' : 'arcade-felt';
  const isDealing =
    Boolean(dealAnim) || Boolean(drawFly) || game.phase === 'dealing';
  const isGoFish = game.phase === 'goFish';
  const isComputer = playMode === 'computer';
  const isAnnouncer = feedView === 'announcer';
  const isHumanTurn = !isComputer || game.currentPlayer === 0;
  const booksBusy =
    bookQueue.length > 0 ||
    Boolean(flyingBook) ||
    Boolean(bookCenterReveal) ||
    Boolean(bookAnnounce);
  const announceBusy = Boolean(announce);
  const revealBusy =
    Boolean(matchReveal) || Boolean(bookCenterReveal) || announceBusy;
  const feedAnnounce = announce || bookAnnounce;
  const canStartDeal =
    Boolean(pendingDeal) && !dealAnim && game.phase === 'ready' && !game.won;

  useEffect(() => {
    if (!canStartDeal) {
      setShowDealNudge(false);
      return undefined;
    }
    setShowDealNudge(false);
    const startId = window.setTimeout(() => {
      setShowDealNudge(true);
    }, DEAL_NUDGE_DELAY_MS);
    return () => window.clearTimeout(startId);
  }, [canStartDeal, pendingDeal]);

  useEffect(() => {
    if (!showDealNudge) return undefined;
    const endId = window.setTimeout(() => {
      setShowDealNudge(false);
    }, DEAL_NUDGE_ANIM_MS);
    return () => window.clearTimeout(endId);
  }, [showDealNudge]);

  const canFish =
    isGoFish &&
    isHumanTurn &&
    !goFishFlash &&
    !announceBusy &&
    !isDealing &&
    !booksBusy &&
    !revealBusy &&
    !game.won;
  const canAct =
    game.phase === 'turn' &&
    isHumanTurn &&
    !game.won &&
    !isDealing &&
    !booksBusy &&
    !revealBusy;
  const seats = isComputer
    ? seatPlayersFixed(game.players)
    : seatPlayers(game.players, game.currentPlayer);
  const showPass =
    !isComputer &&
    game.phase === 'pass' &&
    !game.won &&
    !booksBusy &&
    !goFishFlash &&
    !announceBusy &&
    !revealBusy;
  const turnActive =
    !game.won &&
    !isDealing &&
    (game.phase === 'turn' || game.phase === 'goFish' || game.phase === 'pass');
  const showHumanHand =
    !isDealing &&
    !game.won &&
    (isComputer ||
      game.phase === 'turn' ||
      game.phase === 'goFish' ||
      booksBusy);

  const clearAnnounceQueue = () => {
    if (announceTimerRef.current) {
      window.clearTimeout(announceTimerRef.current);
      announceTimerRef.current = 0;
    }
    announceQueueRef.current = [];
    setAnnounce(null);
  };

  const pumpAnnounce = () => {
    if (announceTimerRef.current) return;
    const next = announceQueueRef.current.shift();
    if (!next) {
      setAnnounce(null);
      return;
    }
    setAnnounce({
      text: next.text,
      kind: next.kind || 'info',
      cards: next.cards || null,
    });
    if (typeof next.onShow === 'function') next.onShow();
    announceTimerRef.current = window.setTimeout(() => {
      announceTimerRef.current = 0;
      if (typeof next.onDone === 'function') next.onDone();
      pumpAnnounce();
    }, next.ms || ANNOUNCE_RESULT_MS);
  };

  const enqueueAnnounce = (steps) => {
    if (!steps?.length) return;
    announceQueueRef.current.push(...steps);
    pumpAnnounce();
  };

  const visibleBooksFor = (player) => {
    if (!player) return [];
    return player.books;
  };

  const enqueueBooks = (events) => {
    if (!events?.length) return;
    setGame((g) => deferBooksToHands(g, events));
    setBookQueue((prev) => [...prev, ...events]);
    const who = (id) =>
      game.players.find((p) => p.id === id)?.name || `Player ${id + 1}`;
    setEventLog((prev) => {
      const rows = events.map((e) => ({
        asker: who(e.playerId),
        asked: '—',
        forWhat: bookLabel(e.rank),
        result: 'Book',
      }));
      return [...rows, ...prev].slice(0, EVENT_LOG_MAX);
    });
  };

  const pushLog = (asker, asked, forWhat, result) => {
    if (!result) return;
    setEventLog((prev) =>
      [
        {
          asker: asker || '—',
          asked: asked || '—',
          forWhat: forWhat || '—',
          result,
        },
        ...prev,
      ].slice(0, EVENT_LOG_MAX),
    );
  };

  const logRefillDeals = (refillDeals, players) => {
    if (!refillDeals?.length) return;
    for (const deal of refillDeals) {
      const name =
        players.find((p) => p.id === deal.playerId)?.name ||
        `Player ${deal.playerId + 1}`;
      pushLog(name, 'Pond', '—', countWord(deal.cards.length));
    }
  };

  /** Apply state; if hands were refilled from the pond, fly those cards in. */
  const commitGameState = (next, { askBooks = null } = {}) => {
    if (!next) return;
    const books = askBooks ?? next.newBooks ?? [];
    const refillDeals = next.refillDeals || [];
    const cleaned = { ...next, newBooks: [], refillDeals: [] };

    if (refillDeals.length) {
      const startGame = stripRefillDeals(cleaned, refillDeals);
      const who =
        refillDeals.length === 1
          ? cleaned.players[refillDeals[0].playerId]?.name
          : null;
      startGame.phase = cleaned.phase === 'over' ? 'over' : cleaned.phase;
      startGame.lastEvent = who
        ? `${who} is out of cards — drawing from the pond…`
        : 'Drawing from the pond…';
      setGame(startGame);
      enqueueBooks(books);
      logRefillDeals(refillDeals, cleaned.players);
      setDealAnim({
        kind: 'refill',
        finalGame: cleaned,
        startGame,
        dealOrder: refillDealOrder(refillDeals),
        openingBooks: refillBooksFromDeals(refillDeals),
      });
      return;
    }

    setGame(cleaned);
    enqueueBooks(books);
  };

  const applyGameUpdate = (next) => {
    commitGameState(next);
  };

  /** Fly a Go Fish draw from the pond into the drawer's hand. */
  const animatePondDraw = (next) => {
    if (!next) return;
    const drawn = next.drawnCard;
    const drawerId = next.drawnBy;
    const books = next.newBooks || [];
    const refillDeals = next.refillDeals || [];
    const cleaned = {
      ...next,
      newBooks: [],
      refillDeals: [],
      drawnCard: undefined,
      drawnBy: undefined,
    };

    if (!drawn || drawerId == null) {
      commitGameState({ ...cleaned, newBooks: books, refillDeals });
      return;
    }

    let start = deferBooksToHands(cleaned, books);
    const drawer = start.players.find((p) => p.id === drawerId);
    const drawerName = drawer?.name || 'Player';
    start = {
      ...start,
      currentPlayer: drawerId,
      phase: 'dealing',
      lastEvent: `${drawerName} draws…`,
      pond: [
        ...start.pond,
        { id: `draw-fly-${drawn.id}`, faceUp: false },
      ],
      players: start.players.map((p) =>
        p.id === drawerId
          ? {
              ...p,
              hand: p.hand.filter((c) => c.id !== drawn.id),
            }
          : p,
      ),
    };
    setGame(start);
    setDrawFly({
      cleaned,
      books,
      refillDeals,
      drawerId,
      drawn,
    });
  };

  const beginDeal = (
    count = playerCount,
    size = bookSize,
    names = playerNames,
    mode = playMode,
  ) => {
    const nextCount = Math.min(4, Math.max(2, count));
    const nextSize = size === 2 ? 2 : 4;
    const nextMode = normalizePlayMode(mode);
    const nextNames = [0, 1, 2, 3].map((i) =>
      typeof names[i] === 'string' ? names[i].slice(0, MAX_NAME_LEN) : '',
    );
    setPlayerCount(nextCount);
    setBookSize(nextSize);
    setPlayMode(nextMode);
    setPlayerNames(nextNames);
    writePlayerCount(nextCount);
    writeBookSize(nextSize);
    writePlayMode(nextMode);
    writePlayerNames(nextNames);
    setAskRank(null);
    setAskTarget(null);
    setMatchReveal(null);
    setBookCenterReveal(null);
    setEventLog([]);
    clearAnnounceQueue();
    setBookAnnounce(null);
    announceTurnKeyRef.current = null;
    setGoFishFlash(false);
    setIsSettingsOpen(false);
    setNamesExpanded(false);
    setFlyingDeal(null);
    setDealAnim(null);
    setDrawFly(null);
    setBookQueue([]);
    setFlyingBook(null);

    const { game: finalGame, dealOrder, openingBooks } = prepareGoFishDeal(
      nextCount,
      { bookSize: nextSize, names: nextNames, playMode: nextMode },
    );
    setPendingDeal({ finalGame, dealOrder, openingBooks });
    setGame(emptyGoFishTable(nextCount, nextSize, nextNames, nextMode));
  };

  // One run per deal/refill: cards fly from the pond into seats.
  useEffect(() => {
    if (!dealAnim) return undefined;

    const {
      finalGame,
      dealOrder,
      openingBooks = [],
      kind = 'opening',
      startGame = null,
    } = dealAnim;
    let cancelled = false;
    let timeoutId = 0;

    const wait = (ms) =>
      new Promise((resolve) => {
        timeoutId = window.setTimeout(resolve, ms);
      });

    const nextFrame = () =>
      new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

    const fallbackOffset = (seat) => {
      if (seat === 'bottom') return { dx: 0, dy: 140 };
      if (seat === 'top') return { dx: 0, dy: -140 };
      if (seat === 'left') return { dx: -160, dy: 0 };
      return { dx: 160, dy: 0 };
    };

    const seatForPlayer = (playerId) => {
      if (kind === 'refill') {
        const layout =
          playMode === 'computer'
            ? seatPlayersFixed(finalGame.players)
            : seatPlayers(finalGame.players, finalGame.currentPlayer);
        return seatKeyForSeatedPlayer(playerId, layout);
      }
      return seatKeyForPlayer(playerId, finalGame.playerCount);
    };

    (async () => {
      if (kind === 'refill' && startGame) {
        let pondLen = startGame.pond.length;
        const hands = startGame.players.map((p) => [...p.hand]);
        const books = startGame.players.map((p) => [...p.books]);

        for (let i = 0; i < dealOrder.length; i += 1) {
          if (cancelled) return;

          await nextFrame();
          if (cancelled) return;

          const playerId = dealOrder[i];
          const seat = seatForPlayer(playerId);
          const boardEl = boardRef.current;
          const pondEl = pondRef.current;
          const seatEl = seatRefByKey[seat]?.current;
          const rotate =
            seat === 'left'
              ? 90
              : seat === 'right'
                ? -90
                : seat === 'top'
                  ? 180
                  : 0;

          if (boardEl && pondEl) {
            const board = boardEl.getBoundingClientRect();
            const from = pondEl.getBoundingClientRect();
            const cardW = from.width || 64;
            const cardH = from.height || 90;
            const fromX = from.left + from.width / 2 - board.left - cardW / 2;
            const fromY = from.top + from.height / 2 - board.top - cardH / 2;

            let dx;
            let dy;
            if (seatEl) {
              const to = seatEl.getBoundingClientRect();
              dx = to.left + to.width / 2 - board.left - cardW / 2 - fromX;
              dy = to.top + to.height / 2 - board.top - cardH / 2 - fromY;
            } else {
              ({ dx, dy } = fallbackOffset(seat));
            }

            setFlyingDeal({
              key: `refill-${i}`,
              left: fromX,
              top: fromY,
              dx,
              dy,
              rotate,
            });
          } else {
            const { dx, dy } = fallbackOffset(seat);
            setFlyingDeal({
              key: `refill-${i}`,
              left: '50%',
              top: '50%',
              dx,
              dy,
              rotate,
            });
          }

          pondLen = Math.max(0, pondLen - 1);
          hands[playerId] = [
            ...hands[playerId],
            { id: `refill-${i}`, faceUp: false },
          ];

          setGame((g) => ({
            ...g,
            phase: 'dealing',
            lastEvent: `${finalGame.players[playerId]?.name || 'Player'} draws…`,
            pond: Array.from({ length: pondLen }, (_, n) => ({
              id: `pond-refill-${n}`,
              faceUp: false,
            })),
            players: g.players.map((p) => ({
              ...p,
              hand: hands[p.id] || [],
              books: books[p.id] || [],
            })),
          }));

          await wait(DEAL_FLY_MS);
          if (cancelled) return;
          setFlyingDeal(null);
        }

        await wait(120);
        if (cancelled) return;
        setGame(
          openingBooks.length
            ? deferBooksToHands(
                { ...finalGame, newBooks: [], refillDeals: [] },
                openingBooks,
              )
            : { ...finalGame, newBooks: [], refillDeals: [] },
        );
        setDealAnim(null);
        setFlyingDeal(null);
        if (openingBooks.length) {
          setBookQueue(openingBooks);
          setEventLog((prev) => {
            const rows = openingBooks.map((e) => ({
              asker:
                finalGame.players.find((p) => p.id === e.playerId)?.name ||
                `Player ${e.playerId + 1}`,
              asked: '—',
              forWhat: bookLabel(e.rank),
              result: 'Book',
            }));
            return [...rows, ...prev].slice(0, EVENT_LOG_MAX);
          });
        }
        return;
      }

      for (let i = 0; i < dealOrder.length; i += 1) {
        if (cancelled) return;

        await nextFrame();
        if (cancelled) return;

        const seat = seatForPlayer(dealOrder[i]);
        const boardEl = boardRef.current;
        const pondEl = pondRef.current;
        const seatEl = seatRefByKey[seat]?.current;
        const rotate =
          seat === 'left' ? 90 : seat === 'right' ? -90 : seat === 'top' ? 180 : 0;

        if (boardEl && pondEl) {
          const board = boardEl.getBoundingClientRect();
          const from = pondEl.getBoundingClientRect();
          const cardW = from.width || 64;
          const cardH = from.height || 90;
          const fromX = from.left + from.width / 2 - board.left - cardW / 2;
          const fromY = from.top + from.height / 2 - board.top - cardH / 2;

          let dx;
          let dy;
          if (seatEl) {
            const to = seatEl.getBoundingClientRect();
            dx = to.left + to.width / 2 - board.left - cardW / 2 - fromX;
            dy = to.top + to.height / 2 - board.top - cardH / 2 - fromY;
          } else {
            ({ dx, dy } = fallbackOffset(seat));
          }

          setFlyingDeal({
            key: i,
            left: fromX,
            top: fromY,
            dx,
            dy,
            rotate,
          });
        } else {
          const { dx, dy } = fallbackOffset(seat);
          setFlyingDeal({
            key: i,
            left: '50%',
            top: '50%',
            dx,
            dy,
            rotate,
          });
        }

        setGame((g) => ({
          ...g,
          phase: 'dealing',
          lastEvent: 'Dealing…',
          pond: Array.from({ length: Math.max(0, 52 - (i + 1)) }, (_, n) => ({
            id: `pond-deal-${n}`,
            faceUp: false,
          })),
        }));

        await wait(DEAL_FLY_MS);
        if (cancelled) return;

        const dealt = i + 1;
        const hands = Array.from({ length: finalGame.playerCount }, () => []);
        for (let j = 0; j < dealt; j += 1) {
          hands[dealOrder[j]].push({
            id: `deal-${j}`,
            faceUp: false,
          });
        }

        setFlyingDeal(null);
        setGame((g) => ({
          ...g,
          phase: 'dealing',
          lastEvent: 'Dealing…',
          pond: Array.from({ length: Math.max(0, 52 - dealt) }, (_, n) => ({
            id: `pond-deal-${n}`,
            faceUp: false,
          })),
          players: g.players.map((p) => ({
            ...p,
            hand: hands[p.id] || [],
            books: [],
          })),
        }));
      }

      await wait(120);
      if (cancelled) return;
      setGame(
        openingBooks.length
          ? deferBooksToHands({ ...finalGame, newBooks: [] }, openingBooks)
          : { ...finalGame, newBooks: [] },
      );
      setDealAnim(null);
      setFlyingDeal(null);
      if (openingBooks.length) {
        setBookQueue(openingBooks);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealAnim]);

  // Go Fish draw: one card flies from the pond into the drawer's hand.
  useEffect(() => {
    if (!drawFly) return undefined;

    const { cleaned, books, refillDeals, drawerId } = drawFly;
    let cancelled = false;
    let timeoutId = 0;

    const wait = (ms) =>
      new Promise((resolve) => {
        timeoutId = window.setTimeout(resolve, ms);
      });

    const nextFrame = () =>
      new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

    const fallbackOffset = (seat) => {
      if (seat === 'bottom') return { dx: 0, dy: 140 };
      if (seat === 'top') return { dx: 0, dy: -140 };
      if (seat === 'left') return { dx: -160, dy: 0 };
      return { dx: 160, dy: 0 };
    };

    (async () => {
      await nextFrame();
      if (cancelled) return;

      const layout =
        playMode === 'computer'
          ? seatPlayersFixed(cleaned.players)
          : seatPlayers(cleaned.players, drawerId);
      const seat = seatKeyForSeatedPlayer(drawerId, layout);
      const boardEl = boardRef.current;
      const pondEl = pondRef.current;
      const seatEl = seatRefByKey[seat]?.current;
      const rotate =
        seat === 'left' ? 90 : seat === 'right' ? -90 : seat === 'top' ? 180 : 0;

      if (boardEl && pondEl) {
        const board = boardEl.getBoundingClientRect();
        const from = pondEl.getBoundingClientRect();
        const cardW = from.width || 64;
        const cardH = from.height || 90;
        const fromX = from.left + from.width / 2 - board.left - cardW / 2;
        const fromY = from.top + from.height / 2 - board.top - cardH / 2;
        let dx;
        let dy;
        if (seatEl) {
          const to = seatEl.getBoundingClientRect();
          dx = to.left + to.width / 2 - board.left - cardW / 2 - fromX;
          dy = to.top + to.height / 2 - board.top - cardH / 2 - fromY;
        } else {
          ({ dx, dy } = fallbackOffset(seat));
        }
        setFlyingDeal({
          key: `draw-${drawerId}`,
          left: fromX,
          top: fromY,
          dx,
          dy,
          rotate,
        });
      } else {
        const { dx, dy } = fallbackOffset(seat);
        setFlyingDeal({
          key: `draw-${drawerId}`,
          left: '50%',
          top: '50%',
          dx,
          dy,
          rotate,
        });
      }

      setGame((g) => ({
        ...g,
        pond: g.pond.slice(0, Math.max(0, g.pond.length - 1)),
      }));

      await wait(DEAL_FLY_MS);
      if (cancelled) return;

      setFlyingDeal(null);
      setDrawFly(null);
      commitGameState({ ...cleaned, newBooks: books, refillDeals });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFly]);

  useEffect(() => {
    setAskRank(null);
    setAskTarget(null);
  }, [game.currentPlayer, game.phase]);

  useEffect(() => {
    if (game.phase !== 'goFish') {
      setGoFishFlash(false);
      return undefined;
    }
    if (feedViewRef.current === 'announcer') {
      setGoFishFlash(false);
      return undefined;
    }
    setGoFishFlash(true);
    const id = window.setTimeout(() => setGoFishFlash(false), GO_FISH_FLASH_MS);
    return () => window.clearTimeout(id);
  }, [game.phase, game.lastEvent]);

  // Announcer: call out whose turn it is after books (and other callouts) settle.
  useEffect(() => {
    if (!isAnnouncer || game.won || isDealing || game.phase !== 'turn') {
      return;
    }
    // Opening deal / ask books first — then the turn callout.
    if (booksBusy) return;
    const turnKey = String(game.currentPlayer);
    const prev = announceTurnKeyRef.current;
    if (prev === turnKey) return;
    announceTurnKeyRef.current = turnKey;
    const name = game.players[game.currentPlayer]?.name || 'Player';
    enqueueAnnounce([
      {
        text: `It's ${turnPossessive(name)} turn!`,
        kind: 'turn',
        ms: ANNOUNCE_TURN_MS,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAnnouncer,
    game.currentPlayer,
    game.phase,
    isDealing,
    game.won,
    booksBusy,
  ]);

  // Reset turn-announce tracking when leaving play (new deal / ready).
  useEffect(() => {
    if (game.phase === 'ready' || game.phase === 'dealing') {
      announceTurnKeyRef.current = null;
    }
  }, [game.phase]);

  // Play queued book animations: announcer callout (or center popup), then fly to the pile.
  // Depend on the queue head identity only — mid-anim setGame must not restart the same book.
  const bookHead = bookQueue[0] || null;
  const bookHeadKey = bookHead
    ? `${bookHead.playerId}-${bookHead.rank}-${bookHead.cards?.[0]?.id || bookHead.cards?.length || 0}`
    : null;

  useEffect(() => {
    if (
      bookAnimLockRef.current ||
      !bookHead ||
      isDealing ||
      matchReveal ||
      announceBusy
    ) {
      return undefined;
    }

    bookAnimLockRef.current = true;
    const event = bookHead;
    let cancelled = false;
    let timeoutId = 0;
    const playerName =
      gameRef.current.players.find((p) => p.id === event.playerId)?.name ||
      `Player ${event.playerId + 1}`;
    const showcaseMs = isAnnouncer ? ANNOUNCE_RESULT_MS : BOOK_CENTER_MS;
    const ownCards = event.ownCards?.length
      ? event.ownCards
      : event.cards || [];
    const takenCards = event.takenCards || [];
    const isMerge =
      takenCards.length > 0 &&
      event.takenFromId != null &&
      event.takenFromId !== event.playerId;

    const finishLand = () => {
      if (cancelled) return;
      setGame((g) => applyBookLanding(g, event));
      setBookQueue((prev) => prev.slice(1));
      setFlyingBook(null);
      setBookCenterReveal(null);
      setBookAnnounce(null);
      bookAnimLockRef.current = false;
    };

    if (isAnnouncer) {
      setBookCenterReveal(null);
      setBookAnnounce({
        text: `${playerName} booked ${bookLabel(event.rank)}!`,
        kind: 'book',
        cards: null,
      });
    } else {
      setBookAnnounce(null);
      // Log mode: text-only wait, then hand → pile (no center card popup).
      setBookCenterReveal(null);
    }

    const seatRotate = (seat) =>
      seat === 'left' ? 90 : seat === 'right' ? -90 : seat === 'top' ? 180 : 0;

    const pointFromEl = (boardEl, el, cardW, cardH) => {
      const board = boardEl.getBoundingClientRect();
      if (!el) {
        return {
          left: board.width / 2 - cardW / 2,
          top: board.height / 2 - cardH / 2,
        };
      }
      const box = el.getBoundingClientRect();
      return {
        left: box.left + box.width / 2 - board.left - cardW / 2,
        top: box.top + box.height / 2 - board.top - cardH / 2,
      };
    };

    timeoutId = window.setTimeout(() => {
      if (cancelled) return;

      setBookAnnounce(null);
      setBookCenterReveal(null);

      // Pull booked cards out of the relevant hand(s) before they fly.
      setGame((g) => {
        const next = { ...g, players: g.players.map((p) => ({ ...p })) };
        const ownIds = new Set(ownCards.map((c) => c.id));
        const takenIds = new Set(takenCards.map((c) => c.id));
        const booker = next.players.find((x) => x.id === event.playerId);
        if (booker) {
          booker.hand = booker.hand.filter((c) => !ownIds.has(c.id));
          if (!isMerge) {
            booker.hand = booker.hand.filter((c) => !takenIds.has(c.id));
          }
        }
        if (isMerge) {
          const donor = next.players.find((x) => x.id === event.takenFromId);
          if (donor) {
            donor.hand = donor.hand.filter((c) => !takenIds.has(c.id));
          }
        }
        return next;
      });

      const current = gameRef.current;
      const seatLayout =
        playMode === 'computer'
          ? seatPlayersFixed(current.players)
          : seatPlayers(current.players, current.currentPlayer);
      const bookerSeat = seatKeyForSeatedPlayer(event.playerId, seatLayout);
      const boardEl = boardRef.current;
      const pileEl = bookRefByKey[bookerSeat]?.current;
      const cardW = 64;
      const cardH = 90;

      if (!boardEl) {
        timeoutId = window.setTimeout(finishLand, BOOK_ANIM_MS);
        return;
      }

      const board = boardEl.getBoundingClientRect();
      const pilePoint = pointFromEl(boardEl, pileEl, cardW, cardH);
      const centerPoint = {
        left: board.width / 2 - cardW / 2,
        top: board.height / 2 - cardH / 2,
      };

      if (isMerge) {
        const donorSeat = seatKeyForSeatedPlayer(
          event.takenFromId,
          seatLayout,
        );
        const bookerHand = seatRefByKey[bookerSeat]?.current;
        const donorHand = seatRefByKey[donorSeat]?.current;
        const fromBooker = pointFromEl(boardEl, bookerHand, cardW, cardH);
        const fromDonor = pointFromEl(boardEl, donorHand, cardW, cardH);

        // Straight flights — no seat rotations. Meet in the middle, then to the pile.
        setFlyingBook({
          mode: 'meet',
          key: `${event.playerId}-${event.rank}-meet`,
          faceUp: true,
          streams: [
            {
              id: 'own',
              cards: ownCards,
              left: fromBooker.left,
              top: fromBooker.top,
              dx: centerPoint.left - fromBooker.left,
              dy: centerPoint.top - fromBooker.top,
              rotate: 0,
            },
            {
              id: 'taken',
              cards: takenCards,
              left: fromDonor.left,
              top: fromDonor.top,
              dx: centerPoint.left - fromDonor.left,
              dy: centerPoint.top - fromDonor.top,
              rotate: 0,
            },
          ],
        });

        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          setFlyingBook({
            mode: 'pile',
            key: `${event.playerId}-${event.rank}-pile`,
            cards: [...ownCards, ...takenCards],
            left: centerPoint.left,
            top: centerPoint.top,
            dx: pilePoint.left - centerPoint.left,
            dy: pilePoint.top - centerPoint.top,
            rotate: 0,
            faceUp: true,
          });
          timeoutId = window.setTimeout(finishLand, BOOK_TO_PILE_MS);
        }, BOOK_MEET_MS);
        return;
      }

      // Own-hand book: lift from hand, then into the pile.
      const handEl = seatRefByKey[bookerSeat]?.current;
      const fromHand = pointFromEl(boardEl, handEl, cardW, cardH);
      setFlyingBook({
        mode: 'own',
        key: `${event.playerId}-${event.rank}-${event.cards[0]?.id || 0}`,
        cards: event.cards,
        left: fromHand.left,
        top: fromHand.top,
        dx: pilePoint.left - fromHand.left,
        dy: pilePoint.top - fromHand.top,
        rotate: seatRotate(bookerSeat),
        faceUp: true,
      });

      timeoutId = window.setTimeout(finishLand, BOOK_ANIM_MS);
    }, showcaseMs);

    return () => {
      cancelled = true;
      bookAnimLockRef.current = false;
      window.clearTimeout(timeoutId);
      setFlyingBook(null);
      setBookCenterReveal(null);
      setBookAnnounce(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookHeadKey, isDealing, matchReveal, announceBusy, isAnnouncer, playMode]);

  const newGame = (count = playerCount, size = bookSize, mode = playMode) => {
    beginDeal(count, size, playerNames, mode);
  };

  const applyPlayerCount = (count) => {
    newGame(count, bookSize);
  };

  const applyBookSize = (size) => {
    newGame(playerCount, size);
  };

  const applyPlayMode = (mode) => {
    newGame(playerCount, bookSize, mode);
  };

  const applyFeedView = (view) => {
    const next = normalizeFeedView(view);
    setFeedView(next);
    writeFeedView(next);
    if (next !== 'announcer') {
      clearAnnounceQueue();
      setBookAnnounce(null);
    }
  };

  const applyPlayerName = (index, value) => {
    const nextNames = playerNames.map((name, i) =>
      i === index ? value.slice(0, MAX_NAME_LEN) : name,
    );
    setPlayerNames(nextNames);
    writePlayerNames(nextNames);
    setGame((g) => ({
      ...g,
      players: g.players.map((p) =>
        p.id === index
          ? { ...p, name: resolvePlayerName(nextNames, index, playMode) }
          : p,
      ),
    }));
    setPendingDeal((pending) => {
      if (!pending) return pending;
      return {
        ...pending,
        finalGame: {
          ...pending.finalGame,
          players: pending.finalGame.players.map((p) =>
            p.id === index
              ? { ...p, name: resolvePlayerName(nextNames, index, playMode) }
              : p,
          ),
        },
      };
    });
  };

  const chooseCardBack = (id) => {
    setCardBack(id);
    try {
      window.localStorage.setItem(CARD_BACK_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const closePanels = () => {
    setIsSettingsOpen(false);
    setNamesExpanded(false);
  };

  const selectRank = (rank) => {
    if (!canAct) return;
    setAskTarget(null);
    setAskRank((prev) => (prev === rank ? null : rank));
  };

  const performAsk = (fromIndex, toIndex, rank, sourceGame = gameRef.current) => {
    const next = askForRank(sourceGame, fromIndex, toIndex, rank);
    if (!next) return false;

    const asker = sourceGame.players[fromIndex];
    const target = sourceGame.players[toIndex];
    const rankName = bookLabel(rank);
    const received = next.receivedCards || [];
    const pendingBooks = next.newBooks || [];
    const cleaned = {
      ...next,
      newBooks: [],
      receivedCards: [],
      receivedFrom: undefined,
      receivedRank: undefined,
    };

    setAskTarget(toIndex);

    if (received.length) {
      pushLog(
        asker.name,
        target.name,
        rankName,
        countWord(received.length),
      );
      setAskRank(null);

      if (isAnnouncer) {
        const refillDeals = cleaned.refillDeals || [];
        enqueueAnnounce([
          {
            text: `${asker.name} asks ${target.name} for ${rankName}.`,
            kind: 'ask',
            ms: ANNOUNCE_ASK_MS,
          },
          {
            text: `${target.name} had ${rankName}!`,
            kind: 'had',
            cards: received,
            ms: ANNOUNCE_RESULT_MS,
            onShow: () => {
              const revealGame = refillDeals.length
                ? stripRefillDeals(cleaned, refillDeals)
                : { ...cleaned, refillDeals: [] };
              setGame(revealGame);
            },
            onDone: () => {
              setAskTarget(null);
              commitGameState({
                ...cleaned,
                newBooks: pendingBooks,
                refillDeals,
              });
            },
          },
        ]);
        return true;
      }

      setMatchReveal({
        cards: received,
        title: `${target.name} had ${rank}!`,
      });
      const refillDeals = cleaned.refillDeals || [];
      const revealGame = refillDeals.length
        ? stripRefillDeals(cleaned, refillDeals)
        : { ...cleaned, refillDeals: [] };
      setGame(revealGame);
      window.setTimeout(() => {
        setMatchReveal(null);
        setAskTarget(null);
        commitGameState({
          ...cleaned,
          newBooks: pendingBooks,
          refillDeals,
        });
      }, MATCH_REVEAL_MS);
      return true;
    }

    pushLog(asker.name, target.name, rankName, 'Go Fish');
    setAskRank(null);

    if (isAnnouncer) {
      enqueueAnnounce([
        {
          text: `${asker.name} asks ${target.name} for ${rankName}.`,
          kind: 'ask',
          ms: ANNOUNCE_ASK_MS,
        },
        {
          text: 'Go Fish!',
          kind: 'goFish',
          ms: ANNOUNCE_RESULT_MS,
          onShow: () => {
            applyGameUpdate(cleaned);
          },
          onDone: () => {
            setAskTarget(null);
          },
        },
      ]);
      return true;
    }

    applyGameUpdate(cleaned);
    window.setTimeout(() => setAskTarget(null), 800);
    return true;
  };

  const selectOpponent = (player) => {
    if (!canAct || player.id === game.currentPlayer) return;
    if (!askRank) {
      setGame((g) => ({
        ...g,
        lastEvent: 'Select a card in your hand, then tap a player to ask.',
      }));
      return;
    }
    performAsk(game.currentPlayer, player.id, askRank);
  };

  const onStartDeal = () => {
    if (!canStartDeal || !pendingDeal) return;
    setDealAnim(pendingDeal);
    setPendingDeal(null);
    pushLog('—', '—', '—', 'Dealt');
  };

  const onPondClick = () => {
    if (canStartDeal) {
      onStartDeal();
      return;
    }
    if (!canFish) return;
    const asker = game.players[game.currentPlayer];
    const askedRank = game.pendingAsk?.rank;
    const rankName = askedRank ? bookLabel(askedRank) : '—';
    const next = drawFromPond(game);
    if (!next) return;
    if (askedRank && next.lastEvent.includes('fished')) {
      pushLog(asker.name, 'Pond', rankName, 'Caught');
    } else {
      pushLog(asker.name, 'Pond', rankName, 'Drew');
    }
    animatePondDraw(next);
  };

  // Computer opponents take turns automatically.
  useEffect(() => {
    if (
      !isComputer ||
      game.won ||
      isDealing ||
      booksBusy ||
      revealBusy ||
      announceBusy
    ) {
      return undefined;
    }
    if (game.currentPlayer === 0) return undefined;

    if (game.phase === 'pass') {
      setGame(beginTurn(game));
      return undefined;
    }

    if (game.phase === 'goFish') {
      if (goFishFlash) return undefined;
      const id = window.setTimeout(() => {
        const current = gameRef.current;
        if (
          current.phase !== 'goFish' ||
          current.currentPlayer === 0 ||
          current.won
        ) {
          return;
        }
        const asker = current.players[current.currentPlayer];
        const askedRank = current.pendingAsk?.rank;
        const rankName = askedRank ? bookLabel(askedRank) : '—';
        const next = drawFromPond(current);
        if (!next) return;
        if (askedRank && next.lastEvent.includes('fished')) {
          pushLog(asker.name, 'Pond', rankName, 'Caught');
        } else {
          pushLog(asker.name, 'Pond', rankName, 'Drew');
        }
        animatePondDraw(next);
      }, AI_DRAW_MS);
      return () => window.clearTimeout(id);
    }

    if (game.phase !== 'turn') return undefined;

    const id = window.setTimeout(() => {
      const current = gameRef.current;
      if (
        current.phase !== 'turn' ||
        current.currentPlayer === 0 ||
        current.won
      ) {
        return;
      }
      const choice = chooseAiAsk(current, current.currentPlayer);
      if (!choice) return;
      performAsk(current.currentPlayer, choice.toIndex, choice.rank, current);
    }, AI_THINK_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isComputer,
    game.phase,
    game.currentPlayer,
    game.won,
    game.lastEvent,
    isDealing,
    booksBusy,
    revealBusy,
    announceBusy,
    goFishFlash,
  ]);

  return (
    <div
      className={`arcade-pixel relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl pt-3 ${felt}`}
    >
      <div className="arcade-panel mx-3 flex shrink-0 flex-wrap items-center gap-2 overflow-visible px-3 py-2 sm:mx-4">
        <span className="inline-flex items-center gap-2 text-[14px] leading-[1.35] text-[#f7f3e8]">
          <Fish size={16} strokeWidth={2.5} />
          Go Fish
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="edu-control arcade-btn arcade-btn-primary inline-flex items-center gap-2"
            onClick={() => newGame()}
            title="New game"
            aria-label="New game"
          >
            <Shuffle size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            className={`edu-control arcade-btn inline-flex items-center gap-2 ${
              isSettingsOpen ? 'arcade-btn-primary' : ''
            }`}
            onClick={() => setIsSettingsOpen((v) => !v)}
            title="Settings"
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
          >
            <Settings size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="arcade-play-scroll relative min-h-0 flex-1 px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3">
        <div
          ref={boardRef}
          className="arcade-play-board relative mx-auto flex h-full min-h-[28rem] max-w-5xl flex-col"
        >
          {/* Top opponent */}
          <div className="flex shrink-0 flex-col items-center gap-3 pb-2">
            {seats.top ? (
              <>
                <SeatLabel
                  player={seats.top}
                  isTurn={turnActive && seats.top.id === game.currentPlayer}
                  isTarget={askTarget === seats.top.id}
                  isYou={false}
                  disabled={!canAct}
                  onSelect={() => selectOpponent(seats.top)}
                />
                <div className="flex items-start justify-center gap-3">
                  <HandPile handRef={seatTopRef} labelPosition="above">
                    <div className="rotate-180">
                      <HandFan
                        cards={seats.top.hand}
                        faceUp={false}
                        cardBack={cardBack}
                        axis="horizontal"
                      />
                    </div>
                  </HandPile>
                  <BookPile
                    books={visibleBooksFor(seats.top)}
                    faceUp={false}
                    cardBack={cardBack}
                    pileRef={bookTopRef}
                    orientation="top"
                    labelPosition="above"
                  />
                </div>
              </>
            ) : (
              <div className="h-8" />
            )}
          </div>

          {/* Middle band: left / right seats + pond, all vertically centered */}
          <div className="relative min-h-0 flex-1">
            {seats.left ? (
              <div className="absolute left-0 top-1/2 z-[1] flex -translate-y-1/2 flex-col items-start gap-3">
                <SeatLabel
                  player={seats.left}
                  isTurn={turnActive && seats.left.id === game.currentPlayer}
                  isTarget={askTarget === seats.left.id}
                  isYou={false}
                  disabled={!canAct}
                  onSelect={() => selectOpponent(seats.left)}
                />
                <SideSeatRow
                  side="left"
                  cards={seats.left.hand}
                  books={visibleBooksFor(seats.left)}
                  cardBack={cardBack}
                  handRef={seatLeftRef}
                  pileRef={bookLeftRef}
                />
              </div>
            ) : null}

            {seats.right ? (
              <div className="absolute right-0 top-1/2 z-[1] flex -translate-y-1/2 flex-col items-end gap-3">
                <SeatLabel
                  player={seats.right}
                  isTurn={turnActive && seats.right.id === game.currentPlayer}
                  isTarget={askTarget === seats.right.id}
                  isYou={false}
                  disabled={!canAct}
                  onSelect={() => selectOpponent(seats.right)}
                />
                <SideSeatRow
                  side="right"
                  cards={seats.right.hand}
                  books={visibleBooksFor(seats.right)}
                  cardBack={cardBack}
                  handRef={seatRightRef}
                  pileRef={bookRightRef}
                />
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center gap-3 px-2">
              <div className="pointer-events-auto flex flex-col items-center gap-1">
                <span className="text-[7px] text-[#bbf7d0]">Pond</span>
                <div
                  ref={pondRef}
                  className={`relative ${canFish ? 'arcade-gofish-pond-live' : ''}`}
                >
                  {game.pond.length ? (
                    <SolitaireCard
                      card={{ id: 'pond', faceUp: false }}
                      cardBack={cardBack}
                      onClick={
                        canStartDeal || canFish ? onPondClick : undefined
                      }
                      selected={canFish || canStartDeal}
                      className={
                        canStartDeal && showDealNudge ? 'arcade-deal-nudge' : ''
                      }
                    />
                  ) : (
                    <div className="arcade-slot" aria-label="Empty pond" />
                  )}
                </div>
                <span className="text-[7px] text-[#fbbf24]">
                  {game.pond.length}
                </span>
              </div>

              <div
                className={`pointer-events-auto arcade-panel flex flex-col overflow-hidden ${
                  isAnnouncer
                    ? 'h-[calc(var(--arcade-card-h)+2.5rem)] w-[13rem] sm:w-[16.2rem]'
                    : 'h-[calc(var(--arcade-card-h)+2.5rem)] w-[16rem] sm:w-[19rem]'
                }`}
                aria-label={isAnnouncer ? 'Announcer' : 'Play log'}
              >
                <p className="shrink-0 border-b-2 border-[#064a29] px-2 py-1 text-[7px] text-[#fbbf24]">
                  {isAnnouncer ? 'Announcer' : 'Log'}
                </p>
                {isAnnouncer ? (
                  <div
                    className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden px-2 pb-1 pt-0.5 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    {feedAnnounce ? (
                      <>
                        <p className="shrink-0 px-0.5 text-[8px] leading-snug text-[#f7f3e8] sm:text-[9px]">
                          {feedAnnounce.text}
                        </p>
                        {feedAnnounce.kind === 'goFish' ? (
                          <div
                            className="flex shrink-0 items-center justify-center overflow-visible"
                            style={{ height: 44 }}
                          >
                            <div className="origin-center scale-[0.55]">
                              <PixelFish />
                            </div>
                          </div>
                        ) : null}
                        {feedAnnounce.cards?.length ? (
                          <div
                            className="flex shrink-0 flex-wrap items-center justify-center gap-0"
                            style={{
                              height: 'calc(var(--arcade-card-h) * 0.55)',
                            }}
                          >
                            {feedAnnounce.cards.slice(0, 4).map((card) => (
                              <div
                                key={card.id}
                                className="relative overflow-visible"
                                style={{
                                  width: 'calc(var(--arcade-card-w) * 0.55)',
                                  height: 'calc(var(--arcade-card-h) * 0.55)',
                                }}
                              >
                                <div className="origin-top-left scale-[0.55]">
                                  <SolitaireCard
                                    card={{ ...card, faceUp: true }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-[#064a29]">
                        <tr className="text-[5px] uppercase tracking-wide text-[#86efac]">
                          <th className="border border-[#086336] px-1.5 py-1 font-normal">
                            Asker
                          </th>
                          <th className="border border-[#086336] px-1 py-1 font-normal">
                            Asked
                          </th>
                          <th className="border border-[#086336] px-1 py-1 font-normal">
                            For
                          </th>
                          <th className="border border-[#086336] px-1.5 py-1 font-normal">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventLog.map((row, i) => (
                          <tr
                            key={`${i}-${row.asker}-${row.asked}-${row.forWhat}-${row.result}`}
                            className="text-[6px] leading-snug text-[#f7f3e8]"
                          >
                            <td className="max-w-[3.75rem] truncate border border-[#086336] px-1.5 py-1 align-top">
                              {row.asker}
                            </td>
                            <td className="max-w-[3.75rem] truncate border border-[#086336] px-1 py-1 align-top">
                              {row.asked}
                            </td>
                            <td className="whitespace-nowrap border border-[#086336] px-1 py-1 align-top">
                              {row.forWhat}
                            </td>
                            <td className="whitespace-nowrap border border-[#086336] px-1.5 py-1 align-top">
                              {row.result}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: current player face-up */}
          <div className="flex shrink-0 flex-col items-center gap-3 pt-4 pb-1">
            {seats.bottom ? (
              <>
                <div className="flex items-end justify-center gap-3">
                  <HandPile handRef={seatBottomRef}>
                    <HandFan
                      cards={seats.bottom.hand}
                      faceUp={showHumanHand}
                      cardBack={cardBack}
                      axis="horizontal"
                      selectedRank={askRank}
                      onCardClick={canAct ? selectRank : undefined}
                    />
                  </HandPile>
                  <BookPile
                    books={visibleBooksFor(seats.bottom)}
                    faceUp
                    cardBack={cardBack}
                    pileRef={bookBottomRef}
                  />
                </div>
                <SeatLabel
                  player={seats.bottom}
                  isTurn={turnActive && seats.bottom.id === game.currentPlayer}
                  isTarget={false}
                  isYou
                  disabled
                  onSelect={() => {}}
                />
              </>
            ) : null}
          </div>

          {flyingDeal ? (
            <div
              key={flyingDeal.key}
              className="arcade-gofish-fly pointer-events-none absolute z-30"
              style={{
                left: flyingDeal.left,
                top: flyingDeal.top,
                marginLeft:
                  typeof flyingDeal.left === 'string' ? '-32px' : undefined,
                marginTop:
                  typeof flyingDeal.top === 'string' ? '-45px' : undefined,
                '--fly-dx': `${flyingDeal.dx}px`,
                '--fly-dy': `${flyingDeal.dy}px`,
                '--fly-rot': `${flyingDeal.rotate}deg`,
              }}
              aria-hidden
            >
              <div className="arcade-card arcade-card-back arcade-card-back-art">
                <span className="arcade-card-back-inner">
                  <CardBackArt id={cardBack} />
                </span>
              </div>
            </div>
          ) : null}

          {flyingBook?.mode === 'meet' ? (
            flyingBook.streams.map((stream) => (
              <div
                key={`${flyingBook.key}-${stream.id}`}
                className="arcade-gofish-book-meet pointer-events-none absolute z-[35]"
                style={{
                  left: stream.left,
                  top: stream.top,
                  '--fly-dx': `${stream.dx}px`,
                  '--fly-dy': `${stream.dy}px`,
                }}
                aria-hidden
              >
                {stream.cards.map((card, i) => {
                  const spread = (i - (stream.cards.length - 1) / 2) * 12;
                  return (
                    <div
                      key={card.id || `${stream.id}-${i}`}
                      className="absolute left-0 top-0"
                      style={{
                        transform: `translateX(${spread}px)`,
                        zIndex: i + 1,
                      }}
                    >
                      <SolitaireCard card={{ ...card, faceUp: true }} />
                    </div>
                  );
                })}
              </div>
            ))
          ) : flyingBook ? (
            <div
              key={flyingBook.key}
              className={`pointer-events-none absolute z-[35] ${
                flyingBook.mode === 'pile'
                  ? 'arcade-gofish-book-to-pile'
                  : 'arcade-gofish-book-fly'
              }`}
              style={{
                left: flyingBook.left,
                top: flyingBook.top,
                marginLeft:
                  typeof flyingBook.left === 'string' ? '-32px' : undefined,
                marginTop:
                  typeof flyingBook.top === 'string' ? '-45px' : undefined,
                '--fly-dx': `${flyingBook.dx}px`,
                '--fly-dy': `${flyingBook.dy}px`,
                '--fly-rot': `${flyingBook.rotate || 0}deg`,
              }}
              aria-hidden
            >
              {flyingBook.cards.map((card, i) => {
                const spread = (i - (flyingBook.cards.length - 1) / 2) * 18;
                return (
                  <div
                    key={card.id || i}
                    className={`absolute left-0 top-0 ${
                      flyingBook.mode === 'own' ? 'arcade-gofish-book-card' : ''
                    }`}
                    style={{
                      ...(flyingBook.mode === 'own'
                        ? { '--book-spread': `${spread}px` }
                        : { transform: `translateX(${spread}px)` }),
                      zIndex: i + 1,
                    }}
                  >
                    {flyingBook.faceUp ? (
                      <SolitaireCard card={{ ...card, faceUp: true }} />
                    ) : (
                      <div className="arcade-card arcade-card-back arcade-card-back-art">
                        <span className="arcade-card-back-inner">
                          <CardBackArt id={cardBack} />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {isSettingsOpen ? (
        <>
          <button
            type="button"
            className="absolute inset-0 z-30 cursor-default bg-black/25"
            aria-label="Close panel"
            onClick={closePanels}
          />
          <div
            className="arcade-panel absolute left-1/2 top-1/2 z-40 max-h-[min(80%,32rem)] w-[min(100%-1.5rem,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto px-3 py-3"
            role="dialog"
            aria-label="Settings"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="pt-1 text-[10px] text-[#f7f3e8]">Settings</p>
              <button
                type="button"
                className="edu-control arcade-btn inline-flex items-center justify-center p-2"
                onClick={closePanels}
                title="Close"
                aria-label="Close settings"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <p className="mb-2 text-[9px] text-[#f7f3e8]">Play feed</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  feedView === 'announcer' ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyFeedView('announcer')}
                aria-pressed={feedView === 'announcer'}
              >
                Announcer
              </button>
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  feedView === 'log' ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyFeedView('log')}
                aria-pressed={feedView === 'log'}
              >
                Log
              </button>
            </div>
            <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
              {feedView === 'announcer'
                ? 'Big turn-by-turn callouts for younger players.'
                : 'Table of asks, results, and books.'}
            </p>

            <p className="mb-2 text-[9px] text-[#f7f3e8]">Play mode</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  playMode === 'computer' ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyPlayMode('computer')}
                aria-pressed={playMode === 'computer'}
              >
                Computer
              </button>
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  playMode === 'live' ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyPlayMode('live')}
                aria-pressed={playMode === 'live'}
              >
                Live play
              </button>
            </div>
            <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
              {playMode === 'computer'
                ? 'You play against computer opponents. Changing mode starts a new game.'
                : 'Pass the device each turn. Changing mode starts a new game.'}
            </p>

            <p className="mb-2 text-[9px] text-[#f7f3e8]">Players</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`edu-control arcade-btn ${
                    playerCount === n ? 'arcade-btn-primary' : ''
                  }`}
                  onClick={() => applyPlayerCount(n)}
                  aria-pressed={playerCount === n}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
              Changing players starts a new game.
            </p>

            <button
              type="button"
              className="edu-control mb-2 flex w-full items-center justify-between gap-2 text-left"
              onClick={() => setNamesExpanded((v) => !v)}
              aria-expanded={namesExpanded}
            >
              <span className="text-[9px] text-[#f7f3e8]">Player names</span>
              <ChevronDown
                size={14}
                strokeWidth={2.5}
                className={`shrink-0 text-[#bbf7d0] transition-transform ${
                  namesExpanded ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
            {namesExpanded ? (
              <>
                <div className="mb-3 flex flex-col gap-2">
                  {Array.from({ length: playerCount }, (_, i) => (
                    <label key={i} className="flex flex-col gap-1">
                      <span className="text-[7px] text-[#bbf7d0]">
                        {namePlaceholder(playMode, i)}
                      </span>
                      <input
                        type="text"
                        value={playerNames[i] || ''}
                        onChange={(e) => applyPlayerName(i, e.target.value)}
                        placeholder={namePlaceholder(playMode, i)}
                        maxLength={MAX_NAME_LEN}
                        className="edu-control w-full rounded-sm border-2 border-[#064a29] bg-[#085530] px-2 py-1.5 text-[10px] text-[#f7f3e8] outline-none placeholder:text-[#86efac]/70 focus:border-[#fbbf24]"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </label>
                  ))}
                </div>
                <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
                  Names update right away and are saved for the next deal.
                </p>
              </>
            ) : (
              <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
                Tap to edit names.
              </p>
            )}

            <p className="mb-2 text-[9px] text-[#f7f3e8]">Capture size</p>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  bookSize === 2 ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyBookSize(2)}
                aria-pressed={bookSize === 2}
              >
                2 · Pairs
              </button>
              <button
                type="button"
                className={`edu-control arcade-btn ${
                  bookSize === 4 ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applyBookSize(4)}
                aria-pressed={bookSize === 4}
              >
                4 · Whole set
              </button>
            </div>
            <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
              How many matching cards make a book. Changing this starts a new
              game.
            </p>

            <p className="mb-2 text-[9px] text-[#f7f3e8]">Card back</p>
            <div className="grid grid-cols-3 gap-2">
              {CARD_BACK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`edu-control arcade-card-back-option ${
                    cardBack === opt.id ? 'arcade-card-back-option-active' : ''
                  }`}
                  onClick={() => chooseCardBack(opt.id)}
                  title={opt.label}
                  aria-label={`Card back: ${opt.label}`}
                  aria-pressed={cardBack === opt.id}
                >
                  <span className="arcade-card-back-option-art">
                    <CardBackArt id={opt.id} />
                  </span>
                  <span className="mt-1 block text-[7px] leading-tight text-[#f7f3e8]">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {matchReveal && !isAnnouncer ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div
            className="arcade-gofish-match-reveal arcade-panel px-5 py-4 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="mb-3 text-[10px] leading-relaxed text-[#f7f3e8]">
              {matchReveal.title}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {matchReveal.cards.map((card) => (
                <SolitaireCard
                  key={card.id}
                  card={{ ...card, faceUp: true }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {bookCenterReveal && !isAnnouncer ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div
            className="arcade-gofish-match-reveal arcade-panel px-5 py-4 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="mb-3 text-[10px] leading-relaxed text-[#f7f3e8]">
              {bookCenterReveal.name} booked {bookLabel(bookCenterReveal.rank)}!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {bookCenterReveal.cards.map((card) => (
                <SolitaireCard
                  key={card.id}
                  card={{ ...card, faceUp: true }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {goFishFlash && !isAnnouncer ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="arcade-gofish-callout arcade-panel px-6 py-5 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-[16px] leading-none text-[#f7f3e8]">Go Fish!</p>
            <div className="mt-3 flex justify-center">
              <PixelFish />
            </div>
          </div>
        </div>
      ) : null}

      {showPass ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div
            className="arcade-panel max-w-sm px-5 py-5 text-center"
            role="dialog"
            aria-label="Pass device"
          >
            <p className="text-[12px] leading-relaxed text-[#f7f3e8]">
              Pass to {game.players[game.currentPlayer].name}
            </p>
            <p className="mt-3 text-[8px] leading-relaxed text-[#bbf7d0]">
              Hide the screen, hand it over, then continue.
            </p>
            <button
              type="button"
              className="edu-control arcade-btn arcade-btn-primary mt-4"
              onClick={() => setGame(beginTurn(game))}
            >
              Ready
            </button>
          </div>
        </div>
      ) : null}

      {game.won ? (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="arcade-win-banner pointer-events-auto px-6 py-5 text-center">
            <p className="text-[12px] leading-relaxed">
              {game.winners.length === 1 ? 'YOU WIN!' : 'TIE!'}
            </p>
            <p className="mt-2 text-[8px] leading-relaxed">{game.lastEvent}</p>
            <button
              type="button"
              className="edu-control arcade-btn arcade-btn-primary mt-4"
              onClick={() => newGame()}
            >
              Play again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
