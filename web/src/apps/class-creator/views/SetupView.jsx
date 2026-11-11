import { useEffect, useMemo, useState } from 'react';
import { Check, GripVertical, Paintbrush, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { bestOnColor } from '../../../shared/colorContrast';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { ShapePicker } from '../../../shared/ShapePicker';
import { ShapeSurface } from '../../../shared/ShapeSurface';
import { SpectrumColorPicker } from '../../../shared/SpectrumColorPicker';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { gradeShapeFor } from '../../../shared/shapeLibrary';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { createUploadAvatar } from '../../../data/classes/avatar';
import { useClasses } from '../../../data/classes/ClassContext';
import { useDistrictOrg } from '../../../data/district/useDistrictOrg';
import { staffForSchool } from '../../../data/district/districtModel';
import {
  classSectionCode,
  defaultPlacementYearLabel,
  destinationGradesForBand,
  displayPlacementYearLabel,
  gradeBandLabel,
  gradeFromStaffRole,
  gradesForBand,
  nextGradeFor,
  sectionLetterFromClassName,
} from '../../../data/class-creator/classCreatorModel';
import { NextYearImportView } from './NextYearImportView';
import { SchemaView, SectionInfoTip, cardHeaderClass } from './SchemaView';

/** Circles shown on Setup — selecting 6th expands the band to K–6. */
const GRADE_LEVEL_CIRCLES = [
  { short: 'K', grade: 'Kindergarten' },
  { short: '1', grade: '1st Grade' },
  { short: '2', grade: '2nd Grade' },
  { short: '3', grade: '3rd Grade' },
  { short: '4', grade: '4th Grade' },
  { short: '5', grade: '5th Grade' },
  { short: '6', grade: '6th Grade' },
];

function fieldClass(isDarkMode, theme) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${theme.ring} ${
    isDarkMode
      ? 'bg-slate-800 border-slate-600 text-white'
      : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
}

function gradeSortKey(grade) {
  if (!grade) return 99;
  if (grade === 'Pre-K') return -1;
  if (grade === 'Kindergarten') return 0;
  const n = Number(String(grade).match(/\d+/)?.[0]);
  return Number.isFinite(n) ? n : 50;
}

function staffAsAvatarSubject(member) {
  return {
    name: member.name,
    avatar: member.avatarUrl
      ? createUploadAvatar(member.avatarUrl, member.avatarUrl)
      : undefined,
  };
}

const DEFAULT_GRADE_SWATCH = '#94a3b8';

/**
 * Setup page — preplacement: year, grade band, teachers/sections, CSV intake, rating schema.
 * Current / previous rosters live on Dashboard; Place runs the sorter after surveys.
 */
export function SetupView({
  theme,
  isDarkMode,
  run,
  createPlacementRun,
  upsertActiveRun,
  selectableSchools = null,
  selectedSchoolId = '',
}) {
  const { org } = useDistrictOrg();
  const { allClasses } = useClasses();
  const schools =
    Array.isArray(selectableSchools) && selectableSchools.length
      ? selectableSchools
      : org?.schools || [];

  const [yearLabel, setYearLabel] = useState(
    () => displayPlacementYearLabel(run?.yearLabel),
  );
  const yearPlaceholder = defaultPlacementYearLabel();
  const [gradeBand, setGradeBand] = useState(run?.gradeBand || 'k5');
  const destOptions = useMemo(() => destinationGradesForBand(gradeBand), [gradeBand]);
  const selectedGrades = useMemo(
    () => new Set(gradesForBand(gradeBand)),
    [gradeBand],
  );

  useEffect(() => {
    setYearLabel(displayPlacementYearLabel(run?.yearLabel));
  }, [run?.id]);

  useEffect(() => {
    if (!run || !/^next year$/i.test(String(run.yearLabel || '').trim())) return;
    upsertActiveRun({ yearLabel: '' });
  }, [run?.id, run?.yearLabel, upsertActiveRun]);

  const selectGradeCircle = (grade) => {
    const nextBand =
      grade === '6th Grade' ? (gradeBand === 'k6' ? 'k5' : 'k6') : 'k5';
    setGradeBand(nextBand);
    if (run) {
      upsertActiveRun({ gradeBand: nextBand });
    }
  };
  /** Grade card open in edit mode (title, color, add/remove/reorder teachers). */
  const [editingGrade, setEditingGrade] = useState('');
  const [gradeTitleDraft, setGradeTitleDraft] = useState('');
  const [cardTeacherName, setCardTeacherName] = useState('');
  const [dragStaffId, setDragStaffId] = useState(null);
  const [dropGrade, setDropGrade] = useState('');
  const [editingSectionStaffId, setEditingSectionStaffId] = useState('');
  const [editingSectionValue, setEditingSectionValue] = useState('');

  const schoolId = run?.schoolId || selectedSchoolId || schools[0]?.id || '';
  const school = schools.find((row) => row.id === schoolId) || org?.schools?.find((row) => row.id === schoolId);
  const activeSchoolId = schoolId;

  const classGradeById = useMemo(() => {
    const map = {};
    for (const cls of allClasses || []) {
      if (cls?.id) map[String(cls.id)] = String(cls.grade || '').trim();
    }
    return map;
  }, [allClasses]);

  const classNameById = useMemo(() => {
    const map = {};
    for (const cls of allClasses || []) {
      if (cls?.id) map[String(cls.id)] = String(cls.name || '').trim();
    }
    return map;
  }, [allClasses]);

  const schoolTeachers = useMemo(() => {
    const overrides = run?.staffGradeOverrides || {};
    const staff = staffForSchool(org, activeSchoolId);
    const rows = staff
      .filter((member) => {
        const dept = String(member.department || '').toLowerCase();
        const role = String(member.role || '').toLowerCase();
        if (dept === 'teaching') return true;
        if (role.includes('teacher')) return true;
        if (gradeFromStaffRole(member.role)) return true;
        return false;
      })
      .map((member) => {
        const fromClass = member.classId ? classGradeById[String(member.classId)] : '';
        const inferred = fromClass || gradeFromStaffRole(member.role) || '';
        const currentGrade =
          overrides[member.id] != null && overrides[member.id] !== ''
            ? overrides[member.id]
            : inferred;
        const className = member.classId
          ? classNameById[String(member.classId)] || ''
          : '';
        return {
          ...member,
          currentGrade,
          inferredGrade: inferred,
          className,
          sectionLetter: sectionLetterFromClassName(className),
        };
      });

    rows.sort((a, b) => {
      const g = gradeSortKey(a.currentGrade) - gradeSortKey(b.currentGrade);
      if (g !== 0) return g;
      const sa = a.sectionLetter || 'Z';
      const sb = b.sectionLetter || 'Z';
      if (sa !== sb) return sa.localeCompare(sb);
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
    });
    return rows;
  }, [org, activeSchoolId, classGradeById, classNameById, run?.staffGradeOverrides]);

  const addedByStaffId = useMemo(() => {
    const map = {};
    for (const teacher of run?.destinationTeachers || []) {
      if (teacher.staffId) map[teacher.staffId] = teacher;
      else map[teacher.id] = teacher;
    }
    return map;
  }, [run]);

  /** Current-year staff grouped into grade cards (all band grades stay drop targets). */
  const teachersByCurrentGrade = useMemo(() => {
    const bandGrades = gradesForBand(run?.gradeBand || gradeBand);
    const orderByGrade = run?.staffOrderByGrade || {};
    const map = new Map(bandGrades.map((grade) => [grade, []]));
    const other = [];
    for (const member of schoolTeachers) {
      const key = member.currentGrade || '';
      if (key && map.has(key)) map.get(key).push(member);
      else other.push(member);
    }
    const sortGradeTeachers = (grade, list) => {
      const order = orderByGrade[grade] || [];
      if (!order.length) return list;
      const rank = new Map(order.map((id, i) => [String(id), i]));
      return [...list].sort((a, b) => {
        const ra = rank.has(String(a.id)) ? rank.get(String(a.id)) : 9999;
        const rb = rank.has(String(b.id)) ? rank.get(String(b.id)) : 9999;
        if (ra !== rb) return ra - rb;
        const sa = a.sectionLetter || 'Z';
        const sb = b.sectionLetter || 'Z';
        if (sa !== sb) return sa.localeCompare(sb);
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
          sensitivity: 'base',
        });
      });
    };
    const cards = bandGrades.map((grade) => ({
      grade,
      teachers: sortGradeTeachers(grade, map.get(grade) || []),
    }));
    if (other.length) cards.push({ grade: 'Other / no grade', teachers: other });
    return cards;
  }, [schoolTeachers, run?.gradeBand, run?.staffOrderByGrade, gradeBand]);

  /** Staff advance with their students: K→1st, 1st→2nd, … */
  const destinationForStaff = (currentGrade) => {
    const next = nextGradeFor(currentGrade);
    if (next && destOptions.includes(next)) return next;
    return '';
  };

  const startRun = () => {
    createPlacementRun({
      schoolId,
      schoolName: school?.name || '',
      yearLabel: yearLabel.trim(),
      gradeBand,
      sourceGrade: '',
      destinationGrade: '',
      destinationTeachers: run?.destinationTeachers || [],
      schema: run?.schema,
      priorityOrder: run?.priorityOrder,
    });
  };

  const saveMeta = () => {
    if (!run) {
      startRun();
      return;
    }
    upsertActiveRun({
      schoolId,
      schoolName: school?.name || '',
      yearLabel: yearLabel.trim(),
      gradeBand,
      sourceGrade: '',
      destinationGrade: '',
    });
  };

  const excludedStaffIds = useMemo(
    () => new Set(run?.excludedStaffIds || []),
    [run?.excludedStaffIds],
  );

  /** Staff on grade cards are included by default (app is once-a-year). */
  useEffect(() => {
    if (!run || !schoolTeachers.length) return;
    const excluded = new Set(run.excludedStaffIds || []);
    let destinationTeachers = [...(run.destinationTeachers || [])];
    let changed = false;

    for (const member of schoolTeachers) {
      if (excluded.has(member.id)) continue;
      const destinationGrade = destinationForStaff(member.currentGrade);
      if (!destinationGrade) continue;
      const idx = destinationTeachers.findIndex(
        (teacher) => teacher.staffId === member.id || teacher.id === member.id,
      );
      if (idx >= 0) {
        const current = destinationTeachers[idx];
        if (
          current.destinationGrade !== destinationGrade ||
          current.currentGrade !== (member.currentGrade || '') ||
          current.name !== member.name
        ) {
          destinationTeachers[idx] = {
            ...current,
            name: member.name,
            room: member.room || current.room || '',
            currentGrade: member.currentGrade || '',
            destinationGrade,
            isProvisional: false,
            staffId: member.id,
          };
          changed = true;
        }
      } else {
        destinationTeachers.push({
          id: member.id,
          staffId: member.id,
          name: member.name,
          room: member.room || '',
          isProvisional: false,
          currentGrade: member.currentGrade || '',
          destinationGrade,
        });
        changed = true;
      }
    }

    if (changed) upsertActiveRun({ destinationTeachers });
    // destinationForStaff is stable for current destOptions; avoid looping on run object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, schoolTeachers, destOptions, run?.excludedStaffIds, upsertActiveRun]);

  const moveStaffToGrade = (staffId, toGrade, beforeStaffId = null) => {
    if (!run || !staffId || !toGrade || toGrade === 'Other / no grade') return;
    const member = schoolTeachers.find((row) => row.id === staffId);
    const fromGrade = member?.currentGrade || '';
    if (fromGrade === toGrade) {
      reorderStaffInGrade(toGrade, staffId, beforeStaffId);
      return;
    }
    const overrides = { ...(run.staffGradeOverrides || {}), [staffId]: toGrade };
    const destinationGrade = destinationForStaff(toGrade);
    const isExcluded = (run.excludedStaffIds || []).includes(staffId);
    let destinationTeachers = [...(run.destinationTeachers || [])];
    const idx = destinationTeachers.findIndex(
      (teacher) => teacher.staffId === staffId || teacher.id === staffId,
    );
    if (isExcluded) {
      if (idx >= 0) destinationTeachers = destinationTeachers.filter((_, i) => i !== idx);
    } else if (idx >= 0) {
      destinationTeachers[idx] = {
        ...destinationTeachers[idx],
        currentGrade: toGrade,
        destinationGrade: destinationGrade || destinationTeachers[idx].destinationGrade,
      };
    } else if (member && destinationGrade) {
      destinationTeachers.push({
        id: member.id,
        staffId: member.id,
        name: member.name,
        room: member.room || '',
        isProvisional: false,
        currentGrade: toGrade,
        destinationGrade,
      });
    }

    const staffOrderByGrade = { ...(run.staffOrderByGrade || {}) };
    if (fromGrade && fromGrade !== 'Other / no grade') {
      const fromCard = teachersByCurrentGrade.find((card) => card.grade === fromGrade);
      staffOrderByGrade[fromGrade] = (fromCard?.teachers || [])
        .map((row) => String(row.id))
        .filter((id) => id !== String(staffId));
    }
    const toCard = teachersByCurrentGrade.find((card) => card.grade === toGrade);
    const toIds = (toCard?.teachers || [])
      .map((row) => String(row.id))
      .filter((id) => id !== String(staffId));
    if (beforeStaffId) {
      const at = toIds.indexOf(String(beforeStaffId));
      if (at >= 0) toIds.splice(at, 0, String(staffId));
      else toIds.push(String(staffId));
    } else {
      toIds.push(String(staffId));
    }
    staffOrderByGrade[toGrade] = toIds;

    upsertActiveRun({
      staffGradeOverrides: overrides,
      destinationTeachers,
      staffOrderByGrade,
    });
  };

  /** Reorder within a grade card — section codes (KA, KB, …) follow list order. */
  const reorderStaffInGrade = (grade, staffId, beforeStaffId = null) => {
    if (!run || !grade || grade === 'Other / no grade' || !staffId) return;
    const card = teachersByCurrentGrade.find((row) => row.grade === grade);
    if (!card) return;
    const ids = card.teachers
      .map((row) => String(row.id))
      .filter((id) => id !== String(staffId));
    if (beforeStaffId && String(beforeStaffId) !== String(staffId)) {
      const at = ids.indexOf(String(beforeStaffId));
      if (at >= 0) ids.splice(at, 0, String(staffId));
      else ids.push(String(staffId));
    } else {
      ids.push(String(staffId));
    }
    upsertActiveRun({
      staffOrderByGrade: {
        ...(run.staffOrderByGrade || {}),
        [grade]: ids,
      },
    });
  };

  const sectionCodeForMember = (grade, member, teacherIndex) => {
    if (grade === 'Other / no grade') return '';
    const override = String(run?.staffSectionCodes?.[member.id] || '')
      .trim()
      .toUpperCase();
    if (override) return override;
    return classSectionCode(grade, teacherIndex);
  };

  const beginEditSectionCode = (member, code) => {
    setEditingSectionStaffId(member.id);
    setEditingSectionValue(code);
  };

  const commitSectionCode = (staffId, fallbackCode) => {
    if (!run || !staffId) return;
    const next = editingSectionValue.trim().toUpperCase().slice(0, 4);
    const codes = { ...(run.staffSectionCodes || {}) };
    if (!next || next === String(fallbackCode || '').toUpperCase()) {
      delete codes[staffId];
    } else {
      codes[staffId] = next;
    }
    upsertActiveRun({ staffSectionCodes: codes });
    setEditingSectionStaffId('');
    setEditingSectionValue('');
  };

  /** Toggle next-year room inclusion; ratings still come from this teacher’s current class. */
  const toggleStaffIncluded = (member) => {
    if (!run) return;
    const excluded = new Set(run.excludedStaffIds || []);
    let destinationTeachers = [...(run.destinationTeachers || [])];
    const idx = destinationTeachers.findIndex(
      (teacher) => teacher.staffId === member.id || teacher.id === member.id,
    );

    if (excluded.has(member.id) || idx < 0) {
      excluded.delete(member.id);
      const destinationGrade = destinationForStaff(member.currentGrade);
      if (destinationGrade && idx < 0) {
        destinationTeachers.push({
          id: member.id,
          staffId: member.id,
          name: member.name,
          room: member.room || '',
          isProvisional: false,
          currentGrade: member.currentGrade || '',
          destinationGrade,
        });
      } else if (destinationGrade && idx >= 0) {
        destinationTeachers[idx] = {
          ...destinationTeachers[idx],
          name: member.name,
          currentGrade: member.currentGrade || '',
          destinationGrade,
          staffId: member.id,
          isProvisional: false,
        };
      }
    } else {
      excluded.add(member.id);
      if (idx >= 0) {
        destinationTeachers = destinationTeachers.filter((_, i) => i !== idx);
      }
    }

    upsertActiveRun({
      excludedStaffIds: [...excluded],
      destinationTeachers,
    });
  };

  const gradeDisplayTitle = (grade) => {
    const custom = String(run?.gradeTitles?.[grade] || '').trim();
    return custom || grade;
  };

  const beginEditGrade = (grade) => {
    setEditingGrade(grade);
    setGradeTitleDraft(gradeDisplayTitle(grade));
    setCardTeacherName('');
  };

  const finishEditGrade = () => {
    if (run && editingGrade && editingGrade !== 'Other / no grade') {
      const nextTitle = gradeTitleDraft.trim();
      const titles = { ...(run.gradeTitles || {}) };
      if (!nextTitle || nextTitle === editingGrade) delete titles[editingGrade];
      else titles[editingGrade] = nextTitle;
      upsertActiveRun({ gradeTitles: titles });
    }
    setEditingGrade('');
    setGradeTitleDraft('');
    setCardTeacherName('');
  };

  /** Open position / extra teacher for this grade card → next-year destination. */
  const addTeacherToGradeCard = (currentGrade) => {
    if (!run) return;
    const destinationGrade = destinationForStaff(currentGrade);
    if (!destinationGrade) return;
    const name = cardTeacherName.trim();
    if (!name) return;
    upsertActiveRun({
      destinationTeachers: [
        ...run.destinationTeachers,
        {
          id: `tch-${Date.now().toString(36)}`,
          name,
          isProvisional: true,
          room: '',
          destinationGrade,
          staffId: '',
          currentGrade: currentGrade === 'Other / no grade' ? '' : currentGrade,
        },
      ],
    });
    setCardTeacherName('');
  };

  /** Remove staff from this grade card for the run (lands in Other). */
  const removeStaffFromGradeCard = (staffId, fromGrade) => {
    if (!run || !staffId) return;
    const staffOrderByGrade = { ...(run.staffOrderByGrade || {}) };
    if (fromGrade) {
      staffOrderByGrade[fromGrade] = (staffOrderByGrade[fromGrade] || []).filter(
        (id) => id !== String(staffId),
      );
    }
    const destinationTeachers = (run.destinationTeachers || []).filter(
      (teacher) => teacher.staffId !== staffId && teacher.id !== staffId,
    );
    upsertActiveRun({
      staffGradeOverrides: {
        ...(run.staffGradeOverrides || {}),
        [staffId]: 'Other / no grade',
      },
      staffOrderByGrade,
      destinationTeachers,
    });
  };

  const gradeLevelsBoard = (
    <AppBoard mode="scroll" pad="board" theme={theme}>
      <div className={cardHeaderClass(theme, '!justify-start')}>
        <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Grade Levels
        </h2>
        <SectionInfoTip
          text={`${gradeBandLabel(gradeBand)} included. Tap 6 to include sixth grade.`}
          label="About grade levels"
          isDarkMode={isDarkMode}
          theme={theme}
        />
      </div>
      <div className="flex flex-wrap gap-2.5">
        {GRADE_LEVEL_CIRCLES.map((row) => {
          const selected = selectedGrades.has(row.grade);
          return (
            <button
              key={row.grade}
              type="button"
              title={row.grade}
              aria-pressed={selected}
              aria-label={row.grade}
              onClick={() => selectGradeCircle(row.grade)}
              className={`edu-control w-11 h-11 rounded-full text-sm font-semibold transition-colors ${
                selected
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : `border-[1.5px] ${theme.colorOutline} ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-white text-slate-700'
                    }`
              }`}
            >
              {row.short}
            </button>
          );
        })}
      </div>
    </AppBoard>
  );

  return (
    <div className="space-y-4">
      <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="block">
              <span className="sr-only">Placement run title</span>
              <input
                className={`edu-control w-full max-w-xl bg-transparent border-0 border-b-[1.5px] rounded-none px-0 py-1 text-xl sm:text-2xl font-semibold outline-none focus:ring-0 ${
                  theme.colorOutline
                } ${isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
                value={yearLabel}
                onChange={(e) => setYearLabel(e.target.value)}
                onBlur={() => {
                  if (!run) return;
                  const next = yearLabel.trim();
                  const prev = displayPlacementYearLabel(run.yearLabel);
                  if (next !== prev) upsertActiveRun({ yearLabel: next });
                }}
                placeholder={yearPlaceholder}
              />
            </label>
          </div>
          <button
            type="button"
            className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={saveMeta}
          >
            Get Started
          </button>
        </div>
      </AppBoard>

      {!run ? (
        <>
          {gradeLevelsBoard}
          <EmptyState
            message="No active placement run — Pick a school in the header, set band, then start a run to assign destination teachers."
            isDarkMode={isDarkMode}
          />
        </>
      ) : (
        <>
          <div className="space-y-3">
            <div>
              <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Grade Level Teachers
              </h2>
            </div>
            {schoolTeachers.length === 0 ? (
              <AppBoard mode="scroll" pad="board" theme={theme}>
                <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  No teaching staff found for this school. Add staff in DistrictHub, or use Edit on
                  a grade card for an open position.
                </p>
              </AppBoard>
            ) : (
              <ContentCardGrid>
                {teachersByCurrentGrade.map(({ grade, teachers }) => {
                  const nextGrade = destinationForStaff(
                    grade === 'Other / no grade' ? '' : grade,
                  );
                  const isEditingCard = editingGrade === grade;
                  const isDropTarget =
                    isEditingCard && dropGrade === grade && dragStaffId;
                  const canEditGrade = grade !== 'Other / no grade';
                  const gradeColor = canEditGrade
                    ? String(run?.gradeColors?.[grade] || '').trim()
                    : '';
                  const headerOn = gradeColor ? bestOnColor(gradeColor) : null;
                  const swatchHex = gradeColor || DEFAULT_GRADE_SWATCH;
                  const gradeShape = canEditGrade
                    ? gradeShapeFor(grade, run?.gradeShapes)
                    : '';
                  const title = gradeDisplayTitle(grade);
                  return (
                    <AppBoard
                      key={grade}
                      mode="grid"
                      pad="board"
                      theme={theme}
                      className={`overflow-hidden ${isDropTarget ? `ring-2 ${theme.ring}` : ''}`}
                      onDragOver={(e) => {
                        if (!isEditingCard || grade === 'Other / no grade') return;
                        e.preventDefault();
                        setDropGrade(grade);
                      }}
                      onDragLeave={() => {
                        if (dropGrade === grade) setDropGrade('');
                      }}
                      onDrop={(e) => {
                        if (!isEditingCard) return;
                        e.preventDefault();
                        const id = e.dataTransfer.getData('text/staff-id') || dragStaffId;
                        setDropGrade('');
                        setDragStaffId(null);
                        if (id) moveStaffToGrade(id, grade);
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-2 mb-3 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 px-5 sm:px-6 py-3"
                        style={
                          gradeColor
                            ? { backgroundColor: gradeColor, color: headerOn.hex }
                            : undefined
                        }
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          {canEditGrade && isEditingCard ? (
                            <ShapePicker
                              value={gradeShape}
                              onChange={(shape) => {
                                if (!run) return;
                                upsertActiveRun({
                                  gradeShapes: {
                                    ...(run.gradeShapes || {}),
                                    [grade]: shape,
                                  },
                                });
                              }}
                              isDarkMode={isDarkMode}
                              theme={theme}
                              fillHex={swatchHex}
                              triggerFillHex="#ffffff"
                              ariaLabel={`${title} shape`}
                              triggerClassName={`edu-control w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-lg ${
                                isDarkMode ? 'hover:bg-black/20' : 'hover:bg-black/10'
                              }`}
                            />
                          ) : canEditGrade && gradeShape ? (
                            <ShapeSurface
                              shape={gradeShape}
                              className="h-6 w-6 shrink-0"
                              style={{
                                backgroundColor: gradeColor
                                  ? '#ffffff'
                                  : isDarkMode
                                    ? '#e2e8f0'
                                    : '#0f172a',
                              }}
                              aria-hidden
                            />
                          ) : null}
                          {isEditingCard && canEditGrade ? (
                            <input
                              className={`edu-control min-w-0 flex-1 bg-transparent border-0 border-b-[1.5px] rounded-none px-0 py-0.5 font-semibold outline-none focus:ring-0 ${
                                gradeColor
                                  ? ''
                                  : isDarkMode
                                    ? 'border-slate-600 text-white'
                                    : 'border-slate-300 text-slate-900'
                              }`}
                              style={
                                gradeColor
                                  ? {
                                      color: headerOn.hex,
                                      borderBottomColor: `${headerOn.hex}66`,
                                    }
                                  : undefined
                              }
                              value={gradeTitleDraft}
                              onChange={(e) => setGradeTitleDraft(e.target.value)}
                              aria-label={`${grade} title`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  finishEditGrade();
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingGrade('');
                                  setGradeTitleDraft('');
                                  setCardTeacherName('');
                                }
                              }}
                            />
                          ) : (
                            <h3
                              className={`min-w-0 font-semibold truncate ${
                                gradeColor
                                  ? ''
                                  : isDarkMode
                                    ? 'text-white'
                                    : 'text-slate-900'
                              }`}
                              style={gradeColor ? { color: headerOn.hex } : undefined}
                            >
                              {title}
                            </h3>
                          )}
                        </div>
                        {canEditGrade ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isEditingCard ? (
                              <SpectrumColorPicker
                                value={swatchHex}
                                onChange={(color) => {
                                  if (!run) return;
                                  upsertActiveRun({
                                    gradeColors: {
                                      ...(run.gradeColors || {}),
                                      [grade]: color,
                                    },
                                  });
                                }}
                                isDarkMode={isDarkMode}
                                theme={theme}
                                ariaLabel={`${title} header color`}
                                triggerClassName={`edu-control w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center border-[1.5px] shadow-inner ${
                                  isDarkMode ? 'border-white/40' : 'border-black/15'
                                }`}
                                triggerStyle={{
                                  backgroundColor: '#ffffff',
                                  color: bestOnColor('#ffffff').hex,
                                }}
                              >
                                <Paintbrush className="w-3 h-3" aria-hidden />
                              </SpectrumColorPicker>
                            ) : null}
                            <button
                              type="button"
                              className={`${toolBtnClass(isDarkMode)} edu-control ${
                                isEditingCard
                                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                                  : gradeColor
                                    ? isDarkMode
                                      ? '!bg-transparent !border-transparent hover:!bg-black/25'
                                      : '!bg-transparent !border-transparent hover:!bg-black/10'
                                    : isDarkMode
                                      ? '!bg-transparent !border-transparent hover:!bg-slate-700'
                                      : '!bg-transparent !border-transparent hover:!bg-slate-100'
                              }`}
                              style={
                                gradeColor && !isEditingCard
                                  ? { color: headerOn.hex }
                                  : undefined
                              }
                              onClick={() => {
                                if (isEditingCard) finishEditGrade();
                                else beginEditGrade(grade);
                              }}
                              title={
                                isEditingCard
                                  ? 'Done editing this grade'
                                  : `Edit ${title}: title, color, shape, teachers`
                              }
                              aria-label={
                                isEditingCard
                                  ? 'Done editing this grade'
                                  : `Edit ${title}: title, color, shape, teachers`
                              }
                              aria-pressed={isEditingCard}
                            >
                              {isEditingCard ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Pencil className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {isEditingCard ? (
                        <div className="flex flex-wrap items-end gap-2 mb-3">
                          <label className="flex-1 min-w-[8rem]">
                            <span
                              className={`${TYPE.labelMicro} ${
                                isDarkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              Add teacher
                            </span>
                            <input
                              className={`${fieldClass(isDarkMode, theme)} mt-1 edu-control`}
                              value={cardTeacherName}
                              onChange={(e) => setCardTeacherName(e.target.value)}
                              placeholder="Open position or name"
                              disabled={!nextGrade}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTeacherToGradeCard(grade);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                            onClick={() => addTeacherToGradeCard(grade)}
                            disabled={!nextGrade || !cardTeacherName.trim()}
                            title={
                              nextGrade
                                ? `Add another teacher for ${nextGrade}`
                                : 'No next grade in this band'
                            }
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      ) : null}

                      <ul className="space-y-2 min-h-[2.5rem]">
                        {teachers.length === 0 ? (
                          <li
                            className={`${TYPE.bodySm} px-1 ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {isEditingCard ? 'Drop a teacher here' : 'No teachers yet'}
                          </li>
                        ) : null}
                        {teachers.map((member, teacherIndex) => {
                          const included =
                            Boolean(addedByStaffId[member.id]) &&
                            !excludedStaffIds.has(member.id);
                          const memberNext = destinationForStaff(member.currentGrade);
                          const canInclude = Boolean(memberNext);
                          const autoSectionCode = classSectionCode(grade, teacherIndex);
                          const sectionCode = sectionCodeForMember(
                            grade,
                            member,
                            teacherIndex,
                          );
                          const sectionLabel = sectionCode
                            ? `${title} · ${sectionCode}`
                            : '';
                          const isEditingSection = editingSectionStaffId === member.id;
                          return (
                            <li
                              key={member.id}
                              className="flex items-center gap-2"
                              onDragOver={(e) => {
                                if (!isEditingCard || grade === 'Other / no grade') return;
                                e.preventDefault();
                                e.stopPropagation();
                                setDropGrade(grade);
                              }}
                              onDrop={(e) => {
                                if (!isEditingCard) return;
                                e.preventDefault();
                                e.stopPropagation();
                                const id =
                                  e.dataTransfer.getData('text/staff-id') || dragStaffId;
                                setDropGrade('');
                                setDragStaffId(null);
                                if (id) moveStaffToGrade(id, grade, member.id);
                              }}
                            >
                              {sectionCode || isEditingSection ? (
                                isEditingSection ? (
                                  <input
                                    autoFocus
                                    value={editingSectionValue}
                                    maxLength={4}
                                    aria-label={`Section code for ${member.name}`}
                                    className={`edu-control shrink-0 size-[calc(2.5rem+1.25rem+3px)] rounded-xl border text-center text-sm font-semibold uppercase outline-none focus:ring-2 ${theme.ring} ${theme.colorOutline} ${
                                      isDarkMode
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-white text-slate-900'
                                    }`}
                                    onChange={(e) =>
                                      setEditingSectionValue(
                                        e.target.value.toUpperCase().slice(0, 4),
                                      )
                                    }
                                    onBlur={() =>
                                      commitSectionCode(member.id, autoSectionCode)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        commitSectionCode(member.id, autoSectionCode);
                                      }
                                      if (e.key === 'Escape') {
                                        e.preventDefault();
                                        setEditingSectionStaffId('');
                                        setEditingSectionValue('');
                                      }
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    className={`edu-control shrink-0 size-[calc(2.5rem+1.25rem+3px)] rounded-xl border text-sm font-semibold tabular-nums ${theme.colorOutline} ${
                                      isDarkMode
                                        ? 'bg-slate-800/70 text-slate-200 hover:bg-slate-800'
                                        : 'bg-slate-50 text-slate-700 hover:bg-white'
                                    }`}
                                    title={
                                      isEditingCard
                                        ? `${sectionLabel} — click to edit`
                                        : sectionLabel
                                    }
                                    aria-label={`Edit section code ${sectionCode}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isEditingCard) return;
                                      beginEditSectionCode(member, sectionCode);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    disabled={!isEditingCard}
                                  >
                                    {sectionCode}
                                  </button>
                                )
                              ) : null}
                              <div
                                draggable={isEditingCard}
                                onDragStart={(e) => {
                                  if (!isEditingCard) {
                                    e.preventDefault();
                                    return;
                                  }
                                  setDragStaffId(member.id);
                                  e.dataTransfer.setData('text/staff-id', member.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  setDragStaffId(null);
                                  setDropGrade('');
                                }}
                                className={`min-w-0 flex-1 flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.colorOutline} ${
                                  isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
                                } ${isEditingCard ? 'cursor-grab active:cursor-grabbing' : ''} ${
                                  dragStaffId === member.id ? 'opacity-50' : ''
                                } ${
                                  !included && canInclude ? 'opacity-70' : ''
                                }`}
                              >
                                {isEditingCard ? (
                                  <GripVertical
                                    size={16}
                                    className={`shrink-0 ${
                                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                    }`}
                                    aria-hidden
                                  />
                                ) : null}
                                <StudentAvatar
                                  student={staffAsAvatarSubject(member)}
                                  theme={theme}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`font-medium ${
                                      isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}
                                  >
                                    {member.name}
                                  </p>
                                </div>
                                {isEditingCard ? (
                                  <button
                                    type="button"
                                    className={`edu-control inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                                      isDarkMode
                                        ? 'border-slate-600 text-rose-300 hover:bg-rose-950/40'
                                        : 'border-slate-300 text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={`Remove ${member.name} from ${title}`}
                                    aria-label={`Remove ${member.name} from ${title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeStaffFromGradeCard(member.id, grade);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden />
                                  </button>
                                ) : canInclude ? (
                                  <button
                                    type="button"
                                    className={`edu-control inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                                      included
                                        ? isDarkMode
                                          ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300'
                                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : isDarkMode
                                          ? 'bg-slate-900/40 border-slate-600 text-slate-500 hover:border-slate-500'
                                          : 'bg-white border-slate-300 text-slate-300 hover:border-slate-400 hover:text-slate-400'
                                    }`}
                                    title={
                                      included
                                        ? `Included for ${memberNext} — click to exclude (still rates)`
                                        : `Not teaching ${memberNext} next year — click to include`
                                    }
                                    aria-pressed={included}
                                    aria-label={
                                      included
                                        ? `Exclude ${member.name} from next year`
                                        : `Include ${member.name} for next year`
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStaffIncluded(member);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Check className="w-4 h-4" aria-hidden />
                                  </button>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </AppBoard>
                  );
                })}
              </ContentCardGrid>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Rating System
            </h2>
            <SchemaView
              theme={theme}
              isDarkMode={isDarkMode}
              run={run}
              upsertActiveRun={upsertActiveRun}
              aboveGender={gradeLevelsBoard}
            />
          </div>

          <div className="space-y-3 pt-2">
            <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Next-year import
            </h2>
            <NextYearImportView
              theme={theme}
              isDarkMode={isDarkMode}
              run={run}
              upsertActiveRun={upsertActiveRun}
            />
          </div>
        </>
      )}
    </div>
  );
}
