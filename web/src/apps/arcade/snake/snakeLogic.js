/**
 * Snake — pure grid game state.
 * View advances on a tick via stepSnake (not continuous physics).
 * Starts in `ready` until the first direction, then `countdown` (3·2·1).
 */

export const COLS = 24;
export const ROWS = 16;
export const CELL = 24;
export const FIELD_W = COLS * CELL;
export const FIELD_H = ROWS * CELL;
export const BASE_STEP_MS = 130;
export const MIN_STEP_MS = 70;
export const COUNTDOWN_MS = 1000;

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function cellKey(x, y) {
  return `${x},${y}`;
}

function occupiedSet(snake) {
  return new Set(snake.map((s) => cellKey(s.x, s.y)));
}

export function pickFood(snake, random = Math.random) {
  const taken = occupiedSet(snake);
  const free = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!taken.has(cellKey(x, y))) free.push({ x, y });
    }
  }
  if (!free.length) return null;
  return free[Math.floor(random() * free.length)];
}

export function createSnakeGame(random = Math.random) {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  const snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  return {
    snake,
    dir: 'right',
    pendingDir: 'right',
    food: pickFood(snake, random),
    score: 0,
    status: 'ready', // ready | countdown | playing | won | lost
    countdown: 0,
    countdownAcc: 0,
    message: 'Press a direction to start',
    stepMs: BASE_STEP_MS,
    elapsedMs: 0,
  };
}

export function resetSnake(random = Math.random) {
  return createSnakeGame(random);
}

/**
 * First direction from ready → start 3·2·1 countdown.
 * While playing, queues a turn (no 180° reverse).
 */
export function queueDirection(state, dir) {
  if (!DIRS[dir]) return state;

  if (state.status === 'ready') {
    state.dir = dir;
    state.pendingDir = dir;
    state.status = 'countdown';
    state.countdown = 3;
    state.countdownAcc = 0;
    state.message = '3';
    return state;
  }

  if (state.status !== 'playing') return state;
  if (OPPOSITE[state.dir] === dir) return state;
  state.pendingDir = dir;
  return state;
}

/** Advance countdown; flips to playing after 1. */
export function tickSnakeCountdown(state, dtMs) {
  if (state.status !== 'countdown') return state;
  state.countdownAcc += dtMs;
  while (state.countdownAcc >= COUNTDOWN_MS && state.status === 'countdown') {
    state.countdownAcc -= COUNTDOWN_MS;
    if (state.countdown > 1) {
      state.countdown -= 1;
      state.message = String(state.countdown);
    } else {
      state.countdown = 0;
      state.countdownAcc = 0;
      state.status = 'playing';
      state.message = 'Go!';
    }
  }
  return state;
}

export function stepMsForScore(score) {
  const faster = Math.floor(score / 5) * 8;
  return Math.max(MIN_STEP_MS, BASE_STEP_MS - faster);
}

/**
 * Advance one grid tick. Mutates state.
 */
export function stepSnake(state, random = Math.random) {
  if (state.status !== 'playing') return state;

  state.dir = state.pendingDir;
  const delta = DIRS[state.dir];
  const head = state.snake[0];
  const next = { x: head.x + delta.x, y: head.y + delta.y };

  // Walls
  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    state.status = 'lost';
    state.message = `Crashed! Score ${state.score}`;
    return state;
  }

  // Self — allow sliding into the tail cell if the tail will move away
  const willGrow =
    state.food && next.x === state.food.x && next.y === state.food.y;
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  if (body.some((s) => s.x === next.x && s.y === next.y)) {
    state.status = 'lost';
    state.message = `Ouch! Score ${state.score}`;
    return state;
  }

  state.snake = [next, ...state.snake];
  if (willGrow) {
    state.score += 1;
    state.stepMs = stepMsForScore(state.score);
    state.food = pickFood(state.snake, random);
    if (!state.food) {
      state.status = 'won';
      state.message = `Board cleared! Score ${state.score}`;
      return state;
    }
    state.message = `Score ${state.score}`;
  } else {
    state.snake.pop();
  }

  return state;
}
