/**
 * Game high-score database — per class, per game, per player.
 * Stored in localStorage (same pattern as Behavior points) until a remote
 * scores API exists.
 *
 * Shape:
 * {
 *   [classId]: {
 *     [gameId]: {
 *       [playerId]: { score: number, updatedAt: number, displayName?: string }
 *     }
 *   }
 * }
 */

export const GAME_SCORES_STORAGE_KEY = 'eduHub.games.highScores';
export const GAME_SCORES_UPDATED_EVENT = 'eduHub.games.highScoresUpdated';
export const LOCAL_PLAYER_ID = '_local';

/** Math Train game id in the scores DB. */
export const MATH_TRAIN_GAME_ID = 'math-train';

/** In-memory fallback for Node/tests when localStorage is unavailable. */
let memoryStore = {};

function storage() {
  try {
    const root = typeof globalThis !== 'undefined' ? globalThis : null;
    if (root?.localStorage) return root.localStorage;
  } catch {
    /* ignore */
  }
  return null;
}

function readMap() {
  const store = storage();
  if (!store) return { ...memoryStore };
  try {
    const raw = store.getItem(GAME_SCORES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  memoryStore = map;
  const store = storage();
  if (store) {
    try {
      store.setItem(GAME_SCORES_STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(GAME_SCORES_UPDATED_EVENT));
    }
  } catch {
    /* ignore */
  }
}

/** Test helper — clear persisted and in-memory scores. */
export function clearGameScores() {
  memoryStore = {};
  const store = storage();
  try {
    store?.removeItem?.(GAME_SCORES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function classBucket(map, classId) {
  const key = String(classId || 'local');
  if (!map[key] || typeof map[key] !== 'object') map[key] = {};
  return map[key];
}

function gameBucket(classMap, gameId) {
  const key = String(gameId || '');
  if (!classMap[key] || typeof classMap[key] !== 'object') classMap[key] = {};
  return classMap[key];
}

/**
 * @param {string} classId
 * @param {string} gameId
 * @param {string} playerId
 * @returns {number}
 */
export function getHighScore(classId, gameId, playerId) {
  const entry = readMap()?.[String(classId || 'local')]?.[String(gameId)]?.[String(playerId)];
  const score = Number(entry?.score);
  return Number.isFinite(score) && score > 0 ? score : 0;
}

/**
 * Whether this player has finished at least one round of the game.
 * @param {string} classId
 * @param {string} gameId
 * @param {string} playerId
 */
export function hasPlayedRound(classId, gameId, playerId) {
  const entry = readMap()?.[String(classId || 'local')]?.[String(gameId)]?.[String(playerId)];
  return Boolean(entry && typeof entry === 'object');
}

/**
 * Record a finished round. Updates the stored high score when beaten.
 * @returns {{ score: number, highScore: number, isNewHigh: boolean }}
 */
export function recordGameScore(classId, gameId, playerId, score, displayName, bank) {
  const map = readMap();
  const games = classBucket(map, classId);
  const players = gameBucket(games, gameId);
  const id = String(playerId || LOCAL_PLAYER_ID);
  const nextScore = Math.max(0, Math.floor(Number(score) || 0));
  const prev = players[id];
  const prevHigh = Math.max(0, Math.floor(Number(prev?.score) || 0));
  const highScore = Math.max(prevHigh, nextScore);
  const isNewHigh = nextScore > prevHigh;

  players[id] = {
    score: highScore,
    updatedAt: Date.now(),
    displayName:
      String(displayName || prev?.displayName || '').trim() || undefined,
    lastScore: nextScore,
    bank: normalizeStoredBank(bank != null ? bank : prev?.bank),
  };
  writeMap(map);
  return { score: nextScore, highScore, isNewHigh };
}

function normalizeStoredBank(bank) {
  return {
    time: Math.max(0, Math.floor(Number(bank?.time) || 0)),
    random: Math.max(0, Math.floor(Number(bank?.random) || 0)),
    double: Math.max(0, Math.floor(Number(bank?.double) || 0)),
  };
}

/**
 * Saved powerbank for future levels of this game.
 * @returns {{ time: number, random: number, double: number }}
 */
export function getPowerBank(classId, gameId, playerId) {
  const entry = readMap()?.[String(classId || 'local')]?.[String(gameId)]?.[String(playerId)];
  return normalizeStoredBank(entry?.bank);
}

/**
 * Persist the powerbank so collected powerups survive future levels.
 */
export function savePowerBank(classId, gameId, playerId, bank, displayName) {
  const map = readMap();
  const games = classBucket(map, classId);
  const players = gameBucket(games, gameId);
  const id = String(playerId || LOCAL_PLAYER_ID);
  const prev = players[id] || {};
  players[id] = {
    ...prev,
    score: Math.max(0, Math.floor(Number(prev.score) || 0)),
    updatedAt: Date.now(),
    displayName:
      String(displayName || prev.displayName || '').trim() || undefined,
    bank: normalizeStoredBank(bank),
  };
  writeMap(map);
  return players[id].bank;
}

/**
 * All stored scores for a game in a class.
 * @returns {Array<{ playerId: string, score: number, updatedAt: number, displayName?: string }>}
 */
export function listGameScores(classId, gameId) {
  const players = readMap()?.[String(classId || 'local')]?.[String(gameId)] || {};
  return Object.entries(players)
    .map(([playerId, entry]) => ({
      playerId,
      score: Math.max(0, Math.floor(Number(entry?.score) || 0)),
      updatedAt: Number(entry?.updatedAt) || 0,
      displayName: entry?.displayName ? String(entry.displayName) : undefined,
      lastScore: Math.max(0, Math.floor(Number(entry?.lastScore) || 0)),
    }))
    .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);
}

/**
 * Classmate leaderboard rows: roster students + any stored scores.
 * Students with no play yet still appear with score 0.
 * @param {object[]} roster
 * @param {string} classId
 * @param {string} gameId
 * @param {(student: object) => string} nameOf
 */
export function buildClassLeaderboard(roster, classId, gameId, nameOf) {
  const scores = listGameScores(classId, gameId);
  const byId = Object.fromEntries(scores.map((row) => [row.playerId, row]));
  const list = Array.isArray(roster) ? roster : [];

  const rows = list.map((student) => {
    const id = String(student.id);
    const stored = byId[id];
    return {
      playerId: id,
      student,
      name: nameOf?.(student) || student?.name || 'Student',
      score: stored?.score || 0,
      hasPlayed: Boolean(stored),
      updatedAt: stored?.updatedAt || 0,
    };
  });

  rows.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.hasPlayed) - Number(a.hasPlayed) ||
      a.name.localeCompare(b.name),
  );
  return rows;
}
