import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, School } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  ADMIN_DASHBOARD_WIDGETS,
  readAdminDashboardPrefs,
  visibleAdminWidgets,
  writeAdminDashboardPrefs,
} from '../../../data/district/adminDashboardStorage';
import { staffForSchool, studentsAtSchool } from '../../../data/district/districtModel';
import { districtQuietButton } from '../fields';

function CountCard({ label, value, theme, onClick }) {
  const body = (
    <>
      <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      <p className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}>{value}</p>
    </>
  );

  if (!onClick) {
    return (
      <AppBoard mode="grid" pad="stage" theme={theme}>
        {body}
      </AppBoard>
    );
  }

  return (
    <AppBoard
      mode="grid"
      pad="stage"
      theme={theme}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`edu-control cursor-pointer ${theme.hoverBg || ''}`}
      aria-label={`${label}: ${value}`}
    >
      {body}
    </AppBoard>
  );
}

function moveId(order, id, delta) {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const next = index + delta;
  if (next < 0 || next >= order.length) return order;
  const copy = [...order];
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

export function AdminDashboardView({
  org,
  classes = [],
  canEdit,
  onOpenSchools,
  onOpenSchool,
  isDarkMode,
  theme,
}) {
  const [prefs, setPrefs] = useState(() => readAdminDashboardPrefs());
  const [customizing, setCustomizing] = useState(false);

  const savePrefs = (patch) => {
    setPrefs(writeAdminDashboardPrefs(patch));
  };

  const visible = visibleAdminWidgets(prefs);

  const counts = useMemo(() => {
    const schools = org.schools || [];
    let employees = 0;
    const studentKeys = new Set();
    for (const school of schools) {
      employees += staffForSchool(org, school.id).length;
      for (const row of studentsAtSchool(classes, school, org)) {
        const student = row.student;
        const key =
          student?.id != null ? `id:${student.id}` : `name:${student?.name || ''}`;
        studentKeys.add(key);
      }
    }
    return {
      schools: schools.length,
      employees,
      students: studentKeys.size,
    };
  }, [org, classes]);

  const renderWidget = (id) => {
    if (id === 'schools') {
      return (
        <CountCard
          key={id}
          label="Schools"
          value={counts.schools}
          theme={theme}
          onClick={onOpenSchools}
        />
      );
    }

    if (id === 'employees') {
      return <CountCard key={id} label="Employees" value={counts.employees} theme={theme} />;
    }

    if (id === 'students') {
      return <CountCard key={id} label="Students" value={counts.students} theme={theme} />;
    }

    if (id === 'shortcuts') {
      return (
        <AppBoard key={id} mode="grid" theme={theme} className="sm:col-span-3">
          <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Shortcuts</p>
          <p className={`mt-1 ${TYPE.titleSm} ${theme.colorOnSurface}`}>Jump into a school</p>
          {(org.schools || []).length === 0 ? (
            <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              Add a school from the Schools tab.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {org.schools.map((school) => (
                <button
                  key={school.id}
                  type="button"
                  className={`edu-control inline-flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                  onClick={() => onOpenSchool?.(school.id)}
                >
                  <School size={16} aria-hidden />
                  {school.name}
                </button>
              ))}
            </ul>
          )}
        </AppBoard>
      );
    }

    return null;
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Dashboard"
        description={
          canEdit
            ? `${org.name} — pin the cards you need for your day.`
            : `${org.name} — a light look at the district.`
        }
        isDarkMode={isDarkMode}
        actions={
          canEdit ? (
            <button
              type="button"
              className={districtQuietButton(theme)}
              onClick={() => setCustomizing((value) => !value)}
              aria-pressed={customizing}
            >
              {customizing ? 'Done' : 'Customize'}
            </button>
          ) : null
        }
      />

      {customizing && canEdit ? (
        <AppBoard mode="static" theme={theme} className="mb-4">
          <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>Dashboard cards</h2>
          <ul className="flex flex-col gap-2">
            {prefs.order.map((id, index) => {
              const meta = ADMIN_DASHBOARD_WIDGETS.find((widget) => widget.id === id);
              const hidden = prefs.hidden.includes(id);
              return (
                <li
                  key={id}
                  className={`flex flex-col gap-2 rounded-xl border-[1.5px] px-3 py-3 sm:flex-row sm:items-center ${theme.colorOutline}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{meta?.label || id}</p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {meta?.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className={districtQuietButton(theme)}
                      aria-label={`Move ${meta?.label || id} up`}
                      disabled={index === 0}
                      onClick={() => savePrefs({ order: moveId(prefs.order, id, -1) })}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className={districtQuietButton(theme)}
                      aria-label={`Move ${meta?.label || id} down`}
                      disabled={index === prefs.order.length - 1}
                      onClick={() => savePrefs({ order: moveId(prefs.order, id, 1) })}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      className={districtQuietButton(theme)}
                      aria-pressed={!hidden}
                      onClick={() => {
                        const next = hidden
                          ? prefs.hidden.filter((row) => row !== id)
                          : [...prefs.hidden, id];
                        savePrefs({ hidden: next });
                      }}
                    >
                      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      {hidden ? 'Hidden' : 'Shown'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </AppBoard>
      ) : null}

      <ContentCardGrid columns="grid-cols-1 sm:grid-cols-3">
        {visible.map(renderWidget)}
      </ContentCardGrid>
    </AppPageShell>
  );
}
