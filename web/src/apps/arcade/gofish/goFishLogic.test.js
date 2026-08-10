/**
 * Go Fish rules tests — ask / match / Go Fish / books / refill.
 */
import { describe, expect, it } from 'vitest';
import {
  REFILL_HAND_SIZE,
  STARTING_HAND_SIZE,
  askForRank,
  beginTurn,
  dealGoFish,
  drawFromPond,
  emptyGoFishTable,
  maxBooksForSize,
  normalizeBookSize,
  normalizePlayMode,
  prepareGoFishDeal,
  ranksHeldBy,
  resolvePlayerName,
} from './goFishLogic.js';

function card({ suit = 'spades', rank = 'A', id, faceUp = true } = {}) {
  const meta = {
    spades: { symbol: '♠', color: 'black' },
    hearts: { symbol: '♥', color: 'red' },
    diamonds: { symbol: '♦', color: 'red' },
    clubs: { symbol: '♣', color: 'black' },
  };
  const values = {
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
  };
  const s = meta[suit];
  return {
    id: id ?? `${suit}-${rank}-${Math.random().toString(36).slice(2, 6)}`,
    suit,
    symbol: s.symbol,
    color: s.color,
    rank,
    label: rank,
    value: values[rank],
    faceUp,
  };
}

function baseState(overrides = {}) {
  return {
    playerCount: 2,
    bookSize: 4,
    playMode: 'computer',
    players: [
      { id: 0, name: 'You', hand: [], books: [] },
      { id: 1, name: 'Computer 1', hand: [], books: [] },
    ],
    pond: [],
    currentPlayer: 0,
    phase: 'turn',
    lastEvent: '',
    pendingAsk: null,
    winners: [],
    won: false,
    newBooks: [],
    ...overrides,
  };
}

describe('helpers / deal setup', () => {
  it('normalizes play mode and book size', () => {
    expect(normalizePlayMode('live')).toBe('live');
    expect(normalizePlayMode('nope')).toBe('computer');
    expect(normalizeBookSize(2)).toBe(2);
    expect(normalizeBookSize(4)).toBe(4);
    expect(normalizeBookSize(99)).toBe(4);
    expect(maxBooksForSize(4)).toBe(13);
    expect(maxBooksForSize(2)).toBe(26);
  });

  it('labels seat 0 as You in computer mode', () => {
    expect(resolvePlayerName([], 0, 'computer')).toBe('You');
    expect(resolvePlayerName(['Ada'], 0, 'computer')).toBe('Ada');
    expect(resolvePlayerName([], 0, 'live')).toBe('Player 1');
  });

  it('emptyGoFishTable waits for a pond tap to deal', () => {
    const t = emptyGoFishTable(3, 4, null, 'computer');
    expect(t.phase).toBe('ready');
    expect(t.playerCount).toBe(3);
    expect(t.pond).toHaveLength(52);
    expect(t.players.every((p) => p.hand.length === 0)).toBe(true);
  });

  it('prepareGoFishDeal deals 7 cards each for 2–4 players', () => {
    for (const count of [2, 3, 4]) {
      const { game, dealOrder } = prepareGoFishDeal(count, {
        random: () => 0.31,
        playMode: 'computer',
      });
      expect(game.playerCount).toBe(count);
      expect(dealOrder).toHaveLength(count * STARTING_HAND_SIZE);
      // Opening books may remove cards from hands, so ≤ 7.
      expect(
        game.players.every((p) => p.hand.length <= STARTING_HAND_SIZE),
      ).toBe(true);
      expect(game.pond.length + game.players.reduce(
        (n, p) => n + p.hand.length + p.books.length * (game.bookSize || 4),
        0,
      )).toBe(52);
      expect(game.phase).toBe('turn');
    }
  });

  it('dealGoFish returns the game object from prepareGoFishDeal', () => {
    const g = dealGoFish(2, { random: () => 0.11 });
    expect(g.players).toHaveLength(2);
    expect(g.currentPlayer).toBe(0);
  });
});

describe('askForRank', () => {
  it('transfers matching cards and lets the asker go again', () => {
    const state = baseState({
      players: [
        {
          id: 0,
          name: 'You',
          hand: [card({ suit: 'spades', rank: '7', id: 'you-7' })],
          books: [],
        },
        {
          id: 1,
          name: 'Computer 1',
          hand: [
            card({ suit: 'hearts', rank: '7', id: 'c-7a' }),
            card({ suit: 'clubs', rank: '7', id: 'c-7b' }),
            card({ suit: 'diamonds', rank: '3', id: 'c-3' }),
          ],
          books: [],
        },
      ],
    });
    const next = askForRank(state, 0, 1, '7');
    expect(next).not.toBeNull();
    expect(next.phase).toBe('turn');
    expect(next.currentPlayer).toBe(0);
    expect(next.players[0].hand.filter((c) => c.rank === '7')).toHaveLength(3);
    expect(next.players[1].hand.some((c) => c.rank === '7')).toBe(false);
    expect(next.receivedCards).toHaveLength(2);
  });

  it('rejects asking for a rank you do not hold', () => {
    const state = baseState({
      players: [
        {
          id: 0,
          name: 'You',
          hand: [card({ rank: 'A', id: 'a' })],
          books: [],
        },
        {
          id: 1,
          name: 'Computer 1',
          hand: [card({ rank: 'K', id: 'k' })],
          books: [],
        },
      ],
    });
    expect(askForRank(state, 0, 1, 'K')).toBeNull();
  });

  it('sets goFish phase when the opponent has none', () => {
    const state = baseState({
      pond: [card({ suit: 'diamonds', rank: '2', faceUp: false, id: 'pond-2' })],
      players: [
        {
          id: 0,
          name: 'You',
          hand: [card({ suit: 'spades', rank: 'Q', id: 'q' })],
          books: [],
        },
        {
          id: 1,
          name: 'Computer 1',
          hand: [card({ suit: 'hearts', rank: '3', id: '3' })],
          books: [],
        },
      ],
    });
    const next = askForRank(state, 0, 1, 'Q');
    expect(next.phase).toBe('goFish');
    expect(next.pendingAsk).toEqual({ rank: 'Q', fromIndex: 0 });
  });

  it('forms a book of 4 and records newBooks', () => {
    const state = baseState({
      bookSize: 4,
      players: [
        {
          id: 0,
          name: 'You',
          hand: [
            card({ suit: 'spades', rank: '5', id: 's5' }),
            card({ suit: 'hearts', rank: '5', id: 'h5' }),
            card({ suit: 'clubs', rank: '5', id: 'c5' }),
          ],
          books: [],
        },
        {
          id: 1,
          name: 'Computer 1',
          hand: [card({ suit: 'diamonds', rank: '5', id: 'd5' })],
          books: [],
        },
      ],
    });
    const next = askForRank(state, 0, 1, '5');
    expect(next.players[0].books).toContain('5');
    expect(next.players[0].hand.some((c) => c.rank === '5')).toBe(false);
    expect(next.newBooks?.some((b) => b.rank === '5')).toBe(true);
  });
});

describe('drawFromPond', () => {
  it('lets the asker go again when they fish the asked rank', () => {
    const state = baseState({
      phase: 'goFish',
      pendingAsk: { rank: '9', fromIndex: 0 },
      pond: [card({ suit: 'clubs', rank: '9', faceUp: false, id: 'fish-9' })],
      players: [
        {
          id: 0,
          name: 'You',
          hand: [card({ suit: 'spades', rank: '9', id: 'you-9' })],
          books: [],
        },
        { id: 1, name: 'Computer 1', hand: [card({ rank: 'A', id: 'a' })], books: [] },
      ],
    });
    const next = drawFromPond(state);
    expect(next.phase).toBe('turn');
    expect(next.currentPlayer).toBe(0);
    expect(next.drawnCard.rank).toBe('9');
    expect(next.lastEvent).toMatch(/fished/i);
  });

  it('advances the turn when the draw misses', () => {
    const state = baseState({
      phase: 'goFish',
      pendingAsk: { rank: '9', fromIndex: 0 },
      pond: [card({ suit: 'clubs', rank: '2', faceUp: false, id: 'miss' })],
      players: [
        {
          id: 0,
          name: 'You',
          hand: [card({ suit: 'spades', rank: '9', id: 'you-9' })],
          books: [],
        },
        {
          id: 1,
          name: 'Computer 1',
          hand: [card({ suit: 'hearts', rank: 'A', id: 'a' })],
          books: [],
        },
      ],
    });
    const next = drawFromPond(state);
    expect(next.currentPlayer).toBe(1);
    expect(next.phase).toBe('turn');
    expect(next.pendingAsk).toBeNull();
  });

  it('rejects draws outside goFish phase', () => {
    expect(drawFromPond(baseState({ phase: 'turn' }))).toBeNull();
  });
});

describe('live mode / beginTurn', () => {
  it('ask miss in live mode advances to pass phase', () => {
    const state = baseState({
      playMode: 'live',
      players: [
        {
          id: 0,
          name: 'Player 1',
          hand: [card({ rank: 'J', id: 'j' })],
          books: [],
        },
        {
          id: 1,
          name: 'Player 2',
          hand: [card({ rank: '2', id: 'two' })],
          books: [],
        },
      ],
      pond: [],
    });
    const next = askForRank(state, 0, 1, 'J');
    // Empty pond after Go Fish → advanceTurn → live pass
    expect(next.phase).toBe('pass');
    expect(next.currentPlayer).toBe(1);
  });

  it('beginTurn opens the current player after pass', () => {
    const state = baseState({
      playMode: 'live',
      phase: 'pass',
      currentPlayer: 1,
      players: [
        { id: 0, name: 'Player 1', hand: [card({ rank: 'A', id: 'a' })], books: [] },
        { id: 1, name: 'Player 2', hand: [card({ rank: 'K', id: 'k' })], books: [] },
      ],
    });
    const next = beginTurn(state);
    expect(next.phase).toBe('turn');
    expect(next.currentPlayer).toBe(1);
  });
});

describe('refill constant', () => {
  it('uses two cards when refilling an empty hand', () => {
    expect(REFILL_HAND_SIZE).toBe(2);
  });

  it('ranksHeldBy lists unique ranks', () => {
    const state = baseState({
      players: [
        {
          id: 0,
          name: 'You',
          hand: [
            card({ rank: '4', id: 'a' }),
            card({ rank: '4', suit: 'hearts', id: 'b' }),
            card({ rank: 'K', id: 'c' }),
          ],
          books: [],
        },
        { id: 1, name: 'Computer 1', hand: [], books: [] },
      ],
    });
    expect(ranksHeldBy(state, 0).sort()).toEqual(['4', 'K']);
  });
});
