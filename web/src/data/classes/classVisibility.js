/**
 * Which classes an admin may use when opening teacher tools from DistrictHub.
 * District school pages keep the full roster; tool apps only see the shared
 * Demo Class plus classes the signed-in admin owns.
 */

import { LOCAL_DEMO_CLASS_ID } from '../access/demoAccess';
import { isDemoClassId } from '../settings/DemoDataContext';

/** Shared sandbox class every admin (and teachers) can open in tools. */
export const SHARED_DEMO_CLASS_ID = LOCAL_DEMO_CLASS_ID;

export function isSharedDemoClass(clsOrId) {
  const id = typeof clsOrId === 'object' ? clsOrId?.id : clsOrId;
  return String(id || '') === SHARED_DEMO_CLASS_ID;
}

/**
 * Stamp ownership when a user creates a class.
 * Demo seed classes stay shared (no owner).
 */
export function withClassOwner(cls, userId) {
  if (!cls || typeof cls !== 'object') return cls;
  if (isDemoClassId(cls.id) || isSharedDemoClass(cls.id)) {
    const next = { ...cls };
    delete next.ownerId;
    return next;
  }
  if (!userId) return { ...cls };
  return { ...cls, ownerId: String(userId) };
}

/**
 * Classes an admin may use inside Groups, Randomizer, and other teacher tools.
 */
export function classesForAdminWorkspace(classes, userId) {
  const uid = userId ? String(userId) : '';
  return (classes || []).filter((cls) => {
    if (!cls || cls.isArchived) return false;
    if (isSharedDemoClass(cls)) return true;
    if (uid && String(cls.ownerId || '') === uid) return true;
    return false;
  });
}

export function classVisibleInAdminWorkspace(cls, userId) {
  return classesForAdminWorkspace(cls ? [cls] : [], userId).length > 0;
}
