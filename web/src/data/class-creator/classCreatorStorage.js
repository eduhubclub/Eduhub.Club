import {
  emptyStore,
  normalizePlacementRun,
  normalizeStore,
  placementArchiveFromRun,
} from './classCreatorModel';

const STORAGE_KEY = 'eduHub.classCreator.v1';
export const CLASS_CREATOR_UPDATED_EVENT = 'eduHub.classCreator.updated';

function notify() {
  window.dispatchEvent(new CustomEvent(CLASS_CREATOR_UPDATED_EVENT));
}

export function readClassCreatorStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export function writeClassCreatorStore(store) {
  const next = normalizeStore(store);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
  return next;
}

export function updateClassCreatorStore(mutator) {
  const prev = readClassCreatorStore();
  const next = mutator(prev);
  return writeClassCreatorStore(next);
}

export function getActiveRun(store = readClassCreatorStore()) {
  if (!store.activeRunId) return null;
  return store.runs.find((run) => run.id === store.activeRunId) || null;
}

export function upsertActiveRun(patchOrMutator) {
  return updateClassCreatorStore((store) => {
    const active = getActiveRun(store);
    if (!active) return store;
    const patch =
      typeof patchOrMutator === 'function' ? patchOrMutator(active) : patchOrMutator;
    const nextRun = normalizePlacementRun({
      ...active,
      ...patch,
      id: active.id,
      updatedAt: new Date().toISOString(),
    });
    return {
      ...store,
      runs: store.runs.map((run) => (run.id === nextRun.id ? nextRun : run)),
    };
  });
}

export function createPlacementRun(partial) {
  const run = normalizePlacementRun(partial);
  return updateClassCreatorStore((store) => ({
    ...store,
    activeRunId: run.id,
    runs: [...store.runs.filter((row) => row.id !== run.id), run],
  }));
}

export function setActiveRunId(runId) {
  return updateClassCreatorStore((store) => ({
    ...store,
    activeRunId: store.runs.some((run) => run.id === runId) ? runId : store.activeRunId,
  }));
}

/**
 * Snapshot the active run’s draft classes into Archive and mark the run final.
 * Returns { ok, error?, store }.
 */
export function archiveActiveRun() {
  const store = readClassCreatorStore();
  const active = getActiveRun(store);
  if (!active) return { ok: false, error: 'No active placement run.', store };
  const hasDraft = Object.values(active.draftClasses || {}).some((list) => list?.length);
  if (!hasDraft) {
    return { ok: false, error: 'Place students before archiving.', store };
  }
  const archivedAt = new Date().toISOString();
  const nextRun = normalizePlacementRun({
    ...active,
    status: 'final',
    archivedAt,
    updatedAt: archivedAt,
  });
  const snapshot = placementArchiveFromRun(nextRun);
  const archives = [
    snapshot,
    ...(store.archives || []).filter((row) => row.id !== snapshot.id),
  ];
  const next = writeClassCreatorStore({
    ...store,
    runs: store.runs.map((run) => (run.id === nextRun.id ? nextRun : run)),
    archives,
  });
  return { ok: true, store: next };
}

export function deletePlacementArchive(archiveId) {
  return updateClassCreatorStore((store) => ({
    ...store,
    archives: (store.archives || []).filter((row) => row.id !== archiveId),
  }));
}
