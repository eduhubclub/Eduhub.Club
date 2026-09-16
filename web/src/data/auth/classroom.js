import { getSupabase, invokeFunction } from './supabaseClient';
import { saveCardToken } from '../students/cardToken';

async function roster(body) {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    const error = new Error('Sign in as a teacher first.');
    error.code = 'signed_out';
    throw error;
  }
  return invokeFunction('classroom-roster', body, token);
}

export function loadClassroomRoster(classroom = {}) {
  return roster({ action: 'list', ...classroom });
}

export function addClassroomStudent({ displayName, pin, joinCode, name }) {
  return roster({ action: 'addStudent', displayName, pin, joinCode, name });
}

export function mintClassroomQr(memberId, { rotate = false, joinCode, name } = {}) {
  return roster({
    action: rotate ? 'rotateQr' : 'ensureQr',
    memberId,
    joinCode,
    name,
  });
}

/**
 * Keep the printed card and the sign-in secret the same.
 * A newer local replace wins. A newer saved card wins on another computer.
 * Failures stay quiet so a card can still be printed offline.
 */
export async function reconcileStudentCard({
  rosterStudentId,
  displayName,
  local,
  rotate = false,
}) {
  if (!rosterStudentId || !local?.token) return local;
  try {
    const result = await roster({
      action: rotate ? 'rotateQr' : 'ensureQr',
      rosterStudentId,
      displayName,
      token: local.token,
      updatedAt: local.updatedAt,
    });
    if (!result?.qrToken) return local;
    const serverAt = Date.parse(result.updatedAt) || 0;
    if (rotate || serverAt >= Number(local.updatedAt || 0)) {
      return saveCardToken(rosterStudentId, result.qrToken, serverAt || Date.now());
    }
    return local;
  } catch {
    return local;
  }
}
