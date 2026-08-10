/**
 * Arkanoid / Breakout — pure game state + physics.
 * Canvas view drives a fixed timestep via stepArkanoid.
 */

export const FIELD_W = 720;
export const FIELD_H = 480;
export const PADDLE_W = 104;
export const PADDLE_H = 14;
export const PADDLE_Y = FIELD_H - 48;
export const BALL_R = 7;
export const BRICK_GAP = 4;
export const BRICK_ROWS = 6;
export const BRICK_COLS = 12;
export const START_LIVES = 3;
export const BALL_SPEED = 320;
export const PADDLE_SPEED = 420;

/** Soft → hard brick HP + palette keys. */
export const BRICK_TIERS = [
  { hp: 1, key: 'pink' },
  { hp: 1, key: 'orange' },
  { hp: 1, key: 'amber' },
  { hp: 1, key: 'lime' },
  { hp: 2, key: 'cyan' },
  { hp: 2, key: 'violet' },
];

function brickLayout() {
  const marginX = 36;
  const top = 56;
  const usable = FIELD_W - marginX * 2;
  const brickW =
    (usable - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
  const brickH = 18;
  const bricks = [];
  let id = 0;
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    const tier = BRICK_TIERS[row % BRICK_TIERS.length];
    for (let col = 0; col < BRICK_COLS; col += 1) {
      bricks.push({
        id: `b${id++}`,
        x: marginX + col * (brickW + BRICK_GAP),
        y: top + row * (brickH + BRICK_GAP),
        w: brickW,
        h: brickH,
        hp: tier.hp,
        maxHp: tier.hp,
        key: tier.key,
        alive: true,
      });
    }
  }
  return bricks;
}

export function createArkanoidGame() {
  const paddleX = (FIELD_W - PADDLE_W) / 2;
  return {
    paddle: {
      x: paddleX,
      y: PADDLE_Y,
      w: PADDLE_W,
      h: PADDLE_H,
    },
    ball: {
      x: paddleX + PADDLE_W / 2,
      y: PADDLE_Y - BALL_R - 2,
      vx: 0,
      vy: 0,
      r: BALL_R,
      launched: false,
    },
    bricks: brickLayout(),
    lives: START_LIVES,
    score: 0,
    status: 'playing', // playing | won | lost
    message: 'Move · Space / tap to launch',
    elapsedMs: 0,
  };
}

export function resetArkanoid() {
  return createArkanoidGame();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function aliveBricks(state) {
  return state.bricks.filter((b) => b.alive);
}

function serveBall(state) {
  const angle = (-Math.PI / 2) + (Math.random() * 0.5 - 0.25);
  state.ball.vx = Math.cos(angle) * BALL_SPEED;
  state.ball.vy = Math.sin(angle) * BALL_SPEED;
  state.ball.launched = true;
  state.message = 'Clear every brick!';
}

/** Stick unlaunched ball to paddle center. */
function syncBallToPaddle(state) {
  if (state.ball.launched) return;
  state.ball.x = state.paddle.x + state.paddle.w / 2;
  state.ball.y = state.paddle.y - state.ball.r - 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
}

/**
 * Bounce ball off paddle with angle based on hit offset (−1…1).
 * Classic Arkanoid-style control: edges send steeper angles.
 */
export function bounceOffPaddle(ball, paddle) {
  const hit =
    (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
  const clamped = clamp(hit, -1, 1);
  const maxAngle = (75 * Math.PI) / 180;
  const angle = clamped * maxAngle - Math.PI / 2;
  const speed = Math.max(
    BALL_SPEED,
    Math.hypot(ball.vx, ball.vy) || BALL_SPEED,
  );
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.y = paddle.y - ball.r - 0.5;
}

function circleHitsAabb(cx, cy, r, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Resolve ball vs axis-aligned brick: flip the axis of deeper overlap.
 * Returns true if a hit was applied.
 */
export function collideBallBrick(ball, brick) {
  if (!brick.alive) return false;
  if (!circleHitsAabb(ball.x, ball.y, ball.r, brick)) return false;

  const nearestX = clamp(ball.x, brick.x, brick.x + brick.w);
  const nearestY = clamp(ball.y, brick.y, brick.y + brick.h);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;

  if (Math.abs(dx) > Math.abs(dy)) {
    ball.vx *= -1;
    ball.x = dx > 0 ? brick.x + brick.w + ball.r : brick.x - ball.r;
  } else {
    ball.vy *= -1;
    ball.y = dy > 0 ? brick.y + brick.h + ball.r : brick.y - ball.r;
  }

  brick.hp -= 1;
  if (brick.hp <= 0) {
    brick.alive = false;
  }
  return true;
}

function loseLife(state) {
  state.lives -= 1;
  state.ball.launched = false;
  syncBallToPaddle(state);
  if (state.lives <= 0) {
    state.status = 'lost';
    state.message = 'Out of lives — try again!';
    return;
  }
  state.message = `Life lost · ${state.lives} left · Space to launch`;
}

/**
 * Advance simulation by dtMs. Mutates state.
 * @param {{ left?: boolean, right?: boolean, launch?: boolean }} input
 */
export function stepArkanoid(state, dtMs, input = {}) {
  if (state.status !== 'playing') return state;

  const dt = Math.min(dtMs, 32) / 1000;
  state.elapsedMs += dtMs;

  const paddle = state.paddle;
  let dx = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.pointerX != null && Number.isFinite(input.pointerX)) {
    paddle.x = clamp(
      input.pointerX - paddle.w / 2,
      0,
      FIELD_W - paddle.w,
    );
  } else {
    paddle.x = clamp(
      paddle.x + dx * PADDLE_SPEED * dt,
      0,
      FIELD_W - paddle.w,
    );
  }

  if (!state.ball.launched) {
    syncBallToPaddle(state);
    if (input.launch) serveBall(state);
    return state;
  }

  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Walls
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > FIELD_W) {
    ball.x = FIELD_W - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  // Paddle
  if (
    ball.vy > 0 &&
    circleHitsAabb(ball.x, ball.y, ball.r, paddle)
  ) {
    bounceOffPaddle(ball, paddle);
  }

  // Bricks — one collision per step keeps bounce predictable
  for (const brick of state.bricks) {
    if (!collideBallBrick(ball, brick)) continue;
    const points = brick.alive ? 5 : 10 * brick.maxHp;
    state.score += points;
    break;
  }

  if (ball.y - ball.r > FIELD_H) {
    loseLife(state);
    return state;
  }

  if (!aliveBricks(state).length) {
    state.status = 'won';
    state.message = `Cleared! Score ${state.score}`;
    ball.vx = 0;
    ball.vy = 0;
  }

  return state;
}
