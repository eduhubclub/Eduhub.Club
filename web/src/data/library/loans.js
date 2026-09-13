/**
 * Checkout / return rules for Edu.Library.
 */

import { readLibrarySettings } from './settings';
import {
  activeLoanForCopy,
  activeLoansForStudent,
  appendLoan,
  createLoanId,
  getCopy,
  getTitle,
  setCopyStatus,
  updateLoan,
} from './storage';

/**
 * @param {string} [fromIso]
 * @param {number} [days]
 */
export function dueDateFrom(fromIso = new Date().toISOString(), days) {
  const settings = readLibrarySettings();
  const loanDays = days == null ? settings.loanDays : days;
  const start = new Date(fromIso);
  if (Number.isNaN(start.getTime())) return new Date().toISOString();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() + Math.max(1, Number(loanDays) || 14));
  return start.toISOString();
}

/**
 * @param {{ copyId: string, studentId: string, classId: string, loanDays?: number }} args
 */
export function checkoutCopy(args) {
  const copyId = String(args?.copyId || '');
  const studentId = String(args?.studentId || '');
  const classId = String(args?.classId || '');
  if (!copyId || !studentId) {
    return { ok: false, error: 'Pick a book and a student.' };
  }
  const copy = getCopy(copyId);
  if (!copy) return { ok: false, error: 'Copy not found.' };
  if (copy.status === 'out' || activeLoanForCopy(copyId)) {
    return { ok: false, error: 'That copy is already checked out.' };
  }

  const settings = readLibrarySettings();
  if (settings.maxBooks > 0) {
    const open = activeLoansForStudent(studentId);
    if (open.length >= settings.maxBooks) {
      return {
        ok: false,
        error: `This student already has ${open.length} book${open.length === 1 ? '' : 's'} out (max ${settings.maxBooks}).`,
      };
    }
  }

  const outAt = new Date().toISOString();
  const loan = {
    id: createLoanId(),
    copyId,
    studentId,
    classId,
    outAt,
    dueAt: dueDateFrom(outAt, args.loanDays),
    inAt: null,
  };
  appendLoan(loan);
  setCopyStatus(copyId, 'out');
  return { ok: true, loan, copy, title: getTitle(copy.titleId) };
}

/**
 * @param {string} copyId
 */
export function returnCopy(copyId) {
  const id = String(copyId || '');
  const copy = getCopy(id);
  if (!copy) return { ok: false, error: 'Copy not found.' };
  const loan = activeLoanForCopy(id);
  if (!loan && copy.status !== 'out') {
    return { ok: false, error: 'That copy is already on the shelf.' };
  }
  if (loan) {
    updateLoan(loan.id, { inAt: new Date().toISOString() });
  }
  setCopyStatus(id, 'in');
  return { ok: true, loan, copy, title: getTitle(copy.titleId) };
}

/**
 * Verify student credential against roster password (Store/Bank style).
 * @param {{ roster: Array<object>, studentId: string, pin: string }} args
 */
export function verifyStudentCredential({ roster, studentId, pin }) {
  const student = (roster || []).find((s) => String(s.id) === String(studentId));
  if (!student) return { ok: false, error: 'Student not found in this class.' };
  const expected = String(student.password || '').trim();
  const given = String(pin || '').trim();
  if (!expected) {
    return { ok: false, error: 'This student has no PIN set yet.' };
  }
  if (given !== expected) {
    return { ok: false, error: 'Incorrect PIN.' };
  }
  return { ok: true, student };
}
