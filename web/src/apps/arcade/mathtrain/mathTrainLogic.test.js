import { describe, expect, it } from 'vitest';
import {
  POINTS,
  TIME_BOOST_SEC,
  createGame,
  beginTrain,
  extendTrain,
  commitTrain,
  spendPowerup,
  tickTimer,
  startGame,
  pathSum,
  isAdjacent,
  isNumberCell,
} from './mathTrainLogic.js';

function numberCell(id, value) {
  return { id, kind: 'number', value };
}

function powerCell(id, powerup) {
  return { id, kind: 'powerup', powerup };
}

/** High rolls → digit 9, no powerup spawn. */
const quietRng = () => 0.99;

function hasSolvingPath(board, target) {
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  function walk(r, c, used, sum, length) {
    if (length >= 2 && sum === target) return true;
    if (length >= 5) return false;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= 4 || nc >= 4) continue;
      const key = nr * 4 + nc;
      if (used.has(key) || !isNumberCell(board[nr][nc])) continue;
      used.add(key);
      if (walk(nr, nc, used, sum + board[nr][nc].value, length + 1)) return true;
      used.delete(key);
    }
    return false;
  }

  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      if (!isNumberCell(board[r][c])) continue;
      const used = new Set([r * 4 + c]);
      if (walk(r, c, used, board[r][c].value, 1)) return true;
    }
  }
  return false;
}

describe('startGame', () => {
  it('moves from ready to playing and keeps the powerbank', () => {
    const game = createGame(
      { startSeconds: 90, bank: { time: 2, random: 1, double: 0 } },
      quietRng,
    );
    game.timeLeft = 12;
    const next = startGame(game);
    expect(next.status).toBe('playing');
    expect(next.timeLeft).toBe(90);
    expect(next.score).toBe(0);
    expect(next.bank).toEqual({ time: 2, random: 1, double: 0 });
  });
});

describe('createGame', () => {
  it('uses the settings start time and deals a solvable target', () => {
    const game = createGame({ startSeconds: 90, minusMode: true }, quietRng);
    expect(game.startSeconds).toBe(90);
    expect(game.timeLeft).toBe(90);
    expect(game.minusMode).toBe(true);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.board).toHaveLength(4);
    expect(game.board[0]).toHaveLength(4);
    expect(hasSolvingPath(game.board, game.target)).toBe(true);
  });

  it('falls back to 60 seconds for an unknown duration', () => {
    const game = createGame({ startSeconds: 45 }, quietRng);
    expect(game.timeLeft).toBe(60);
  });
});

describe('train adjacency', () => {
  it('accepts diagonals, rejects jumps, and retracts one step', () => {
    const game = startGame(createGame({}, quietRng));
    expect(isAdjacent({ r: 0, c: 0 }, { r: 1, c: 1 })).toBe(true);
    expect(isAdjacent({ r: 0, c: 0 }, { r: 2, c: 1 })).toBe(false);

    let next = beginTrain(game, { r: 1, c: 1 });
    next = extendTrain(next, { r: 0, c: 0 });
    expect(next.train).toEqual([
      { r: 1, c: 1 },
      { r: 0, c: 0 },
    ]);
    next = extendTrain(next, { r: 0, c: 2 });
    expect(next.train).toHaveLength(2);
    next = extendTrain(next, { r: 1, c: 1 });
    expect(next.train).toEqual([{ r: 1, c: 1 }]);
  });

  it('does not revisit a cell already on the train', () => {
    let next = beginTrain(startGame(createGame({}, quietRng)), { r: 0, c: 0 });
    next = extendTrain(next, { r: 0, c: 1 });
    next = extendTrain(next, { r: 1, c: 1 });
    expect(next.train).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 1 },
    ]);
    const looped = extendTrain(next, { r: 0, c: 0 });
    expect(looped.train).toHaveLength(3);
  });

  it('keeps a straight orthogonal run', () => {
    let next = beginTrain(startGame(createGame({}, quietRng)), { r: 0, c: 0 });
    next = extendTrain(next, { r: 0, c: 1 });
    next = extendTrain(next, { r: 0, c: 2 });
    expect(next.train).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
    ]);
  });

  it('accepts a pure diagonal step', () => {
    let next = beginTrain(startGame(createGame({}, quietRng)), { r: 0, c: 0 });
    next = extendTrain(next, { r: 1, c: 1 });
    expect(next.train).toEqual([
      { r: 0, c: 0 },
      { r: 1, c: 1 },
    ]);
  });
});

describe('commitTrain', () => {
  function scripted() {
    const board = [
      [numberCell(1, 7), numberCell(2, 8), numberCell(3, 1), numberCell(4, 5)],
      [powerCell(5, 'time'), numberCell(6, 6), numberCell(7, 5), numberCell(8, 4)],
      [numberCell(9, 3), powerCell(10, 'double'), numberCell(11, 7), numberCell(12, 5)],
      [numberCell(13, 2), numberCell(14, 5), numberCell(15, 4), numberCell(16, 3)],
    ];
    return {
      ...startGame(createGame({ startSeconds: 60 }, quietRng)),
      board,
      nextId: 17,
      target: 15,
      train: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
      bank: { time: 0, random: 0, double: 0 },
      doubleArmed: false,
    };
  }

  it('banks powerup cells picked up on a complete train', () => {
    const game = scripted();
    // 7 → time → 3  (powerup between two numbers that sum to 10)
    game.train = [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
    ];
    game.target = pathSum(game.board, game.train);
    expect(game.target).toBe(10);

    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('clear');
    expect(result.collected).toBe(1);
    expect(result.game.score).toBe(POINTS);
    expect(result.game.bank).toEqual({ time: 1, random: 0, double: 0 });
    expect(result.game.train).toEqual([]);
    // Column 0 cleared 7, time, 3 — survivor 2 drops to bottom.
    expect(result.game.board[3][0].value).toBe(2);
    expect(result.game.board[0][0].id).not.toBe(1);
    expect(hasSolvingPath(result.game.board, result.game.target)).toBe(true);
  });

  it('does not bank a powerup when the train misses', () => {
    const game = scripted();
    game.train = [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
    ];
    game.target = 99;
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('miss');
    expect(result.collected).toBe(0);
    expect(result.game.bank).toEqual({ time: 0, random: 0, double: 0 });
    expect(result.game.board[1][0].kind).toBe('powerup');
  });

  it('doubles points once when armed, then clears the arm', () => {
    const game = scripted();
    game.doubleArmed = true;
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('clear');
    expect(result.game.score).toBe(POINTS * 2);
    expect(result.game.doubleArmed).toBe(false);
  });

  it('misses without scoring when the path does not match', () => {
    const game = scripted();
    game.target = 99;
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('miss');
    expect(result.game.score).toBe(0);
    expect(result.game.board[0][0].value).toBe(7);
    expect(result.game.train).toEqual([]);
  });

  it('treats a one-number release as a short cancel', () => {
    const game = beginTrain(scripted(), { r: 0, c: 0 });
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('short');
    expect(result.game.score).toBe(0);
    expect(result.game.train).toEqual([]);
  });

  it('treats number-plus-powerup without a second number as short', () => {
    const game = scripted();
    game.train = [
      { r: 0, c: 0 },
      { r: 1, c: 0 },
    ];
    game.target = 7;
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('short');
    expect(result.game.bank.time).toBe(0);
  });

  it('clears minus mode when the path sums to the target', () => {
    const game = scripted();
    game.minusMode = true;
    const result = commitTrain(game, quietRng);
    expect(result.outcome).toBe('clear');
    expect(result.game.minusMode).toBe(true);
    expect(result.game.score).toBe(POINTS);
  });
});

describe('spendPowerup', () => {
  it('adds five seconds and spends one time boost', () => {
    const game = startGame(createGame({ startSeconds: 30 }, quietRng));
    game.bank = { time: 1, random: 0, double: 0 };
    game.timeLeft = 12;
    const next = spendPowerup(game, 'time');
    expect(next.timeLeft).toBe(12 + TIME_BOOST_SEC);
    expect(next.bank.time).toBe(0);
  });

  it('arms double points for the next clear only', () => {
    const game = startGame(createGame({}, quietRng));
    game.bank = { time: 0, random: 0, double: 2 };
    const armed = spendPowerup(game, 'double');
    expect(armed.doubleArmed).toBe(true);
    expect(armed.bank.double).toBe(1);
  });

  it('reshuffles digits, keeps powerup cells, and picks a new target', () => {
    const game = startGame(createGame({}, quietRng));
    game.board = game.board.map((row, r) =>
      row.map((entry, c) =>
        r === 0 && c === 0
          ? powerCell(entry.id, 'random')
          : numberCell(entry.id, 1),
      ),
    );
    game.bank = { time: 0, random: 1, double: 0 };
    game.target = 2;
    const next = spendPowerup(game, 'random', quietRng);
    expect(next.board[0][0].kind).toBe('powerup');
    expect(next.board[0][0].powerup).toBe('random');
    expect(next.board[0][1].kind).toBe('number');
    expect(next.board[0][1].value).toBe(9);
    expect(next.bank.random).toBe(0);
    expect(hasSolvingPath(next.board, next.target)).toBe(true);
  });

  it('ignores an empty bank', () => {
    const game = startGame(createGame({}, quietRng));
    expect(spendPowerup(game, 'time')).toBe(game);
  });
});

describe('tickTimer', () => {
  it('counts down and ends the game at zero', () => {
    const game = startGame(createGame({ startSeconds: 30 }, quietRng));
    const next = tickTimer({ ...game, timeLeft: 2, train: [{ r: 0, c: 0 }] });
    expect(next.timeLeft).toBe(1);
    expect(next.status).toBe('playing');
    const over = tickTimer(next);
    expect(over.timeLeft).toBe(0);
    expect(over.status).toBe('over');
    expect(over.train).toEqual([]);
    expect(tickTimer(over)).toBe(over);
  });
});
