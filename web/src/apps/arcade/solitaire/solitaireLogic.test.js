/**
 * Klondike Solitaire rules tests — classic Ace-to-King foundations.
 */
import { describe, expect, it } from 'vitest';
import {
  canDropOnFoundation,
  canDropOnTableau,
  createDeck,
  dealKlondike,
  drawFromStock,
  getMovableStack,
  isClearedForAutoFinish,
  isNoMovesLeft,
  isWon,
  tryAutoFoundation,
  tryMove,
} from './solitaireLogic.js';

function card({
  suit = 'spades',
  rank = 'A',
  faceUp = true,
  id,
} = {}) {
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
    id: id ?? `${suit}-${rank}`,
    suit,
    symbol: s.symbol,
    color: s.color,
    rank,
    label: rank,
    value: values[rank],
    faceUp,
  };
}

function emptyState(overrides = {}) {
  return {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: Array.from({ length: 7 }, () => []),
    drawMode: 1,
    won: false,
    ...overrides,
  };
}

describe('createDeck / dealKlondike', () => {
  it('builds a 52-card deck with unique ids', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
  });

  it('deals classic 7-column layout: 1..7 cards, tops face-up, 24 in stock', () => {
    const g = dealKlondike(() => 0.5, { drawMode: 1 });
    expect(g.tableau.map((c) => c.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(g.tableau.every((col) => col[col.length - 1].faceUp)).toBe(true);
    expect(
      g.tableau.every((col) => col.slice(0, -1).every((c) => !c.faceUp)),
    ).toBe(true);
    expect(g.stock).toHaveLength(24);
    expect(g.waste).toHaveLength(0);
    expect(g.foundations).toHaveLength(4);
    expect(g.drawMode).toBe(1);
  });

  it('honors drawMode 3', () => {
    expect(dealKlondike(() => 0.2, { drawMode: 3 }).drawMode).toBe(3);
  });
});

describe('canDropOnTableau / foundation', () => {
  it('requires a King on an empty tableau column', () => {
    expect(canDropOnTableau(card({ rank: 'K' }), [])).toBe(true);
    expect(canDropOnTableau(card({ rank: 'Q' }), [])).toBe(false);
  });

  it('requires alternating color and next-lower rank', () => {
    const black7 = [card({ suit: 'spades', rank: '7' })];
    expect(canDropOnTableau(card({ suit: 'hearts', rank: '6' }), black7)).toBe(
      true,
    );
    expect(canDropOnTableau(card({ suit: 'clubs', rank: '6' }), black7)).toBe(
      false,
    );
    expect(canDropOnTableau(card({ suit: 'hearts', rank: '5' }), black7)).toBe(
      false,
    );
  });

  it('foundations build Ace up same suit', () => {
    expect(canDropOnFoundation(card({ suit: 'hearts', rank: 'A' }), [])).toBe(
      true,
    );
    expect(canDropOnFoundation(card({ suit: 'hearts', rank: '2' }), [])).toBe(
      false,
    );
    const ace = [card({ suit: 'hearts', rank: 'A' })];
    expect(canDropOnFoundation(card({ suit: 'hearts', rank: '2' }), ace)).toBe(
      true,
    );
    expect(canDropOnFoundation(card({ suit: 'spades', rank: '2' }), ace)).toBe(
      false,
    );
  });
});

describe('getMovableStack', () => {
  it('moves a valid alt-color descending run', () => {
    const col = [
      card({ suit: 'spades', rank: '8' }),
      card({ suit: 'hearts', rank: '7' }),
      card({ suit: 'clubs', rank: '6' }),
    ];
    expect(getMovableStack(col, 0)?.map((c) => c.rank)).toEqual(['8', '7', '6']);
  });

  it('rejects same-color or out-of-order stacks', () => {
    const col = [
      card({ suit: 'spades', rank: '8' }),
      card({ suit: 'clubs', rank: '7' }),
    ];
    expect(getMovableStack(col, 0)).toBeNull();
  });
});

describe('drawFromStock', () => {
  it('draws one card in drawMode 1', () => {
    const state = emptyState({
      drawMode: 1,
      stock: [
        card({ suit: 'spades', rank: '3', faceUp: false }),
        card({ suit: 'hearts', rank: '4', faceUp: false }),
      ],
    });
    const next = drawFromStock(state);
    expect(next.stock).toHaveLength(1);
    expect(next.waste).toHaveLength(1);
    expect(next.waste[0].faceUp).toBe(true);
    expect(next.waste[0].rank).toBe('4');
  });

  it('draws up to three in drawMode 3', () => {
    const state = emptyState({
      drawMode: 3,
      stock: [
        card({ suit: 'spades', rank: 'A', faceUp: false, id: 'a' }),
        card({ suit: 'hearts', rank: '2', faceUp: false, id: 'b' }),
        card({ suit: 'clubs', rank: '3', faceUp: false, id: 'c' }),
        card({ suit: 'diamonds', rank: '4', faceUp: false, id: 'd' }),
      ],
    });
    const next = drawFromStock(state);
    expect(next.stock).toHaveLength(1);
    expect(next.waste).toHaveLength(3);
  });

  it('recycles waste to stock when stock is empty', () => {
    const state = emptyState({
      stock: [],
      waste: [
        card({ suit: 'spades', rank: '5', faceUp: true }),
        card({ suit: 'hearts', rank: '6', faceUp: true }),
      ],
    });
    const next = drawFromStock(state);
    expect(next.waste).toHaveLength(0);
    expect(next.stock).toHaveLength(2);
    expect(next.stock.every((c) => !c.faceUp)).toBe(true);
  });
});

describe('tryMove / tryAutoFoundation', () => {
  it('moves waste Ace onto an empty foundation', () => {
    const state = emptyState({
      waste: [card({ suit: 'diamonds', rank: 'A' })],
    });
    const next = tryMove(
      state,
      { type: 'waste' },
      { type: 'foundation', index: 0 },
    );
    expect(next).not.toBeNull();
    expect(next.foundations[0][0].rank).toBe('A');
    expect(next.waste).toHaveLength(0);
  });

  it('flips the newly exposed tableau card after a move', () => {
    const state = emptyState({
      tableau: [
        [
          card({ suit: 'spades', rank: '9', faceUp: false }),
          card({ suit: 'hearts', rank: '5' }),
        ],
        [card({ suit: 'clubs', rank: '6' })],
        ...Array.from({ length: 5 }, () => []),
      ],
    });
    const next = tryMove(
      state,
      { type: 'tableau', col: 0, index: 1 },
      { type: 'tableau', col: 1 },
    );
    expect(next.tableau[0]).toHaveLength(1);
    expect(next.tableau[0][0].faceUp).toBe(true);
    expect(next.tableau[1].map((c) => c.rank)).toEqual(['6', '5']);
  });

  it('tryAutoFoundation finds a legal foundation for a waste Ace', () => {
    const state = emptyState({
      waste: [card({ suit: 'clubs', rank: 'A' })],
    });
    const next = tryAutoFoundation(state, { type: 'waste' });
    expect(next?.foundations.some((f) => f[0]?.rank === 'A')).toBe(true);
  });
});

describe('win / stuck helpers', () => {
  it('isWon when all four foundations have 13 cards', () => {
    const foundations = ['spades', 'hearts', 'diamonds', 'clubs'].map((suit) =>
      ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(
        (rank) => card({ suit, rank }),
      ),
    );
    expect(isWon(emptyState({ foundations }))).toBe(true);
  });

  it('isClearedForAutoFinish when stock empty and all tableau face-up', () => {
    const state = emptyState({
      stock: [],
      tableau: [
        [card({ suit: 'spades', rank: 'K' })],
        ...Array.from({ length: 6 }, () => []),
      ],
    });
    expect(isClearedForAutoFinish(state)).toBe(true);
  });

  it('isNoMovesLeft when nothing can be played or drawn into play', () => {
    // Face-down single cards with no stock/waste and no kings — no progressive moves.
    const state = emptyState({
      stock: [],
      waste: [],
      tableau: Array.from({ length: 7 }, (_, i) => [
        card({
          suit: 'spades',
          rank: '2',
          faceUp: false,
          id: `stuck-${i}`,
        }),
      ]),
    });
    expect(isNoMovesLeft(state)).toBe(true);
  });
});
