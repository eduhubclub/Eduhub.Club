/**
 * Classroom jobs catalog + helpers.
 */

export const INITIAL_JOBS = [
  { id: 'j1', title: 'Line Leader', description: '', salary: 15, icon: '🚶', howToPages: [] },
  { id: 'j2', title: 'Paper Passer', description: '', salary: 10, icon: '📄', howToPages: [] },
  { id: 'j3', title: 'Tech Assistant', description: '', salary: 20, icon: '💻', howToPages: [] },
  { id: 'j4', title: 'Librarian', description: '', salary: 15, icon: '📚', howToPages: [] },
  { id: 'j5', title: 'Banker', description: '', salary: 25, icon: '🏦', howToPages: [] },
  { id: 'j6', title: 'Messenger', description: '', salary: 10, icon: '✉️', howToPages: [] },
  { id: 'j7', title: 'Board Eraser', description: '', salary: 10, icon: '🧽', howToPages: [] },
];

export const MAX_HOWTO_PAGES = 8;
export const MAX_HOWTO_IMAGE_BYTES = 1_200_000;

export function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function createHowToPage() {
  return {
    id: `ht-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    body: '',
    image: '',
  };
}

export function normalizeHowToPages(pages) {
  if (!Array.isArray(pages)) return [];
  return pages
    .slice(0, MAX_HOWTO_PAGES)
    .map((p, i) => ({
      id:
        typeof p?.id === 'string' && p.id
          ? p.id
          : `ht-${i}-${Date.now().toString(36)}`,
      title: String(p?.title || '').trim(),
      body: String(p?.body || '').trim(),
      image: typeof p?.image === 'string' ? p.image : '',
    }))
    .filter((p) => p.title || p.body || p.image);
}

export function emptyAssignments(roster = []) {
  const map = {};
  for (const s of roster) {
    map[String(s.id)] = { job: 'Unassigned', salary: 0 };
  }
  return map;
}

export function syncAssignmentsWithRoster(assignments, roster = []) {
  const next = { ...assignments };
  const ids = new Set(roster.map((s) => String(s.id)));
  for (const id of Object.keys(next)) {
    if (!ids.has(id)) delete next[id];
  }
  for (const s of roster) {
    const id = String(s.id);
    if (!next[id]) next[id] = { job: 'Unassigned', salary: 0 };
  }
  return next;
}
