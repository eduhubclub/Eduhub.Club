import { useEffect, useMemo, useRef } from 'react';
import { EmptyState } from '../../../shared/EmptyState';
import { TYPE } from '../../../shared/typography';
import { useClasses } from '../../../data/classes/ClassContext';
import { useDistrictOrg } from '../../../data/district/useDistrictOrg';
import {
  currentRosterYearShort,
  gradesForBand,
  normalizeStudentSnapshot,
} from '../../../data/class-creator/classCreatorModel';
import {
  PRIOR_SCALE_COLUMNS,
  ensurePriorRating,
} from '../../../data/class-creator/demoTeacherResults';
import { GradeRosterGrid } from '../GradeRosterGrid';
import { buildGradeRosterCards } from '../rosterCards';

function splitStudentName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '', name: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '', name: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
    name: parts.join(' '),
  };
}

/**
 * Roster — current grade cards (Dashboard).
 * Past placements live on Archive; next-year CSV on Setup.
 * Current lists sync into the ratings cohort automatically.
 */
export function RosterView({ theme, isDarkMode, run, upsertActiveRun }) {
  const { allClasses, setClasses } = useClasses();
  const { org } = useDistrictOrg();
  const lastSyncKey = useRef('');

  const bandGrades = useMemo(
    () => gradesForBand(run?.gradeBand || 'k5'),
    [run?.gradeBand],
  );

  const currentCards = useMemo(() => {
    if (!run) return [];
    return buildGradeRosterCards(allClasses, org, run.schoolId, bandGrades);
  }, [allClasses, org, run, bandGrades]);

  useEffect(() => {
    if (!run || !upsertActiveRun) return;
    const cohortStudentIds = [];
    const students = { ...run.students };
    for (const card of currentCards) {
      for (const room of card.rooms) {
        for (const student of room.students || []) {
          const snap = normalizeStudentSnapshot({
            ...student,
            source: 'roster',
            grade_level: student.grade_level || card.grade || '',
          });
          students[snap.id] = {
            ...students[snap.id],
            ...snap,
            services: students[snap.id]?.services || snap.services || [],
          };
          cohortStudentIds.push(snap.id);
        }
      }
    }
    const nextIds = [...new Set(cohortStudentIds)];
    const priorRatings = { ...(run.priorRatings || {}) };
    let priorChanged = false;
    for (const id of nextIds) {
      const nextPrior = ensurePriorRating(priorRatings[id], id);
      const prev = priorRatings[id];
      const scalesChanged =
        !prev ||
        PRIOR_SCALE_COLUMNS.some((col) => prev[col] !== nextPrior[col]) ||
        JSON.stringify(prev.services || []) !== JSON.stringify(nextPrior.services || []);
      if (scalesChanged) {
        priorRatings[id] = nextPrior;
        priorChanged = true;
      }
    }
    const syncKey = `${run.id}:${run.schoolId}:${nextIds.join(',')}:prior${
      priorChanged ? '+' : ''
    }`;
    if (syncKey === lastSyncKey.current) return;
    const prevIds = [...(run.cohortStudentIds || [])].sort().join(',');
    const nextSorted = [...nextIds].sort().join(',');
    const cohortUnchanged =
      prevIds === nextSorted && nextIds.every((id) => run.students?.[id]);
    if (cohortUnchanged && !priorChanged) {
      lastSyncKey.current = syncKey;
      return;
    }
    lastSyncKey.current = syncKey;
    upsertActiveRun({
      students,
      cohortStudentIds: nextIds,
      priorRatings,
    });
  }, [run, currentCards, upsertActiveRun]);

  const displayPriorRatings = useMemo(() => {
    const out = {};
    for (const card of currentCards) {
      for (const room of card.rooms || []) {
        for (const student of room.students || []) {
          const id = String(student.id);
          out[id] = ensurePriorRating(run?.priorRatings?.[id], id);
        }
      }
    }
    return out;
  }, [currentCards, run?.priorRatings]);

  const moveStudent = (studentId, fromClassId, toClassId) => {
    if (!fromClassId || !toClassId || fromClassId === toClassId) return;
    setClasses((prev) => {
      let moved = null;
      const stripped = prev.map((cls) => {
        if (cls.id !== fromClassId) return cls;
        const list = cls.studentList || [];
        moved = list.find((s) => String(s.id) === String(studentId)) || null;
        if (!moved) return cls;
        return {
          ...cls,
          studentList: list.filter((s) => String(s.id) !== String(studentId)),
        };
      });
      if (!moved) return prev;
      return stripped.map((cls) => {
        if (cls.id !== toClassId) return cls;
        if ((cls.studentList || []).some((s) => String(s.id) === String(studentId))) {
          return cls;
        }
        return {
          ...cls,
          studentList: [...(cls.studentList || []), moved],
        };
      });
    });
  };

  const removeStudent = (classId, studentId) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          studentList: (cls.studentList || []).filter(
            (s) => String(s.id) !== String(studentId),
          ),
        };
      }),
    );
  };

  const addStudent = (classId, grade, name) => {
    const parts = splitStudentName(name);
    if (!parts.name) return;
    const student = {
      id: `stu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...parts,
      grade_level: grade || '',
    };
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          studentList: [...(cls.studentList || []), student],
        };
      }),
    );
  };

  if (!run) {
    return (
      <EmptyState
        message="Start a placement run first — Use Setup to choose school and band before opening Roster."
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-3">
      <h2 className={`${TYPE.titleLg} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        Current Rosters ({currentRosterYearShort(run.yearLabel)})
      </h2>
      <GradeRosterGrid
        theme={theme}
        isDarkMode={isDarkMode}
        schema={run.schema}
        ratings={displayPriorRatings}
        ratingYearLabel="Previous year"
        gradeColors={run.gradeColors || {}}
        gradeShapes={run.gradeShapes || {}}
        cards={currentCards}
        emptyMessage="No classes found for this school and band."
        editable
        onMoveStudent={moveStudent}
        onRemoveStudent={removeStudent}
        onAddStudent={addStudent}
      />
    </div>
  );
}
