import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { syncJobAssignmentsToBank } from '../bank/bankAccountsStorage';
import {
  INITIAL_JOBS,
  emptyAssignments,
  normalizeHowToPages,
  syncAssignmentsWithRoster,
} from './jobsState';

const DATA_KEY = 'eduHub.jobs.dataByClass';
const SYNC_KEY = 'eduHub.jobs.syncToBank';
export const JOBS_SYNC_EVENT = 'eduHub.jobs.syncToBankChanged';

const JobsContext = createContext(null);

export function readJobsSyncToBank() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

export function writeJobsSyncToBank(value) {
  const next = Boolean(value);
  try {
    localStorage.setItem(SYNC_KEY, next ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(JOBS_SYNC_EVENT, { detail: { syncToBank: next } }),
    );
  } catch {
    /* ignore */
  }
  return next;
}

/** Shared Jobs↔Bank sync preference (works outside JobsProvider). */
export function useJobsSyncToBankPreference() {
  const [syncToBank, setSyncToBank] = useState(readJobsSyncToBank);
  useEffect(() => {
    const onChange = (e) => {
      setSyncToBank(
        typeof e?.detail?.syncToBank === 'boolean'
          ? e.detail.syncToBank
          : readJobsSyncToBank(),
      );
    };
    window.addEventListener(JOBS_SYNC_EVENT, onChange);
    return () => window.removeEventListener(JOBS_SYNC_EVENT, onChange);
  }, []);
  return syncToBank;
}

function readDataMap() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDataMap(map) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function loadClassData(classId, roster) {
  const stored = classId ? readDataMap()[String(classId)] : null;
  if (stored?.jobs?.length) {
    return {
      jobs: stored.jobs,
      assignments: syncAssignmentsWithRoster(stored.assignments || {}, roster),
      boardPosts: Array.isArray(stored.boardPosts) ? stored.boardPosts : [],
    };
  }
  return {
    jobs: INITIAL_JOBS.map((j) => ({ ...j })),
    assignments: emptyAssignments(roster),
    boardPosts: [],
  };
}

export function JobsProvider({ roster, classId, children }) {
  const initial = loadClassData(classId, roster);
  const [jobs, setJobs] = useState(initial.jobs);
  const [assignments, setAssignments] = useState(initial.assignments);
  const [boardPosts, setBoardPosts] = useState(initial.boardPosts);
  const [syncToBank, setSyncToBankState] = useState(readJobsSyncToBank);
  const [seededClassId, setSeededClassId] = useState(classId);

  useEffect(() => {
    if (classId !== seededClassId) {
      const next = loadClassData(classId, roster);
      setJobs(next.jobs);
      setAssignments(next.assignments);
      setBoardPosts(next.boardPosts);
      setSeededClassId(classId);
      return;
    }
    setAssignments((prev) => syncAssignmentsWithRoster(prev, roster));
  }, [roster, classId, seededClassId]);

  useEffect(() => {
    if (!classId) return;
    const all = readDataMap();
    all[String(classId)] = { jobs, assignments, boardPosts };
    writeDataMap(all);
    try {
      window.dispatchEvent(
        new CustomEvent('eduHub.jobs.dataUpdated', {
          detail: { classId: String(classId) },
        }),
      );
    } catch {
      /* ignore */
    }
  }, [jobs, assignments, boardPosts, classId]);

  const pushToBank = useCallback(
    (nextAssignments) => {
      if (!syncToBank || !classId) return;
      syncJobAssignmentsToBank({
        classId,
        roster,
        assignments: nextAssignments,
      });
    },
    [syncToBank, classId, roster],
  );

  useEffect(() => {
    const onChange = (e) => {
      const next =
        typeof e?.detail?.syncToBank === 'boolean'
          ? e.detail.syncToBank
          : readJobsSyncToBank();
      setSyncToBankState(next);
      if (next && classId) {
        syncJobAssignmentsToBank({ classId, roster, assignments });
      }
    };
    window.addEventListener(JOBS_SYNC_EVENT, onChange);
    return () => window.removeEventListener(JOBS_SYNC_EVENT, onChange);
  }, [classId, roster, assignments]);

  const setSyncToBank = useCallback((value) => {
    writeJobsSyncToBank(value);
  }, []);

  const holdersFor = useCallback(
    (title) =>
      Object.values(assignments).filter((a) => a.job === title).length,
    [assignments],
  );

  const saveJob = useCallback(
    ({ mode, job, oldTitle }) => {
      if (!job?.title || job.salary === '' || job.salary == null) {
        return { ok: false, error: 'Title and base salary are required.' };
      }
      const salary = Number(job.salary);
      if (!Number.isFinite(salary) || salary < 0) {
        return { ok: false, error: 'Salary must be a valid number.' };
      }
      const normalized = {
        ...job,
        title: String(job.title).trim(),
        description: String(job.description || '').trim(),
        salary,
        howToPages: normalizeHowToPages(job.howToPages),
      };

      if (mode === 'create') {
        setJobs((prev) => [
          ...prev,
          { ...normalized, id: job.id || `j-${Date.now()}` },
        ]);
        return { ok: true };
      }

      setJobs((prev) => prev.map((j) => (j.id === job.id ? normalized : j)));
      setAssignments((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id].job === oldTitle) {
            next[id] = {
              job: normalized.title,
              salary: normalized.salary,
            };
          }
        }
        pushToBank(next);
        return next;
      });
      return { ok: true };
    },
    [pushToBank],
  );

  const deleteJob = useCallback(
    ({ job, oldTitle }) => {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setAssignments((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id].job === oldTitle) {
            next[id] = { job: 'Unassigned', salary: 0 };
          }
        }
        pushToBank(next);
        return next;
      });
    },
    [pushToBank],
  );

  const assignJob = useCallback(
    ({ job, studentIds }) => {
      if (!job?.title) return;
      const selected = new Set((studentIds || []).map(String));
      setAssignments((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          const isSelected = selected.has(id);
          if (isSelected) {
            next[id] = {
              job: job.title,
              salary: Number(job.salary) || 0,
            };
          } else if (next[id].job === job.title) {
            next[id] = { job: 'Unassigned', salary: 0 };
          }
        }
        pushToBank(next);
        return next;
      });
    },
    [pushToBank],
  );

  const saveBoardPost = useCallback(({ mode, post }) => {
    const title = String(post?.title || '').trim();
    const description = String(post?.description || '').trim();
    const pay = Number(post?.pay);
    if (!title) return { ok: false, error: 'Title is required.' };
    if (!Number.isFinite(pay) || pay < 0) {
      return { ok: false, error: 'Payment must be a valid amount.' };
    }
    const images = Array.isArray(post?.images)
      ? post.images.filter((url) => typeof url === 'string' && url).slice(0, 4)
      : [];
    const normalized = {
      id: post.id || `jb-${Date.now().toString(36)}`,
      title,
      description,
      pay,
      images,
      at: post.at || Date.now(),
      status: post.status === 'done' ? 'done' : 'open',
    };

    if (mode === 'edit') {
      setBoardPosts((prev) =>
        prev.map((p) => (p.id === normalized.id ? { ...p, ...normalized } : p)),
      );
      return { ok: true };
    }

    setBoardPosts((prev) => [normalized, ...prev]);
    return { ok: true };
  }, []);

  const deleteBoardPost = useCallback((postId) => {
    setBoardPosts((prev) => prev.filter((p) => p.id !== String(postId)));
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      assignments,
      boardPosts,
      holdersFor,
      saveJob,
      deleteJob,
      assignJob,
      saveBoardPost,
      deleteBoardPost,
      syncToBank,
      setSyncToBank,
    }),
    [
      jobs,
      assignments,
      boardPosts,
      holdersFor,
      saveJob,
      deleteJob,
      assignJob,
      saveBoardPost,
      deleteBoardPost,
      syncToBank,
      setSyncToBank,
    ],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
