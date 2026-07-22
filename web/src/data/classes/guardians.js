/** Max parents/guardians editable from the class roster grid. */
export const GRID_GUARDIAN_LIMIT = 2;

export const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Guardian',
  'Grandparent',
  'Step-parent',
  'Other',
];

function emptyGuardian(relationship = 'Parent') {
  return { id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', phone: '', email: '', relationship };
}

/**
 * Normalize legacy single guardian fields into a `guardians` array.
 */
export function normalizeGuardians(student) {
  if (Array.isArray(student?.guardians) && student.guardians.length > 0) {
    return student.guardians.map((g, i) => ({
      id: g.id || `g-legacy-${i}`,
      name: g.name || '',
      phone: g.phone || '',
      email: g.email || '',
      relationship: g.relationship || (i < 2 ? 'Parent' : 'Other'),
    }));
  }

  if (student?.guardianName || student?.guardianPhone || student?.guardianEmail) {
    return [
      {
        id: 'g-legacy-0',
        name: student.guardianName || '',
        phone: student.guardianPhone || '',
        email: student.guardianEmail || '',
        relationship: 'Parent',
      },
    ];
  }

  return [];
}

/** First N guardians for the class grid (pads empty slots up to limit). */
export function guardiansForGrid(student, limit = GRID_GUARDIAN_LIMIT) {
  const list = normalizeGuardians(student);
  const slots = [];
  for (let i = 0; i < limit; i++) {
    slots.push(list[i] ? { ...list[i] } : emptyGuardian('Parent'));
  }
  return slots;
}

/**
 * Merge grid-edited parent slots (max 2) with any extra contacts
 * that only exist on the student profile (grandparents, etc.).
 */
export function mergeGridGuardians(student, gridSlots) {
  const existing = normalizeGuardians(student);
  const extras = existing.slice(GRID_GUARDIAN_LIMIT);
  const cleaned = gridSlots
    .map((g, i) => ({
      id: g.id || existing[i]?.id || `g-grid-${i}`,
      name: (g.name || '').trim(),
      phone: (g.phone || '').trim(),
      email: (g.email || '').trim(),
      relationship: g.relationship || 'Parent',
    }))
    .filter((g) => g.name || g.phone || g.email);

  return [...cleaned, ...extras];
}

export function syncLegacyGuardianFields(guardians) {
  const primary = guardians[0];
  return {
    guardians,
    guardianName: primary?.name || '',
    guardianPhone: primary?.phone || '',
    guardianEmail: primary?.email || '',
  };
}

export function createEmptyGuardian(relationship = 'Other') {
  return emptyGuardian(relationship);
}

export function isGuardianEntryEmpty(g) {
  return !(g?.name || g?.phone || g?.email);
}
