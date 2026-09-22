/**
 * Math Train — pure rules for the 4×4 swipe-sum board.
 * Add mode: path sum must equal the target.
 * Minus mode: the same check (start at the target and subtract to exactly 0).
 * Powerup cells replace a grid space; they add 0 and bank on a successful clear.
 */

export const GRID = 4;
export const POINTS = 10;
export const TIME_BOOST_SEC = 5;
export const POWERUP_CHANCE = 0.1;
export const DEFAULT_START_SECONDS = 60;
export const START_TIME_OPTIONS = [30, 60, 90, 120];
export const POWERUP_TYPES = ['time', 'random', 'double'];

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function normalizeStart(seconds) {
  return START_TIME_OPTIONS.includes(seconds) ? seconds : DEFAULT_START_SECONDS;
}

function keyOf(cell) {
  return cell.r * GRID + cell.c;
}

export function inBounds(cell) {
  return (
    cell &&
    cell.r >= 0 &&
    cell.c >= 0 &&
    cell.r < GRID &&
    cell.c < GRID
  );
}

export function isAdjacent(a, b) {
  if (!inBounds(a) || !inBounds(b)) return false;
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return dr <= 1 && dc <= 1 && dr + dc > 0;
}

export function isNumberCell(cell) {
  return Boolean(cell && cell.kind === 'number');
}

export function isPowerupCell(cell) {
  return Boolean(cell && cell.kind === 'powerup');
}

export function cellValue(cell) {
  return isNumberCell(cell) ? cell.value : 0;
}

export function pathSum(board, path) {
  return path.reduce((sum, step) => sum + cellValue(board[step.r][step.c]), 0);
}

export function pathNumberCount(board, path) {
  return path.reduce(
    (count, step) => count + (isNumberCell(board[step.r][step.c]) ? 1 : 0),
    0,
  );
}

function spawnCell(idState, rng) {
  const id = idState.nextId;
  idState.nextId += 1;
  if (rng() < POWERUP_CHANCE) {
    return {
      id,
      kind: 'powerup',
      powerup: POWERUP_TYPES[Math.floor(rng() * POWERUP_TYPES.length)],
    };
  }
  return {
    id,
    kind: 'number',
    value: 1 + Math.floor(rng() * 9),
  };
}

function numberNeighbors(board, r, c, used) {
  const out = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= GRID || nc >= GRID) continue;
    const cell = board[nr][nc];
    if (!isNumberCell(cell)) continue;
    const key = nr * GRID + nc;
    if (used.has(key)) continue;
    out.push({ r: nr, c: nc });
  }
  return out;
}

/** A random 8-way path of 2–5 number cells (powerups are bridges for the player). */
function randomNumberPath(board, rng) {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const start = {
      r: Math.floor(rng() * GRID),
      c: Math.floor(rng() * GRID),
    };
    if (!isNumberCell(board[start.r]?.[start.c])) continue;
    const len = 2 + Math.floor(rng() * 4);
    const path = [start];
    const used = new Set([keyOf(start)]);
    let stuck = false;
    while (path.length < len) {
      const last = path[path.length - 1];
      const opts = numberNeighbors(board, last.r, last.c, used);
      if (!opts.length) {
        stuck = true;
        break;
      }
      const next = opts[Math.floor(rng() * opts.length)];
      path.push(next);
      used.add(keyOf(next));
    }
    if (!stuck && path.length >= 2) return path;
  }

  const numbers = [];
  for (let r = 0; r < GRID; r += 1) {
    for (let c = 0; c < GRID; c += 1) {
      if (isNumberCell(board[r][c])) numbers.push({ r, c });
    }
  }
  if (numbers.length >= 2) return [numbers[0], numbers[1]];
  return [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
  ];
}

function targetFor(board, rng) {
  return pathSum(board, randomNumberPath(board, rng));
}

export function normalizeBank(bank) {
  return {
    time: Math.max(0, Math.floor(Number(bank?.time) || 0)),
    random: Math.max(0, Math.floor(Number(bank?.random) || 0)),
    double: Math.max(0, Math.floor(Number(bank?.double) || 0)),
  };
}

function dealBoard(rng) {
  const idState = { nextId: 1 };
  const board = [];
  for (let r = 0; r < GRID; r += 1) {
    const row = [];
    for (let c = 0; c < GRID; c += 1) {
      row.push(spawnCell(idState, rng));
    }
    board.push(row);
  }
  return { board, nextId: idState.nextId };
}

/**
 * @param {{ startSeconds?: number, minusMode?: boolean, bank?: object }} [settings]
 * @param {() => number} [rng]
 */
export function createGame(settings = {}, rng = Math.random) {
  const startSeconds = normalizeStart(settings.startSeconds);
  const { board, nextId } = dealBoard(rng);
  return {
    board,
    nextId,
    target: targetFor(board, rng),
    minusMode: Boolean(settings.minusMode),
    score: 0,
    timeLeft: startSeconds,
    startSeconds,
    status: 'ready',
    train: [],
    bank: normalizeBank(settings.bank),
    doubleArmed: false,
  };
}

export function resetGame(settings, rng) {
  return createGame(settings, rng);
}

/** Leave the ready screen and begin the countdown timer. Keeps the powerbank. */
export function startGame(game) {
  if (game.status !== 'ready' && game.status !== 'over') return game;
  return {
    ...game,
    status: 'playing',
    timeLeft: game.startSeconds,
    score: 0,
    train: [],
    bank: normalizeBank(game.bank),
    doubleArmed: false,
  };
}

export function beginTrain(game, cell) {
  if (game.status !== 'playing' || !inBounds(cell)) return game;
  if (!game.board[cell.r][cell.c]) return game;
  return { ...game, train: [{ r: cell.r, c: cell.c }] };
}

export function extendTrain(game, cell) {
  if (game.status !== 'playing' || !game.train.length || !inBounds(cell)) return game;
  if (!game.board[cell.r][cell.c]) return game;
  const train = game.train;
  const last = train[train.length - 1];
  if (last.r === cell.r && last.c === cell.c) return game;
  if (train.length >= 2) {
    const prev = train[train.length - 2];
    if (prev.r === cell.r && prev.c === cell.c) {
      return { ...game, train: train.slice(0, -1) };
    }
  }
  if (!isAdjacent(last, cell)) return game;
  if (train.some((step) => step.r === cell.r && step.c === cell.c)) return game;
  return { ...game, train: [...train, { r: cell.r, c: cell.c }] };
}

export function cancelTrain(game) {
  if (!game.train.length) return game;
  return { ...game, train: [] };
}

function cascade(board, nextId, rng) {
  const idState = { nextId };
  const droppedIds = [];
  const next = [];
  for (let r = 0; r < GRID; r += 1) next.push(new Array(GRID).fill(null));

  for (let c = 0; c < GRID; c += 1) {
    const kept = [];
    for (let r = 0; r < GRID; r += 1) {
      if (board[r][c]) kept.push(board[r][c]);
    }
    const missing = GRID - kept.length;
    const fresh = [];
    for (let i = 0; i < missing; i += 1) {
      const cell = spawnCell(idState, rng);
      fresh.push(cell);
      droppedIds.push(cell.id);
    }
    const col = [...fresh, ...kept];
    for (let r = 0; r < GRID; r += 1) next[r][c] = col[r];
  }

  return { board: next, nextId: idState.nextId, droppedIds };
}

/**
 * Release the current train.
 * Powerups on the path bank only when the number sum matches the target.
 * @returns {{ game: object, outcome: 'clear' | 'miss' | 'short', collected: number, droppedIds: number[] }}
 */
export function commitTrain(game, rng = Math.random) {
  const empty = { collected: 0, droppedIds: [] };
  if (game.status !== 'playing') {
    return { game, outcome: 'short', ...empty };
  }
  if (game.train.length < 2 || pathNumberCount(game.board, game.train) < 2) {
    return { game: cancelTrain(game), outcome: 'short', ...empty };
  }

  const sum = pathSum(game.board, game.train);
  if (sum !== game.target) {
    return { game: { ...game, train: [] }, outcome: 'miss', ...empty };
  }

  const bank = { ...game.bank };
  let collected = 0;
  const board = game.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  for (const step of game.train) {
    const cell = board[step.r][step.c];
    if (isPowerupCell(cell)) {
      bank[cell.powerup] += 1;
      collected += 1;
    }
    board[step.r][step.c] = null;
  }

  const fell = cascade(board, game.nextId, rng);
  const points = game.doubleArmed ? POINTS * 2 : POINTS;
  const next = {
    ...game,
    board: fell.board,
    nextId: fell.nextId,
    bank,
    score: game.score + points,
    doubleArmed: false,
    train: [],
    target: targetFor(fell.board, rng),
  };
  return { game: next, outcome: 'clear', collected, droppedIds: fell.droppedIds };
}

export function spendPowerup(game, type, rng = Math.random) {
  if (game.status !== 'playing') return game;
  if (!POWERUP_TYPES.includes(type) || !game.bank[type]) return game;

  const bank = { ...game.bank, [type]: game.bank[type] - 1 };
  const base = { ...game, bank, train: [] };

  if (type === 'time') {
    return { ...base, timeLeft: game.timeLeft + TIME_BOOST_SEC };
  }
  if (type === 'double') {
    return { ...base, doubleArmed: true };
  }

  const board = game.board.map((row) =>
    row.map((cell) => {
      if (!isNumberCell(cell)) return { ...cell };
      return {
        ...cell,
        value: 1 + Math.floor(rng() * 9),
      };
    }),
  );
  return { ...base, board, target: targetFor(board, rng) };
}

export function tickTimer(game) {
  if (game.status !== 'playing') return game;
  if (game.timeLeft <= 1) {
    return { ...game, timeLeft: 0, status: 'over', train: [] };
  }
  return { ...game, timeLeft: game.timeLeft - 1 };
}
