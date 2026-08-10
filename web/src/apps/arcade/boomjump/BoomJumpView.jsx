import { useEffect, useRef, useState } from 'react';
import { Bomb, RotateCcw } from 'lucide-react';
import {
  COLLAPSE_MS,
  TILE,
  TILE_TYPES,
  createBoomJumpGame,
  createDemoLevel,
  resetBoomJump,
  stepBoomJump,
} from './boomJumpLogic';
import '../solitaire/Solitaire.css';
import './BoomJump.css';

const VIEW_W = 720;
const VIEW_H = 420;
const FIXED_MS = 1000 / 60;

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function tileColors(type, isDark) {
  switch (type) {
    case TILE_TYPES.tntRed:
      return { fill: '#ef4444', stroke: '#7f1d1d', label: 'TNT' };
    case TILE_TYPES.tntYellow:
      return { fill: '#fbbf24', stroke: '#92400e', label: 'TNT' };
    case TILE_TYPES.cloud:
      return { fill: isDark ? '#cbd5e1' : '#f8fafc', stroke: '#64748b', label: '' };
    case TILE_TYPES.spike:
      return { fill: '#334155', stroke: '#0f172a', label: '' };
    default:
      return { fill: isDark ? '#166534' : '#22c55e', stroke: '#14532d', label: '' };
  }
}

function paint(ctx, state, isDark) {
  const { level, player, cameraX } = state;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  if (isDark) {
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(1, '#14532d');
  } else {
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(1, '#bbf7d0');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.translate(-Math.round(cameraX), 0);

  // Distant grid hint
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < level.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, level.height);
    ctx.stroke();
  }

  for (const t of level.tiles) {
    if (!t.alive) continue;
    const colors = tileColors(t.type, isDark);
    const shake =
      state.boomStarted && t.collapseOrder != null
        ? Math.sin(state.elapsedMs / 40 + t.collapseOrder) * 1.5
        : 0;

    if (t.type === TILE_TYPES.spike) {
      ctx.fillStyle = colors.fill;
      ctx.beginPath();
      const spikes = Math.max(1, Math.round(t.w / 16));
      for (let i = 0; i < spikes; i += 1) {
        const x0 = t.x + (i / spikes) * t.w;
        const x1 = t.x + ((i + 0.5) / spikes) * t.w;
        const x2 = t.x + ((i + 1) / spikes) * t.w;
        ctx.moveTo(x0, t.y + t.h);
        ctx.lineTo(x1, t.y);
        ctx.lineTo(x2, t.y + t.h);
      }
      ctx.closePath();
      ctx.fill();
      continue;
    }

    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, t.x + shake, t.y, t.w, t.h, 6);
    ctx.fill();
    ctx.stroke();

    if (colors.label) {
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(colors.label, t.x + t.w / 2 + shake, t.y + t.h / 2);
    }
  }

  // Player
  if (player.alive) {
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, player.x, player.y, player.w, player.h, 5);
    ctx.fill();
    ctx.stroke();
    // Eye
    ctx.fillStyle = '#1a1a1a';
    const eyeX = player.facing >= 0 ? player.x + player.w - 8 : player.x + 4;
    ctx.fillRect(eyeX, player.y + 8, 4, 4);
  }

  ctx.restore();

  // Vignette status strip overlay is DOM; flash on boom
  if (state.boomStarted && state.status === 'playing') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.08)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

/**
 * Boom Jump — canvas platformer vertical slice.
 */
export function BoomJumpView({ isDarkMode }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createBoomJumpGame());
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  });
  const [hud, setHud] = useState(() => ({
    status: 'playing',
    message: gameRef.current.message,
    boomStarted: false,
  }));

  const restart = () => {
    gameRef.current = resetBoomJump(createDemoLevel());
    inputRef.current = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
    };
    setHud({
      status: 'playing',
      message: gameRef.current.message,
      boomStarted: false,
    });
  };

  useEffect(() => {
    const onKey = (e, down) => {
      const c = e.code;
      if (
        c === 'ArrowLeft' ||
        c === 'KeyA' ||
        c === 'ArrowRight' ||
        c === 'KeyD' ||
        c === 'ArrowUp' ||
        c === 'KeyW' ||
        c === 'Space'
      ) {
        e.preventDefault();
      }
      const input = inputRef.current;
      if (c === 'ArrowLeft' || c === 'KeyA') input.left = down;
      if (c === 'ArrowRight' || c === 'KeyD') input.right = down;
      if (c === 'ArrowUp' || c === 'KeyW' || c === 'Space') {
        if (down && !input.jump) input.jumpPressed = true;
        input.jump = down;
      }
      if (down && c === 'KeyR') restart();
    };
    const down = (e) => onKey(e, true);
    const up = (e) => onKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const frame = (now) => {
      const elapsed = now - last;
      last = now;
      acc += elapsed;

      const input = inputRef.current;
      while (acc >= FIXED_MS) {
        stepBoomJump(gameRef.current, FIXED_MS, input);
        input.jumpPressed = false;
        acc -= FIXED_MS;
      }

      paint(ctx, gameRef.current, isDarkMode);

      const g = gameRef.current;
      setHud((prev) => {
        if (
          prev.status === g.status &&
          prev.message === g.message &&
          prev.boomStarted === g.boomStarted
        ) {
          return prev;
        }
        return {
          status: g.status,
          message: g.message,
          boomStarted: g.boomStarted,
        };
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isDarkMode]);

  const felt = isDarkMode ? 'arcade-felt-dark' : 'arcade-felt';
  const hold = (key, down) => {
    const input = inputRef.current;
    if (key === 'left') input.left = down;
    if (key === 'right') input.right = down;
    if (key === 'jump') {
      if (down && !input.jump) input.jumpPressed = true;
      input.jump = down;
    }
  };

  return (
    <div
      className={`arcade-pixel relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl pt-3 ${felt}`}
    >
      <div className="arcade-panel mx-3 flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 sm:mx-4">
        <span className="inline-flex items-center gap-2 text-[14px] leading-[1.35] text-[#f7f3e8]">
          <Bomb size={16} strokeWidth={2.5} />
          Boom Jump
        </span>
        <span className="text-[8px] text-[#bbf7d0]">
          {hud.boomStarted ? `Collapse ${COLLAPSE_MS}ms` : 'Ready'}
        </span>
        <div className="ml-auto">
          <button
            type="button"
            className="edu-control arcade-btn arcade-btn-primary inline-flex items-center gap-2"
            onClick={restart}
            title="Restart"
            aria-label="Restart"
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      <div className="arcade-play-scroll relative min-h-0 flex-1 px-3 pb-2 pt-2 sm:px-4">
        <div className="arcade-boom-stage mx-auto flex h-full min-h-0 max-w-5xl flex-col">
          <p className="mb-2 shrink-0 text-center text-[8px] leading-relaxed text-[#f7f3e8]">
            {hud.message}
          </p>
          <div className="relative mx-auto min-h-0 w-full flex-1">
            <canvas
              ref={canvasRef}
              width={VIEW_W}
              height={VIEW_H}
              className="arcade-boom-canvas mx-auto block h-auto max-h-full w-full max-w-full rounded-2xl border-[3px] border-[#1a1a1a] bg-[#0d7a45]"
            />
            {hud.status !== 'playing' ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="arcade-panel pointer-events-auto px-5 py-4 text-center">
                  <p className="text-[12px] text-[#f7f3e8]">
                    {hud.status === 'won' ? 'YOU WIN!' : 'TRY AGAIN'}
                  </p>
                  <p className="mt-2 text-[8px] text-[#bbf7d0]">{hud.message}</p>
                  <button
                    type="button"
                    className="edu-control arcade-btn arcade-btn-primary mt-3"
                    onClick={restart}
                  >
                    Play again
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex shrink-0 justify-center gap-3 pb-1">
            <button
              type="button"
              className="edu-control arcade-btn arcade-boom-pad"
              onPointerDown={(e) => {
                e.preventDefault();
                hold('left', true);
              }}
              onPointerUp={() => hold('left', false)}
              onPointerLeave={() => hold('left', false)}
              onPointerCancel={() => hold('left', false)}
              aria-label="Move left"
            >
              ←
            </button>
            <button
              type="button"
              className="edu-control arcade-btn arcade-btn-primary arcade-boom-pad arcade-boom-pad-jump"
              onPointerDown={(e) => {
                e.preventDefault();
                hold('jump', true);
              }}
              onPointerUp={() => hold('jump', false)}
              onPointerLeave={() => hold('jump', false)}
              onPointerCancel={() => hold('jump', false)}
              aria-label="Jump"
            >
              JUMP
            </button>
            <button
              type="button"
              className="edu-control arcade-btn arcade-boom-pad"
              onPointerDown={(e) => {
                e.preventDefault();
                hold('right', true);
              }}
              onPointerUp={() => hold('right', false)}
              onPointerLeave={() => hold('right', false)}
              onPointerCancel={() => hold('right', false)}
              aria-label="Move right"
            >
              →
            </button>
          </div>
          <p className="mt-1 shrink-0 text-center text-[7px] text-[#86efac]">
            Arrows / WASD · Space to jump · R restart · Hop TNT to blast
          </p>
        </div>
      </div>
    </div>
  );
}
