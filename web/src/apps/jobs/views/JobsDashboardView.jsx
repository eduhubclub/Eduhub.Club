import { useMemo, useState } from 'react';
import { Grid, List } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
  APP_SCROLL_BOARD,
} from '../../../shared/layout';
import { formatMoney } from '../jobsState';
import { useJobs } from '../JobsContext';
import { JobHowToModal } from '../components/JobHowToModal';
import {
  studentDisplayName,
  studentShortName,
} from '../../../data/students/displayName';

/**
 * Jobs → Dashboard — cleanup reminder board; tap a student for job how-to.
 */
export function JobsDashboardView({ roster, isDarkMode, theme, classLabel }) {
  const { jobs, assignments } = useJobs();
  const [viewMode, setViewMode] = useState('grid');
  const [howto, setHowto] = useState(null);

  const jobByTitle = useMemo(() => {
    const map = new Map();
    for (const job of jobs || []) {
      map.set(job.title, job);
    }
    return map;
  }, [jobs]);

  const rows = useMemo(() => {
    return [...(roster || [])]
      .map((student) => {
        const assignment = assignments[String(student.id)] || {
          job: 'Unassigned',
          salary: 0,
        };
        const catalogJob = jobByTitle.get(assignment.job) || null;
        return {
          student,
          jobTitle: assignment.job || 'Unassigned',
          salary: Number(assignment.salary) || 0,
          icon:
            catalogJob?.icon ||
            (assignment.job === 'Unassigned' ? '—' : '💼'),
          job: catalogJob,
        };
      })
      .sort((a, b) => {
        const aUn = a.jobTitle === 'Unassigned';
        const bUn = b.jobTitle === 'Unassigned';
        if (aUn !== bUn) return aUn ? 1 : -1;
        return studentDisplayName(a.student).localeCompare(studentDisplayName(b.student));
      });
  }, [roster, assignments, jobByTitle]);

  const openHowto = (row) => {
    setHowto({
      student: row.student,
      job:
        row.job ||
        (row.jobTitle !== 'Unassigned'
          ? {
              title: row.jobTitle,
              icon: row.icon,
              howToPages: [],
            }
          : null),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={classLabel || undefined}
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={viewMode}
          onChange={setViewMode}
          options={[
            { id: 'grid', label: 'Grid', icon: Grid },
            { id: 'list', label: 'List', icon: List },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div
          className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No students on this roster yet.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rows.map((row) => {
            const unassigned = row.jobTitle === 'Unassigned';
            return (
              <button
                key={row.student.id}
                type="button"
                onClick={() => openHowto(row)}
                aria-label={`Open job how-to for ${studentDisplayName(row.student)}`}
                className={`edu-control relative flex aspect-square flex-col items-center justify-end ${APP_GRID_CARD} p-3 sm:p-4 ${theme.colorSurface} ${theme.colorOutline} transition hover:-translate-y-0.5`}
              >
                <span
                  className={`absolute top-2 left-2 text-lg leading-none ${
                    unassigned ? 'opacity-40' : ''
                  }`}
                  aria-hidden
                >
                  {row.icon}
                </span>
                <p
                  className={`absolute top-2 right-2 tabular-nums ${TYPE.labelLg} ${
                    unassigned
                      ? theme.colorOnSurfaceVariant
                      : theme.colorOnSurface
                  }`}
                >
                  {unassigned ? '—' : formatMoney(row.salary)}
                </p>
                <StudentAvatar
                  student={row.student}
                  theme={theme}
                  size="lg"
                />
                <p
                  className={`mt-2 w-full truncate text-center ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                >
                  {studentShortName(row.student)}
                </p>
                <p
                  className={`mt-0.5 w-full truncate text-center ${TYPE.titleMd} ${theme.colorOnSurface}`}
                >
                  {unassigned ? 'Unassigned' : row.jobTitle}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}
        >
          <div className={`${APP_BOARD_PAD} border-b ${theme.colorOutline}`}>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              Student jobs
            </h2>
          </div>
          <ul
            className={`divide-y ${
              isDarkMode ? 'divide-slate-700' : 'divide-slate-200'
            }`}
          >
            {rows.map((row) => {
              const unassigned = row.jobTitle === 'Unassigned';
              return (
                <li key={row.student.id}>
                  <button
                    type="button"
                    onClick={() => openHowto(row)}
                    aria-label={`Open job how-to for ${studentDisplayName(row.student)}`}
                    className={`edu-control flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5 ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <StudentAvatar
                      student={row.student}
                      theme={theme}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                      >
                        {studentDisplayName(row.student)}
                      </p>
                      <p
                        className={`truncate ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                      >
                        <span aria-hidden className="mr-1">
                          {row.icon}
                        </span>
                        {row.jobTitle}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                        unassigned
                          ? theme.colorOnSurfaceVariant
                          : theme.colorOnSurface
                      }`}
                    >
                      {unassigned ? '—' : formatMoney(row.salary)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <JobHowToModal
        open={Boolean(howto)}
        student={howto?.student}
        job={howto?.job}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setHowto(null)}
      />
    </div>
  );
}
