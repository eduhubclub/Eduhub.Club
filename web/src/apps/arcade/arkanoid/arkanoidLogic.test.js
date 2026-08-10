/**
 * Arkanoid rules — paddle bounce, brick hits, win/lose.
 */
import { describe, expect, it } from 'vitest';
import {
  BALL_SPEED,
  START_LIVES,
  bounceOffPaddle,
  collideBallBrick,
  createArkanoidGame,
  stepArkanoid,
} from './arkanoidLogic.js';

describe('createArkanoidGame', () => {
  it('starts with a full brick field, lives, and unlaunched ball', () => {
    const g = createArkanoidGame();
    expect(g.bricks.length).toBeGreaterThan(20);
    expect(g.bricks.every((b) => b.alive)).toBe(true);
    expect(g.lives).toBe(START_LIVES);
    expect(g.ball.launched).toBe(false);
    expect(g.status).toBe('playing');
  });
});

describe('bounceOffPaddle', () => {
  it('sends the ball upward from center hits', () => {
    const paddle = { x: 100, y: 400, w: 100, h: 14 };
    const ball = { x: 150, y: 390, vx: 10, vy: 200, r: 7 };
    bounceOffPaddle(ball, paddle);
    expect(ball.vy).toBeLessThan(0);
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThanOrEqual(BALL_SPEED - 0.01);
  });

  it('angles left when hitting the left edge', () => {
    const paddle = { x: 100, y: 400, w: 100, h: 14 };
    const ball = { x: 105, y: 390, vx: 0, vy: 200, r: 7 };
    bounceOffPaddle(ball, paddle);
    expect(ball.vx).toBeLessThan(0);
    expect(ball.vy).toBeLessThan(0);
  });
});

describe('collideBallBrick', () => {
  it('damages and clears a 1-hp brick', () => {
    const brick = {
      x: 100,
      y: 100,
      w: 40,
      h: 16,
      hp: 1,
      maxHp: 1,
      alive: true,
    };
    const ball = { x: 120, y: 118, vx: 0, vy: -200, r: 7 };
    expect(collideBallBrick(ball, brick)).toBe(true);
    expect(brick.alive).toBe(false);
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('only cracks a 2-hp brick on first hit', () => {
    const brick = {
      x: 100,
      y: 100,
      w: 40,
      h: 16,
      hp: 2,
      maxHp: 2,
      alive: true,
    };
    const ball = { x: 120, y: 118, vx: 0, vy: -200, r: 7 };
    expect(collideBallBrick(ball, brick)).toBe(true);
    expect(brick.alive).toBe(true);
    expect(brick.hp).toBe(1);
  });
});

describe('stepArkanoid', () => {
  it('launches on input and moves the paddle', () => {
    const g = createArkanoidGame();
    const startX = g.paddle.x;
    stepArkanoid(g, 16, { right: true });
    expect(g.paddle.x).toBeGreaterThan(startX);
    stepArkanoid(g, 16, { launch: true });
    expect(g.ball.launched).toBe(true);
    expect(g.ball.vy).not.toBe(0);
  });

  it('wins when every brick is cleared', () => {
    const g = createArkanoidGame();
    for (const b of g.bricks) b.alive = false;
    g.ball.launched = true;
    g.ball.vx = 0;
    g.ball.vy = -10;
    g.ball.x = 360;
    g.ball.y = 200;
    stepArkanoid(g, 16, {});
    expect(g.status).toBe('won');
  });

  it('loses a life when the ball falls off the bottom', () => {
    const g = createArkanoidGame();
    g.ball.launched = true;
    g.ball.x = 360;
    g.ball.y = 600;
    g.ball.vx = 0;
    g.ball.vy = 100;
    const lives = g.lives;
    stepArkanoid(g, 16, {});
    expect(g.lives).toBe(lives - 1);
    expect(g.ball.launched).toBe(false);
  });
});
