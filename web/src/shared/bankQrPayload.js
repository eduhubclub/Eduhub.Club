/**
 * Stable ClassBank login payload for student bank cards / QR codes.
 * PIN is never embedded — scan identifies the student; PIN is entered separately.
 */

import { studentDisplayName } from '../data/students/displayName';

export function buildStudentBankQrPayload(student) {
  if (!student?.id) return '';
  const payload = {
    v: 1,
    app: 'eduhub.bank',
    studentId: String(student.id),
    studentNumber: String(student.studentId || '').trim(),
    name: studentDisplayName(student, ''),
  };
  return JSON.stringify(payload);
}

/** Parse a scanned payload; returns null if not a ClassBank card. */
export function parseStudentBankQrPayload(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || data.app !== 'eduhub.bank' || !data.studentId) return null;
    return {
      studentId: String(data.studentId),
      studentNumber: String(data.studentNumber || ''),
      name: String(data.name || ''),
      v: Number(data.v) || 1,
    };
  } catch {
    return null;
  }
}
