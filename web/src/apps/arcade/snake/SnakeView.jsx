import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  CELL,
  FIELD_H,
  FIELD_W,
  createSnakeGame,
  queueDirection,
  resetSnake,
  stepSnake,
  tickSnakeCountdown,
} from './snakeLogic';
import { ArcadeCabinet } from '../classic/ArcadeCabinet';
import './Snake.css';

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

function paint(ctx, state) {
  ctx.clearRect(0, 0, FIELD_W, FIELD_H);

  const bg = ctx.createLinearGradient(0, 0, 0, FIELD_H);
  bg.addColorStop(0, '#241047');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  ctx.strokeStyle = 'rgba(45, 226, 230, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD_W; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, FIELD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= FIELD_H; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(FIELD_W, y + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(45, 226, 230, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, FIELD_W - 2, FIELD_H - 2);

  if (state.food) {
    const fx = state.food.x * CELL;
    const fy = state.food.y * CELL;
    ctx.fillStyle = '#ff4fd8';
    ctx.strokeStyle = '#0a0614';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, fx + 3, fy + 3, CELL - 6, CELL - 6, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(fx + 7, fy + 7, 4, 4);
  }

  state.snake.forEach((seg, i) => {
    const x = seg.x * CELL;
    const y = seg.y * CELL;
    const isHead = i === 0;
    ctx.fillStyle = isHead ? '#2de2e6' : '#a78bfa';
    ctx.strokeStyle = '#0a0614';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, isHead ? 6 : 4);
    ctx.fill();
    ctx.stroke();
    if (isHead) {
      ctx.fillStyle = '#0a0614';
      const eye = 3;
      if (state.dir === 'right') {
        ctx.fillRect(x + CELL - 10, y + 7, eye, eye);
        ctx.fillRect(x + CELL - 10, y + CELL - 10, eye, eye);
      } else if (state.dir === 'left') {
        ctx.fillRect(x + 7, y + 7, eye, eye);
        ctx.fillRect(x + 7, y + CELL - 10, eye, eye);
      } else if (state.dir === 'up') {
        ctx.fillRect(x + 7, y + 7, eye, eye);
        ctx.fillRect(x + CELL - 10, y + 7, eye, eye);
      } else {
        ctx.fillRect(x + 7, y + CELL - 10, eye, eye);
        ctx.fillRect(x + CELL - 10, y + CELL - 10, eye, eye);
      }
    }
  });
}

/**
 * Snake — grid classic on the shared arcade cabinet.
 */
export function SnakeView() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createSnakeGame());
  const inputRef = useRef({ dir: null });
  const [hud, setHud] = useState(() => ({
    status: gameRef.current.status,
    message: gameRef.current.message,
    score: 0,
    countdown: 0,
  }));

  const restart = () => {
    gameRef.current = resetSnake();
    inputRef.current.dir = null;
    setHud({
      status: 'ready',
      message: gameRef.current.message,
      score: 0,
      countdown: 0,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
      };
      if (map[e.code]) {
        e.preventDefault();
        inputRef.current.dir = map[e.code];
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

      const g = gameRef.current;
      if (inputRef.current.dir) {
        queueDirection(g, inputRef.current.dir);
        inputRef.current.dir = null;
      }

      if (g.status === 'countdown') {
        tickSnakeCountdown(g, elapsed);
        acc = 0;
      } else if (g.status === 'playing') {
        const tick = g.stepMs || 130;
        while (acc >= tick && g.status === 'playing') {
          stepSnake(g);
          g.elapsedMs += tick;
          acc -= tick;
        }
      } else {
        acc = 0;
      }

      paint(ctx, g);

      setHud((prev) => {
        if (
          prev.status === g.status &&
          prev.message === g.message &&
          prev.score === g.score &&
          prev.countdown === g.countdown
        ) {
          return prev;
        }
        return {
          status: g.status,
          message: g.message,
          score: g.score,
          countdown: g.countdown,
        };
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const press = (dir) => {
    inputRef.current.dir = dir;
  };

  return (
    <ArcadeCabinet
      title="SNAKE"
      subtitle={`Score ${hud.score}`}
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
        <div className="arcade-snake-pad">
          <span className="arcade-snake-pad-spacer" />
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-snake-key"
            onPointerDown={(e) => {
              e.preventDefault();
              press('up');
            }}
            aria-label="Up"
          >
            ↑
          </button>
          <span className="arcade-snake-pad-spacer" />
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-snake-key"
            onPointerDown={(e) => {
              e.preventDefault();
              press('left');
            }}
            aria-label="Left"
          >
            ←
          </button>
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-cab-btn-cyan arcade-snake-key"
            onPointerDown={(e) => {
              e.preventDefault();
              press('down');
            }}
            aria-label="Down"
          >
            ↓
          </button>
          <button
            type="button"
            className="edu-control arcade-cab-btn arcade-snake-key"
            onPointerDown={(e) => {
              e.preventDefault();
              press('right');
            }}
            aria-label="Right"
          >
            →
          </button>
          <p className="arcade-cab-hint w-full basis-full">
            Press a direction to start · R restart
          </p>
        </div>
      }
    >
      <div className="arcade-snake-stage relative mx-auto flex h-full min-h-0 w-full flex-col p-2 sm:p-3">
        <p className="arcade-cab-status">{hud.message}</p>
        <div className="relative mx-auto min-h-0 w-full flex-1">
          <canvas
            ref={canvasRef}
            width={FIELD_W}
            height={FIELD_H}
            className="arcade-snake-canvas mx-auto block h-auto max-h-full w-full max-w-full"
          />
          {hud.status === 'ready' ? (
            <div className="arcade-cab-overlay">
              <div className="arcade-cab-dialog">
                <p className="text-[12px]">READY</p>
                <p className="mt-2 text-[8px] text-[#a5f3fc]">
                  Press ↑ ← ↓ → to start
                </p>
              </div>
            </div>
          ) : null}
          {hud.status === 'countdown' ? (
            <div className="arcade-cab-overlay arcade-snake-countdown">
              <p
                key={hud.countdown}
                className="arcade-snake-countdown-num"
                aria-live="polite"
              >
                {hud.countdown}
              </p>
            </div>
          ) : null}
          {hud.status === 'won' || hud.status === 'lost' ? (
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
