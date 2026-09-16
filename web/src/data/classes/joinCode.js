import { makeClassroomJoinCode, normalizeJoinCode } from '../auth/codes';

/**
 * Every Edu.Classes card gets a unique join code. Existing codes stay put.
 */
export function assignClassJoinCodes(list) {
  const rows = Array.isArray(list) ? list : [];
  const used = new Set();
  let changed = false;
  const next = rows.map((cls) => {
    let joinCode = normalizeJoinCode(cls?.joinCode);
    if (!joinCode || used.has(joinCode)) {
      joinCode = makeClassroomJoinCode(used);
      changed = true;
    }
    used.add(joinCode);
    if (cls.joinCode === joinCode) return cls;
    changed = true;
    return { ...cls, joinCode };
  });
  return changed ? next : rows;
}

export function classroomFromClass(cls) {
  const joinCode = normalizeJoinCode(cls?.joinCode);
  if (!joinCode) return {};
  return { joinCode, name: String(cls.name || '').trim() };
}
