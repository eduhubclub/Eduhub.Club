/**
 * Go Fish — pure game state helpers.
 * Modes: `computer` (default, you vs AI) and `live` (hot-seat pass-and-play).
 */

import {
  RANKS,
  SUITS,
  createDeck,
  shuffle,
  cloneState,
} from '../solitaire/solitaireLogic';

export { RANKS, SUITS };

/** @typedef {'computer' | 'live'} GoFishPlayMode */

export function normalizePlayMode(mode) {
  return mode === 'live' ? 'live' : 'computer';
}

export function normalizeBookSize(size) {
  return size === 2 ? 2 : 4;
}

export function maxBooksForSize(bookSize) {
  return Math.floor(52 / normalizeBookSize(bookSize));
}

/** Starting hand size for every player count (2–4). */
export const STARTING_HAND_SIZE = 7;

/** Cards dealt from the pond when a player's hand is empty. */
export const REFILL_HAND_SIZE = 2;

export function handSizeForPlayers(_playerCount) {
  return STARTING_HAND_SIZE;
}

function faceUp(card) {
  return { ...card, faceUp: true };
}

function sortHand(hand) {
  return [...hand].sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return a.suit.localeCompare(b.suit);
  });
}

function ranksInHand(hand) {
  return [...new Set(hand.map((c) => c.rank))];
}

function extractBooks(hand, bookSize = 4) {
  const size = normalizeBookSize(bookSize);
  const byRank = new Map();
  for (const card of hand) {
    if (!byRank.has(card.rank)) byRank.set(card.rank, []);
    byRank.get(card.rank).push(card);
  }
  const books = [];
  const bookGroups = [];
  let kept = [...hand];
  for (const [rank, cards] of byRank) {
    let remaining = [...cards];
    while (remaining.length >= size) {
      const taken = remaining.slice(0, size);
      books.push(rank);
      bookGroups.push({ rank, cards: taken.map((c) => ({ ...c })) });
      const take = new Set(taken.map((c) => c.id));
      remaining = remaining.filter((c) => !take.has(c.id));
      kept = kept.filter((c) => !take.has(c.id));
    }
  }
  return { hand: sortHand(kept), books, bookGroups };
}

function playerLabel(index, playMode = 'computer') {
  if (playMode === 'computer') {
    return index === 0 ? 'You' : `Computer ${index}`;
  }
  return `Player ${index + 1}`;
}

export function resolvePlayerName(names, index, playMode = 'computer') {
  const mode = normalizePlayMode(playMode);
  const raw = Array.isArray(names) ? names[index] : null;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed || playerLabel(index, mode);
}

/**
 * Fresh Go Fish deal.
 * @param {number} playerCount 2–4
 * @param {{ bookSize?: 2 | 4, names?: string[], playMode?: GoFishPlayMode, random?: () => number }} [options]
 */
export function prepareGoFishDeal(playerCount = 2, options = {}) {
  const random = options.random || Math.random;
  const bookSize = normalizeBookSize(options.bookSize);
  const playMode = normalizePlayMode(options.playMode);
  const count = Math.min(4, Math.max(2, Math.floor(playerCount) || 2));
  const deck = shuffle(createDeck(), random).map(faceUp);
  const handSize = handSizeForPlayers(count);
  const players = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: resolvePlayerName(options.names, i, playMode),
    hand: [],
    books: [],
  }));

  const dealOrder = [];
  let i = 0;
  for (let round = 0; round < handSize; round += 1) {
    for (const p of players) {
      if (i >= deck.length) break;
      p.hand.push(deck[i]);
      dealOrder.push(p.id);
      i += 1;
    }
  }

  const openingBooks = [];
  for (const p of players) {
    const extracted = extractBooks(p.hand, bookSize);
    for (const group of extracted.bookGroups) {
      openingBooks.push({
        playerId: p.id,
        rank: group.rank,
        cards: group.cards,
        ownCards: group.cards.map((c) => ({ ...c })),
        takenCards: [],
        takenFromId: null,
      });
    }
    p.hand = extracted.hand;
    p.books = extracted.books;
  }

  const game = {
    playerCount: count,
    bookSize,
    playMode,
    players,
    pond: deck.slice(i).map((c) => ({ ...c, faceUp: false })),
    currentPlayer: 0,
    phase: 'turn',
    lastEvent:
      playMode === 'computer'
        ? 'Your turn — select a card, then tap a player to ask.'
        : 'Select a card, then tap a player to ask.',
    pendingAsk: null,
    winners: [],
    won: false,
    newBooks: [],
  };

  return { game, dealOrder, openingBooks };
}

export function dealGoFish(playerCount = 2, options = {}) {
  return prepareGoFishDeal(playerCount, options).game;
}

/** Empty table shell used while waiting for the player to deal. */
export function emptyGoFishTable(
  playerCount = 2,
  bookSize = 4,
  names,
  playMode = 'computer',
) {
  const count = Math.min(4, Math.max(2, Math.floor(playerCount) || 2));
  const mode = normalizePlayMode(playMode);
  return {
    playerCount: count,
    bookSize: normalizeBookSize(bookSize),
    playMode: mode,
    players: Array.from({ length: count }, (_, i) => ({
      id: i,
      name: resolvePlayerName(names, i, mode),
      hand: [],
      books: [],
    })),
    pond: Array.from({ length: 52 }, (_, i) => ({
      id: `pond-predeal-${i}`,
      faceUp: false,
    })),
    currentPlayer: 0,
    phase: 'ready',
    lastEvent: 'Tap the pond to deal.',
    pendingAsk: null,
    winners: [],
    won: false,
    newBooks: [],
  };
}

export function ranksHeldBy(state, playerIndex) {
  return ranksInHand(state.players[playerIndex].hand);
}

function refillIfEmpty(state, playerIndex) {
  const p = state.players[playerIndex];
  if (p.hand.length || !state.pond.length) return;
  const dealt = [];
  for (let i = 0; i < REFILL_HAND_SIZE && state.pond.length; i += 1) {
    dealt.push(faceUp(state.pond.pop()));
  }
  if (!dealt.length) return;
  p.hand = sortHand(dealt);
  const books = collectBooksFor(state, playerIndex);
  if (!state.refillDeals) state.refillDeals = [];
  state.refillDeals.push({
    playerId: playerIndex,
    cards: dealt.map((c) => ({ ...c })),
    books,
  });
}

/**
 * Reverse refill deals so the UI can animate cards flying from the pond.
 * Returns a copy with those cards back on the pond and out of hands/books.
 */
export function stripRefillDeals(state, refillDeals) {
  if (!refillDeals?.length) return cloneState(state);
  const start = cloneState(state);
  start.refillDeals = [];
  for (const deal of refillDeals) {
    const ids = new Set(deal.cards.map((c) => c.id));
    const p = start.players[deal.playerId];
    if (!p) continue;
    p.hand = sortHand(p.hand.filter((c) => !ids.has(c.id)));
    for (const card of [...deal.cards].reverse()) {
      start.pond.push({ ...card, faceUp: false });
    }
    for (const book of deal.books || []) {
      const idx = p.books.indexOf(book.rank);
      if (idx >= 0) {
        p.books = [...p.books.slice(0, idx), ...p.books.slice(idx + 1)];
      }
    }
  }
  return start;
}

export function refillDealOrder(refillDeals) {
  if (!refillDeals?.length) return [];
  return refillDeals.flatMap((d) => d.cards.map(() => d.playerId));
}

export function refillBooksFromDeals(refillDeals) {
  if (!refillDeals?.length) return [];
  return refillDeals.flatMap((d) => d.books || []);
}

/**
 * Put booked cards back into hands (and off the pile) so the UI can
 * announce, then animate them from hand → book pile.
 * Ask-sourced books put taken cards back on the donor's hand.
 */
export function deferBooksToHands(state, bookEvents) {
  if (!bookEvents?.length) return cloneState(state);
  const next = cloneState(state);
  for (const event of [...bookEvents].reverse()) {
    const p = next.players[event.playerId];
    if (!p) continue;
    const idx = p.books.lastIndexOf(event.rank);
    if (idx >= 0) {
      p.books = [...p.books.slice(0, idx), ...p.books.slice(idx + 1)];
    }
    const own = (event.ownCards || event.cards || []).map((c) => ({
      ...c,
      faceUp: true,
    }));
    const taken = (event.takenCards || []).map((c) => ({
      ...c,
      faceUp: true,
    }));
    p.hand = sortHand([...p.hand, ...own]);
    if (
      taken.length &&
      event.takenFromId != null &&
      next.players[event.takenFromId]
    ) {
      const donor = next.players[event.takenFromId];
      donor.hand = sortHand([...donor.hand, ...taken]);
    } else if (taken.length) {
      p.hand = sortHand([...p.hand, ...taken]);
    }
  }
  return next;
}

/** After the book fly lands: remove cards from hand(s) and add the book to the pile. */
export function applyBookLanding(state, event) {
  const next = cloneState(state);
  const ownIds = new Set(
    (event.ownCards || event.cards || []).map((c) => c.id),
  );
  const takenIds = new Set((event.takenCards || []).map((c) => c.id));
  const allIds = new Set([...ownIds, ...takenIds]);

  const booker = next.players[event.playerId];
  if (booker) {
    booker.hand = sortHand(booker.hand.filter((c) => !allIds.has(c.id)));
    booker.books = [...booker.books, event.rank];
  }
  if (event.takenFromId != null && next.players[event.takenFromId]) {
    const donor = next.players[event.takenFromId];
    donor.hand = sortHand(donor.hand.filter((c) => !takenIds.has(c.id)));
  }
  return next;
}

function collectBooksFor(state, playerIndex, options = {}) {
  const p = state.players[playerIndex];
  const extracted = extractBooks(p.hand, state.bookSize || 4);
  p.hand = extracted.hand;
  if (!extracted.bookGroups.length) return [];
  p.books = [...p.books, ...extracted.books];
  const receivedIds = options.receivedIds || null;
  const takenFromId =
    options.takenFromId == null ? null : options.takenFromId;
  return extracted.bookGroups.map((group) => {
    const cards = group.cards;
    const ownCards = receivedIds
      ? cards.filter((c) => !receivedIds.has(c.id))
      : cards.map((c) => ({ ...c }));
    const takenCards = receivedIds
      ? cards.filter((c) => receivedIds.has(c.id))
      : [];
    return {
      playerId: playerIndex,
      rank: group.rank,
      cards,
      ownCards,
      takenCards,
      takenFromId: takenCards.length ? takenFromId : null,
    };
  });
}

function checkGameOver(state) {
  const totalBooks = state.players.reduce((n, p) => n + p.books.length, 0);
  const handsEmpty = state.players.every((p) => !p.hand.length);
  const pondEmpty = !state.pond.length;
  const bookGoal = maxBooksForSize(state.bookSize || 4);
  if (totalBooks >= bookGoal || (handsEmpty && pondEmpty)) {
    state.won = true;
    state.phase = 'over';
    const max = Math.max(...state.players.map((p) => p.books.length));
    state.winners = state.players
      .filter((p) => p.books.length === max)
      .map((p) => p.id);
    if (state.winners.length === 1) {
      state.lastEvent = `${state.players[state.winners[0]].name} wins with ${max} book${max === 1 ? '' : 's'}!`;
    } else {
      state.lastEvent = `Tie! ${state.winners.map((i) => state.players[i].name).join(' & ')} with ${max} books.`;
    }
    return true;
  }
  return false;
}

function advanceTurn(state) {
  if (state.won) return;
  const n = state.players.length;
  let next = (state.currentPlayer + 1) % n;
  let guard = 0;
  while (
    guard < n &&
    !state.players[next].hand.length &&
    !state.pond.length
  ) {
    next = (next + 1) % n;
    guard += 1;
  }
  state.currentPlayer = next;
  refillIfEmpty(state, next);
  state.pendingAsk = null;
  const name = state.players[next].name;
  if (normalizePlayMode(state.playMode) === 'live') {
    state.phase = 'pass';
    state.lastEvent = `Pass the device to ${name}.`;
    return;
  }
  state.phase = 'turn';
  state.lastEvent =
    next === 0
      ? 'Your turn — select a card, then tap a player to ask.'
      : `${name}'s turn.`;
}

/**
 * Pick a rank + opponent for a computer player.
 * Prefers ranks with more copies; prefers opponents with larger hands.
 */
export function chooseAiAsk(state, playerIndex, random = Math.random) {
  const ranks = ranksHeldBy(state, playerIndex);
  if (!ranks.length) return null;

  const hand = state.players[playerIndex].hand;
  const ranked = [...ranks].sort((a, b) => {
    const ca = hand.filter((c) => c.rank === a).length;
    const cb = hand.filter((c) => c.rank === b).length;
    return cb - ca;
  });
  const topCount = hand.filter((c) => c.rank === ranked[0]).length;
  const topRanks = ranked.filter(
    (r) => hand.filter((c) => c.rank === r).length === topCount,
  );
  const rank = topRanks[Math.floor(random() * topRanks.length)];

  const opponents = state.players
    .map((_, i) => i)
    .filter((i) => i !== playerIndex && state.players[i].hand.length > 0);
  if (!opponents.length) return null;

  opponents.sort(
    (a, b) =>
      state.players[b].hand.length - state.players[a].hand.length,
  );
  const pool = opponents.slice(0, Math.min(2, opponents.length));
  const toIndex = pool[Math.floor(random() * pool.length)];
  return { rank, toIndex };
}

/**
 * Ask another player for a rank. Caller must hold that rank.
 * Returns new state or null if illegal.
 */
export function askForRank(state, fromIndex, toIndex, rank) {
  if (state.won || state.phase !== 'turn') return null;
  if (fromIndex !== state.currentPlayer) return null;
  if (toIndex === fromIndex) return null;
  if (toIndex < 0 || toIndex >= state.players.length) return null;
  if (!ranksHeldBy(state, fromIndex).includes(rank)) return null;

  const next = cloneState(state);
  const from = next.players[fromIndex];
  const to = next.players[toIndex];
  const matching = to.hand.filter((c) => c.rank === rank);

  if (matching.length) {
    const received = matching.map(faceUp);
    to.hand = sortHand(to.hand.filter((c) => c.rank !== rank));
    from.hand = sortHand([...from.hand, ...received]);
    next.newBooks = collectBooksFor(next, fromIndex, {
      receivedIds: new Set(received.map((c) => c.id)),
      takenFromId: toIndex,
    });
    next.receivedCards = received;
    next.receivedFrom = to.name;
    next.receivedRank = rank;
    refillIfEmpty(next, toIndex);
    next.lastEvent = `${to.name} gave ${matching.length} ${rank}${matching.length > 1 ? 's' : ''}! Ask again.`;
    next.pendingAsk = null;
    next.phase = 'turn';
    if (checkGameOver(next)) return next;
    refillIfEmpty(next, fromIndex);
    if (!from.hand.length) {
      advanceTurn(next);
      checkGameOver(next);
    }
    return next;
  }

  // Go Fish — player must draw from the pond themselves.
  next.pendingAsk = { rank, fromIndex };
  if (!next.pond.length) {
    next.lastEvent = `${to.name} says Go Fish… pond is empty.`;
    next.pendingAsk = null;
    if (checkGameOver(next)) return next;
    advanceTurn(next);
    checkGameOver(next);
    return next;
  }

  next.phase = 'goFish';
  next.lastEvent = `${to.name} says Go Fish!`;
  return next;
}

/**
 * After a Go Fish, draw one card from the pond.
 * Matching the asked rank lets the player ask again.
 */
export function drawFromPond(state) {
  if (state.won || state.phase !== 'goFish') return null;

  const next = cloneState(state);
  const fromIndex = next.currentPlayer;
  const askedRank = next.pendingAsk?.rank;
  const from = next.players[fromIndex];

  if (!next.pond.length) {
    next.pendingAsk = null;
    next.lastEvent = `Go Fish… pond is empty.`;
    if (checkGameOver(next)) return next;
    advanceTurn(next);
    checkGameOver(next);
    return next;
  }

  const drawn = next.pond.pop();
  const up = faceUp(drawn);
  from.hand = sortHand([...from.hand, up]);
  next.newBooks = collectBooksFor(next, fromIndex);
  next.pendingAsk = null;
  next.drawnCard = { ...up };
  next.drawnBy = fromIndex;

  if (askedRank && up.rank === askedRank) {
    next.lastEvent = `${from.name} fished a ${askedRank}! Ask again.`;
    next.phase = 'turn';
    if (checkGameOver(next)) return next;
    refillIfEmpty(next, fromIndex);
    if (!from.hand.length) {
      advanceTurn(next);
      checkGameOver(next);
    }
    return next;
  }

  next.lastEvent = `${from.name} drew a card.`;
  if (checkGameOver(next)) return next;
  advanceTurn(next);
  checkGameOver(next);
  return next;
}

/** After the pass screen (live mode), start the next player's turn. */
export function beginTurn(state) {
  if (state.won) return state;
  const next = cloneState(state);
  next.phase = 'turn';
  const name = next.players[next.currentPlayer].name;
  next.lastEvent =
    normalizePlayMode(next.playMode) === 'computer' && next.currentPlayer === 0
      ? 'Your turn — select a card, then tap a player to ask.'
      : `${name}: select a card, then tap a player.`;
  return next;
}

export function bookLabel(rank) {
  const r = RANKS.find((x) => x.id === rank);
  return r ? r.label : rank;
}

/** Face-up card used to represent a completed book in the pile. */
export function bookDisplayCard(rank, index = 0) {
  const suit = SUITS[index % SUITS.length];
  const r = RANKS.find((x) => x.id === rank) || RANKS[0];
  return {
    id: `book-${rank}-${index}`,
    suit: suit.id,
    rank: r.id,
    value: r.value,
    color: suit.color,
    label: r.label,
    symbol: suit.symbol,
    faceUp: true,
  };
}
