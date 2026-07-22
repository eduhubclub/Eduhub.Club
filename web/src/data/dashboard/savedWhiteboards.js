const STORAGE_KEY = 'eduHub.dashboard.savedWhiteboards';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(boards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function listSavedWhiteboards() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getSavedWhiteboard(id) {
  return readAll().find((b) => b.id === id) || null;
}

export function upsertSavedWhiteboard(board) {
  const list = readAll();
  const idx = list.findIndex((b) => b.id === board.id);
  if (idx >= 0) list[idx] = board;
  else list.unshift(board);
  writeAll(list);
  return board;
}

export function deleteSavedWhiteboard(id) {
  writeAll(readAll().filter((b) => b.id !== id));
}

export function createSavedWhiteboardId() {
  return `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
