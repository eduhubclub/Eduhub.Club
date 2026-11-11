import { useMemo } from 'react';
import { apps } from '../../index';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  audiencesForApp,
  isAppBlockedForStudents,
  isAppBlockedForTeachers,
  readDistrictAppAccess,
} from '../../../data/district/districtAppAccess';
import {
  managedParentApps,
  managedStudentApps,
  managedTeacherApps,
  readDistrictAdminAccess,
} from '../../../data/district/districtAdminAccess';
import {
  classesAtSchool,
  staffForSchool,
  studentsAtSchool,
} from '../../../data/district/districtModel';

function InsightCard({ label, value, hint, theme }) {
  return (
    <AppBoard mode="grid" pad="stage" theme={theme}>
      <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      <p className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}>{value}</p>
      {hint ? (
        <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{hint}</p>
      ) : null}
    </AppBoard>
  );
}

function audienceBadge(appId) {
  const audiences = audiencesForApp(appId);
  const labels = [];
  if (audiences.includes('teacher')) labels.push('Teachers');
  if (audiences.includes('student')) labels.push('Students');
  if (audiences.includes('parent')) labels.push('Parents');
  return labels.join(' · ') || 'Apps';
}

/**
 * DistrictHub Insights — high-level counts and building / app comparisons for admins.
 */
export function InsightsView({ org, classes = [], isDarkMode, theme }) {
  const appBlocks = useMemo(() => readDistrictAppAccess(), []);
  const adminAccess = useMemo(() => readDistrictAdminAccess(), []);

  const summary = useMemo(() => {
    const schools = org.schools || [];
    let employees = 0;
    let classesCount = 0;
    const studentKeys = new Set();
    const bySchool = [];

    for (const school of schools) {
      const staff = staffForSchool(org, school.id);
      const enrolled = studentsAtSchool(classes, school, org);
      const linked = classesAtSchool(classes, school, org);

      employees += staff.length;
      classesCount += linked.length;
      for (const row of enrolled) {
        const student = row.student;
        const key =
          student?.id != null ? `id:${student.id}` : `name:${student?.name || ''}`;
        studentKeys.add(key);
      }
      bySchool.push({
        id: school.id,
        name: school.name,
        staff: staff.length,
        students: enrolled.length,
        classes: linked.length,
      });
    }

    bySchool.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const byAppMap = new Map();
    for (const list of [managedTeacherApps(), managedStudentApps(), managedParentApps()]) {
      for (const app of list) {
        if (byAppMap.has(app.id)) continue;
        const actors = adminAccess.appActors?.[app.id] || [];
        const blockedTeachers = isAppBlockedForTeachers(app.id, appBlocks);
        const blockedStudents = isAppBlockedForStudents(app.id, appBlocks);
        byAppMap.set(app.id, {
          id: app.id,
          name: app.label,
          audience: audienceBadge(app.id),
          ready: Boolean(apps[app.id]),
          roles: actors.length,
          blockedTeachers,
          blockedStudents,
        });
      }
    }

    const byApp = [...byAppMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );

    return {
      schools: schools.length,
      employees,
      students: studentKeys.size,
      classes: classesCount,
      blockedTeachers: appBlocks.blockedTeachers?.length || 0,
      blockedStudents: appBlocks.blockedStudents?.length || 0,
      bySchool,
      byApp,
    };
  }, [org, classes, appBlocks, adminAccess]);

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Insights"
        description={`${org.name} — counts and building comparisons. Deeper reports will land here.`}
        isDarkMode={isDarkMode}
      />

      <ContentCardGrid columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" className="mb-6">
        <InsightCard label="Schools" value={summary.schools} theme={theme} />
        <InsightCard label="Employees" value={summary.employees} theme={theme} />
        <InsightCard label="Students" value={summary.students} theme={theme} />
        <InsightCard label="Classes" value={summary.classes} theme={theme} />
      </ContentCardGrid>

      <ContentCardGrid columns="grid-cols-1 sm:grid-cols-2" className="mb-6">
        <InsightCard
          label="Apps blocked for teachers"
          value={summary.blockedTeachers}
          hint="From DistrictHub → Apps → Manage."
          theme={theme}
        />
        <InsightCard
          label="Apps blocked for students"
          value={summary.blockedStudents}
          hint="District blocks apply before teacher class rules."
          theme={theme}
        />
      </ContentCardGrid>

      <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>By school</h2>
      {summary.bySchool.length === 0 ? (
        <AppBoard mode="static" theme={theme} className="mb-8">
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            Add schools to see building-level insights.
          </p>
        </AppBoard>
      ) : (
        <ul className="mb-8 flex flex-col gap-3">
          {summary.bySchool.map((row) => (
            <li key={row.id}>
              <AppBoard mode="static" pad="stage" theme={theme}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{row.name}</h3>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {row.staff} staff · {row.students} students · {row.classes} classes
                  </p>
                </div>
              </AppBoard>
            </li>
          ))}
        </ul>
      )}

      <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>By app</h2>
      {summary.byApp.length === 0 ? (
        <AppBoard mode="static" theme={theme}>
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No classroom apps in the catalog yet.
          </p>
        </AppBoard>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.byApp.map((row) => {
            const status = [];
            status.push(row.ready ? 'Ready' : 'Coming soon');
            status.push(`${row.roles} roles`);
            if (row.blockedTeachers) status.push('Blocked · teachers');
            if (row.blockedStudents) status.push('Blocked · students');
            return (
              <li key={row.id}>
                <AppBoard mode="static" pad="stage" theme={theme}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{row.name}</h3>
                      <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        {row.audience}
                      </p>
                    </div>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {status.join(' · ')}
                    </p>
                  </div>
                </AppBoard>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageShell>
  );
}
