/**
 * Spider Solitaire rules tests — classic Windows Spider conventions.
 * @see https://en.wikipedia.org/wiki/Spider_(solitaire)
 * @see Microsoft Spider Solitaire how-to (Vista archive)
 */
import { describe, expect, it } from 'vitest';
import {
  canDealFromStock,
  canDropOnTableau,
  createSpiderDeck,
  dealFromStock,
  dealOpening,
  dealSpider,
  getMovableStack,
  hasAnyLegalMove,
  hasLegalCardMove,
  isNoMovesLeft,
  isWon,
  openingColumnDepth,
  removeCompletedRun,
  tryMove,
} from './spiderLogic.js';

function card({
  suit = 'spades',
  rank = 'A',
  value,
  faceUp = true,
  id,
  symbol = '♠',
  color = 'black',
} = {}) {
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
  const v = value ?? values[rank];
  return {
    id: id ?? `${suit}-${rank}-${Math.random().toString(36).slice(2, 7)}`,
    suit,
    symbol: suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : symbol,
    color: suit === 'hearts' || suit === 'diamonds' ? 'red' : color,
    rank,
    label: rank,
    value: v,
    faceUp,
  };
}

function emptyDealtState(overrides = {}) {
  return {
    stock: [],
    tableau: Array.from({ length: 10 }, () => []),
    foundations: [],
    suitCount: 1,
    dealt: true,
    won: false,
    ...overrides,
  };
}

/** King→Ace same-suit run (face-up). */
function kingToAceRun(suit = 'spades') {
  const ranks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
  return ranks.map((rank, i) =>
    card({ suit, rank, id: `${suit}-run-${rank}-${i}` }),
  );
}

describe('createSpiderDeck', () => {
  it('builds 104 cards for 1, 2, and 4 suit modes', () => {
    expect(createSpiderDeck(1)).toHaveLength(104);
    expect(createSpiderDeck(2)).toHaveLength(104);
    expect(createSpiderDeck(4)).toHaveLength(104);
  });

  it('uses only spades in 1-suit mode (8 full ranks)', () => {
    const deck = createSpiderDeck(1);
    expect(deck.every((c) => c.suit === 'spades')).toBe(true);
    expect(deck.filter((c) => c.rank === 'A')).toHaveLength(8);
  });

  it('uses spades + hearts in 2-suit mode', () => {
    const deck = createSpiderDeck(2);
    const suits = new Set(deck.map((c) => c.suit));
    expect(suits).toEqual(new Set(['spades', 'hearts']));
  });
});

describe('opening deal layout (classic Spider)', () => {
  it('deals undealt: all 104 in stock, empty tableau', () => {
    const g = dealSpider(() => 0.5, { suitCount: 1 });
    expect(g.dealt).toBe(false);
    expect(g.stock).toHaveLength(104);
    expect(g.tableau.every((col) => col.length === 0)).toBe(true);
  });

  it('opening depths: first 4 columns 6, last 6 columns 5', () => {
    for (let col = 0; col < 10; col += 1) {
      expect(openingColumnDepth(col)).toBe(col < 4 ? 6 : 5);
    }
  });

  it('dealOpening places 54 cards and leaves 50 in stock', () => {
    const g = dealOpening(dealSpider(() => 0.42, { suitCount: 1 }));
    expect(g).not.toBeNull();
    expect(g.dealt).toBe(true);
    expect(g.stock).toHaveLength(50);
    expect(g.tableau.map((c) => c.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(g.tableau.every((col) => col[col.length - 1].faceUp)).toBe(true);
    expect(
      g.tableau.every((col) =>
        col.slice(0, -1).every((c) => !c.faceUp),
      ),
    ).toBe(true);
  });
});

describe('canDropOnTableau', () => {
  it('allows any card on an empty column', () => {
    expect(canDropOnTableau(card({ rank: '7' }), [])).toBe(true);
    expect(canDropOnTableau(card({ rank: 'A' }), [])).toBe(true);
    expect(canDropOnTableau(card({ rank: 'K' }), [])).toBe(true);
  });

  it('allows next-lower rank regardless of suit', () => {
    const sevenSpades = [card({ suit: 'spades', rank: '7' })];
    expect(canDropOnTableau(card({ suit: 'hearts', rank: '6' }), sevenSpades)).toBe(
      true,
    );
    expect(canDropOnTableau(card({ suit: 'spades', rank: '6' }), sevenSpades)).toBe(
      true,
    );
  });

  it('rejects same rank, higher rank, or ace as target', () => {
    const seven = [card({ rank: '7' })];
    expect(canDropOnTableau(card({ rank: '7' }), seven)).toBe(false);
    expect(canDropOnTableau(card({ rank: '8' }), seven)).toBe(false);
    expect(canDropOnTableau(card({ rank: '2' }), [card({ rank: 'A' })])).toBe(
      false,
    );
  });
});

describe('getMovableStack', () => {
  it('moves a same-suit descending run together', () => {
    const col = [
      card({ suit: 'spades', rank: '9' }),
      card({ suit: 'spades', rank: '8' }),
      card({ suit: 'spades', rank: '7' }),
    ];
    expect(getMovableStack(col, 0)?.map((c) => c.rank)).toEqual(['9', '8', '7']);
    expect(getMovableStack(col, 1)?.map((c) => c.rank)).toEqual(['8', '7']);
  });

  it('does not move a mixed-suit descending sequence as a group', () => {
    const col = [
      card({ suit: 'spades', rank: '9' }),
      card({ suit: 'hearts', rank: '8' }),
    ];
    expect(getMovableStack(col, 0)).toBeNull();
    expect(getMovableStack(col, 1)?.map((c) => c.rank)).toEqual(['8']);
  });

  it('rejects face-down starts', () => {
    const col = [
      card({ rank: '9', faceUp: false }),
      card({ rank: '8', faceUp: true }),
    ];
    expect(getMovableStack(col, 0)).toBeNull();
  });
});

describe('tryMove', () => {
  it('moves a card onto next-higher any suit and flips revealed card', () => {
    const state = emptyDealtState({
      tableau: [
        [card({ rank: '9', faceUp: false }), card({ rank: '5' })],
        [card({ rank: '6' })],
        ...Array.from({ length: 8 }, () => [card({ rank: 'K' })]),
      ],
    });
    const next = tryMove(
      state,
      { type: 'tableau', col: 0, index: 1 },
      { type: 'tableau', col: 1 },
    );
    expect(next).not.toBeNull();
    expect(next.tableau[1].map((c) => c.rank)).toEqual(['6', '5']);
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0].faceUp).toBe(true);
    expect(next.tableau[0][0].rank).toBe('9');
  });

  it('allows a partial stack onto an empty column', () => {
    const state = emptyDealtState({
      tableau: [
        [
          card({ suit: 'spades', rank: '9' }),
          card({ suit: 'spades', rank: '8' }),
          card({ suit: 'spades', rank: '7' }),
        ],
        [],
        ...Array.from({ length: 8 }, () => [card({ rank: 'K' })]),
      ],
    });
    const next = tryMove(
      state,
      { type: 'tableau', col: 0, index: 1 },
      { type: 'tableau', col: 1 },
    );
    expect(next).not.toBeNull();
    expect(next.tableau[0].map((c) => c.rank)).toEqual(['9']);
    expect(next.tableau[1].map((c) => c.rank)).toEqual(['8', '7']);
  });

  it('blocks moves before the opening deal', () => {
    const undealt = dealSpider(() => 0.1, { suitCount: 1 });
    expect(
      tryMove(
        undealt,
        { type: 'tableau', col: 0, index: 0 },
        { type: 'tableau', col: 1 },
      ),
    ).toBeNull();
  });
});

describe('stock deal', () => {
  it('deals one face-up card to each column when all columns filled', () => {
    const dealt = dealOpening(dealSpider(() => 0.3, { suitCount: 1 }));
    expect(canDealFromStock(dealt)).toBe(true);
    const next = dealFromStock(dealt);
    expect(next.stock).toHaveLength(40);
    expect(next.tableau.every((col) => col[col.length - 1].faceUp)).toBe(true);
    expect(next.tableau.map((c) => c.length)).toEqual([
      7, 7, 7, 7, 6, 6, 6, 6, 6, 6,
    ]);
  });

  it('blocks stock deal when any column is empty', () => {
    const dealt = dealOpening(dealSpider(() => 0.3, { suitCount: 1 }));
    dealt.tableau[3] = [];
    expect(canDealFromStock(dealt)).toBe(false);
    expect(dealFromStock(dealt)).toBeNull();
  });
});

describe('completed runs', () => {
  it('clears a King-to-Ace same-suit run to foundations', () => {
    const run = kingToAceRun('spades');
    const state = emptyDealtState({
      tableau: [run, ...Array.from({ length: 9 }, () => [])],
    });
    expect(removeCompletedRun(state, 0)).toBe(true);
    expect(state.tableau[0]).toHaveLength(0);
    expect(state.foundations).toHaveLength(1);
    expect(state.foundations[0][0].rank).toBe('K');
    expect(state.foundations[0][12].rank).toBe('A');
  });

  it('tryMove auto-clears a completed run after a finishing drop', () => {
    const almost = kingToAceRun('spades').slice(0, 12); // K…2
    const ace = card({ suit: 'spades', rank: 'A', id: 'finish-ace' });
    const state = emptyDealtState({
      tableau: [
        almost,
        [ace],
        ...Array.from({ length: 8 }, () => [card({ rank: 'K', id: `pad-${Math.random()}` })]),
      ],
    });
    const next = tryMove(
      state,
      { type: 'tableau', col: 1, index: 0 },
      { type: 'tableau', col: 0 },
    );
    expect(next).not.toBeNull();
    expect(next.foundations).toHaveLength(1);
    expect(next.tableau[0]).toHaveLength(0);
  });

  it('isWon when eight runs are cleared', () => {
    const state = emptyDealtState({
      foundations: Array.from({ length: 8 }, () => kingToAceRun()),
    });
    expect(isWon(state)).toBe(true);
  });
});

describe('stuck detection vs empty-column juggling', () => {
  it('hasAnyLegalMove is true when a partial stack can fill an empty', () => {
    const state = emptyDealtState({
      stock: [],
      tableau: [
        [
          card({ suit: 'spades', rank: '5' }),
          card({ suit: 'spades', rank: '4' }),
        ],
        [],
        ...Array.from({ length: 8 }, () => [
          card({ suit: 'spades', rank: 'K', id: `block-${Math.random()}` }),
        ]),
      ],
    });
    // No progressive build (nothing to land on), but empty-column move is legal.
    expect(hasAnyLegalMove(state)).toBe(true);
    expect(isNoMovesLeft(state)).toBe(false);
  });

  it('does not treat whole-pile empty↔empty hops as the only escape', () => {
    const state = emptyDealtState({
      stock: [],
      tableau: [
        [card({ rank: '7' })],
        [],
        ...Array.from({ length: 8 }, () => []),
      ],
    });
    // Only whole column onto empty — skipped by hasAnyLegalMove.
    expect(hasAnyLegalMove(state)).toBe(false);
    expect(isNoMovesLeft(state)).toBe(true);
  });

  it('progressive hints may ignore empty reshuffles that stuck still allows', () => {
    const state = emptyDealtState({
      stock: [],
      tableau: [
        [
          card({ suit: 'spades', rank: '9' }),
          card({ suit: 'spades', rank: '8' }),
        ],
        [],
        ...Array.from({ length: 8 }, () => [
          card({ suit: 'spades', rank: 'A', id: `a-${Math.random()}` }),
        ]),
      ],
    });
    expect(hasAnyLegalMove(state)).toBe(true);
    // No reveal, no same-suit build onto another pile — not progressive.
    expect(hasLegalCardMove(state)).toBe(false);
  });
});
