/**
 * Boom Jump — pure game state + physics (Tamachi-style collapse platformer).
 * Canvas view drives a fixed timestep via stepBoomJump.
 */

export const TILE = 32;
export const COLLAPSE_MS = 420;
export const COYOTE_MS = 90;
export const JUMP_BUFFER_MS = 110;

export const TILE_TYPES = {
  solid: 'solid',
  cloud: 'cloud',
  spike: 'spike',
  tntRed: 'tnt-red',
  tntYellow: 'tnt-yellow',
};

const GRAVITY = 2200;
const MOVE_ACCEL = 3200;
const MOVE_MAX = 220;
const FRICTION_GROUND = 1800;
const JUMP_V = 520;
const WALL_JUMP_V = 500;
const WALL_JUMP_X = 260;
const BOUNCE_RED = 620;
const BOUNCE_YELLOW = 860;
const WALL_SLIDE = 120;

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function tileRect(t) {
  return { x: t.x, y: t.y, w: t.w, h: t.h };
}

function playerRect(p) {
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

/** Demo level — hop red TNT to start the collapse chain. */
export function createDemoLevel() {
  const T = TILE;
  const tiles = [];
  let id = 0;
  const add = (x, y, w, h, type, collapseOrder = null) => {
    tiles.push({
      id: `t${id++}`,
      x: x * T,
      y: y * T,
      w: w * T,
      h: h * T,
      type,
      collapseOrder,
      alive: true,
    });
  };

  // Ground runway
  add(1, 12, 6, 1, TILE_TYPES.solid, 0);
  add(8, 12, 3, 1, TILE_TYPES.tntRed, 1);
  add(12, 11, 3, 1, TILE_TYPES.solid, 2);
  add(16, 9, 3, 1, TILE_TYPES.cloud, 3);
  add(20, 8, 2, 1, TILE_TYPES.tntYellow, 4);
  add(23, 10, 3, 1, TILE_TYPES.solid, 5);
  add(27, 8, 2, 1, TILE_TYPES.solid, 6);
  add(30, 6, 3, 1, TILE_TYPES.cloud, 7);
  add(34, 5, 2, 1, TILE_TYPES.tntRed, 8);
  add(37, 7, 3, 1, TILE_TYPES.solid, 9);

  // Decorative walls for wall-jump practice near the end
  add(40, 3, 1, 5, TILE_TYPES.solid, 10);
  add(43, 4, 1, 4, TILE_TYPES.solid, 11);
  add(41, 8, 2, 1, TILE_TYPES.solid, 12);

  // Spikes under a gap
  add(15, 13, 1, 1, TILE_TYPES.spike, null);
  add(26, 13, 1, 1, TILE_TYPES.spike, null);

  return {
    id: 'demo-1',
    name: 'First Blast',
    width: 46 * T,
    height: 16 * T,
    playerSpawn: { x: 2.2 * T, y: 10 * T },
    tiles,
  };
}

export function createBoomJumpGame(level = createDemoLevel()) {
  const spawn = level.playerSpawn;
  return {
    level: {
      ...level,
      tiles: level.tiles.map((t) => ({ ...t, alive: true })),
    },
    player: {
      x: spawn.x,
      y: spawn.y,
      w: 20,
      h: 26,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      wallL: false,
      wallR: false,
      coyoteMs: 0,
      jumpBufferMs: 0,
      alive: true,
    },
    cameraX: 0,
    boomStarted: false,
    collapseQueue: [],
    collapseTimerMs: 0,
    status: 'playing', // playing | won | lost
    elapsedMs: 0,
    message: 'Hop a TNT block to start the blast!',
  };
}

function solidTiles(state) {
  return state.level.tiles.filter(
    (t) =>
      t.alive &&
      (t.type === TILE_TYPES.solid ||
        t.type === TILE_TYPES.cloud ||
        t.type === TILE_TYPES.tntRed ||
        t.type === TILE_TYPES.tntYellow),
  );
}

function spikeTiles(state) {
  return state.level.tiles.filter(
    (t) => t.alive && t.type === TILE_TYPES.spike,
  );
}

function resolveAxis(player, tiles, axis) {
  for (const t of tiles) {
    const prect = playerRect(player);
    const tr = tileRect(t);
    if (!rectsOverlap(prect, tr)) continue;

    if (axis === 'x') {
      if (player.vx > 0) {
        player.x = tr.x - player.w;
        player.vx = 0;
        player.wallR = true;
      } else if (player.vx < 0) {
        player.x = tr.x + tr.w;
        player.vx = 0;
        player.wallL = true;
      }
    } else if (player.vy > 0) {
      player.y = tr.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.landedOn = t;
    } else if (player.vy < 0) {
      player.y = tr.y + tr.h;
      player.vy = 0;
    }
  }
}

/** Detect wall contact for wall-jumps even when not pushing into the wall. */
function detectWalls(player, tiles) {
  const body = {
    x: player.x,
    y: player.y + 4,
    w: player.w,
    h: Math.max(8, player.h - 8),
  };
  const leftProbe = { ...body, x: player.x - 3, w: 5 };
  const rightProbe = { ...body, x: player.x + player.w - 2, w: 5 };
  for (const t of tiles) {
    const tr = tileRect(t);
    if (rectsOverlap(leftProbe, tr)) player.wallL = true;
    if (rectsOverlap(rightProbe, tr)) player.wallR = true;
  }
}

function tryJump(player, input) {
  const canCoyote = player.coyoteMs > 0;
  const buffered = player.jumpBufferMs > 0 || input.jumpPressed;
  if (!buffered) return;

  if (player.onGround || canCoyote) {
    player.vy = -JUMP_V;
    player.onGround = false;
    player.coyoteMs = 0;
    player.jumpBufferMs = 0;
    return;
  }

  if (player.wallL) {
    player.vy = -WALL_JUMP_V;
    player.vx = WALL_JUMP_X;
    player.facing = 1;
    player.jumpBufferMs = 0;
    return;
  }
  if (player.wallR) {
    player.vy = -WALL_JUMP_V;
    player.vx = -WALL_JUMP_X;
    player.facing = -1;
    player.jumpBufferMs = 0;
  }
}

function startBoom(state, seedTile) {
  if (state.boomStarted) return;
  state.boomStarted = true;
  state.message = 'Blast started — stay airborne!';

  const ordered = state.level.tiles
    .filter((t) => t.alive && t.collapseOrder != null)
    .sort((a, b) => a.collapseOrder - b.collapseOrder)
    .map((t) => t.id);

  // Ensure the TNT you hit collapses early if not already queued first.
  if (seedTile?.collapseOrder != null) {
    const rest = ordered.filter((id) => id !== seedTile.id);
    state.collapseQueue = [seedTile.id, ...rest];
  } else {
    state.collapseQueue = ordered;
  }
  state.collapseTimerMs = COLLAPSE_MS * 0.35;
}

function applyBounce(state, tile) {
  const p = state.player;
  if (tile.type === TILE_TYPES.tntYellow) {
    p.vy = -BOUNCE_YELLOW;
    startBoom(state, tile);
    state.message = 'Yellow boost!';
  } else if (tile.type === TILE_TYPES.tntRed) {
    p.vy = -BOUNCE_RED;
    startBoom(state, tile);
    state.message = 'Red boost — platforms are vanishing!';
  }
}

function tickCollapse(state, dtMs) {
  if (!state.boomStarted || state.status !== 'playing') return;
  if (!state.collapseQueue.length) {
    // All collapse tiles gone — win if player still alive.
    state.status = 'won';
    state.message = 'You outlasted the blast!';
    return;
  }

  state.collapseTimerMs -= dtMs;
  if (state.collapseTimerMs > 0) return;
  state.collapseTimerMs += COLLAPSE_MS;

  const id = state.collapseQueue.shift();
  const tile = state.level.tiles.find((t) => t.id === id);
  if (tile) tile.alive = false;
}

/**
 * @param {object} state
 * @param {number} dtMs
 * @param {{ left: boolean, right: boolean, jump: boolean, jumpPressed: boolean }} input
 */
export function stepBoomJump(state, dtMs, input) {
  if (state.status !== 'playing') return state;

  const dt = Math.min(dtMs, 32) / 1000;
  const p = state.player;
  state.elapsedMs += dtMs;

  p.wallL = false;
  p.wallR = false;
  p.landedOn = null;
  const wasGrounded = p.onGround;
  p.onGround = false;

  if (input.jumpPressed) p.jumpBufferMs = JUMP_BUFFER_MS;
  else p.jumpBufferMs = Math.max(0, p.jumpBufferMs - dtMs);

  // Horizontal
  if (input.left && !input.right) {
    p.vx -= MOVE_ACCEL * dt;
    p.facing = -1;
  } else if (input.right && !input.left) {
    p.vx += MOVE_ACCEL * dt;
    p.facing = 1;
  } else if (wasGrounded) {
    const fr = FRICTION_GROUND * dt;
    if (p.vx > fr) p.vx -= fr;
    else if (p.vx < -fr) p.vx += fr;
    else p.vx = 0;
  }

  p.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, p.vx));

  // Gravity
  p.vy += GRAVITY * dt;

  const solids = solidTiles(state);

  // Move X
  p.x += p.vx * dt;
  resolveAxis(p, solids, 'x');

  // Move Y
  p.y += p.vy * dt;
  resolveAxis(p, solids, 'y');

  detectWalls(p, solids);

  // Wall slide after we know contact
  if ((p.wallL || p.wallR) && !p.onGround && p.vy > WALL_SLIDE) {
    p.vy = WALL_SLIDE;
  }

  if (p.onGround) p.coyoteMs = COYOTE_MS;
  else p.coyoteMs = Math.max(0, p.coyoteMs - dtMs);

  tryJump(p, input);

  if (p.landedOn) applyBounce(state, p.landedOn);

  // Spikes
  const pref = playerRect(p);
  for (const spike of spikeTiles(state)) {
    if (rectsOverlap(pref, tileRect(spike))) {
      p.alive = false;
      state.status = 'lost';
      state.message = 'Ouch — spikes!';
      return state;
    }
  }

  // Fell off
  if (p.y > state.level.height + 80) {
    p.alive = false;
    state.status = 'lost';
    state.message = 'Fell into the void!';
    return state;
  }

  tickCollapse(state, dtMs);

  // Camera follow
  const viewW = 720;
  state.cameraX = Math.max(
    0,
    Math.min(state.level.width - viewW, p.x + p.w / 2 - viewW / 2),
  );

  return state;
}

export function resetBoomJump(level) {
  return createBoomJumpGame(level || createDemoLevel());
}
