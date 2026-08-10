import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Lightbulb,
  Maximize,
  Minimize,
  RotateCcw,
  Settings,
  Shuffle,
  X,
} from 'lucide-react';
import {
  dealFromStock,
  dealOpening,
  dealSpider,
  findHint,
  getMovableStack,
  getSelectedCards,
  hintKey,
  isNoMovesLeft,
  previewOpeningDeal,
  previewStockDeal,
  scoreDelta,
  tryMove,
} from './spiderLogic';
import { EmptySlot, SolitaireCard } from '../solitaire/SolitaireCard';
import {
  CARD_BACK_OPTIONS,
  CardBackArt,
  DEFAULT_CARD_BACK,
} from '../solitaire/cardBacks';
import { SpiderLearnPanel } from './SpiderLearnPanel';
import '../solitaire/Solitaire.css';

const FULLSCREEN_Z = 'z-[240]';
const DRAG_THRESHOLD = 8;
const DEAL_FLY_MS = 380;
const DEAL_STAGGER_MS = 95;
const OPEN_STAGGER_MS = 68;
/** Wait before pulsing the stock to start an undealt game. */
const DEAL_NUDGE_DELAY_MS = 15000;
/** Matches .arcade-deal-nudge: 1.2s × 3. */
const DEAL_NUDGE_ANIM_MS = 3600;
const CARD_BACK_STORAGE_KEY = 'edu-arcade-solitaire-card-back';
const SHOW_SCORE_STORAGE_KEY = 'edu-arcade-spider-show-score';
const SHOW_TIME_STORAGE_KEY = 'edu-arcade-spider-show-time';
const SUIT_COUNT_STORAGE_KEY = 'edu-arcade-spider-suit-count';

function sameSelection(a, b) {
  if (!a || !b) return false;
  return a.type === b.type && a.col === b.col && a.index === b.index;
}

function parseDropTarget(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const zone = el?.closest?.('[data-spider-drop]');
  if (!zone) return null;
  try {
    return JSON.parse(zone.getAttribute('data-spider-drop'));
  } catch {
    return null;
  }
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

function readStoredFlag(key, fallback = true) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeStoredFlag(key, value) {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function readSuitCount() {
  try {
    const raw = Number(window.localStorage.getItem(SUIT_COUNT_STORAGE_KEY));
    if (raw === 1 || raw === 2 || raw === 4) return raw;
  } catch {
    /* ignore */
  }
  return 1;
}

function writeSuitCount(n) {
  try {
    window.localStorage.setItem(SUIT_COUNT_STORAGE_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function readBoardScaleVars(el) {
  if (!el) return {};
  const s = getComputedStyle(el);
  const keys = [
    '--arcade-card-w',
    '--arcade-card-h',
    '--arcade-peek',
    '--arcade-card-radius',
    '--arcade-card-border',
    '--arcade-card-shadow',
    '--arcade-pip',
    '--arcade-pip-dense',
    '--arcade-index-rank',
    '--arcade-index-suit',
  ];
  const vars = {};
  for (const key of keys) {
    const v = s.getPropertyValue(key).trim();
    if (v) vars[key] = v;
  }
  return vars;
}

/**
 * Pixel-style Spider Solitaire board.
 */
export function SpiderView({ isDarkMode }) {
  const [suitCount, setSuitCount] = useState(readSuitCount);
  const [game, setGame] = useState(() => dealSpider(Math.random, { suitCount: readSuitCount() }));
  const [selection, setSelection] = useState(null);
  const [history, setHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isStuckOpen, setIsStuckOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [cardBack, setCardBack] = useState(readStoredCardBack);
  const [showScore, setShowScore] = useState(() =>
    readStoredFlag(SHOW_SCORE_STORAGE_KEY, true),
  );
  const [showTime, setShowTime] = useState(() =>
    readStoredFlag(SHOW_TIME_STORAGE_KEY, true),
  );
  const [drag, setDrag] = useState(null);
  const [hintTarget, setHintTarget] = useState(null);
  const [dealBlockedMsg, setDealBlockedMsg] = useState(null);
  const [isDealing, setIsDealing] = useState(false);
  const [showDealNudge, setShowDealNudge] = useState(false);
  /** @type {null | Array<{ key: string, left: number, top: number, dx: number, dy: number, card: object }>} */
  const [flyingDeals, setFlyingDeals] = useState(null);
  const dealBlockedTimerRef = useRef(null);

  const gameRef = useRef(game);
  const scoreRef = useRef(0);
  const dragSessionRef = useRef(null);
  const ghostRef = useRef(null);
  const playBoardRef = useRef(null);
  const stockRef = useRef(null);
  const columnRefs = useRef(Array.from({ length: 10 }, () => null));
  const dealingRef = useRef(false);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const hintClearTimerRef = useRef(null);
  /** Recently shown hint keys so Hint cycles without repeating. */
  const hintSeenRef = useRef([]);
  const hintBoardKeyRef = useRef('');

  gameRef.current = game;
  scoreRef.current = score;

  const felt = isDarkMode ? 'arcade-felt-dark' : 'arcade-felt';

  const clearHintLines = useCallback(() => {
    if (hintClearTimerRef.current != null) {
      window.clearTimeout(hintClearTimerRef.current);
      hintClearTimerRef.current = null;
    }
    setHintTarget(null);
  }, []);

  const resetHintCycle = useCallback(() => {
    hintSeenRef.current = [];
    hintBoardKeyRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      if (hintClearTimerRef.current != null) {
        window.clearTimeout(hintClearTimerRef.current);
      }
      if (dealBlockedTimerRef.current != null) {
        window.clearTimeout(dealBlockedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      if (mq.matches) setIsFullscreen(false);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (game.won || !game.dealt) return undefined;
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [game.won, game.dealt, timerEpoch]);

  // After 15s undealt, nudge the stock with 3 yellow outline fades.
  useEffect(() => {
    if (game.dealt || isDealing || game.won) {
      setShowDealNudge(false);
      return undefined;
    }
    setShowDealNudge(false);
    const startId = window.setTimeout(() => {
      setShowDealNudge(true);
    }, DEAL_NUDGE_DELAY_MS);
    return () => window.clearTimeout(startId);
  }, [game.dealt, isDealing, game.won, timerEpoch]);

  useEffect(() => {
    if (!showDealNudge) return undefined;
    const endId = window.setTimeout(() => {
      setShowDealNudge(false);
    }, DEAL_NUDGE_ANIM_MS);
    return () => window.clearTimeout(endId);
  }, [showDealNudge]);

  const syncStuck = useCallback((next) => {
    if (!next || next.won || !next.dealt) {
      setIsStuckOpen(false);
      return;
    }
    setIsStuckOpen(isNoMovesLeft(next));
  }, []);

  const applyMove = useCallback(
    (next) => {
      if (!next) return false;
      const prev = gameRef.current;
      const prevScore = scoreRef.current;
      const nextScore = Math.max(0, prevScore + scoreDelta(prev, next));
      setHistory((h) => [...h, { game: prev, score: prevScore }]);
      setGame(next);
      setScore(nextScore);
      scoreRef.current = nextScore;
      setSelection(null);
      clearHintLines();
      resetHintCycle();
      syncStuck(next);
      return true;
    },
    [clearHintLines, resetHintCycle, syncStuck],
  );

  const chooseCardBack = (id) => {
    setCardBack(id);
    try {
      window.localStorage.setItem(CARD_BACK_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const toggleShowScore = () => {
    setShowScore((v) => {
      const next = !v;
      writeStoredFlag(SHOW_SCORE_STORAGE_KEY, next);
      return next;
    });
  };

  const toggleShowTime = () => {
    setShowTime((v) => {
      const next = !v;
      writeStoredFlag(SHOW_TIME_STORAGE_KEY, next);
      return next;
    });
  };

  const showHint = () => {
    setIsLearnOpen(false);
    setIsSettingsOpen(false);
    if (hintClearTimerRef.current != null) {
      window.clearTimeout(hintClearTimerRef.current);
      hintClearTimerRef.current = null;
    }

    const boardKey = `${game.foundations.length}|${game.stock.length}|${game.tableau
      .map((c) => c.map((card) => `${card.id}:${card.faceUp ? 1 : 0}`).join(','))
      .join(';')}`;
    if (boardKey !== hintBoardKeyRef.current) {
      hintBoardKeyRef.current = boardKey;
      hintSeenRef.current = [];
    }

    const hint = findHint(game, hintSeenRef.current);
    if (!hint) {
      setHintTarget(null);
      setSelection(null);
      return;
    }

    const key = hintKey(hint);
    if (key) {
      const alreadyExhausted = hintSeenRef.current.includes(key);
      hintSeenRef.current = alreadyExhausted
        ? [key]
        : [...hintSeenRef.current, key];
    }

    if (hint.kind === 'deal') {
      setSelection(null);
      setHintTarget({ type: 'stock' });
    } else {
      setSelection(hint.selection);
      setHintTarget(hint.dest);
    }

    hintClearTimerRef.current = window.setTimeout(() => {
      hintClearTimerRef.current = null;
      setHintTarget(null);
    }, 1800);
  };

  const clearDrag = useCallback(() => {
    dragSessionRef.current = null;
    setDrag(null);
  }, []);

  const armClickSuppress = useCallback(() => {
    didDragRef.current = true;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      didDragRef.current = false;
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const finishDrag = useCallback(
    (clientX, clientY) => {
      const session = dragSessionRef.current;
      if (!session?.active) {
        clearDrag();
        return;
      }

      const dest = parseDropTarget(clientX, clientY);
      const next = dest
        ? tryMove(gameRef.current, session.selection, dest)
        : null;

      if (next) {
        applyMove(next);
        clearDrag();
        armClickSuppress();
        return;
      }

      const ghost = ghostRef.current;
      const curLeft = ghost
        ? parseFloat(ghost.style.left) || session.originLeft
        : session.originLeft;
      const curTop = ghost
        ? parseFloat(ghost.style.top) || session.originTop
        : session.originTop;

      setDrag((d) =>
        d ? { ...d, left: curLeft, top: curTop, returning: true } : null,
      );

      const settle = () => {
        if (dragSessionRef.current === session) clearDrag();
      };

      requestAnimationFrame(() => {
        const node = ghostRef.current;
        if (!node) {
          settle();
          return;
        }
        node.style.left = `${curLeft}px`;
        node.style.top = `${curTop}px`;
        void node.offsetWidth;
        node.classList.add('arcade-drag-returning');
        node.style.left = `${session.originLeft}px`;
        node.style.top = `${session.originTop}px`;
        node.addEventListener('transitionend', settle, { once: true });
        window.setTimeout(settle, 280);
      });

      armClickSuppress();
    },
    [clearDrag, applyMove, armClickSuppress],
  );

  const startDrag = useCallback(
    (event, sel) => {
      if (event.button != null && event.button !== 0) return;
      const cards = getSelectedCards(gameRef.current, sel);
      if (!cards.length) return;

      const originEl = event.currentTarget;
      const rect = originEl.getBoundingClientRect();
      const pointerId = event.pointerId;

      didDragRef.current = false;
      suppressClickRef.current = false;

      dragSessionRef.current = {
        selection: sel,
        cards,
        pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: rect.left,
        originTop: rect.top,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        active: false,
      };

      const onMove = (e) => {
        const session = dragSessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;

        const dx = e.clientX - session.startX;
        const dy = e.clientY - session.startY;

        if (!session.active) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          session.active = true;
          didDragRef.current = true;
          suppressClickRef.current = true;
          setSelection(sel);
          const left = e.clientX - session.offsetX;
          const top = e.clientY - session.offsetY;
          const scaleVars = readBoardScaleVars(playBoardRef.current);
          setDrag({
            selection: sel,
            cards: session.cards,
            left,
            top,
            originLeft: session.originLeft,
            originTop: session.originTop,
            returning: false,
            scaleVars,
          });
          try {
            originEl.setPointerCapture(pointerId);
          } catch {
            /* ignore */
          }
          return;
        }

        e.preventDefault();
        const left = e.clientX - session.offsetX;
        const top = e.clientY - session.offsetY;
        if (ghostRef.current) {
          ghostRef.current.style.left = `${left}px`;
          ghostRef.current.style.top = `${top}px`;
        }
      };

      const onUp = (e) => {
        const session = dragSessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        try {
          originEl.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
        if (session.active) {
          finishDrag(e.clientX, e.clientY);
        } else {
          dragSessionRef.current = null;
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [finishDrag],
  );

  const guardClick = (handler) => (e) => {
    if (suppressClickRef.current || didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      didDragRef.current = false;
      return;
    }
    handler(e);
  };

  const newGame = (nextSuit = suitCount) => {
    dealingRef.current = false;
    setIsDealing(false);
    setFlyingDeals(null);
    clearDrag();
    clearHintLines();
    resetHintCycle();
    setIsStuckOpen(false);
    setDealBlockedMsg(null);
    setGame(dealSpider(Math.random, { suitCount: nextSuit }));
    setSelection(null);
    setHistory([]);
    setScore(0);
    scoreRef.current = 0;
    setElapsedSec(0);
    setTimerEpoch((n) => n + 1);
  };

  const applySuitCount = (n) => {
    const next = n === 2 || n === 4 ? n : 1;
    setSuitCount(next);
    writeSuitCount(next);
    newGame(next);
  };

  const undo = () => {
    clearDrag();
    clearHintLines();
    resetHintCycle();
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setGame(prev.game);
      setScore(prev.score);
      scoreRef.current = prev.score;
      if (prev.game?.suitCount) setSuitCount(prev.game.suitCount);
      setSelection(null);
      syncStuck(prev.game);
      return h.slice(0, -1);
    });
  };

  const clearSelection = () => setSelection(null);

  const attemptPlay = (dest) => {
    if (!selection) return false;
    return applyMove(tryMove(gameRef.current, selection, dest));
  };

  const flashDealBlocked = (msg) => {
    setDealBlockedMsg(msg);
    if (dealBlockedTimerRef.current != null) {
      window.clearTimeout(dealBlockedTimerRef.current);
    }
    dealBlockedTimerRef.current = window.setTimeout(() => {
      dealBlockedTimerRef.current = null;
      setDealBlockedMsg(null);
    }, 2200);
  };

  const runOpeningDeal = useCallback(async () => {
    if (dealingRef.current) return;
    const cur = gameRef.current;
    const preview = previewOpeningDeal(cur);
    const next = dealOpening(cur);
    if (!next || !preview) return;

    dealingRef.current = true;
    setIsDealing(true);
    setDealBlockedMsg(null);
    setSelection(null);
    clearDrag();
    clearHintLines();

    const boardEl = playBoardRef.current;
    const stockEl = stockRef.current;
    const board = boardEl?.getBoundingClientRect();
    const from = stockEl?.getBoundingClientRect();
    const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));
    const nextFrame = () =>
      new Promise((r) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(r));
      });

    await nextFrame();

    // Landed cards only — in-flight cards use pendingByCol for destinations.
    const live = {
      ...cur,
      stock: [...cur.stock],
      tableau: Array.from({ length: 10 }, () => []),
    };
    const pendingByCol = Array.from({ length: 10 }, () => 0);
    /** @type {Array<{ key: string, left: number, top: number, dx: number, dy: number, card: object, w: number, h: number }>} */
    let flies = [];

    const syncLiveBoard = () => {
      setGame({
        ...live,
        stock: live.stock.map((c) => ({ ...c })),
        tableau: live.tableau.map((colCards) =>
          colCards.map((c) => ({ ...c })),
        ),
        dealt: false,
      });
    };

    if (board && from) {
      const cardW = from.width || 64;
      const cardH = from.height || 90;
      const fromX = from.left - board.left;
      const fromY = from.top - board.top;
      const peek =
        Number.parseFloat(
          getComputedStyle(playBoardRef.current).getPropertyValue(
            '--arcade-peek',
          ),
        ) || 14;

      const landPromises = [];

      for (let i = 0; i < preview.length; i += 1) {
        const { col, card } = preview[i];
        const pileLen = live.tableau[col].length + pendingByCol[col];
        const colEl = columnRefs.current[col];
        const to = colEl?.getBoundingClientRect();
        let dx = (col - 4.5) * (cardW + 8);
        let dy = 120 + pileLen * 12;
        if (to) {
          dx = to.left - board.left - fromX;
          dy = to.top - board.top + pileLen * peek - fromY;
        }

        const key = `open-${card.id}-${i}`;
        const fly = {
          key,
          left: fromX,
          top: fromY,
          dx,
          dy,
          card,
          w: cardW,
          h: cardH,
        };
        flies = [...flies.slice(-7), fly];
        pendingByCol[col] += 1;
        live.stock.shift();
        setFlyingDeals(flies);
        syncLiveBoard();

        // Place on the tableau only after the fly finishes.
        landPromises.push(
          wait(DEAL_FLY_MS).then(() => {
            live.tableau[col] = [...live.tableau[col], { ...card }];
            pendingByCol[col] = Math.max(0, pendingByCol[col] - 1);
            setFlyingDeals((prev) => {
              const nextFlies = (prev || []).filter((f) => f.key !== key);
              flies = nextFlies;
              return nextFlies.length ? nextFlies : null;
            });
            syncLiveBoard();
          }),
        );

        await wait(OPEN_STAGGER_MS);
      }

      await Promise.all(landPromises);
    }

    setFlyingDeals(null);
    setGame(next);
    gameRef.current = next;
    setHistory([]);
    setScore(0);
    scoreRef.current = 0;
    setElapsedSec(0);
    setTimerEpoch((n) => n + 1);
    dealingRef.current = false;
    setIsDealing(false);
    syncStuck(next);
  }, [clearDrag, clearHintLines, syncStuck]);

  const runStockDeal = useCallback(async () => {
    if (dealingRef.current) return;
    clearHintLines();
    const cur = gameRef.current;
    if (!cur.dealt) {
      await runOpeningDeal();
      return;
    }
    const preview = previewStockDeal(cur);
    const next = dealFromStock(cur);
    if (!next || !preview) {
      if (cur.stock.length >= 10 && cur.tableau.some((col) => !col.length)) {
        flashDealBlocked('Fill empty columns before dealing');
      } else if (!cur.stock.length) {
        flashDealBlocked('No deals left');
      }
      return;
    }

    dealingRef.current = true;
    setIsDealing(true);
    setDealBlockedMsg(null);
    setSelection(null);
    clearDrag();

    const boardEl = playBoardRef.current;
    const stockEl = stockRef.current;
    const board = boardEl?.getBoundingClientRect();
    const from = stockEl?.getBoundingClientRect();

    const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));
    const nextFrame = () =>
      new Promise((r) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(r));
      });

    await nextFrame();

    // Keep pre-deal tableau until each card's fly lands.
    const liveTableau = cur.tableau.map((col) => [...col]);
    let liveStock = [...cur.stock];
    /** @type {Array<object>} */
    let flies = [];

    if (board && from) {
      const cardW = from.width || 64;
      const cardH = from.height || 90;
      const fromX = from.left - board.left;
      const fromY = from.top - board.top;
      const peek =
        Number.parseFloat(
          getComputedStyle(playBoardRef.current).getPropertyValue(
            '--arcade-peek',
          ),
        ) || 14;
      const landPromises = [];
      const pendingByCol = Array.from({ length: 10 }, () => 0);

      for (let col = 0; col < 10; col += 1) {
        const colEl = columnRefs.current[col];
        const to = colEl?.getBoundingClientRect();
        const pileLen = liveTableau[col].length + pendingByCol[col];
        let dx = (col - 4.5) * (cardW + 8);
        let dy = 120 + pileLen * 12;
        if (to) {
          const destX = to.left - board.left;
          const destY = to.top - board.top + pileLen * peek;
          dx = destX - fromX;
          dy = destY - fromY;
        }

        const dealtCard = preview[col];
        const key = `deal-${dealtCard.id}-${col}`;
        const fly = {
          key,
          left: fromX,
          top: fromY,
          dx,
          dy,
          card: dealtCard,
          w: cardW,
          h: cardH,
        };
        flies = [...flies, fly];
        pendingByCol[col] += 1;
        liveStock = liveStock.slice(1);
        setFlyingDeals([...flies]);
        setGame((g) => ({
          ...g,
          stock: liveStock.map((c) => ({ ...c })),
        }));

        landPromises.push(
          wait(DEAL_FLY_MS).then(() => {
            liveTableau[col] = [...liveTableau[col], { ...dealtCard }];
            pendingByCol[col] = Math.max(0, pendingByCol[col] - 1);
            setFlyingDeals((prev) => {
              const nextFlies = (prev || []).filter((f) => f.key !== key);
              flies = nextFlies;
              return nextFlies.length ? nextFlies : null;
            });
            setGame((g) => ({
              ...g,
              stock: liveStock.map((c) => ({ ...c })),
              tableau: liveTableau.map((colCards) =>
                colCards.map((c) => ({ ...c })),
              ),
            }));
          }),
        );

        await wait(DEAL_STAGGER_MS);
      }

      await Promise.all(landPromises);
    }

    setFlyingDeals(null);
    applyMove(next);
    dealingRef.current = false;
    setIsDealing(false);
  }, [applyMove, clearDrag, clearHintLines, runOpeningDeal]);

  const onStockClick = guardClick(() => {
    if (dealingRef.current || isDealing) return;
    void runStockDeal();
  });

  const onTableauCardClick = (col, index) =>
    guardClick(() => {
      const column = game.tableau[col];
      const card = column[index];
      if (!card?.faceUp) return;

      const sel = { type: 'tableau', col, index };
      if (!getMovableStack(column, index)?.length) return;

      if (selection) {
        if (sameSelection(selection, sel)) {
          clearSelection();
          return;
        }
        if (attemptPlay({ type: 'tableau', col })) return;
      }
      setSelection(sel);
    });

  const onTableauEmptyClick = (col) =>
    guardClick(() => {
      if (selection) {
        if (attemptPlay({ type: 'tableau', col })) return;
      }
      clearSelection();
    });

  const onPlayAreaClick = (e) => {
    if (e.target === e.currentTarget) clearSelection();
  };

  const selectedIds = new Set();
  if (selection) {
    for (const c of getSelectedCards(game, selection)) selectedIds.add(c.id);
  }
  const dragIds = new Set(drag?.cards?.map((c) => c.id) || []);
  const hintStock = hintTarget?.type === 'stock';
  const hintTableauCol =
    hintTarget?.type === 'tableau' ? hintTarget.col : null;

  const closePanels = () => {
    setIsSettingsOpen(false);
    setIsLearnOpen(false);
  };

  const titleLabel = game.won ? 'YOU WIN!' : 'Spider';
  const stockDealsLeft = game.dealt
    ? Math.floor(game.stock.length / 10)
    : Math.floor(Math.max(0, game.stock.length - 54) / 10);

  const dragGhost =
    drag && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={ghostRef}
            className={`arcade-pixel arcade-drag-ghost ${drag.returning ? 'arcade-drag-returning' : ''}`}
            style={{
              left: drag.left,
              top: drag.top,
              ['--stack-n']: String(drag.cards.length),
              height:
                'calc(var(--arcade-card-h) + (var(--stack-n) - 1) * var(--arcade-peek))',
              ...(drag.scaleVars || {}),
            }}
          >
            {drag.cards.map((card, i) => (
              <div
                key={card.id}
                className="absolute"
                style={{
                  top: `calc(${i} * var(--arcade-peek))`,
                  left: 0,
                  zIndex: i,
                }}
              >
                <SolitaireCard card={card} cardBack={cardBack} />
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  const board = (
    <div
      className={`arcade-pixel flex min-h-0 flex-col overflow-hidden pt-3 ${felt} ${
        isFullscreen
          ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none`
          : 'relative h-full rounded-2xl'
      }`}
    >
      <div className="arcade-panel mx-3 flex shrink-0 flex-wrap items-center gap-2 overflow-visible px-3 py-2 sm:mx-4">
        <span className="text-[14px] leading-[1.35] text-[#f7f3e8]">
          {titleLabel}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="edu-control arcade-btn arcade-btn-primary inline-flex items-center gap-2"
            onClick={() => newGame()}
            disabled={isDealing}
            title="New game"
            aria-label="New game"
          >
            <Shuffle size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            className="edu-control arcade-btn inline-flex items-center gap-2"
            onClick={undo}
            disabled={!history.length || isDealing}
            title="Undo"
            aria-label="Undo"
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            className={`edu-control arcade-btn inline-flex items-center gap-2 ${
              hintTarget ? 'arcade-btn-primary' : ''
            }`}
            onClick={showHint}
            disabled={isDealing}
            title="Hint"
            aria-label="Hint"
          >
            <Lightbulb size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Hint</span>
          </button>
          <button
            type="button"
            className={`edu-control arcade-btn inline-flex items-center gap-2 ${
              isLearnOpen ? 'arcade-btn-primary' : ''
            }`}
            onClick={() => {
              setIsLearnOpen((v) => !v);
              setIsSettingsOpen(false);
            }}
            title="Learn / Instructions"
            aria-label="Learn / Instructions"
            aria-expanded={isLearnOpen}
          >
            <BookOpen size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Learn</span>
          </button>
          <button
            type="button"
            className={`edu-control arcade-btn inline-flex items-center gap-2 ${
              isSettingsOpen ? 'arcade-btn-primary' : ''
            }`}
            onClick={() => {
              setIsSettingsOpen((v) => !v);
              setIsLearnOpen(false);
            }}
            title="Settings"
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
          >
            <Settings size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className="edu-control arcade-btn hidden items-center gap-2 md:inline-flex"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? (
              <Minimize size={14} strokeWidth={2.5} />
            ) : (
              <Maximize size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <div
        className="arcade-play-scroll relative min-h-0 flex-1 px-2 pb-2 pt-3 sm:px-3 sm:pb-3 sm:pt-4"
        onClick={onPlayAreaClick}
      >
        <div
          ref={playBoardRef}
          className="arcade-play-board arcade-play-board-spider relative pt-5"
        >
          <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-wrap items-center justify-end gap-3 text-[9px] leading-none text-[#bbf7d0]">
            <span>
              Cleared{' '}
              <span className="text-[#fbbf24]">
                {game.foundations.length}/8
              </span>
            </span>
            {showScore ? (
              <span>
                Score <span className="text-[#fbbf24]">{score}</span>
              </span>
            ) : null}
            {showTime ? (
              <span>
                Time{' '}
                <span className="text-[#fbbf24]">{formatTime(elapsedSec)}</span>
              </span>
            ) : null}
          </div>

          <div className="arcade-deal-row relative z-10 mb-4 flex flex-nowrap items-start justify-between pb-1 sm:mb-6">
            <div className="relative flex shrink-0 flex-col items-center">
              <div className="relative" ref={stockRef}>
                {game.stock.length ? (
                  <SolitaireCard
                    card={{ id: 'stock', faceUp: false }}
                    onClick={onStockClick}
                    className={
                      hintStock
                        ? 'arcade-hint-pulse'
                        : showDealNudge
                          ? 'arcade-deal-nudge'
                          : ''
                    }
                    cardBack={cardBack}
                  />
                ) : (
                  <EmptySlot
                    onClick={onStockClick}
                    label="Empty stock"
                    className={hintStock ? 'arcade-hint-pulse' : ''}
                  />
                )}
                {game.dealt && game.stock.length ? (
                  <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-[#bbf7d0]">
                    ×{stockDealsLeft}
                  </span>
                ) : null}
              </div>
              {dealBlockedMsg ? (
                <span
                  className="mt-5 max-w-[9rem] text-center text-[7px] leading-snug text-[#fbbf24]"
                  role="status"
                >
                  {dealBlockedMsg}
                </span>
              ) : null}
            </div>

            <div
              className="flex shrink-0 flex-nowrap items-start justify-end"
              style={{ gap: 'var(--arcade-deal-gap)' }}
            >
              {Array.from({ length: 8 }, (_, i) => {
                const pile = game.foundations[i];
                const top = pile?.[pile.length - 1];
                return top ? (
                  <SolitaireCard
                    key={`f-${i}`}
                    card={top}
                    cardBack={cardBack}
                  />
                ) : (
                  <EmptySlot
                    key={`f-${i}`}
                    label={`Completed run ${i + 1}`}
                  />
                );
              })}
            </div>
          </div>

          <div
            className={`arcade-tableau-row relative z-10 flex justify-center px-0 pb-8 pt-1 ${
              isDealing || !game.dealt ? 'pointer-events-none' : ''
            }`}
          >
            {game.tableau.map((column, col) => (
              <div
                key={`t-${col}`}
                ref={(el) => {
                  columnRefs.current[col] = el;
                }}
                className="relative"
                data-spider-drop={JSON.stringify({ type: 'tableau', col })}
                style={{
                  width: 'var(--arcade-card-w)',
                  minHeight: `calc(var(--arcade-card-h) + ${Math.max(0, column.length - 1)} * var(--arcade-peek))`,
                  flex: '0 0 auto',
                }}
              >
                {!column.length ? (
                  <EmptySlot
                    onClick={onTableauEmptyClick(col)}
                    label={`Tableau ${col + 1}`}
                    className={
                      hintTableauCol === col ? 'arcade-hint-pulse' : ''
                    }
                  />
                ) : (
                  <>
                    {selection?.type === 'tableau' &&
                    selection.col === col &&
                    !column.some((c) => dragIds.has(c.id)) ? (
                      <div
                        className="arcade-selection-hull"
                        style={{
                          top: `calc(${selection.index} * var(--arcade-peek))`,
                          ['--stack-n']: String(column.length - selection.index),
                        }}
                      />
                    ) : null}
                    {column.map((card, index) => {
                      const movable =
                        card.faceUp &&
                        Boolean(getMovableStack(column, index)?.length);
                      const isHintDest =
                        hintTableauCol === col && index === column.length - 1;
                      return (
                        <div
                          key={card.id}
                          className="absolute left-1/2 -translate-x-1/2"
                          style={{
                            top: `calc(${index} * var(--arcade-peek))`,
                            zIndex:
                              selectedIds.has(card.id) || dragIds.has(card.id)
                                ? 40 + index
                                : index,
                          }}
                        >
                          <SolitaireCard
                            card={card}
                            dragSource={dragIds.has(card.id)}
                            onClick={onTableauCardClick(col, index)}
                            onPointerDown={
                              movable
                                ? (e) =>
                                    startDrag(e, {
                                      type: 'tableau',
                                      col,
                                      index,
                                    })
                                : undefined
                            }
                            className={isHintDest ? 'arcade-hint-pulse' : ''}
                            cardBack={cardBack}
                          />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ))}
          </div>

          {flyingDeals?.length ? (
            <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden>
              {flyingDeals.map((fly) => (
                <div
                  key={fly.key}
                  className="arcade-spider-deal-fly absolute"
                  style={{
                    left: fly.left,
                    top: fly.top,
                    width: fly.w,
                    height: fly.h,
                    '--fly-dx': `${fly.dx}px`,
                    '--fly-dy': `${fly.dy}px`,
                    '--fly-duration': `${DEAL_FLY_MS}ms`,
                  }}
                >
                  <div className="arcade-card arcade-card-back arcade-card-back-art h-full w-full">
                    <span className="arcade-card-back-inner">
                      <CardBackArt id={cardBack} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {game.won ? (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4">
              <div className="arcade-win-banner pointer-events-auto px-6 py-5 text-center">
                <p className="text-[14px] leading-relaxed">YOU WIN!</p>
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

          {isStuckOpen && !game.won ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
              <div
                className="arcade-panel pointer-events-auto max-w-sm px-5 py-5 text-center"
                role="dialog"
                aria-label="No more moves"
              >
                <p className="text-[12px] leading-relaxed text-[#f7f3e8]">
                  No more moves
                </p>
                <p className="mt-3 text-[8px] leading-relaxed text-[#bbf7d0]">
                  No legal moves left, and the stock can&apos;t be dealt. Start a
                  new game, or Undo if you want to try another path.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className="edu-control arcade-btn"
                    onClick={() => setIsStuckOpen(false)}
                  >
                    Keep looking
                  </button>
                  <button
                    type="button"
                    className="edu-control arcade-btn arcade-btn-primary"
                    onClick={() => newGame()}
                  >
                    New game
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isSettingsOpen || isLearnOpen ? (
        <button
          type="button"
          className="absolute inset-0 z-30 cursor-default bg-black/25"
          aria-label="Close panel"
          onClick={closePanels}
        />
      ) : null}

      {isLearnOpen ? (
        <SpiderLearnPanel
          onClose={() => setIsLearnOpen(false)}
          cardBack={cardBack}
        />
      ) : null}

      {isSettingsOpen ? (
        <div
          className="arcade-panel absolute left-1/2 top-1/2 z-40 max-h-[min(80%,32rem)] w-[min(100%-1.5rem,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto px-3 py-3"
          role="dialog"
          aria-label="Spider settings"
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

          <p className="mb-2 text-[9px] text-[#f7f3e8]">Difficulty</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {[1, 2, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={`edu-control arcade-btn ${
                  suitCount === n ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => applySuitCount(n)}
              >
                {n} suit{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <p className="mb-3 text-[7px] leading-relaxed text-[#86efac]">
            Changing suits starts a new deal.
          </p>

          <p className="mb-2 text-[9px] text-[#f7f3e8]">Display</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control arcade-btn ${
                showScore ? 'arcade-btn-primary' : ''
              }`}
              onClick={toggleShowScore}
            >
              Score
            </button>
            <button
              type="button"
              className={`edu-control arcade-btn ${
                showTime ? 'arcade-btn-primary' : ''
              }`}
              onClick={toggleShowTime}
            >
              Time
            </button>
          </div>

          <p className="mb-2 text-[9px] text-[#f7f3e8]">Card back</p>
          <div className="flex flex-wrap gap-2">
            {CARD_BACK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`edu-control arcade-btn ${
                  cardBack === opt.id ? 'arcade-btn-primary' : ''
                }`}
                onClick={() => chooseCardBack(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {dragGhost}
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(board, document.body);
  }
  return board;
}
