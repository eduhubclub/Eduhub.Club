import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  BALL_R,
  FIELD_H,
  FIELD_W,
  createArkanoidGame,
  resetArkanoid,
  stepArkanoid,
} from './arkanoidLogic';
import { ArcadeCabinet } from '../classic/ArcadeCabinet';
import './Arkanoid.css';

const FIXED_MS = 1000 / 60;

const BRICK_COLORS = {
  pink: { fill: '#ff4fd8', stroke: '#9d174d' },
  orange: { fill: '#fb923c', stroke: '#9a3412' },
  amber: { fill: '#fbbf24', stroke: '#92400e' },
  lime: { fill: '#a3e635', stroke: '#3f6212' },
  cyan: { fill: '#2de2e6', stroke: '#0e7490' },
  violet: { fill: '#a78bfa', stroke: '#5b21b6' },
};

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

function paint(ctx, state, isDark) {
  ctx.clearRect(0, 0, FIELD_W, FIELD_H);

  const bg = ctx.createLinearGradient(0, 0, 0, FIELD_H);
  if (isDark) {
    bg.addColorStop(0, '#1a0a32');
    bg.addColorStop(1, '#0f172a');
  } else {
    bg.addColorStop(0, '#241047');
    bg.addColorStop(1, '#12081f');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Soft playfield frame
  ctx.strokeStyle = 'rgba(45, 226, 230, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, FIELD_W - 16, FIELD_H - 16);

  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    const colors = BRICK_COLORS[brick.key] || BRICK_COLORS.lime;
    const cracked = brick.hp < brick.maxHp;
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
    ctx.fill();
    ctx.stroke();
    if (cracked) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(brick.x + 6, brick.y + brick.h * 0.35);
      ctx.lineTo(brick.x + brick.w - 8, brick.y + brick.h * 0.65);
      ctx.stroke();
    }
  }

  const { paddle, ball } = state;
  ctx.fillStyle = '#f7f3e8';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();
  ctx.stroke();
  // Paddle accent
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(paddle.x + 8, paddle.y + 3, paddle.w - 16, 3);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.fill();
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ball.x - 2, ball.y - 2, Math.max(2, BALL_R * 0.35), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
}

/**
 * Arkanoid — canvas Breakout-style classic.
 */
export function ArkanoidView({ isDarkMode }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const gameRef = useRef(createArkanoidGame());
  const inputRef = useRef({
    left: false,
    right: false,
    launch: false,
    pointerX: null,
  });
  const [hud, setHud] = useState(() => ({
    status: 'playing',
    message: gameRef.current.message,
    score: 0,
    lives: gameRef.current.lives,
  }));

  const restart = () => {
    gameRef.current = resetArkanoid();
    inputRef.current = {
      left: false,
      right: false,
      launch: false,
      pointerX: null,
    };
    setHud({
      status: 'playing',
      message: gameRef.current.message,
      score: 0,
      lives: gameRef.current.lives,
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
        c === 'Space' ||
        c === 'ArrowUp'
      ) {
        e.preventDefault();
      }
      const input = inputRef.current;
      if (c === 'ArrowLeft' || c === 'KeyA') input.left = down;
      if (c === 'ArrowRight' || c === 'KeyD') input.right = down;
      if (down && (c === 'Space' || c === 'ArrowUp')) input.launch = true;
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
        stepArkanoid(gameRef.current, FIXED_MS, input);
        input.launch = false;
        acc -= FIXED_MS;
      }

      paint(ctx, gameRef.current, isDarkMode);

      const g = gameRef.current;
      setHud((prev) => {
        if (
          prev.status === g.status &&
          prev.message === g.message &&
          prev.score === g.score &&
          prev.lives === g.lives
        ) {
          return prev;
        }
        return {
          status: g.status,
          message: g.message,
          score: g.score,
          lives: g.lives,
        };
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isDarkMode]);

  const canvasToFieldX = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return null;
    return ((clientX - rect.left) / rect.width) * FIELD_W;
  };

  const hold = (key, down) => {
    const input = inputRef.current;
    if (key === 'left') input.left = down;
    if (key === 'right') input.right = down;
    if (key === 'launch' && down) input.launch = true;
  };

  return (
    <ArcadeCabinet
      title="ARKANOID"
      subtitle={`Score ${hud.score} · Lives ${hud.lives}`}
      headerRight={
        <button
          type="button"
          className="edu-control arcade-cab-btn arcade-cab-btn-primary inline-flex items-center gap-2"
          onClick={restart}
          title="Restart"
          aria-label="Restart"
        >
          <RotateCcw size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">Restart</span>
        </button>
      }
      deck={
        <>
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-ark-pad"
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
            className="edu-control arcade-cab-btn arcade-cab-btn-primary arcade-ark-pad arcade-ark-pad-launch"
            onPointerDown={(e) => {
              e.preventDefault();
              hold('launch', true);
            }}
            aria-label="Launch ball"
          >
            LAUNCH
          </button>
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-ark-pad"
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
          <p className="arcade-cab-hint w-full basis-full">
            Arrows / A D · Space launch · drag paddle · R restart
          </p>
        </>
      }
    >
      <div
        ref={stageRef}
        className="arcade-ark-stage relative mx-auto flex h-full min-h-0 w-full flex-col p-2 sm:p-3"
      >
        <p className="arcade-cab-status">{hud.message}</p>
        <div className="relative mx-auto min-h-0 w-full flex-1">
          <canvas
            ref={canvasRef}
            width={FIELD_W}
            height={FIELD_H}
            className="arcade-ark-canvas mx-auto block h-auto max-h-full w-full max-w-full"
            onPointerDown={(e) => {
              e.preventDefault();
              const x = canvasToFieldX(e.clientX);
              if (x != null) inputRef.current.pointerX = x;
              inputRef.current.launch = true;
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0 && e.pointerType === 'mouse') return;
              const x = canvasToFieldX(e.clientX);
              if (x != null) inputRef.current.pointerX = x;
            }}
            onPointerUp={(e) => {
              inputRef.current.pointerX = null;
              try {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
              } catch {
                /* ignore */
              }
            }}
            onPointerLeave={() => {
              inputRef.current.pointerX = null;
            }}
            onPointerCancel={() => {
              inputRef.current.pointerX = null;
            }}
          />
          {hud.status !== 'playing' ? (
            <div className="arcade-cab-overlay">
              <div className="arcade-cab-dialog">
                <p className="text-[12px]">
                  {hud.status === 'won' ? 'YOU WIN!' : 'TRY AGAIN'}
                </p>
                <p className="mt-2 text-[8px] text-[#a5f3fc]">{hud.message}</p>
                <button
                  type="button"
                  className="edu-control arcade-cab-btn arcade-cab-btn-primary mt-3"
                  onClick={restart}
                >
                  Play again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ArcadeCabinet>
  );
}
