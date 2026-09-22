import { describe, expect, it, beforeEach } from 'vitest';
import {
  LOCAL_PLAYER_ID,
  MATH_TRAIN_GAME_ID,
  buildClassLeaderboard,
  clearGameScores,
  getHighScore,
  getPowerBank,
  hasPlayedRound,
  listGameScores,
  recordGameScore,
  savePowerBank,
} from './gameScores.js';

beforeEach(() => {
  clearGameScores();
});

describe('recordGameScore / getHighScore', () => {
  it('stores a first score and reports a new high', () => {
    const result = recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 40, 'Ada');
    expect(result).toEqual({ score: 40, highScore: 40, isNewHigh: true });
    expect(getHighScore('c1', MATH_TRAIN_GAME_ID, 's1')).toBe(40);
    expect(hasPlayedRound('c1', MATH_TRAIN_GAME_ID, 's1')).toBe(true);
  });

  it('keeps the higher score when a later round is lower', () => {
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 50, 'Ada');
    const result = recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 20, 'Ada');
    expect(result.isNewHigh).toBe(false);
    expect(result.highScore).toBe(50);
    expect(getHighScore('c1', MATH_TRAIN_GAME_ID, 's1')).toBe(50);
  });

  it('raises the high score when beaten', () => {
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 30);
    const result = recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 70);
    expect(result.isNewHigh).toBe(true);
    expect(result.highScore).toBe(70);
  });
});

describe('powerbank persistence', () => {
  it('saves and reloads the bank for future levels', () => {
    savePowerBank('c1', MATH_TRAIN_GAME_ID, 's1', { time: 2, random: 1, double: 3 }, 'Ada');
    expect(getPowerBank('c1', MATH_TRAIN_GAME_ID, 's1')).toEqual({
      time: 2,
      random: 1,
      double: 3,
    });
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 40, 'Ada', {
      time: 1,
      random: 1,
      double: 3,
    });
    expect(getPowerBank('c1', MATH_TRAIN_GAME_ID, 's1')).toEqual({
      time: 1,
      random: 1,
      double: 3,
    });
  });
});

describe('buildClassLeaderboard', () => {
  it('lists classmates with scores and zeros for unplayed', () => {
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's2', 80, 'Bea');
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 40, 'Ada');
    const roster = [
      { id: 's1', name: 'Ada' },
      { id: 's2', name: 'Bea' },
      { id: 's3', name: 'Cal' },
    ];
    const rows = buildClassLeaderboard(
      roster,
      'c1',
      MATH_TRAIN_GAME_ID,
      (s) => s.name,
    );
    expect(rows.map((r) => r.playerId)).toEqual(['s2', 's1', 's3']);
    expect(rows[0].score).toBe(80);
    expect(rows[2].score).toBe(0);
    expect(rows[2].hasPlayed).toBe(false);
  });
});

describe('listGameScores', () => {
  it('returns scores sorted highest first', () => {
    recordGameScore('c1', MATH_TRAIN_GAME_ID, LOCAL_PLAYER_ID, 10);
    recordGameScore('c1', MATH_TRAIN_GAME_ID, 's1', 90);
    expect(listGameScores('c1', MATH_TRAIN_GAME_ID).map((r) => r.playerId)).toEqual([
      's1',
      LOCAL_PLAYER_ID,
    ]);
  });
});
