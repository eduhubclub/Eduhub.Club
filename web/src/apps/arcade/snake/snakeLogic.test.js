/**
 * Snake rules — ready → countdown → play, growth, crash.
 */
import { describe, expect, it } from 'vitest';
import {
  COLS,
  COUNTDOWN_MS,
  ROWS,
  createSnakeGame,
  queueDirection,
  stepMsForScore,
  stepSnake,
  tickSnakeCountdown,
} from './snakeLogic.js';

describe('createSnakeGame', () => {
  it('starts ready with a short snake and food on the board', () => {
    const g = createSnakeGame(() => 0);
    expect(g.snake.length).toBe(3);
    expect(g.dir).toBe('right');
    expect(g.status).toBe('ready');
    expect(g.food).toEqual({ x: 0, y: 0 });
    expect(g.food.x).toBeLessThan(COLS);
    expect(g.food.y).toBeLessThan(ROWS);
  });
});

describe('queueDirection / countdown', () => {
  it('first direction from ready starts a 3·2·1 countdown', () => {
    const g = createSnakeGame(() => 0.5);
    queueDirection(g, 'up');
    expect(g.status).toBe('countdown');
    expect(g.countdown).toBe(3);
    expect(g.dir).toBe('up');
    expect(g.pendingDir).toBe('up');
  });

  it('does not move during ready or countdown', () => {
    const g = createSnakeGame(() => 0.5);
    const head = { ...g.snake[0] };
    stepSnake(g);
    expect(g.snake[0]).toEqual(head);
    queueDirection(g, 'right');
    stepSnake(g);
    expect(g.snake[0]).toEqual(head);
  });

  it('ticks countdown into playing after three seconds', () => {
    const g = createSnakeGame(() => 0.5);
    queueDirection(g, 'right');
    tickSnakeCountdown(g, COUNTDOWN_MS);
    expect(g.countdown).toBe(2);
    tickSnakeCountdown(g, COUNTDOWN_MS);
    expect(g.countdown).toBe(1);
    tickSnakeCountdown(g, COUNTDOWN_MS);
    expect(g.status).toBe('playing');
    expect(g.message).toBe('Go!');
  });

  it('blocks 180° reverses while playing', () => {
    const g = createSnakeGame(() => 0.5);
    g.status = 'playing';
    g.dir = 'right';
    g.pendingDir = 'right';
    queueDirection(g, 'left');
    expect(g.pendingDir).toBe('right');
    queueDirection(g, 'up');
    expect(g.pendingDir).toBe('up');
  });
});

describe('stepSnake', () => {
  it('moves the head and leaves the length unchanged without food', () => {
    const g = createSnakeGame(() => 0.9);
    g.status = 'playing';
    g.food = { x: 0, y: 0 };
    const len = g.snake.length;
    const head = { ...g.snake[0] };
    stepSnake(g, () => 0.9);
    expect(g.snake.length).toBe(len);
    expect(g.snake[0]).toEqual({ x: head.x + 1, y: head.y });
  });

  it('grows and scores when eating food', () => {
    const g = createSnakeGame(() => 0.5);
    g.status = 'playing';
    const head = g.snake[0];
    g.food = { x: head.x + 1, y: head.y };
    const len = g.snake.length;
    stepSnake(g, () => 0.2);
    expect(g.snake.length).toBe(len + 1);
    expect(g.score).toBe(1);
  });

  it('loses when hitting a wall', () => {
    const g = createSnakeGame(() => 0.5);
    g.status = 'playing';
    g.snake = [{ x: COLS - 1, y: 5 }];
    g.dir = 'right';
    g.pendingDir = 'right';
    stepSnake(g);
    expect(g.status).toBe('lost');
  });

  it('loses when biting itself', () => {
    const g = createSnakeGame(() => 0.5);
    g.status = 'playing';
    g.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
      { x: 6, y: 4 },
    ];
    g.dir = 'right';
    g.pendingDir = 'right';
    g.food = { x: 0, y: 0 };
    stepSnake(g);
    expect(g.status).toBe('lost');
  });
});

describe('stepMsForScore', () => {
  it('speeds up as score rises but stays above the floor', () => {
    expect(stepMsForScore(0)).toBeGreaterThan(stepMsForScore(20));
    expect(stepMsForScore(999)).toBe(70);
  });
});
