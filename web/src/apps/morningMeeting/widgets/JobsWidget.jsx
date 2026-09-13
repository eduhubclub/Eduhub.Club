import { useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import {
  emptyAssignments,
  INITIAL_JOBS,
  syncAssignmentsWithRoster,
} from '../../jobs/jobsState';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

const DATA_KEY = 'eduHub.jobs.dataByClass';
const JOBS_UPDATED_EVENT = 'eduHub.jobs.dataUpdated';

function readJobsData(classId, roster) {
  if (!classId) {
    return {
      jobs: INITIAL_JOBS.map((j) => ({ ...j })),
      assignments: emptyAssignments(roster),
    };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
    const stored = raw?.[String(classId)];
    if (stored?.jobs?.length) {
      return {
        jobs: stored.jobs,
        assignments: syncAssignmentsWithRoster(stored.assignments || {}, roster),
      };
    }
  } catch {
    /* ignore */
  }
  return {
    jobs: INITIAL_JOBS.map((j) => ({ ...j })),
    assignments: emptyAssignments(roster),
  };
}

/**
 * Classroom jobs assigned today.
 */
export function JobsWidget({ theme, classId, roster, onOpenApp, pin }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener(JOBS_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(JOBS_UPDATED_EVENT, onChange);
  }, []);

  const rows = useMemo(() => {
    void tick;
    const { assignments } = readJobsData(classId, roster || []);
    const list = [];
    for (const s of roster || []) {
      const a = assignments[String(s.id)];
      const job = a?.job && a.job !== 'Unassigned' ? a.job : null;
      if (!job) continue;
      list.push({ id: String(s.id), name: s.name || 'Student', job });
    }
    return list.sort((a, b) => a.job.localeCompare(b.job) || a.name.localeCompare(b.name));
  }, [classId, roster, tick]);

  return (
    <WidgetShell
      theme={theme}
      title="Jobs"
      icon={Briefcase}
      pin={pin}
      action={
        onOpenApp ? (
          <button
            type="button"
            className={`edu-control rounded-lg px-2 py-1 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => onOpenApp('jobs')}
          >
            Open
          </button>
        ) : null
      }
    >
      {!rows.length ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          No jobs assigned.
        </p>
      ) : (
        <ul className={`space-y-1 ${TYPE.bodySm} ${theme.colorOnSurface}`}>
          {rows.slice(0, 6).map((row) => (
            <li key={row.id} className="flex justify-between gap-2 min-w-0">
              <span className="truncate font-medium">{row.job}</span>
              <span className={`shrink-0 truncate max-w-[45%] ${theme.colorOnSurfaceVariant}`}>
                {row.name}
              </span>
            </li>
          ))}
          {rows.length > 6 ? (
            <li className={theme.colorOnSurfaceVariant}>+{rows.length - 6} more</li>
          ) : null}
        </ul>
      )}
    </WidgetShell>
  );
}
