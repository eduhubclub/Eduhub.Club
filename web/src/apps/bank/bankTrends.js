/**
 * Bank Trends — aggregate helpers for callouts and simple charts.
 */

import { studentDisplayName } from '../../data/students/displayName';

/** Per-student spend (deducts) and save (current balance + deposit total). */
export function buildStudentTrendRows(accounts = {}, roster = []) {
  return roster.map((student) => {
    const id = String(student.id);
    const account = accounts[id] || {};
    let spent = 0;
    let deposited = 0;
    for (const tx of account.transactions || []) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'deposit') deposited += amount;
      else if (tx.type === 'deduct') spent += amount;
    }
    return {
      studentId: id,
      student,
      name: studentDisplayName(student),
      balance: Number(account.balance) || 0,
      spent,
      deposited,
      net: deposited - spent,
      job: account.job || 'Unassigned',
    };
  });
}

export function pickBiggestSpender(rows = []) {
  if (!rows.length) return null;
  const ranked = [...rows].sort((a, b) => {
    if (b.spent !== a.spent) return b.spent - a.spent;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return ranked[0].spent > 0 ? ranked[0] : null;
}

export function pickBiggestSaver(rows = []) {
  if (!rows.length) return null;
  const ranked = [...rows].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return ranked[0];
}

/** Top N by a numeric field for bar charts. */
export function topByField(rows = [], field, limit = 8) {
  return [...rows]
    .sort((a, b) => (Number(b[field]) || 0) - (Number(a[field]) || 0))
    .slice(0, limit)
    .filter((row) => (Number(row[field]) || 0) > 0);
}
