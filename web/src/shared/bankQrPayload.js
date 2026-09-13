/**
 * One student card. The secret signs them in. The student id names them
 * in ClassBank and the library. The PIN is never in the code.
 */

import { studentDisplayName } from '../data/students/displayName';

const CARD_APP = 'eduhub.card';
const LEGACY_APP = 'eduhub.bank';

export function buildStudentBankQrPayload(student, token = '') {
  if (!student?.id) return '';
  const payload = {
    v: token ? 2 : 1,
    app: token ? CARD_APP : LEGACY_APP,
    studentId: String(student.id),
    studentNumber: String(student.studentId || '').trim(),
    name: studentDisplayName(student, ''),
  };
  if (token) payload.token = String(token);
  return JSON.stringify(payload);
}

/** Parse a scanned card. Older ClassBank cards have no token. */
export function parseStudentBankQrPayload(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data?.studentId) return null;
    if (data.app !== CARD_APP && data.app !== LEGACY_APP) return null;
    const token = String(data.token || '').trim();
    return {
      studentId: String(data.studentId),
      studentNumber: String(data.studentNumber || ''),
      name: String(data.name || ''),
      token,
      v: Number(data.v) || 1,
    };
  } catch {
    return null;
  }
}
