import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, Pencil, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { bestOnColor } from '../../../shared/colorContrast';
import { EmptyState } from '../../../shared/EmptyState';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { SegmentControl } from '../../../shared/SegmentControl';
import { SpectrumColorPicker } from '../../../shared/SpectrumColorPicker';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAuth } from '../../../data/auth/AuthContext';
import { useClasses } from '../../../data/classes/ClassContext';
import { useDistrictOrg } from '../../../data/district/useDistrictOrg';
import {
  DEFAULT_SCALE,
  SCALE_THEME_COLORS,
  gradeBandLabel,
  gradesForBand,
  normalizeScale,
  normalizeScaleValue,
  normalizeStudentSnapshot,
  sameScaleValue,
  scaleForColumn,
  scaleValueSortKey,
  studentDestinationGrade,
  studentList,
  teachersForDestinationGrade,
} from '../../../data/class-creator/classCreatorModel';
import { buildGradeRosterCards } from '../rosterCards';
import { ratingSwatchStyle } from '../ratingSwatch';
import { cardHeaderClass } from './SchemaView';

function edgeKey(a, b) {
  return [a, b].sort().join('::');
}

function sortStudents(list) {
  return [...list].sort((a, b) =>
    String(a.lastName || a.name).localeCompare(String(b.lastName || b.name)),
  );
}

function surveySubmissionKey({ isTeacherView, session, selectedClass, teacherFilter }) {
  if (isTeacherView) {
    const user = session?.userId || session?.email || 'teacher';
    const cls = selectedClass?.id || 'class';
    return `${user}::${cls}`;
  }
  if (teacherFilter && teacherFilter !== 'all') return String(teacherFilter);
  return '';
}

/**
 * Rating grid — one tab per schema category.
 * Teachers rate their class; admin reviews every teacher’s inputs (filter by teacher).
 */
export function RatingsView({
  theme,
  isDarkMode,
  run,
  upsertActiveRun,
  isTeacherView = false,
  selectedClass = null,
  teacherFilter: teacherFilterProp = 'all',
  onTeacherFilterChange,
  onTeacherFilterOptionsChange,
}) {
  const { session } = useAuth();
  const { org } = useDistrictOrg();
  const { allClasses } = useClasses();
  const [pairQuery, setPairQuery] = useState({});
  const [activePairFor, setActivePairFor] = useState(null);
  const [pairMode, setPairMode] = useState('separations');
  const [activeTab, setActiveTab] = useState('');
  const [teacherFilterLocal, setTeacherFilterLocal] = useState('all');
  const teacherFilter = onTeacherFilterChange ? teacherFilterProp : teacherFilterLocal;
  const setTeacherFilter = onTeacherFilterChange || setTeacherFilterLocal;
  const [noteModal, setNoteModal] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingScale, setEditingScale] = useState(false);

  useEffect(() => {
    if (!noteModal) return;
    setNoteDraft(noteModal.value || '');
  }, [noteModal]);

  useEffect(() => {
    setEditingScale(false);
  }, [activeTab]);

  const classStudents = useMemo(() => {
    if (!isTeacherView || !selectedClass) return null;
    return sortStudents(
      (selectedClass.studentList || []).map((student) =>
        normalizeStudentSnapshot({
          ...(run?.students?.[student.id] || {}),
          ...student,
          source: 'roster',
          grade_level:
            student.grade_level || selectedClass.grade || run?.students?.[student.id]?.grade_level,
        }),
      ),
    );
  }, [isTeacherView, selectedClass, run]);

  const teacherRooms = useMemo(() => {
    if (isTeacherView || !run) return [];
    const cards = buildGradeRosterCards(
      allClasses,
      org,
      run.schoolId,
      gradesForBand(run.gradeBand),
    );
    const cohort = new Set(run.cohortStudentIds || []);
    const rooms = [];
    for (const card of cards) {
      for (const room of card.rooms) {
        const students = (room.students || [])
          .map((student) => {
            const id = String(student.id);
            const snap = run.students?.[id];
            if (cohort.size && !cohort.has(id) && !snap) return null;
            return normalizeStudentSnapshot({
              ...(snap || {}),
              ...student,
              source: 'roster',
              grade_level: student.grade_level || card.grade || snap?.grade_level || '',
            });
          })
          .filter(Boolean);
        if (!students.length) continue;
        rooms.push({
          id: String(room.classId || `${card.grade}-${room.teacherName}`),
          label: room.teacherName,
          grade: card.grade,
          className: room.className,
          students: sortStudents(students),
        });
      }
    }
    return rooms;
  }, [isTeacherView, run, allClasses, org]);

  const teacherFilterOptions = useMemo(() => {
    if (isTeacherView) return [];
    return [
      { id: 'all', label: 'All teachers' },
      ...teacherRooms.map((room) => ({
        id: room.id,
        label: room.grade ? `${room.label} · ${room.grade}` : room.label,
      })),
    ];
  }, [isTeacherView, teacherRooms]);

  useEffect(() => {
    onTeacherFilterOptionsChange?.(teacherFilterOptions);
  }, [teacherFilterOptions, onTeacherFilterOptionsChange]);

  const students = useMemo(() => {
    if (isTeacherView) return classStudents || [];
    if (!run) return [];
    if (teacherFilter !== 'all') {
      const room = teacherRooms.find((row) => row.id === teacherFilter);
      return room?.students || [];
    }
    return sortStudents(studentList(run));
  }, [isTeacherView, classStudents, run, teacherFilter, teacherRooms]);

  const ratingTabs = useMemo(() => {
    if (!run) return [];
    const tabs = (run.schema.columns || [])
      .filter((col) => col.enabled)
      .map((col) => ({
        id: col.id,
        label: col.label,
        kind: col.type === 'tags' ? 'tags' : col.type === 'text' ? 'text' : 'scale',
        column: col,
      }));
    tabs.push({ id: 'sep_pair', label: 'Sep / Pair', kind: 'sep_pair', column: null });
    if (!isTeacherView) {
      tabs.push({ id: 'lock', label: 'Lock', kind: 'lock', column: null });
    }
    tabs.push({ id: 'submit', label: 'Submit', kind: 'submit', column: null });
    return tabs;
  }, [run, isTeacherView]);

  const currentTab =
    ratingTabs.find((tab) => tab.id === activeTab) || ratingTabs[0] || null;

  if (isTeacherView && !selectedClass) {
    return (
      <EmptyState
        message="Select your class in the Classes panel to rate your students."
        isDarkMode={isDarkMode}
      />
    );
  }

  if (!run) {
    return (
      <EmptyState
        message={
          isTeacherView
            ? 'Waiting on admin — a placement run has not started yet.'
            : 'Start a placement run first — Load a roster, then rate students here.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  if (!students.length) {
    return (
      <EmptyState
        message={
          isTeacherView
            ? 'This class has no students to rate.'
            : 'No students in the cohort — Use Roster to load current classes or import a CSV.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  const levels =
    currentTab?.kind === 'scale'
      ? scaleForColumn(run.schema, currentTab?.column?.id).levels
      : run.schema.scale?.levels || [];

  const updateColumnScale = (columnId, scalePatch) => {
    if (!run || !columnId || !upsertActiveRun) return;
    const schema = run.schema;
    const currentCol = (schema.columns || []).find((col) => col.id === columnId);
    const current = normalizeScale(currentCol?.scale || schema.scale, schema.scale || DEFAULT_SCALE);
    const nextScale =
      typeof scalePatch === 'function' ? scalePatch(current) : { ...current, ...scalePatch };
    upsertActiveRun({
      schema: {
        ...schema,
        columns: (schema.columns || []).map((col) =>
          col.id === columnId && col.type === 'scale' ? { ...col, scale: nextScale } : col,
        ),
        ...(columnId === 'overall_academics' ? { scale: nextScale } : {}),
      },
    });
  };

  const updateLevel = (index, patch) => {
    const columnId = currentTab?.column?.id;
    if (!columnId) return;
    updateColumnScale(columnId, (current) => ({
      ...current,
      levels: current.levels.map((level, i) =>
        i === index ? { ...level, ...patch } : level,
      ),
    }));
  };

  const addLevel = () => {
    const columnId = currentTab?.column?.id;
    if (!columnId) return;
    updateColumnScale(columnId, (current) => {
      const rows = current.levels;
      const values = rows
        .map((level) => scaleValueSortKey(level.value))
        .filter(Number.isFinite);
      const nextNum = values.length ? Math.max(...values) + 1 : 1;
      const usePct = rows.some((level) => String(level.value).includes('%'));
      return {
        ...current,
        levels: [
          {
            value: usePct ? `${nextNum}%` : nextNum,
            label: 'New level',
            color: SCALE_THEME_COLORS[rows.length % SCALE_THEME_COLORS.length],
          },
          ...rows,
        ],
      };
    });
  };

  const removeLevel = (index) => {
    const columnId = currentTab?.column?.id;
    if (!columnId || levels.length <= 2) return;
    updateColumnScale(columnId, (current) => ({
      ...current,
      levels: current.levels.filter((_, i) => i !== index),
    }));
  };

  const ensureStudentInRun = (studentId) => {
    if (run.students[studentId]) {
      return {
        students: run.students,
        cohortStudentIds: run.cohortStudentIds,
      };
    }
    const fromClass = (selectedClass?.studentList || []).find(
      (row) => String(row.id) === String(studentId),
    );
    if (!fromClass) {
      return {
        students: run.students,
        cohortStudentIds: run.cohortStudentIds,
      };
    }
    const snap = normalizeStudentSnapshot({
      ...fromClass,
      source: 'roster',
      grade_level: fromClass.grade_level || selectedClass?.grade || '',
    });
    return {
      students: { ...run.students, [snap.id]: snap },
      cohortStudentIds: run.cohortStudentIds.includes(snap.id)
        ? run.cohortStudentIds
        : [...run.cohortStudentIds, snap.id],
    };
  };

  const setRating = (studentId, columnId, value) => {
    const prev = run.ratings[studentId] || {};
    const rosterPatch = isTeacherView ? ensureStudentInRun(studentId) : null;
    upsertActiveRun({
      ...(rosterPatch || {}),
      ratings: {
        ...run.ratings,
        [studentId]: { ...prev, [columnId]: value },
      },
    });
  };

  const toggleService = (studentId, tagId) => {
    const prev = run.ratings[studentId] || {};
    const current = Array.isArray(prev.services) ? prev.services : [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setRating(studentId, 'services', next);
  };

  const setLock = (studentId, teacherId) => {
    const locks = { ...run.locks };
    if (!teacherId) delete locks[studentId];
    else locks[studentId] = teacherId;
    upsertActiveRun({ locks });
  };

  const addEdge = (kind, a, b) => {
    if (!a || !b || a === b) return;
    const list = [...(run[kind] || [])];
    const key = edgeKey(a, b);
    if (list.some((edge) => edgeKey(edge.a, edge.b) === key)) return;
    list.push({ a, b, reason: '' });
    upsertActiveRun({ [kind]: list });
    setActivePairFor(null);
    setPairQuery((q) => ({ ...q, [a]: '' }));
  };

  const removeEdge = (kind, a, b) => {
    upsertActiveRun({
      [kind]: (run[kind] || []).filter((edge) => edgeKey(edge.a, edge.b) !== edgeKey(a, b)),
    });
  };

  const edgesFor = (studentId, kind) =>
    (run[kind] || []).filter((edge) => edge.a === studentId || edge.b === studentId);

  const searchMatches = (studentId, query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return students.filter((s) => s.id !== studentId).slice(0, 8);
    return students
      .filter(
        (s) =>
          s.id !== studentId &&
          `${s.name} ${s.lastName} ${s.firstName}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  };

  const isScaleTab = currentTab?.kind === 'scale';
  const stickySurface = isDarkMode ? '#0f172a' : '#ffffff';
  const rowStripe = isDarkMode ? 'rgba(30, 41, 59, 0.85)' : '#f8fafc';
  const gridCell = `border ${theme.colorOutline}`;
  const scaleColWidth = 'w-[10.5rem]';

  const scaleColsForProgress = (run.schema.columns || []).filter(
    (col) => col.enabled && col.type === 'scale',
  );
  const rateableForProgress = students.filter((student) => student.source !== 'external');
  const surveyTotal = scaleColsForProgress.length * rateableForProgress.length;
  let surveyDone = 0;
  if (surveyTotal) {
    for (const student of rateableForProgress) {
      const rating = run.ratings?.[student.id] || {};
      for (const col of scaleColsForProgress) {
        if (rating[col.id] != null && rating[col.id] !== '') surveyDone += 1;
      }
    }
  }
  const surveyProgress = {
    done: surveyDone,
    total: surveyTotal,
    pct: surveyTotal ? Math.round((surveyDone / surveyTotal) * 100) : 0,
  };

  const activeTeacherRoom =
    !isTeacherView && teacherFilter !== 'all'
      ? teacherRooms.find((row) => row.id === teacherFilter)
      : null;

  const isSubmitTab = currentTab?.kind === 'submit';
  const submissionKey = surveySubmissionKey({
    isTeacherView,
    session,
    selectedClass,
    teacherFilter,
  });
  const existingSubmission = submissionKey
    ? run.ratingsSubmissions?.[submissionKey]
    : null;
  const canSubmitScoped = Boolean(submissionKey);
  const surveyComplete = surveyProgress.total > 0 && surveyProgress.done >= surveyProgress.total;

  const submitSurvey = () => {
    if (!run || !submissionKey) return;
    const label = isTeacherView
      ? selectedClass?.name || 'My class'
      : activeTeacherRoom
        ? activeTeacherRoom.grade
          ? `${activeTeacherRoom.label} · ${activeTeacherRoom.grade}`
          : activeTeacherRoom.label
        : 'Class';
    upsertActiveRun({
      ratingsSubmissions: {
        ...(run.ratingsSubmissions || {}),
        [submissionKey]: {
          submittedAt: new Date().toISOString(),
          label,
        },
      },
    });
  };

  const unsubmitSurvey = () => {
    if (!run || !submissionKey || !existingSubmission) return;
    const ratingsSubmissions = { ...(run.ratingsSubmissions || {}) };
    delete ratingsSubmissions[submissionKey];
    upsertActiveRun({ ratingsSubmissions });
  };

  const roomSubmissionRows = isTeacherView
    ? []
    : teacherRooms.map((room) => {
        const scaleCols = (run.schema.columns || []).filter(
          (col) => col.enabled && col.type === 'scale',
        );
        const rateable = (room.students || []).filter((s) => s.source !== 'external');
        const total = scaleCols.length * rateable.length;
        let done = 0;
        for (const student of rateable) {
          const rating = run.ratings?.[student.id] || {};
          for (const col of scaleCols) {
            if (rating[col.id] != null && rating[col.id] !== '') done += 1;
          }
        }
        const submission = run.ratingsSubmissions?.[room.id];
        return {
          id: room.id,
          label: room.grade ? `${room.label} · ${room.grade}` : room.label,
          done,
          total,
          pct: total ? Math.round((done / total) * 100) : 0,
          submittedAt: submission?.submittedAt || '',
        };
      });

  const canEditScale = !isTeacherView && currentTab?.kind === 'scale';

  return (
    <div className="space-y-4">
      <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className={cardHeaderClass(theme)}>
          <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {currentTab?.label || 'Survey'}
            {isTeacherView
              ? ` · ${selectedClass?.name || 'Class'}`
              : activeTeacherRoom
                ? ` · ${activeTeacherRoom.label}`
                : ` · ${gradeBandLabel(run.gradeBand)}`}
          </h2>
          {!isTeacherView ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {editingScale && canEditScale ? (
                <button
                  type="button"
                  className={`${toolBtnClass(isDarkMode)} edu-control`}
                  onClick={addLevel}
                  aria-label="Add level"
                  title="Add level"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : null}
              <button
                type="button"
                className={`${toolBtnClass(isDarkMode)} edu-control ${
                  editingScale ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={() => {
                  if (!canEditScale && !editingScale) return;
                  setEditingScale((v) => !v);
                }}
                disabled={!canEditScale && !editingScale}
                aria-label={
                  editingScale
                    ? 'Done editing scale'
                    : canEditScale
                      ? `Edit ${currentTab?.label || 'scale'}`
                      : 'Select a scale category to edit'
                }
                title={
                  editingScale
                    ? 'Done'
                    : canEditScale
                      ? 'Edit scale'
                      : 'Select a scale category to edit'
                }
                aria-pressed={editingScale}
              >
                {editingScale ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mb-4">
          <SegmentControl
            isDarkMode={isDarkMode}
            theme={theme}
            fullWidth
            variant="tabs"
            value={currentTab?.id || ''}
            onChange={setActiveTab}
            options={ratingTabs.map((tab) => ({ id: tab.id, label: tab.label }))}
          />
          <div
            className={`mt-0 h-2.5 w-full overflow-hidden ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={surveyProgress.pct}
            aria-label={`Survey completion ${surveyProgress.pct}%`}
          >
            <div
              className={`h-full transition-[width] ${theme.colorPrimary}`}
              style={{ width: `${surveyProgress.pct}%` }}
            />
          </div>
        </div>

        {editingScale && canEditScale ? (
          <ul className="mb-4 space-y-2">
            {levels.map((level, index) => {
              const on = bestOnColor(level.color);
              const hex = String(level.color || '#64748b');
              return (
                <li
                  key={`${currentTab.column.id}-${level.value}-${index}`}
                  className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.colorOutline}`}
                >
                  <SpectrumColorPicker
                    value={hex}
                    onChange={(color) => updateLevel(index, { color })}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    ariaLabel={`Level ${level.value} color`}
                    triggerClassName="edu-control w-10 h-10 rounded-full flex items-center justify-center shrink-0 tabular-nums text-sm font-bold border-0 shadow-none"
                    triggerStyle={{ color: on.hex }}
                  >
                    {level.value}
                  </SpectrumColorPicker>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={`edu-control w-20 shrink-0 px-2 py-2 rounded-xl border text-sm tabular-nums ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    value={level.value}
                    placeholder="4 or 90%"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw !== '' && !/^[\d.]*%?$/.test(raw.trim())) return;
                      updateLevel(index, { value: raw });
                    }}
                    onBlur={(e) => {
                      const next = normalizeScaleValue(e.target.value);
                      if (next === '') return;
                      if (String(next) !== String(level.value)) {
                        updateLevel(index, { value: next });
                      }
                    }}
                    aria-label={`Value for ${level.label || 'level'}`}
                  />
                  <input
                    className={`edu-control flex-1 min-w-[10rem] px-3 py-2 rounded-xl border text-sm ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    value={level.label}
                    onChange={(e) => updateLevel(index, { label: e.target.value })}
                    placeholder="Level label"
                    aria-label={`Label for level ${level.value}`}
                  />
                  <button
                    type="button"
                    className="edu-control p-2 rounded-lg text-slate-500 hover:text-rose-600 disabled:opacity-40 shrink-0"
                    onClick={() => removeLevel(index)}
                    aria-label={`Delete level ${level.value}`}
                    disabled={levels.length <= 2}
                    title={
                      levels.length <= 2 ? 'Keep at least two levels' : 'Delete level'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {isSubmitTab ? (
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-4 ${theme.colorOutline} ${
                isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'
              }`}
            >
              <p
                className={`${TYPE.labelMicro} ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ratings complete
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {surveyProgress.done}/{surveyProgress.total}
                <span
                  className={`ml-2 text-base font-semibold ${
                    surveyComplete
                      ? 'text-emerald-600'
                      : isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                  }`}
                >
                  {surveyProgress.pct}%
                </span>
              </p>
              {!surveyComplete ? (
                <p
                  className={`mt-2 ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Finish scale ratings on the earlier tabs before submitting.
                </p>
              ) : (
                <p
                  className={`mt-2 ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  All scale ratings for this view are filled.
                </p>
              )}
            </div>

            {canSubmitScoped ? (
              <div className="flex flex-wrap items-center gap-2">
                {existingSubmission ? (
                  <>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
                        isDarkMode
                          ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      <Check className="w-4 h-4" aria-hidden />
                      Submitted
                      {existingSubmission.submittedAt
                        ? ` · ${new Date(existingSubmission.submittedAt).toLocaleString()}`
                        : ''}
                    </span>
                    <button
                      type="button"
                      className={`${toolBtnClass(isDarkMode)} edu-control`}
                      onClick={unsubmitSurvey}
                    >
                      Undo submit
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                    disabled={!surveyComplete}
                    onClick={submitSurvey}
                    title={
                      surveyComplete
                        ? 'Submit this survey'
                        : 'Complete all scale ratings first'
                    }
                  >
                    <Send className="w-4 h-4" />
                    Submit survey
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className={`w-full min-w-[28rem] text-sm border-collapse ${gridCell}`}>
                  <thead>
                    <tr className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      <th className={`px-2 py-2 text-left ${TYPE.labelMicro} ${gridCell}`}>
                        Teacher
                      </th>
                      <th className={`px-2 py-2 text-left ${TYPE.labelMicro} ${gridCell}`}>
                        Progress
                      </th>
                      <th className={`px-2 py-2 text-left ${TYPE.labelMicro} ${gridCell}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomSubmissionRows.map((row) => (
                      <tr key={row.id}>
                        <td className={`px-2 py-2 ${gridCell}`}>{row.label}</td>
                        <td className={`px-2 py-2 tabular-nums ${gridCell}`}>
                          {row.done}/{row.total} · {row.pct}%
                        </td>
                        <td className={`px-2 py-2 ${gridCell}`}>
                          {row.submittedAt ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <Check className="w-3.5 h-3.5" aria-hidden />
                              Submitted
                            </span>
                          ) : (
                            <span
                              className={
                                isDarkMode ? 'text-slate-500' : 'text-slate-400'
                              }
                            >
                              Not submitted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[40rem] table-fixed text-sm border-collapse">
            <thead>
              {isScaleTab ? (
                <>
                  <tr>
                    <th
                      className={`sticky left-0 z-20 w-[18rem] p-0 !border-t-0 !border-l-0 !border-b-0 ${gridCell}`}
                      style={{ backgroundColor: stickySurface }}
                      aria-hidden
                    />
                    {levels.map((level) => {
                      const style = ratingSwatchStyle(
                        run.schema,
                        level.value,
                        currentTab?.column?.id,
                      );
                      return (
                        <th
                          key={`value-${level.value}`}
                          className={`${scaleColWidth} px-2 py-2 text-center text-sm font-bold tabular-nums ${gridCell}`}
                          style={{
                            backgroundColor: style?.backgroundColor,
                            color: style?.color,
                          }}
                        >
                          {level.value}
                        </th>
                      );
                    })}
                    <th
                      className={`w-[12rem] p-0 !border-t-0 !border-r-0 !border-b-0 ${gridCell}`}
                      style={{ backgroundColor: stickySurface }}
                      aria-hidden
                    />
                  </tr>
                  <tr className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    <th
                      className={`sticky left-0 z-20 w-[18rem] px-2 py-2 text-left align-middle ${TYPE.labelMicro} ${gridCell}`}
                      style={{ backgroundColor: stickySurface }}
                    >
                      Student
                    </th>
                    {levels.map((level) => (
                      <th
                        key={`label-${level.value}`}
                        className={`${scaleColWidth} px-1.5 py-2 text-center text-[11px] font-medium leading-snug ${gridCell}`}
                        style={{ backgroundColor: stickySurface }}
                      >
                        {level.label}
                      </th>
                    ))}
                    <th
                      className={`w-[12rem] px-2 py-2 text-center align-middle ${TYPE.labelMicro} ${gridCell}`}
                      style={{ backgroundColor: stickySurface }}
                    >
                      Notes
                    </th>
                  </tr>
                </>
              ) : (
                <tr className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                  <th
                    className={`sticky left-0 z-20 px-2 py-2 text-left ${TYPE.labelMicro} ${gridCell}`}
                    style={{ backgroundColor: stickySurface }}
                  >
                    Student
                  </th>
                  <th
                    className={`px-2 py-2 text-left ${TYPE.labelMicro} ${gridCell}`}
                    style={{ backgroundColor: stickySurface }}
                  >
                    {currentTab?.kind === 'tags'
                      ? 'Services'
                      : currentTab?.kind === 'text'
                        ? 'Notes'
                        : currentTab?.kind === 'lock'
                          ? (
                              <span className="inline-flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> Lock to teacher
                              </span>
                            )
                          : 'Separations & pairings'}
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {students.map((student, rowIndex) => {
                const rating = run.ratings[student.id] || {};
                const isExternal = student.source === 'external';
                const lockTeachers = teachersForDestinationGrade(
                  run,
                  studentDestinationGrade(run, student.id),
                );
                const rowBg = rowIndex % 2 === 0 ? stickySurface : rowStripe;
                return (
                  <tr key={student.id}>
                    <td
                      className={`sticky left-0 z-10 w-[18rem] px-2 py-2 align-middle ${gridCell}`}
                      style={{ backgroundColor: rowBg }}
                    >
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {student.name}
                      </p>
                      <p
                        className={`${TYPE.bodySm} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-500'
                        }`}
                      >
                        {[
                          isExternal ? 'CSV · no ratings' : null,
                          student.grade_level || null,
                          !isExternal ? student.gender || null : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </td>

                    {isScaleTab
                      ? levels.map((level) => {
                          if (isExternal) {
                            return (
                              <td
                                key={`${student.id}-${level.value}`}
                                className={`${scaleColWidth} px-1.5 py-2 text-center align-middle ${gridCell}`}
                                style={{ backgroundColor: rowBg }}
                              >
                                <span className="text-xs text-slate-400">—</span>
                              </td>
                            );
                          }
                          const selected = sameScaleValue(
                            rating[currentTab.column.id],
                            level.value,
                          );
                          const style = ratingSwatchStyle(
                            run.schema,
                            level.value,
                            currentTab?.column?.id,
                          );
                          return (
                            <td
                              key={`${student.id}-${level.value}`}
                              className={`${scaleColWidth} px-1.5 py-2 text-center align-middle ${gridCell}`}
                              style={{ backgroundColor: rowBg }}
                            >
                              <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                className={`edu-control mx-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-full ${
                                  selected
                                    ? 'border-0'
                                    : isDarkMode
                                      ? 'border border-slate-600 bg-slate-900/40'
                                      : 'border border-slate-300 bg-white'
                                }`}
                                style={
                                  selected && style
                                    ? {
                                        backgroundColor: style.backgroundColor,
                                        color: style.color,
                                      }
                                    : undefined
                                }
                                title={
                                  selected
                                    ? `${level.label} — click to clear`
                                    : level.label
                                }
                                aria-label={`${level.value} ${level.label}${
                                  selected ? ' (selected, click to clear)' : ''
                                }`}
                                onClick={() =>
                                  setRating(
                                    student.id,
                                    currentTab.column.id,
                                    selected ? '' : level.value,
                                  )
                                }
                              >
                                {selected ? (
                                  <Check
                                    className="size-5"
                                    strokeWidth={3}
                                    aria-hidden
                                  />
                                ) : (
                                  <span
                                    className={`size-3 rounded-full border-2 ${
                                      isDarkMode
                                        ? 'border-slate-500'
                                        : 'border-slate-300'
                                    } bg-transparent`}
                                    aria-hidden
                                  />
                                )}
                              </button>
                            </td>
                          );
                        })
                      : null}

                    {isScaleTab ? (
                      <td
                        className={`w-[12rem] p-0 align-middle ${gridCell}`}
                        style={{ backgroundColor: rowBg }}
                      >
                        {isExternal ? (
                          <span className="block px-2 py-2 text-xs text-slate-400">—</span>
                        ) : (
                          <button
                            type="button"
                            className={`edu-control block w-full min-w-[8rem] min-h-[2.75rem] px-2 py-2 rounded-none border-0 bg-transparent text-sm text-left truncate ${
                              rating[`${currentTab.column.id}_note`]
                                ? isDarkMode
                                  ? 'text-white'
                                  : 'text-slate-900'
                                : isDarkMode
                                  ? 'text-slate-500'
                                  : 'text-slate-400'
                            }`}
                            onClick={() =>
                              setNoteModal({
                                studentId: student.id,
                                studentName: student.name,
                                columnId: currentTab.column.id,
                                label: currentTab.label,
                                value:
                                  rating[`${currentTab.column.id}_note`] == null
                                    ? ''
                                    : String(rating[`${currentTab.column.id}_note`]),
                              })
                            }
                            aria-label={`Note for ${student.name} · ${currentTab.label}`}
                            title={
                              rating[`${currentTab.column.id}_note`]
                                ? String(rating[`${currentTab.column.id}_note`])
                                : `Add ${currentTab.label} note`
                            }
                          >
                            {rating[`${currentTab.column.id}_note`]
                              ? String(rating[`${currentTab.column.id}_note`])
                              : `${currentTab.label} note`}
                          </button>
                        )}
                      </td>
                    ) : (
                      <td
                        className={`px-2 py-2 align-middle ${gridCell}`}
                        style={{ backgroundColor: rowBg }}
                      >
                        {currentTab?.kind === 'tags' ? (
                          <div className="flex flex-wrap gap-1.5">
                            {run.schema.serviceTags.map((tag) => {
                              const on = (rating.services || []).includes(tag.id);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  className={`edu-control px-2.5 py-1.5 rounded-xl text-xs border ${
                                    on
                                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                      : isDarkMode
                                        ? 'border-slate-600 text-slate-300'
                                        : 'border-slate-300 text-slate-600'
                                  }`}
                                  onClick={() => toggleService(student.id, tag.id)}
                                >
                                  {tag.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        {currentTab?.kind === 'text' ? (
                          <textarea
                            className={`edu-control w-full min-h-[3.5rem] px-2.5 py-2 rounded-xl border text-sm ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                            value={rating.notes || ''}
                            onChange={(e) =>
                              setRating(student.id, 'notes', e.target.value)
                            }
                            placeholder="Notes"
                          />
                        ) : null}

                        {currentTab?.kind === 'lock' ? (
                          <select
                            className={`edu-control w-full max-w-xs px-2.5 py-2 rounded-xl border text-sm ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                            value={run.locks[student.id] || ''}
                            onChange={(e) => setLock(student.id, e.target.value)}
                          >
                            <option value="">—</option>
                            {lockTeachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                                {teacher.destinationGrade
                                  ? ` (${teacher.destinationGrade})`
                                  : ''}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        {currentTab?.kind === 'sep_pair' ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {edgesFor(student.id, 'separations').map((edge) => {
                                const otherId = edge.a === student.id ? edge.b : edge.a;
                                return (
                                  <span
                                    key={`sep-${otherId}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] bg-rose-100 text-rose-800"
                                  >
                                    Sep: {run.students[otherId]?.name || otherId}
                                    <button
                                      type="button"
                                      className="edu-control"
                                      onClick={() =>
                                        removeEdge('separations', edge.a, edge.b)
                                      }
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                              {edgesFor(student.id, 'pairings').map((edge) => {
                                const otherId = edge.a === student.id ? edge.b : edge.a;
                                return (
                                  <span
                                    key={`pair-${otherId}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] bg-sky-100 text-sky-800"
                                  >
                                    Pair: {run.students[otherId]?.name || otherId}
                                    <button
                                      type="button"
                                      className="edu-control"
                                      onClick={() =>
                                        removeEdge('pairings', edge.a, edge.b)
                                      }
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className={`edu-control px-2.5 py-1 rounded-lg text-xs border ${
                                  pairMode === 'separations' && activePairFor === student.id
                                    ? 'border-rose-400 text-rose-700'
                                    : isDarkMode
                                      ? 'border-slate-600'
                                      : 'border-slate-300'
                                }`}
                                onClick={() => {
                                  setPairMode('separations');
                                  setActivePairFor(student.id);
                                }}
                              >
                                Separate
                              </button>
                              <button
                                type="button"
                                className={`edu-control px-2.5 py-1 rounded-lg text-xs border ${
                                  pairMode === 'pairings' && activePairFor === student.id
                                    ? 'border-sky-400 text-sky-700'
                                    : isDarkMode
                                      ? 'border-slate-600'
                                      : 'border-slate-300'
                                }`}
                                onClick={() => {
                                  setPairMode('pairings');
                                  setActivePairFor(student.id);
                                }}
                              >
                                Pair
                              </button>
                            </div>
                            {activePairFor === student.id ? (
                              <div className="relative max-w-sm">
                                <div className="flex items-center gap-1">
                                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <input
                                    className={`edu-control w-full px-2 py-1.5 rounded-lg border text-xs ${
                                      isDarkMode
                                        ? 'bg-slate-900 border-slate-600 text-white'
                                        : 'bg-white border-slate-300'
                                    }`}
                                    placeholder="Search students…"
                                    value={pairQuery[student.id] || ''}
                                    onChange={(e) =>
                                      setPairQuery((q) => ({
                                        ...q,
                                        [student.id]: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <ul
                                  className={`mt-1 max-h-32 overflow-auto rounded-lg border text-xs ${
                                    isDarkMode
                                      ? 'bg-slate-900 border-slate-600'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  {searchMatches(student.id, pairQuery[student.id]).map(
                                    (match) => (
                                      <li key={match.id}>
                                        <button
                                          type="button"
                                          className="edu-control w-full text-left px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() =>
                                            addEdge(pairMode, student.id, match.id)
                                          }
                                        >
                                          {match.name}
                                        </button>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </AppBoard>

      <Modal
        isOpen={Boolean(noteModal)}
        title={
          noteModal
            ? `${noteModal.label} note · ${noteModal.studentName}`
            : 'Note'
        }
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setNoteModal(null)}
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNoteModal(null)}
              className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              onClick={() => {
                if (!noteModal) return;
                setRating(
                  noteModal.studentId,
                  `${noteModal.columnId}_note`,
                  noteDraft,
                );
                setNoteModal(null);
              }}
            >
              Save note
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-5 sm:p-6">
          <label className="block">
            <span
              className={`${TYPE.labelMicro} ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Note
            </span>
            <textarea
              autoFocus
              className={`edu-control mt-1.5 w-full min-h-[8rem] px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-0 ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={`Add a ${noteModal?.label || ''} note…`}
              aria-label={
                noteModal
                  ? `Note for ${noteModal.studentName} · ${noteModal.label}`
                  : 'Note'
              }
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
