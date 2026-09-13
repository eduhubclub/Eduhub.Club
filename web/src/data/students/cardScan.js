import { cardTokenMatches } from './cardToken';
import { parseStudentBankQrPayload } from '../../shared/bankQrPayload';

/**
 * A scanned student card names the student immediately.
 * The bank waits for a PIN only when the teacher has asked for one.
 * A replaced card does not match.
 */
export function resolveStudentCardScan({
  raw,
  requirePin = false,
  pin = '',
  pinOk = false,
}) {
  const student = parseStudentBankQrPayload(raw);
  if (!student?.studentId) return { ok: false, reason: 'not-card' };
  if (student.token && !cardTokenMatches(student.studentId, student.token)) {
    return {
      ok: false,
      reason: 'replaced',
      error: 'That card was replaced. Use the new one.',
      student,
    };
  }
  if (requirePin && !pinOk) {
    return {
      ok: false,
      reason: 'pin-required',
      error: 'Enter the PIN to continue in the bank.',
      student,
    };
  }
  if (requirePin && pin && !pinOk) {
    return { ok: false, reason: 'pin', error: 'Incorrect PIN.', student };
  }
  return { ok: true, student };
}
