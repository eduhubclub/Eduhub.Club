import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, BookOpen, Lightbulb, RotateCcw, Settings, Shuffle, X } from 'lucide-react';
import {
  autoFinishStep,
  dealKlondike,
  drawFromStock,
  findHint,
  getMovableStack,
  getSelectedCards,
  isClearedForAutoFinish,
  isNoMovesLeft,
  scoreDelta,
  tryAutoFoundation,
  tryMove,
} from './solitaireLogic';
import { EmptySlot, SolitaireCard } from './SolitaireCard';
import {
  CARD_BACK_OPTIONS,
  CardBackArt,
  DEFAULT_CARD_BACK,
} from './cardBacks';
import { SolitaireLearnPanel } from './SolitaireLearnPanel';
import './Solitaire.css';

const FULLSCREEN_Z = 'z-[240]';
const DRAG_THRESHOLD = 8;
const CARD_BACK_STORAGE_KEY = 'edu-arcade-solitaire-card-back';
const SHOW_SCORE_STORAGE_KEY = 'edu-arcade-solitaire-show-score';
const SHOW_TIME_STORAGE_KEY = 'edu-arcade-solitaire-show-time';

function sameSelection(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'waste') return true;
  if (a.type === 'foundation') return a.index === b.index;
  return a.col === b.col && a.index === b.index;
}

function parseDropTarget(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  const zone = el?.closest?.('[data-solitaire-drop]');
  if (!zone) return null;
  try {
    return JSON.parse(zone.getAttribute('data-solitaire-drop'));
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

function readBoardScaleVars(el) {
  if (!el) return {};
  const s = getComputedStyle(el);
  const keys = [
    '--arcade-card-w',
    '--arcade-card-h',
    '--arcade-peek',
    '--arcade-waste-peek',
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
 * Pixel-style Klondike Solitaire board.
 */
export function SolitaireView({ isDarkMode }) {
  const [game, setGame] = useState(() => dealKlondike());
  const [selection, setSelection] = useState(null);
  const [history, setHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isStuckOpen, setIsStuckOpen] = useState(false);
  const [isAutoFinishOpen, setIsAutoFinishOpen] = useState(false);
  const [isAutoFinishing, setIsAutoFinishing] = useState(false);
  const [drawMode, setDrawMode] = useState(1);
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
  /** @type {null | { selection: object, cards: object[], left: number, top: number, originLeft: number, originTop: number, returning: boolean, scaleVars?: Record<string, string> }} */
  const [drag, setDrag] = useState(null);
  /** Highlighted hint destination or stock draw */
  const [hintTarget, setHintTarget] = useState(null);

  const gameRef = useRef(game);
  const scoreRef = useRef(0);
  const dragSessionRef = useRef(null);
  const ghostRef = useRef(null);
  const playBoardRef = useRef(null);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const hintClearTimerRef = useRef(null);
  const autoFinishDismissedRef = useRef(false);
  const autoFinishTimerRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (hintClearTimerRef.current != null) {
        window.clearTimeout(hintClearTimerRef.current);
      }
      if (autoFinishTimerRef.current != null) {
        window.clearTimeout(autoFinishTimerRef.current);
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

  // Fullscreen is desktop/tablet only — drop it on phone widths.
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
    if (game.won || isAutoFinishing) return undefined;
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [game.won, isAutoFinishing, timerEpoch]);

  const syncEndgamePrompts = useCallback((next) => {
    if (!next || next.won) {
      setIsStuckOpen(false);
      setIsAutoFinishOpen(false);
      return;
    }
    if (
      isClearedForAutoFinish(next) &&
      !autoFinishDismissedRef.current
    ) {
      setIsStuckOpen(false);
      setIsAutoFinishOpen(true);
      return;
    }
    setIsAutoFinishOpen(false);
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
      syncEndgamePrompts(next);
      return true;
    },
    [clearHintLines, syncEndgamePrompts],
  );

  const commit = useCallback(
    (next) => applyMove(next),
    [applyMove],
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

    const hint = findHint(game);
    if (!hint) {
      setHintTarget(null);
      setSelection(null);
      return;
    }
    if (hint.kind === 'draw') {
      setSelection(null);
      setHintTarget({ type: 'stock' });
    } else {
      setSelection(hint.selection);
      setHintTarget(hint.dest);
    }

    // Match .arcade-hint-pulse: 0.9s × 2 iterations, then drop the lines.
    hintClearTimerRef.current = window.setTimeout(() => {
      hintClearTimerRef.current = null;
      setHintTarget(null);
    }, 1800);
  };

  const clearDrag = useCallback(() => {
    dragSessionRef.current = null;
    setDrag(null);
  }, []);

  /** Swallow only the click from this drag gesture; don't block the next tap. */
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

      // Illegal — animate ghost back to where it was picked up.
      const ghost = ghostRef.current;
      const curLeft = ghost
        ? parseFloat(ghost.style.left) || session.originLeft
        : session.originLeft;
      const curTop = ghost
        ? parseFloat(ghost.style.top) || session.originTop
        : session.originTop;

      setDrag((d) =>
        d
          ? { ...d, left: curLeft, top: curTop, returning: true }
          : null,
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
          session.scaleVars = scaleVars;
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

  const newGame = (nextDrawMode = drawMode) => {
    if (autoFinishTimerRef.current != null) {
      window.clearTimeout(autoFinishTimerRef.current);
      autoFinishTimerRef.current = null;
    }
    clearDrag();
    clearHintLines();
    autoFinishDismissedRef.current = false;
    setIsAutoFinishing(false);
    setIsAutoFinishOpen(false);
    setIsStuckOpen(false);
    setGame(dealKlondike(Math.random, { drawMode: nextDrawMode }));
    setSelection(null);
    setHistory([]);
    setScore(0);
    scoreRef.current = 0;
    setElapsedSec(0);
    setTimerEpoch((n) => n + 1);
  };

  const applyDrawMode = (mode) => {
    const next = mode === 3 ? 3 : 1;
    setDrawMode(next);
    setGame((g) => (g.drawMode === next ? g : { ...g, drawMode: next }));
  };

  const undo = () => {
    if (isAutoFinishing) return;
    clearDrag();
    clearHintLines();
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setGame(prev.game);
      setScore(prev.score);
      scoreRef.current = prev.score;
      if (prev.game?.drawMode) setDrawMode(prev.game.drawMode);
      setSelection(null);
      syncEndgamePrompts(prev.game);
      return h.slice(0, -1);
    });
  };

  const dismissAutoFinish = () => {
    autoFinishDismissedRef.current = true;
    setIsAutoFinishOpen(false);
  };

  const runComputerFinish = () => {
    if (isAutoFinishing) return;
    setIsAutoFinishOpen(false);
    setIsLearnOpen(false);
    setIsSettingsOpen(false);
    clearDrag();
    clearHintLines();
    setSelection(null);

    const startGame = gameRef.current;
    const startScore = scoreRef.current;
    setHistory((h) => [...h, { game: startGame, score: startScore }]);
    setIsAutoFinishing(true);

    const tick = () => {
      const cur = gameRef.current;
      if (cur.won) {
        setIsAutoFinishing(false);
        autoFinishTimerRef.current = null;
        return;
      }
      const step = autoFinishStep(cur);
      if (!step) {
        setIsAutoFinishing(false);
        autoFinishTimerRef.current = null;
        setIsStuckOpen(isNoMovesLeft(cur));
        return;
      }
      const nextScore = Math.max(0, scoreRef.current + scoreDelta(cur, step));
      setGame(step);
      setScore(nextScore);
      scoreRef.current = nextScore;
      if (step.won) {
        setIsAutoFinishing(false);
        autoFinishTimerRef.current = null;
        setIsStuckOpen(false);
        setIsAutoFinishOpen(false);
        return;
      }
      autoFinishTimerRef.current = window.setTimeout(tick, 140);
    };

    autoFinishTimerRef.current = window.setTimeout(tick, 80);
  };

  const selectedCards = getSelectedCards(game, selection);
  const selectedIds = new Set(selectedCards.map((c) => c.id));
  const dragIds = new Set(drag?.cards.map((c) => c.id) || []);

  const hintStock = hintTarget?.type === 'stock';
  const hintFoundation =
    hintTarget?.type === 'foundation' ? hintTarget.index : null;
  const hintTableauCol =
    hintTarget?.type === 'tableau' ? hintTarget.col : null;

  const clearSelection = useCallback(() => {
    setSelection(null);
    clearHintLines();
  }, [clearHintLines]);

  const onPlayAreaClick = (e) => {
    // Click on felt / empty board chrome — not cards, slots, or overlays.
    if (e.target.closest('.arcade-card, .arcade-slot, .arcade-panel, button, a')) {
      return;
    }
    clearSelection();
  };

  const attemptPlay = (dest) => {
    if (!selection) return false;
    return commit(tryMove(game, selection, dest));
  };

  const onStockClick = guardClick(() => {
    commit(drawFromStock(game));
  });

  const onWasteClick = guardClick(() => {
    if (!game.waste.length) return;
    const sel = { type: 'waste' };
    if (selection && sameSelection(selection, sel)) {
      const auto = tryAutoFoundation(game, sel);
      if (auto) commit(auto);
      else clearSelection();
      return;
    }
    setSelection(sel);
  });

  const onFoundationClick = (index) =>
    guardClick(() => {
      const dest = { type: 'foundation', index };
      if (selection) {
        if (sameSelection(selection, dest)) {
          clearSelection();
          return;
        }
        if (attemptPlay(dest)) return;
        // Illegal drop target — deselect (e.g. after a hint).
        clearSelection();
        return;
      }
      if (game.foundations[index].length) setSelection(dest);
      else clearSelection();
    });

  const onTableauCardClick = (col, index) =>
    guardClick(() => {
      const card = game.tableau[col][index];
      if (!card.faceUp) {
        clearSelection();
        return;
      }

      const sel = { type: 'tableau', col, index };

      if (selection && sameSelection(selection, sel)) {
        const auto = tryAutoFoundation(game, sel);
        if (auto) commit(auto);
        else clearSelection();
        return;
      }

      if (selection && attemptPlay({ type: 'tableau', col })) return;

      setSelection(sel);
    });

  const onTableauEmptyClick = (col) =>
    guardClick(() => {
      if (selection) {
        if (attemptPlay({ type: 'tableau', col })) return;
      }
      clearSelection();
    });

  const wasteFanCount = (game.drawMode || drawMode) === 3 ? 3 : 1;
  const wasteVisible = game.waste.slice(-wasteFanCount);
  const titleLabel = game.won ? 'YOU WIN!' : 'Solitaire';

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

  const closePanels = () => {
    setIsSettingsOpen(false);
    setIsLearnOpen(false);
  };

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
            disabled={!history.length}
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
          className={`arcade-play-board relative ${
            showScore || showTime ? 'pt-5' : ''
          } ${isAutoFinishing ? 'pointer-events-none' : ''}`}
        >
        {showScore || showTime ? (
          <div className="pointer-events-none absolute right-0 top-0 z-20 flex flex-wrap items-center justify-end gap-3 text-[9px] leading-none text-[#bbf7d0]">
            {showScore ? (
              <span>
                Score{' '}
                <span className="text-[#fbbf24]">{score}</span>
              </span>
            ) : null}
            {showTime ? (
              <span>
                Time{' '}
                <span className="text-[#fbbf24]">{formatTime(elapsedSec)}</span>
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="arcade-deal-row relative z-10 mb-4 flex flex-nowrap items-start justify-between pb-1 sm:mb-6">
          <div className="flex shrink-0" style={{ gap: 'var(--arcade-deal-gap)' }}>
            {game.stock.length ? (
              <SolitaireCard
                card={{ id: 'stock', faceUp: false }}
                onClick={onStockClick}
                className={hintStock ? 'arcade-hint-pulse' : ''}
                cardBack={cardBack}
              />
            ) : (
              <EmptySlot
                onClick={onStockClick}
                label={game.waste.length ? 'Recycle waste' : 'Empty stock'}
                className={hintStock ? 'arcade-hint-pulse' : ''}
              />
            )}
            {wasteVisible.length ? (
              <div
                className="relative"
                style={{
                  width: `calc(var(--arcade-card-w) + ${Math.max(0, wasteVisible.length - 1)} * var(--arcade-waste-peek))`,
                  height: 'var(--arcade-card-h)',
                  flex: '0 0 auto',
                }}
              >
                {wasteVisible.map((card, i) => {
                  const isTop = i === wasteVisible.length - 1;
                  return (
                    <div
                      key={card.id}
                      className="absolute top-0"
                      style={{
                        left: `calc(${i} * var(--arcade-waste-peek))`,
                        zIndex: i,
                      }}
                    >
                      <SolitaireCard
                        card={card}
                        selected={isTop && selectedIds.has(card.id)}
                        dragSource={isTop && dragIds.has(card.id)}
                        onClick={isTop ? onWasteClick : undefined}
                        onPointerDown={
                          isTop
                            ? (e) => startDrag(e, { type: 'waste' })
                            : undefined
                        }
                        cardBack={cardBack}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptySlot onClick={clearSelection} label="Waste" />
            )}
          </div>

          <div className="flex shrink-0" style={{ gap: 'var(--arcade-deal-gap)' }}>
            {game.foundations.map((pile, i) => {
              const top = pile[pile.length - 1];
              const drop = {
                'data-solitaire-drop': JSON.stringify({
                  type: 'foundation',
                  index: i,
                }),
              };
              return top ? (
                <div key={`f-${i}`} {...drop}>
                  <SolitaireCard
                    card={top}
                    selected={
                      selection?.type === 'foundation' && selection.index === i
                    }
                    dragSource={dragIds.has(top.id)}
                    onClick={onFoundationClick(i)}
                    onPointerDown={(e) =>
                      startDrag(e, { type: 'foundation', index: i })
                    }
                    className={
                      hintFoundation === i ? 'arcade-hint-pulse' : ''
                    }
                    cardBack={cardBack}
                  />
                </div>
              ) : (
                <EmptySlot
                  key={`f-${i}`}
                  label={`Foundation ${i + 1}`}
                  onClick={onFoundationClick(i)}
                  dropAttrs={drop}
                  className={hintFoundation === i ? 'arcade-hint-pulse' : ''}
                />
              );
            })}
          </div>
        </div>

        <div className="arcade-tableau-row relative z-10 flex justify-center px-0 pb-8 pt-1">
          {game.tableau.map((column, col) => (
            <div
              key={`t-${col}`}
              className="relative"
              data-solitaire-drop={JSON.stringify({ type: 'tableau', col })}
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
                        ['--stack-n']: String(
                          column.length - selection.index,
                        ),
                      }}
                    />
                  ) : null}
                  {column.map((card, index) => {
                    const isInSelection = selectedIds.has(card.id);
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
                            isInSelection || dragIds.has(card.id)
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

        {isAutoFinishOpen && !game.won && !isAutoFinishing ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
            <div
              className="arcade-panel pointer-events-auto max-w-sm px-5 py-5 text-center"
              role="dialog"
              aria-label="Computer finish"
            >
              <p className="text-[12px] leading-relaxed text-[#f7f3e8]">
                All clear!
              </p>
              <p className="mt-3 text-[8px] leading-relaxed text-[#bbf7d0]">
                Every card is face-up. Want the computer to finish the game for
                you?
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="edu-control arcade-btn"
                  onClick={dismissAutoFinish}
                >
                  I&apos;ll finish
                </button>
                <button
                  type="button"
                  className="edu-control arcade-btn arcade-btn-primary"
                  onClick={runComputerFinish}
                >
                  Computer finish
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isStuckOpen && !game.won && !isAutoFinishOpen && !isAutoFinishing ? (
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
                This deal is stuck. Start a new game, or Undo if you want to try
                another path.
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

      {isSettingsOpen ? (
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

          <p className="mb-2 text-[9px] text-[#f7f3e8]">Display</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control arcade-btn ${
                showScore ? 'arcade-btn-primary' : ''
              }`}
              onClick={toggleShowScore}
              aria-pressed={showScore}
            >
              Score
            </button>
            <button
              type="button"
              className={`edu-control arcade-btn ${
                showTime ? 'arcade-btn-primary' : ''
              }`}
              onClick={toggleShowTime}
              aria-pressed={showTime}
            >
              Time
            </button>
          </div>

          <p className="mb-2 text-[9px] text-[#f7f3e8]">Deal mode</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control arcade-btn ${
                (game.drawMode || drawMode) === 1 ? 'arcade-btn-primary' : ''
              }`}
              onClick={() => applyDrawMode(1)}
            >
              Deal One
            </button>
            <button
              type="button"
              className={`edu-control arcade-btn ${
                (game.drawMode || drawMode) === 3 ? 'arcade-btn-primary' : ''
              }`}
              onClick={() => applyDrawMode(3)}
            >
              Deal Three
            </button>
          </div>
          <p className="mb-3 text-[8px] leading-relaxed text-[#bbf7d0]">
            Applies to the next draw from the stock.
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
      ) : null}

      {isLearnOpen ? (
        <SolitaireLearnPanel
          cardBack={cardBack}
          onClose={() => setIsLearnOpen(false)}
        />
      ) : null}

      {dragGhost}
    </div>
  );

  // Portal out of AppShell’s transform-gpu column so fullscreen covers sidebars + header.
  if (isFullscreen && typeof document !== 'undefined') {
    return (
      <>
        <div className="h-full min-h-0" aria-hidden />
        {createPortal(board, document.body)}
      </>
    );
  }

  return board;
}
