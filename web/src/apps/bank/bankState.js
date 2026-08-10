/**
 * ClassBank pure helpers + seed data (no React).
 * Behavior/parity from reference/EduBank.txt; UI lives in views.
 */

import { studentDisplayName } from '../../data/students/displayName';

export const TEACHER_PIN = '1234';

export const INITIAL_JOBS = [
  { id: 'j1', title: 'Line Leader', salary: 15, icon: '🚶' },
  { id: 'j2', title: 'Paper Passer', salary: 10, icon: '📄' },
  { id: 'j3', title: 'Tech Assistant', salary: 20, icon: '💻' },
  { id: 'j4', title: 'Librarian', salary: 15, icon: '📚' },
  { id: 'j5', title: 'Banker', salary: 25, icon: '🏦' },
  { id: 'j6', title: 'Messenger', salary: 10, icon: '✉️' },
  { id: 'j7', title: 'Board Eraser', salary: 10, icon: '🧽' },
];

const GOALS = [
  { item: 'Homework Pass', amount: 150 },
  { item: 'Pizza Slice', amount: 300 },
  { item: 'Extra Recess', amount: 200 },
  { item: 'Prize Box', amount: 100 },
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

/** Build bank records for a class roster (stable-ish seeds from student id). */
export function seedAccountsFromRoster(roster = []) {
  const accounts = {};
  // Stable baseline so seeded ledger rows stay older than live Store/Bank txs.
  const seedAt = 1_700_000_000_000;
  for (const student of roster) {
    const id = String(student.id);
    const seed = hashSeed(id);
    const job = pick(INITIAL_JOBS, seed);
    accounts[id] = {
      studentId: id,
      pin: String(1000 + (seed % 9000)),
      balance: 20 + (seed % 300),
      behaviorPoints: seed % 10,
      job: job.title,
      salary: job.salary,
      goal: pick(GOALS, seed >> 3),
      transactions: [
        {
          id: `tx-${id}-1`,
          at: seedAt - 1,
          date: 'Today',
          description: 'Class Store Purchase',
          amount: 15,
          type: 'deduct',
        },
        {
          id: `tx-${id}-2`,
          at: seedAt - 86_400_000,
          date: 'Yesterday',
          description: 'Weekly Allowance',
          amount: 50,
          type: 'deposit',
        },
      ],
    };
  }
  return accounts;
}

/** Merge roster into existing accounts; keep balances for known ids. */
export function syncAccountsWithRoster(accounts, roster = []) {
  const next = { ...accounts };
  const ids = new Set(roster.map((s) => String(s.id)));
  for (const id of Object.keys(next)) {
    if (!ids.has(id)) delete next[id];
  }
  const missing = roster.filter((s) => !next[String(s.id)]);
  if (missing.length) {
    Object.assign(next, seedAccountsFromRoster(missing));
  }
  return next;
}

export function makeTransaction({
  description,
  amount,
  type,
  id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  date = 'Just now',
  at = Date.now(),
  storeItemId,
  imageSrc,
}) {
  const tx = { id, date, at, description, amount, type };
  if (storeItemId) tx.storeItemId = String(storeItemId);
  // Prefer non-data URLs on the tx; data: images stay on the catalog item.
  if (imageSrc && !String(imageSrc).startsWith('data:')) {
    tx.imageSrc = String(imageSrc);
  }
  return tx;
}

/** Newest-first key for ledger rows (prefer `at`; fall back to id timestamp). */
export function transactionSortKey(tx) {
  const at = Number(tx?.at);
  if (Number.isFinite(at) && at > 0) return at;
  const match = String(tx?.id || '').match(/^tx-(\d{10,})/);
  if (match) return Number(match[1]);
  return 0;
}

export function applyTransaction(account, tx) {
  const delta = tx.type === 'deposit' ? tx.amount : -tx.amount;
  return {
    ...account,
    balance: Math.max(0, (account.balance || 0) + delta),
    transactions: [tx, ...(account.transactions || [])],
  };
}

export function undoTransaction(account, transactionId) {
  const tx = (account.transactions || []).find((t) => t.id === transactionId);
  if (!tx) return account;
  const reverse = tx.type === 'deposit' ? -tx.amount : tx.amount;
  return {
    ...account,
    balance: Math.max(0, (account.balance || 0) + reverse),
    transactions: account.transactions.filter((t) => t.id !== transactionId),
  };
}

export function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function flattenTransactions(accounts, rosterById) {
  const rows = [];
  for (const [studentId, account] of Object.entries(accounts || {})) {
    const student = rosterById[studentId];
    for (const tx of account.transactions || []) {
      rows.push({
        ...tx,
        studentId,
        studentName: student ? studentDisplayName(student) : 'Student',
        studentAvatar: student?.avatar,
      });
    }
  }
  return rows.sort((a, b) => {
    const diff = transactionSortKey(b) - transactionSortKey(a);
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  });
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Build a CSV string for the class ledger (all flattened transactions).
 */
export function transactionsToCsv(rows = []) {
  const header = ['Date', 'Student', 'Student ID', 'Description', 'Type', 'Amount'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const signed =
      row.type === 'deposit'
        ? Number(row.amount) || 0
        : -(Number(row.amount) || 0);
    lines.push(
      [
        csvEscape(row.date),
        csvEscape(row.studentName),
        csvEscape(row.studentId),
        csvEscape(row.description),
        csvEscape(row.type),
        csvEscape(signed),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

/** Trigger a browser download of the ledger CSV. */
export function downloadTransactionsCsv(rows, fileLabel = 'class') {
  const csv = transactionsToCsv(rows);
  const safe = String(fileLabel || 'class')
    .trim()
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'class';
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bank-transactions-${safe}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function seedPendingApprovals(roster = []) {
  if (roster.length < 2) return [];
  const a = roster[0];
  const b = roster[1];
  return [
    {
      id: 'pa1',
      studentId: String(a.id),
      studentName: studentDisplayName(a),
      date: '10 mins ago',
      description: 'Class Store: Fancy Eraser',
      amount: 15,
      type: 'deduct',
    },
    {
      id: 'pa2',
      studentId: String(b.id),
      studentName: studentDisplayName(b),
      date: '1 hour ago',
      description: 'Found a lost book',
      amount: 5,
      type: 'deposit',
    },
  ];
}
