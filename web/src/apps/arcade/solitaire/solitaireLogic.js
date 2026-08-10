/**
 * Klondike Solitaire — pure game state helpers (no React).
 */

export const SUITS = [
  { id: 'spades', symbol: '♠', color: 'black' },
  { id: 'hearts', symbol: '♥', color: 'red' },
  { id: 'diamonds', symbol: '♦', color: 'red' },
  { id: 'clubs', symbol: '♣', color: 'black' },
];

export const RANKS = [
  { id: 'A', label: 'A', value: 1 },
  { id: '2', label: '2', value: 2 },
  { id: '3', label: '3', value: 3 },
  { id: '4', label: '4', value: 4 },
  { id: '5', label: '5', value: 5 },
  { id: '6', label: '6', value: 6 },
  { id: '7', label: '7', value: 7 },
  { id: '8', label: '8', value: 8 },
  { id: '9', label: '9', value: 9 },
  { id: '10', label: '10', value: 10 },
  { id: 'J', label: 'J', value: 11 },
  { id: 'Q', label: 'Q', value: 12 },
  { id: 'K', label: 'K', value: 13 },
];

function cardId(suitId, rankId) {
  return `${suitId}-${rankId}`;
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: cardId(suit.id, rank.id),
        suit: suit.id,
        symbol: suit.symbol,
        color: suit.color,
        rank: rank.id,
        label: rank.label,
        value: rank.value,
        faceUp: false,
      });
    }
  }
  return deck;
}

/** Fisher–Yates shuffle (mutates and returns). */
export function shuffle(deck, random = Math.random) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cloneState(state) {
  return structuredClone(state);
}

/** Deal a fresh Klondike layout. */
export function dealKlondike(random = Math.random, { drawMode = 1 } = {}) {
  const deck = shuffle(createDeck(), random);
  const tableau = Array.from({ length: 7 }, () => []);
  let i = 0;
  for (let col = 0; col < 7; col += 1) {
    for (let row = 0; row <= col; row += 1) {
      const card = deck[i];
      i += 1;
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(i).map((c) => ({ ...c, faceUp: false }));
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    drawMode: drawMode === 3 ? 3 : 1,
    won: false,
  };
}

export function isWon(state) {
  return state.foundations.every((pile) => pile.length === 13);
}

function topCard(pile) {
  return pile.length ? pile[pile.length - 1] : null;
}

export function canDropOnTableau(card, targetPile) {
  if (!card) return false;
  if (!targetPile.length) return card.value === 13; // King only on empty
  const top = topCard(targetPile);
  if (!top?.faceUp) return false;
  return card.color !== top.color && card.value === top.value - 1;
}

export function canDropOnFoundation(card, foundation) {
  if (!card) return false;
  if (!foundation.length) return card.value === 1; // Ace
  const top = topCard(foundation);
  return card.suit === top.suit && card.value === top.value + 1;
}

/** Face-up run from `fromIndex` to end of column (must be valid descending alt-color). */
export function getMovableStack(column, fromIndex) {
  if (fromIndex < 0 || fromIndex >= column.length) return null;
  if (!column[fromIndex].faceUp) return null;
  for (let i = fromIndex; i < column.length - 1; i += 1) {
    const a = column[i];
    const b = column[i + 1];
    if (!b.faceUp) return null;
    if (a.color === b.color || a.value !== b.value + 1) return null;
  }
  return column.slice(fromIndex);
}

function flipTopIfNeeded(column) {
  if (column.length && !column[column.length - 1].faceUp) {
    column[column.length - 1].faceUp = true;
  }
}

/**
 * Selection: { type: 'waste' } | { type: 'foundation', index } |
 * { type: 'tableau', col, index }
 */
export function getSelectedCards(state, selection) {
  if (!selection) return [];
  if (selection.type === 'waste') {
    const c = topCard(state.waste);
    return c ? [c] : [];
  }
  if (selection.type === 'foundation') {
    const c = topCard(state.foundations[selection.index]);
    return c ? [c] : [];
  }
  if (selection.type === 'tableau') {
    return getMovableStack(state.tableau[selection.col], selection.index) || [];
  }
  return [];
}

export function drawFromStock(state) {
  const next = cloneState(state);
  const drawCount = next.drawMode === 3 ? 3 : 1;
  if (next.stock.length) {
    const n = Math.min(drawCount, next.stock.length);
    for (let i = 0; i < n; i += 1) {
      const card = next.stock.pop();
      card.faceUp = true;
      next.waste.push(card);
    }
  } else if (next.waste.length) {
    // Recycle waste → stock (face down)
    next.stock = next.waste
      .reverse()
      .map((c) => ({ ...c, faceUp: false }));
    next.waste = [];
  }
  next.won = isWon(next);
  return next;
}

/**
 * Attempt move from selection onto a destination.
 * dest: { type: 'foundation', index } | { type: 'tableau', col }
 * Returns new state or null if illegal.
 */
export function tryMove(state, selection, dest) {
  if (!selection || !dest) return null;
  const cards = getSelectedCards(state, selection);
  if (!cards.length) return null;

  const next = cloneState(state);

  if (dest.type === 'foundation') {
    if (cards.length !== 1) return null;
    const card = cards[0];
    const pile = next.foundations[dest.index];
    if (!canDropOnFoundation(card, pile)) return null;
    removeSelected(next, selection);
    pile.push({ ...card, faceUp: true });
  } else if (dest.type === 'tableau') {
    const pile = next.tableau[dest.col];
    if (!canDropOnTableau(cards[0], pile)) return null;
    removeSelected(next, selection);
    for (const c of cards) pile.push({ ...c, faceUp: true });
  } else {
    return null;
  }

  next.won = isWon(next);
  return next;
}

function removeSelected(state, selection) {
  if (selection.type === 'waste') {
    state.waste.pop();
    return;
  }
  if (selection.type === 'foundation') {
    state.foundations[selection.index].pop();
    return;
  }
  if (selection.type === 'tableau') {
    const col = state.tableau[selection.col];
    col.splice(selection.index);
    flipTopIfNeeded(col);
  }
}

/** Auto-move a single card to any legal foundation (for double-click). */
export function tryAutoFoundation(state, selection) {
  const cards = getSelectedCards(state, selection);
  if (cards.length !== 1) return null;
  for (let i = 0; i < 4; i += 1) {
    const moved = tryMove(state, selection, { type: 'foundation', index: i });
    if (moved) return moved;
  }
  return null;
}

function foundationCount(state) {
  return state.foundations.reduce((n, pile) => n + pile.length, 0);
}

function faceDownTableauCount(state) {
  return state.tableau.reduce(
    (n, col) => n + col.filter((c) => !c.faceUp).length,
    0,
  );
}

/** Klondike-style point delta between two states. */
export function scoreDelta(prev, next) {
  if (!prev || !next) return 0;
  let delta = 0;
  const foundationsMoved = foundationCount(next) - foundationCount(prev);
  if (foundationsMoved > 0) delta += foundationsMoved * 10;
  if (foundationsMoved < 0) delta += foundationsMoved * 15;
  const revealed = faceDownTableauCount(prev) - faceDownTableauCount(next);
  if (revealed > 0) delta += revealed * 5;
  return delta;
}

/**
 * Suggest a useful next action.
 * Returns { kind: 'draw' } | { kind: 'move', selection, dest } | null
 */
export function findHint(state) {
  const move = findBestCardMove(state);
  // Prefer drawing over low-value tableau shuffling.
  if (move && move.hintScore >= 45) {
    return { kind: 'move', selection: move.selection, dest: move.dest };
  }
  if (state.stock.length || state.waste.length) {
    return { kind: 'draw' };
  }
  if (move) {
    return { kind: 'move', selection: move.selection, dest: move.dest };
  }
  return null;
}

/** Any progressive card move (ignores empty-column King hops and similar busywork). */
export function hasLegalCardMove(state) {
  return Boolean(findBestCardMove(state));
}

function canPlayOnFoundation(state, selection) {
  for (let i = 0; i < 4; i += 1) {
    if (tryMove(state, selection, { type: 'foundation', index: i })) return true;
  }
  return false;
}

function hasAnyFoundationMove(state) {
  if (state.waste.length && canPlayOnFoundation(state, { type: 'waste' })) {
    return true;
  }
  for (let col = 0; col < state.tableau.length; col += 1) {
    const pile = state.tableau[col];
    if (!pile.length || !pile[pile.length - 1].faceUp) continue;
    if (
      canPlayOnFoundation(state, {
        type: 'tableau',
        col,
        index: pile.length - 1,
      })
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Score a legal move for hints / stuck detection.
 * Returns null when the move does not advance the game (e.g. King pile → empty).
 */
function progressiveMoveScore(state, selection, dest) {
  if (!tryMove(state, selection, dest)) return null;

  if (dest.type === 'foundation') {
    return selection.type === 'waste' ? 100 : 95;
  }

  if (dest.type !== 'tableau') return null;

  if (selection.type === 'waste') {
    // King onto empty is real progress from the waste.
    return state.tableau[dest.col].length ? 50 : 60;
  }

  // Never hint pulling cards off the foundations — it thrashing (down, then back up).
  if (selection.type === 'foundation') return null;

  if (selection.type !== 'tableau') return null;

  const src = state.tableau[selection.col];
  const destPile = state.tableau[dest.col];
  const reveals =
    selection.index > 0 && !src[selection.index - 1].faceUp;
  const destEmpty = !destPile.length;

  // King/stack onto another empty column with nothing to reveal — busywork.
  if (destEmpty && !reveals) return null;

  if (reveals) return 80;

  // Moving within face-up cards: only if it exposes a new foundation play.
  const next = tryMove(state, selection, dest);
  if (!next) return null;
  const exposed = next.tableau[selection.col];
  if (exposed.length && exposed[exposed.length - 1].faceUp) {
    const exposedSel = {
      type: 'tableau',
      col: selection.col,
      index: exposed.length - 1,
    };
    if (canPlayOnFoundation(next, exposedSel)) return 70;
  }
  if (hasAnyFoundationMove(next) && !hasAnyFoundationMove(state)) return 65;

  return null;
}

function findBestCardMove(state) {
  const candidates = [];

  const consider = (selection, dest) => {
    const hintScore = progressiveMoveScore(state, selection, dest);
    if (hintScore == null) return;
    candidates.push({ kind: 'move', selection, dest, hintScore });
  };

  if (state.waste.length) {
    const sel = { type: 'waste' };
    for (let i = 0; i < 4; i += 1) {
      consider(sel, { type: 'foundation', index: i });
    }
  }

  for (let col = 0; col < state.tableau.length; col += 1) {
    const pile = state.tableau[col];
    if (!pile.length || !pile[pile.length - 1].faceUp) continue;
    const sel = { type: 'tableau', col, index: pile.length - 1 };
    for (let i = 0; i < 4; i += 1) {
      consider(sel, { type: 'foundation', index: i });
    }
  }

  for (let col = 0; col < state.tableau.length; col += 1) {
    const pile = state.tableau[col];
    for (let index = 0; index < pile.length; index += 1) {
      if (!getMovableStack(pile, index)) continue;
      const sel = { type: 'tableau', col, index };
      for (let destCol = 0; destCol < state.tableau.length; destCol += 1) {
        if (destCol === col) continue;
        consider(sel, { type: 'tableau', col: destCol });
      }
    }
  }

  if (state.waste.length) {
    const sel = { type: 'waste' };
    for (let destCol = 0; destCol < state.tableau.length; destCol += 1) {
      consider(sel, { type: 'tableau', col: destCol });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.hintScore - a.hintScore);
  return candidates[0];
}

function stockWasteKey(state) {
  const stock = state.stock.map((c) => c.id).join(',');
  const waste = state.waste.map((c) => c.id).join(',');
  return `${stock}|${waste}|${state.drawMode || 1}`;
}

/**
 * True when no card moves remain and cycling the stock cannot create one.
 * (Practical “stuck” / can’t continue — not a full mathematical solvability proof.)
 */
export function isNoMovesLeft(state) {
  if (!state || state.won || isWon(state)) return false;
  if (hasLegalCardMove(state)) return false;

  if (!state.stock.length && !state.waste.length) return true;

  let probe = cloneState(state);
  const seen = new Set();

  while (true) {
    const key = stockWasteKey(probe);
    if (seen.has(key)) return true;
    seen.add(key);

    if (!probe.stock.length && !probe.waste.length) return true;

    probe = drawFromStock(probe);
    if (hasLegalCardMove(probe)) return false;
  }
}

/** All tableau cards face-up and stock empty — classic “computer finish” window. */
export function isClearedForAutoFinish(state) {
  if (!state || state.won || isWon(state)) return false;
  if (state.stock.length) return false;
  return faceDownTableauCount(state) === 0;
}

/** One automatic finish step: foundation first, then a progressive rearrange. */
export function autoFinishStep(state) {
  if (!state || state.won || isWon(state)) return null;

  if (state.waste.length) {
    const sel = { type: 'waste' };
    for (let i = 0; i < 4; i += 1) {
      const next = tryMove(state, sel, { type: 'foundation', index: i });
      if (next) return next;
    }
  }

  for (let col = 0; col < state.tableau.length; col += 1) {
    const pile = state.tableau[col];
    if (!pile.length || !pile[pile.length - 1].faceUp) continue;
    const sel = { type: 'tableau', col, index: pile.length - 1 };
    for (let i = 0; i < 4; i += 1) {
      const next = tryMove(state, sel, { type: 'foundation', index: i });
      if (next) return next;
    }
  }

  const best = findBestCardMove(state);
  if (!best) return null;
  return tryMove(state, best.selection, best.dest);
}
