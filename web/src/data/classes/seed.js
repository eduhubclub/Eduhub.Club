/**
 * Canonical student shape used across Edu.Hub.
 * Apps should pull only the fields they need via selectors.
 *
 * Demo classes come from the Storywell district roster generator
 * (3 teachers per grade elementary; same ratio at middle/high).
 *
 * Bump SEED_REVISION whenever seed content should replace in-memory state.
 */
import { createDefaultAvatar } from './avatar';
import {
  getDemoDistrictRoster,
  resetDemoDistrictRosterCache,
} from '../district/demoDistrictRoster';
import { studentDisplayName } from '../students/displayName';

export const SEED_REVISION = 28;

/** Live demo classes from the Storywell roster generator. */
export function getSeedClasses() {
  return getDemoDistrictRoster().classes;
}

/** Drop cached demo roster so the next getSeedClasses() rebuilds. */
export function invalidateDemoRosterSeed() {
  resetDemoDistrictRosterCache();
}

/** @deprecated Prefer getSeedClasses() so cache resets stay coherent. */
export const SEED_CLASSES = getDemoDistrictRoster().classes;

/** Apps that only need names (Randomizer, Groups, etc.) */
export function getStudentNames(cls) {
  return (cls?.studentList || []).map((s) => studentDisplayName(s));
}

/** Full roster for the given class */
export function getStudents(cls) {
  return cls?.studentList || [];
}

export function findClassById(classes, id) {
  return classes.find((c) => c.id === id) || null;
}

export function sortStudentsByLastName(students, order = 'asc') {
  const getParts = (name) => {
    if (!name) return { first: '', last: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(' ') };
    }
    return { last: parts[0], first: '' };
  };

  return [...students].sort((a, b) => {
    const partsA = getParts(a.name);
    const partsB = getParts(b.name);
    const lastCmp = partsA.last.toLowerCase().localeCompare(partsB.last.toLowerCase());
    if (lastCmp !== 0) return order === 'asc' ? lastCmp : -lastCmp;
    const firstCmp = partsA.first.toLowerCase().localeCompare(partsB.first.toLowerCase());
    return order === 'asc' ? firstCmp : -firstCmp;
  });
}

export function studentInitials(name) {
  if (!name) return 'ST';
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function parseManualStudentLines(text) {
  return text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: `manual-${Date.now()}-${i}`,
      name,
      avatar: createDefaultAvatar(),
    }));
}
