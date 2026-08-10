/**
 * Spider Solitaire — pure game state helpers (no React).
 * Reuses suit/rank catalogs and shuffle from Klondike.
 */

import { RANKS, SUITS, shuffle, cloneState } from '../solitaire/solitaireLogic';

export { cloneState };

const SUIT_PRESETS = {
  1: [SUITS[0]], // spades
  2: [SUITS[0], SUITS[1]], // spades + hearts
  4: SUITS,
};

/** Build 104-card Spider deck for 1 / 2 / 4 suit play. */
export function createSpiderDeck(suitCount = 1) {
  const count = suitCount === 2 || suitCount === 4 ? suitCount : 1;
  const suits = SUIT_PRESETS[count];
  const copies = 8 / suits.length; // 8 / 1 = 8, 8 / 2 = 4, 8 / 4 = 2
  const deck = [];
  let n = 0;
  for (let copy = 0; copy < copies; copy += 1) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        deck.push({
          id: `${suit.id}-${rank.id}-${n}`,
          suit: suit.id,
          symbol: suit.symbol,
          color: suit.color,
          rank: rank.id,
          label: rank.label,
          value: rank.value,
          faceUp: false,
        });
        n += 1;
      }
    }
  }
  return deck;
}

/**
 * Fresh Spider game — cards stay in the stock until the opening Deal.
 * Opening layout (after Deal): 6 in first 4 columns, 5 in last 6; 50 remain for 5 deals.
 */
export function dealSpider(random = Math.random, { suitCount = 1 } = {}) {
  const count = suitCount === 2 || suitCount === 4 ? suitCount : 1;
  const deck = shuffle(createSpiderDeck(count), random).map((c) => ({
    ...c,
    faceUp: false,
  }));
  return {
    stock: deck,
    tableau: Array.from({ length: 10 }, () => []),
    foundations: [],
    suitCount: count,
    dealt: false,
    won: false,
  };
}

/** Classic column depths for the opening deal. */
export function openingColumnDepth(col) {
  return col < 4 ? 6 : 5;
}

/**
 * Ordered opening cards for animation: row-major (left→right, then next row).
 * Last card in each column is face-up.
 */
export function previewOpeningDeal(state) {
  if (!state || state.dealt || state.stock.length < 54) return null;
  const cards = [];
  let i = 0;
  const maxDepth = 6;
  for (let row = 0; row < maxDepth; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      if (row >= openingColumnDepth(col)) continue;
      const card = state.stock[i];
      i += 1;
      cards.push({
        col,
        row,
        card: {
          ...card,
          faceUp: row === openingColumnDepth(col) - 1,
        },
      });
    }
  }
  return cards;
}

/** Apply the classic 54-card opening layout from the stock. */
export function dealOpening(state) {
  const preview = previewOpeningDeal(state);
  if (!preview) return null;
  const next = cloneState(state);
  next.tableau = Array.from({ length: 10 }, () => []);
  for (const { col, card } of preview) {
    next.stock.shift();
    next.tableau[col].push({ ...card });
  }
  next.dealt = true;
  next.won = false;
  return next;
}

export function isWon(state) {
  return state.foundations.length >= 8;
}

function topCard(pile) {
  return pile.length ? pile[pile.length - 1] : null;
}

/** Any descending card may land; empty columns take any card. */
export function canDropOnTableau(card, targetPile) {
  if (!card) return false;
  if (!targetPile.length) return true;
  const top = topCard(targetPile);
  if (!top?.faceUp) return false;
  return card.value === top.value - 1;
}

/**
 * Face-up descending same-suit run from `fromIndex` to end of column.
 * Only same-suit sequences are movable (1-suit → every descending run).
 */
export function getMovableStack(column, fromIndex) {
  if (fromIndex < 0 || fromIndex >= column.length) return null;
  if (!column[fromIndex].faceUp) return null;
  for (let i = fromIndex; i < column.length - 1; i += 1) {
    const a = column[i];
    const b = column[i + 1];
    if (!b.faceUp) return null;
    if (a.suit !== b.suit || a.value !== b.value + 1) return null;
  }
  return column.slice(fromIndex);
}

export function getSelectedCards(state, selection) {
  if (!selection || selection.type !== 'tableau') return [];
  const col = state.tableau[selection.col];
  if (!col) return [];
  return getMovableStack(col, selection.index) || [];
}

function flipTop(column) {
  if (!column.length) return;
  const top = column[column.length - 1];
  if (!top.faceUp) top.faceUp = true;
}

/**
 * Remove a completed K→A same-suit run from the end of a column, if present.
 * @returns {boolean} whether a run was removed
 */
export function removeCompletedRun(state, col) {
  const column = state.tableau[col];
  if (!column || column.length < 13) return false;

  const start = column.length - 13;
  const slice = column.slice(start);
  if (!slice.every((c) => c.faceUp)) return false;
  if (slice[0].value !== 13) return false;
  const suit = slice[0].suit;
  for (let i = 0; i < 13; i += 1) {
    if (slice[i].suit !== suit || slice[i].value !== 13 - i) return false;
  }

  const run = column.splice(start, 13);
  state.foundations.push(run);
  flipTop(column);
  return true;
}

function sweepCompletedRuns(state) {
  let removed = false;
  let guard = 0;
  while (guard < 16) {
    guard += 1;
    let any = false;
    for (let col = 0; col < state.tableau.length; col += 1) {
      if (removeCompletedRun(state, col)) {
        any = true;
        removed = true;
      }
    }
    if (!any) break;
  }
  return removed;
}

function finishState(state) {
  sweepCompletedRuns(state);
  state.won = isWon(state);
  return state;
}

function canDealFromStock(state) {
  return (
    Boolean(state?.dealt) &&
    state.stock.length >= 10 &&
    state.tableau.every((col) => col.length > 0)
  );
}

/**
 * Deal one card face-up onto each column (10 cards).
 * Illegal if stock empty or any column is empty.
 */
export function dealFromStock(state) {
  if (!canDealFromStock(state)) return null;

  const next = cloneState(state);
  for (let col = 0; col < 10; col += 1) {
    const card = next.stock.shift();
    card.faceUp = true;
    next.tableau[col].push(card);
  }
  return finishState(next);
}

/** Cards that would be dealt face-up (for deal fly animation). */
export function previewStockDeal(state) {
  if (!canDealFromStock(state)) return null;
  return state.stock.slice(0, 10).map((c) => ({ ...c, faceUp: true }));
}

export { canDealFromStock };

/**
 * Move a movable stack to another tableau column.
 * selection: { type: 'tableau', col, index }
 * dest: { type: 'tableau', col }
 */
export function tryMove(state, selection, dest) {
  if (!state?.dealt) return null;
  if (!selection || !dest) return null;
  if (selection.type !== 'tableau' || dest.type !== 'tableau') return null;
  if (selection.col === dest.col) return null;

  const next = cloneState(state);
  const fromCol = next.tableau[selection.col];
  const toCol = next.tableau[dest.col];
  const stack = getMovableStack(fromCol, selection.index);
  if (!stack?.length) return null;
  if (!canDropOnTableau(stack[0], toCol)) return null;

  fromCol.splice(selection.index, stack.length);
  toCol.push(...stack);
  flipTop(fromCol);
  return finishState(next);
}

export function scoreDelta(prev, next) {
  const runs = (next.foundations?.length || 0) - (prev.foundations?.length || 0);
  let delta = runs * 100;

  const faceUp = (state) =>
    state.tableau.reduce(
      (n, col) => n + col.filter((c) => c.faceUp).length,
      0,
    );
  // Net newly revealed cards (ignores deals / run clears which also change count).
  const revealed = faceUp(next) - faceUp(prev);
  if (revealed > 0 && revealed <= 2) delta += revealed * 5;
  return delta;
}

function willReveal(column, fromIndex) {
  return fromIndex > 0 && Boolean(column[fromIndex - 1]) && !column[fromIndex - 1].faceUp;
}

function completesRunAfterMove(state, selection, dest) {
  const next = tryMove(state, selection, dest);
  if (!next) return false;
  return next.foundations.length > state.foundations.length;
}

function extendsSameSuit(state, selection, dest) {
  if (dest.type !== 'tableau') return false;
  const destPile = state.tableau[dest.col];
  if (!destPile.length) return false;
  const top = topCard(destPile);
  const stack = getSelectedCards(state, selection);
  if (!stack.length || !top) return false;
  return top.suit === stack[0].suit && stack[0].value === top.value - 1;
}

/**
 * True when the moved stack can immediately hop back onto the source column.
 * Those reshuffles feel like "hints bouncing a partial set back and forth."
 */
function isImmediatelyReversible(state, selection, dest) {
  const stack = getSelectedCards(state, selection);
  if (!stack.length) return false;
  const next = tryMove(state, selection, dest);
  if (!next) return false;
  const destCol = next.tableau[dest.col];
  const start = destCol.length - stack.length;
  if (start < 0) return false;
  return Boolean(
    tryMove(
      next,
      { type: 'tableau', col: dest.col, index: start },
      { type: 'tableau', col: selection.col },
    ),
  );
}

/**
 * After moving a partial stack, does the newly exposed face-up card gain a
 * non-reversible same-suit build or a run clear that was not available before?
 */
function exposedCardGainsRealPlay(prev, next, fromCol) {
  const exposed = next.tableau[fromCol];
  if (!exposed.length) return false;
  const top = exposed[exposed.length - 1];
  if (!top.faceUp) return false;

  for (let to = 0; to < 10; to += 1) {
    if (to === fromCol) continue;
    const destPile = next.tableau[to];
    if (!canDropOnTableau(top, destPile)) continue;
    const sel = {
      type: 'tableau',
      col: fromCol,
      index: exposed.length - 1,
    };
    const dest = { type: 'tableau', col: to };
    if (completesRunAfterMove(next, sel, dest)) return true;
    // Same-suit land that is not immediately reversible.
    if (
      extendsSameSuit(next, sel, dest) &&
      !isImmediatelyReversible(next, sel, dest)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Score a legal move for hints / stuck detection.
 * Returns null when the move does not advance the game (busywork).
 */
function progressiveMoveScore(state, selection, dest) {
  if (selection?.type !== 'tableau' || dest?.type !== 'tableau') return null;
  if (selection.col === dest.col) return null;

  const src = state.tableau[selection.col];
  const destPile = state.tableau[dest.col];
  const stack = getMovableStack(src, selection.index);
  if (!stack?.length) return null;
  if (!canDropOnTableau(stack[0], destPile)) return null;

  const reveals = willReveal(src, selection.index);
  const destEmpty = !destPile.length;

  // Whole column → empty: just relocates, never progress.
  if (destEmpty && selection.index === 0) return null;

  // Empty with nothing revealed: only useful to free a column for dealing.
  if (destEmpty && !reveals) {
    const emptyCount = state.tableau.filter((c) => !c.length).length;
    const stockReady = state.stock.length >= 10;
    if (stockReady && emptyCount > 0) return 35;
    return null;
  }

  if (completesRunAfterMove(state, selection, dest)) return 100;

  // Flip a buried card — always real progress.
  if (reveals) {
    return extendsSameSuit(state, selection, dest) ? 90 : 80;
  }

  // No flip: reject anything you can undo on the next move (partial-set thrash).
  if (isImmediatelyReversible(state, selection, dest)) return null;

  // Keep only if we uncover a face-up parent that can now make a real play.
  const next = tryMove(state, selection, dest);
  if (next && exposedCardGainsRealPlay(state, next, selection.col)) {
    return 65;
  }

  return null;
}

function listProgressiveMoves(state) {
  const candidates = [];
  for (let from = 0; from < 10; from += 1) {
    const column = state.tableau[from];
    for (let index = 0; index < column.length; index += 1) {
      if (!getMovableStack(column, index)?.length) continue;
      const selection = { type: 'tableau', col: from, index };
      for (let to = 0; to < 10; to += 1) {
        if (to === from) continue;
        const dest = { type: 'tableau', col: to };
        const hintScore = progressiveMoveScore(state, selection, dest);
        if (hintScore == null) continue;
        candidates.push({
          kind: 'move',
          selection,
          dest,
          hintScore,
        });
      }
    }
  }
  candidates.sort((a, b) => {
    if (b.hintScore !== a.hintScore) return b.hintScore - a.hintScore;
    // Stable tie-break so cycling order is deterministic.
    const ak = `${a.selection.col}:${a.selection.index}:${a.dest.col}`;
    const bk = `${b.selection.col}:${b.selection.index}:${b.dest.col}`;
    return ak.localeCompare(bk);
  });
  return candidates;
}

/** Can move a partial stack onto an empty column (needed before dealing). */
function canFillEmptyColumn(state) {
  if (!state.tableau.some((c) => !c.length)) return false;
  for (let from = 0; from < 10; from += 1) {
    const column = state.tableau[from];
    // index > 0 leaves something behind so we don't just swap empties.
    for (let index = 1; index < column.length; index += 1) {
      if (getMovableStack(column, index)?.length) return true;
    }
  }
  return false;
}

/**
 * All progressive hints for this position, plus deal when useful.
 * Used by the view to cycle without repeating until the list wraps.
 */
export function listHints(state) {
  if (!state || state.won || !state.dealt) return [];
  const moves = listProgressiveMoves(state);
  const hints = moves.map(({ kind, selection, dest, hintScore }) => ({
    kind,
    selection,
    dest,
    hintScore,
  }));

  if (canDealFromStock(state)) {
    // Prefer dealing when remaining moves are only empty-fill busywork.
    const strong = moves.some((m) => m.hintScore >= 70);
    if (!strong) {
      hints.push({ kind: 'deal', hintScore: 55 });
    } else {
      hints.push({ kind: 'deal', hintScore: 40 });
    }
  } else if (
    state.stock.length >= 10 &&
    canFillEmptyColumn(state) &&
    !moves.some((m) => m.hintScore >= 70)
  ) {
    // Point at filling an empty so a deal becomes legal.
    for (let from = 0; from < 10; from += 1) {
      const column = state.tableau[from];
      for (let index = 1; index < column.length; index += 1) {
        if (!getMovableStack(column, index)?.length) continue;
        for (let to = 0; to < 10; to += 1) {
          if (state.tableau[to].length) continue;
          hints.push({
            kind: 'move',
            selection: { type: 'tableau', col: from, index },
            dest: { type: 'tableau', col: to },
            hintScore: 35,
          });
          return hints.sort((a, b) => b.hintScore - a.hintScore);
        }
      }
    }
  }

  return hints.sort((a, b) => b.hintScore - a.hintScore);
}

/**
 * Suggest a useful next action (best progressive move, else deal).
 * Pass `avoidKeys` (from listHints keys) to skip recently shown hints.
 */
export function findHint(state, avoidKeys = []) {
  const hints = listHints(state);
  if (!hints.length) return null;

  const keyOf = (h) =>
    h.kind === 'deal'
      ? 'deal'
      : `m:${h.selection.col}:${h.selection.index}->${h.dest.col}`;

  const fresh = hints.filter((h) => !avoidKeys.includes(keyOf(h)));
  const pool = fresh.length ? fresh : hints;
  return pool[0];
}

export function hintKey(hint) {
  if (!hint) return null;
  if (hint.kind === 'deal') return 'deal';
  return `m:${hint.selection.col}:${hint.selection.index}->${hint.dest.col}`;
}

/** Any progressive card move (used for hints — ignores empty-column busywork). */
export function hasLegalCardMove(state) {
  return listProgressiveMoves(state).length > 0;
}

/**
 * Any rules-legal tableau move, including empty-column reshuffles.
 * Used for stuck detection so late-game empty juggling still counts.
 */
export function hasAnyLegalMove(state) {
  if (!state?.dealt || state.won) return false;
  for (let from = 0; from < 10; from += 1) {
    const column = state.tableau[from];
    for (let index = 0; index < column.length; index += 1) {
      const stack = getMovableStack(column, index);
      if (!stack?.length) continue;
      for (let to = 0; to < 10; to += 1) {
        if (to === from) continue;
        if (!canDropOnTableau(stack[0], state.tableau[to])) continue;
        // Whole face-up pile onto another empty is a no-op swap — skip only that.
        if (!state.tableau[to].length && index === 0) continue;
        return true;
      }
    }
  }
  return false;
}

/**
 * True when no legal card moves remain and the stock cannot be dealt
 * (or empties cannot be filled to allow a deal).
 * Practical “stuck” — not a full mathematical solvability proof.
 */
export function isNoMovesLeft(state) {
  if (!state || state.won || isWon(state) || !state.dealt) return false;
  if (hasAnyLegalMove(state)) return false;
  if (canDealFromStock(state)) return false;
  if (state.stock.length >= 10 && canFillEmptyColumn(state)) return false;
  return true;
}
