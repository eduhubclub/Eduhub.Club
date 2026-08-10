/**
 * Per-class savings goal. Progress = class balance growth since createdAt,
 * not the absolute class total (so a $1,000 goal can start when the class
 * already has $6,110).
 */

const STORAGE_KEY = 'eduHub.bank.classGoalByClass';

const TIMEFRAME_PRESETS = [
  { id: '7', label: '1 week', days: 7 },
  { id: '14', label: '2 weeks', days: 14 },
  { id: '30', label: '1 month', days: 30 },
  { id: '60', label: '2 months', days: 60 },
];

export { TIMEFRAME_PRESETS };

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function loadClassGoal(classId) {
  if (!classId) return null;
  const goal = readMap()[String(classId)];
  if (!goal || typeof goal !== 'object') return null;
  if (!goal.name || !Number(goal.targetAmount)) return null;
  return goal;
}

export function saveClassGoal(classId, goal) {
  if (!classId) return;
  const all = readMap();
  if (!goal) {
    delete all[String(classId)];
  } else {
    all[String(classId)] = goal;
  }
  writeMap(all);
  try {
    window.dispatchEvent(
      new CustomEvent('eduHub.bank.classGoalUpdated', {
        detail: { classId: String(classId) },
      }),
    );
  } catch {
    /* ignore */
  }
}

export function clearClassGoal(classId) {
  saveClassGoal(classId, null);
}

/**
 * @param {{ name: string, targetAmount: number, timeframeDays: number }} input
 * @param {number} classBalanceAtCreate
 */
export function createClassGoal(input, classBalanceAtCreate) {
  const targetAmount = Math.round(Number(input.targetAmount));
  const timeframeDays = Math.max(1, Math.round(Number(input.timeframeDays) || 14));
  const name = String(input.name || '').trim();
  if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
    return { ok: false, error: 'Enter a goal name and a dollar amount.' };
  }
  return {
    ok: true,
    goal: {
      name,
      targetAmount,
      timeframeDays,
      createdAt: new Date().toISOString(),
      startingBalance: Math.max(0, Math.round(Number(classBalanceAtCreate) || 0)),
    },
  };
}

/** Dollars saved toward the goal since it was created. */
export function classGoalProgress(goal, currentClassBalance) {
  if (!goal) {
    return { saved: 0, target: 0, ratio: 0, reached: false };
  }
  const target = Math.max(0, Number(goal.targetAmount) || 0);
  const start = Math.max(0, Number(goal.startingBalance) || 0);
  const current = Math.max(0, Math.round(Number(currentClassBalance) || 0));
  const saved = Math.max(0, current - start);
  const ratio = target > 0 ? Math.min(1, saved / target) : 0;
  return {
    saved,
    target,
    ratio,
    reached: target > 0 && saved >= target,
  };
}

export function classGoalDeadline(goal) {
  if (!goal?.createdAt) return null;
  const start = new Date(goal.createdAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + (Number(goal.timeframeDays) || 0));
  return end;
}

export function classGoalDaysLeft(goal, now = new Date()) {
  const deadline = classGoalDeadline(goal);
  if (!deadline) return null;
  const ms = deadline.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Split `total` across `count` students as evenly as possible (integer dollars).
 * Returns an array of length `count`.
 */
export function equalShares(total, count) {
  const n = Math.max(0, Math.floor(count));
  const amount = Math.max(0, Math.round(Number(total) || 0));
  if (!n || !amount) return [];
  const base = Math.floor(amount / n);
  const rem = amount % n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}
