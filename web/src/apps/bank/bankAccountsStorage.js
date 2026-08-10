/**
 * Persist Bank accounts per class so Behavior / Jobs can sync into the economy.
 */
import {
  applyTransaction,
  makeTransaction,
  seedAccountsFromRoster,
  syncAccountsWithRoster,
} from './bankState';

const STORAGE_KEY = 'eduHub.bank.accountsByClass';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function notifyAccountsUpdated(classId) {
  try {
    window.dispatchEvent(
      new CustomEvent('eduHub.bank.accountsUpdated', {
        detail: { classId: String(classId) },
      }),
    );
  } catch {
    /* ignore */
  }
}

function ensureAccounts(classId, roster) {
  let accounts = loadBankAccounts(classId);
  if (!accounts || !Object.keys(accounts).length) {
    return seedAccountsFromRoster(roster);
  }
  return syncAccountsWithRoster(accounts, roster);
}

export function loadBankAccounts(classId) {
  if (!classId) return null;
  const all = readAll();
  return all[String(classId)] || null;
}

export function saveBankAccounts(classId, accounts) {
  if (!classId || !accounts) return;
  const all = readAll();
  all[String(classId)] = accounts;
  writeAll(all);
}

/**
 * Apply a behavior award as class dollars (1 pt → $1) for selected students.
 * Seeds accounts from roster when the class has never opened Bank.
 */
export function applyBehaviorAwardToBank({ classId, roster, studentIds, behavior }) {
  if (!classId || !behavior || !studentIds?.length) return { ok: false };
  const amount = Math.abs(Number(behavior.points) || 0);
  if (!amount) return { ok: true };

  const accounts = ensureAccounts(classId, roster);
  const selected = new Set(studentIds.map(String));
  const type = behavior.points > 0 ? 'deposit' : 'deduct';
  const next = { ...accounts };

  for (const id of selected) {
    const account = next[id];
    if (!account) continue;
    const tx = makeTransaction({
      description: `Behavior: ${behavior.name}`,
      amount,
      type,
    });
    next[id] = applyTransaction(account, tx);
  }

  saveBankAccounts(classId, next);
  notifyAccountsUpdated(classId);
  return { ok: true };
}

/**
 * Push Jobs assignments onto Bank accounts so Payday can pay salaries.
 * @param {{ classId: string, roster: object[], assignments: Record<string, { job: string, salary: number }> }} args
 */
export function syncJobAssignmentsToBank({ classId, roster, assignments }) {
  if (!classId) return { ok: false };
  const accounts = ensureAccounts(classId, roster);
  const next = { ...accounts };

  for (const student of roster || []) {
    const id = String(student.id);
    const account = next[id];
    if (!account) continue;
    const a = assignments?.[id];
    next[id] = {
      ...account,
      job: a?.job || 'Unassigned',
      salary: Number(a?.salary) || 0,
    };
  }

  saveBankAccounts(classId, next);
  notifyAccountsUpdated(classId);
  return { ok: true };
}

/**
 * Apply a store redeem as a Bank deduct (storage-level, widget-safe).
 */
export function applyStoreRedeemToBank({
  classId,
  roster,
  studentIds,
  amount,
  itemName,
  itemId,
  imageSrc,
}) {
  if (!classId || !studentIds?.length) {
    return { ok: false, error: 'Missing class or students.' };
  }
  const dollars = Math.max(0, Math.round(Number(amount) || 0));
  if (!dollars) return { ok: false, error: 'Price must be greater than zero.' };

  const accounts = ensureAccounts(classId, roster);
  const selected = studentIds.map(String);
  const next = { ...accounts };
  const failed = [];

  for (const id of selected) {
    const account = next[id];
    if (!account) {
      failed.push({ studentId: id, error: 'No bank account.' });
      continue;
    }
    if ((account.balance || 0) < dollars) {
      failed.push({ studentId: id, error: 'Insufficient balance.' });
      continue;
    }
    const tx = makeTransaction({
      description: `Store: ${itemName || 'Item'}`,
      amount: dollars,
      type: 'deduct',
      storeItemId: itemId,
      imageSrc,
    });
    next[id] = applyTransaction(account, tx);
  }

  if (failed.length === selected.length) {
    return { ok: false, error: failed[0]?.error || 'Redeem failed.', failed };
  }

  saveBankAccounts(classId, next);
  notifyAccountsUpdated(classId);
  return {
    ok: true,
    redeemedIds: selected.filter((id) => !failed.some((f) => f.studentId === id)),
    failed,
  };
}

/** Verify a student bank PIN (storage-level). */
export function verifyBankPin({ classId, roster, studentId, pin }) {
  const accounts = ensureAccounts(classId, roster);
  const account = accounts[String(studentId)];
  if (!account) return { ok: false, error: 'No bank account.' };
  if (String(pin) !== String(account.pin)) {
    return { ok: false, error: 'Incorrect PIN.' };
  }
  return { ok: true, balance: account.balance || 0 };
}

export function getBankBalance({ classId, roster, studentId }) {
  const accounts = ensureAccounts(classId, roster);
  return accounts[String(studentId)]?.balance || 0;
}
