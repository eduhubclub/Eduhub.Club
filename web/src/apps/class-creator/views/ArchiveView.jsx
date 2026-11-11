import { useEffect, useMemo, useState } from 'react';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { TYPE } from '../../../shared/typography';
import { useClasses } from '../../../data/classes/ClassContext';
import { useDistrictOrg } from '../../../data/district/useDistrictOrg';
import { gradesForBand } from '../../../data/class-creator/classCreatorModel';
import {
  readClassCreatorStore,
  writeClassCreatorStore,
} from '../../../data/class-creator/classCreatorStorage';
import { GradeRosterGrid } from '../GradeRosterGrid';
import { buildMockPriorYearArchive } from '../mockPlacementArchive';

export const DEMO_ARCHIVE_DISMISSED_KEY = 'eduHub.classCreator.demoArchiveDismissed';

/**
 * Archive — finalized next-year class placements from past runs.
 */
export function ArchiveView({
  theme,
  isDarkMode,
  store,
  run,
  refresh,
  selectedArchiveId = '',
  onSelectedArchiveIdChange,
}) {
  const { allClasses } = useClasses();
  const { org } = useDistrictOrg();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (store?.archives?.length || seeding) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DEMO_ARCHIVE_DISMISSED_KEY) === '1';
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const schoolId = run?.schoolId || org?.schools?.[0]?.id || '';
    const school =
      (org?.schools || []).find((row) => row.id === schoolId) || org?.schools?.[0];
    if (!school?.id || !allClasses?.length) return;

    const mock = buildMockPriorYearArchive({
      classes: allClasses,
      org,
      schoolId: school.id,
      schoolName: school.name || run?.schoolName || 'School',
      gradeBand: run?.gradeBand || 'k5',
      yearLabel: '2025–26',
    });
    if (!mock) return;

    setSeeding(true);
    const current = readClassCreatorStore();
    if (current.archives?.length) {
      setSeeding(false);
      return;
    }
    writeClassCreatorStore({
      ...current,
      archives: [mock, ...(current.archives || [])],
    });
    refresh?.();
    setSeeding(false);
  }, [store, run, allClasses, org, refresh, seeding]);

  const archives = useMemo(() => {
    const rows = [...(store?.archives || [])];
    rows.sort((a, b) => String(b.archivedAt || '').localeCompare(String(a.archivedAt || '')));
    return rows;
  }, [store]);

  const selected =
    archives.find((row) => row.id === selectedArchiveId) || archives[0] || null;

  const archiveCards = useMemo(() => {
    if (!selected) return [];
    const band = gradesForBand(selected.gradeBand || 'k5');
    const byGrade = new Map();
    for (const grade of band) byGrade.set(grade, []);

    for (const teacher of selected.destinationTeachers || []) {
      const grade = teacher.destinationGrade || 'Unassigned grade';
      if (!byGrade.has(grade)) byGrade.set(grade, []);
      const ids = selected.draftClasses?.[teacher.id] || [];
      byGrade.get(grade).push({
        classId: teacher.id,
        className: grade,
        teacherName: teacher.name || 'Teacher',
        students: ids.map((id) => selected.students?.[id] || { id, name: id }),
      });
    }

    const ordered = [];
    for (const grade of band) {
      const rooms = byGrade.get(grade) || [];
      if (rooms.length) ordered.push({ grade, rooms });
      byGrade.delete(grade);
    }
    for (const [grade, rooms] of byGrade) {
      if (rooms.length) ordered.push({ grade, rooms });
    }
    return ordered;
  }, [selected]);

  if (!archives.length) {
    return (
      <EmptyState
        message={
          seeding
            ? 'Building demo archive…'
            : 'No archived placements yet — When a draft is final, use Archive placements on Results to keep the class lists here.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-4">
      {selected ? (
        <>
          <GradeRosterGrid
            theme={theme}
            isDarkMode={isDarkMode}
            schema={run?.schema}
            gradeColors={selected?.gradeColors || run?.gradeColors || {}}
            gradeShapes={selected?.gradeShapes || run?.gradeShapes || {}}
            cards={archiveCards}
            emptyMessage="This archive has no class lists."
          />

          {(selected.unassigned || []).length ? (
            <AppBoard mode="scroll" pad="board" theme={theme}>
              <h3 className={`${TYPE.titleSm} mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Unassigned
              </h3>
              <ul
                className={`space-y-1 ${TYPE.bodySm} ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {selected.unassigned.map((id) => (
                  <li key={id}>{selected.students[id]?.name || id}</li>
                ))}
              </ul>
            </AppBoard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
