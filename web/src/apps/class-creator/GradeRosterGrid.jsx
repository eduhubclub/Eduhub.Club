import { useState } from 'react';
import { Check, ChevronDown, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppBoard } from '../../shared/AppBoard';
import { bestOnColor } from '../../shared/colorContrast';
import { gradeShapeFor } from '../../shared/shapeLibrary';
import { ShapeSurface } from '../../shared/ShapeSurface';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';
import { studentDisplayName } from '../../data/students/displayName';
import { normalizePreviousTeachers } from '../../data/students/seed';
import {
  DEFAULT_GENDER_COLORS,
  normalizeGenderKey,
  sameScaleValue,
  scaleForColumn,
  studentRowBackground,
} from '../../data/class-creator/classCreatorModel';
import { ratingSwatchStyle } from './ratingSwatch';
import { cardHeaderClass } from './views/SchemaView';

function mostRecentPreviousTeacher(student) {
  const rows = normalizePreviousTeachers(student?.previousTeachers);
  return rows[0]?.teacherName || '';
}

const FALLBACK_SCALE_COLS = [
  { id: 'overall_academics', short: 'OA', title: 'Overall academics' },
  { id: 'behavior', short: 'Beh', title: 'Behavior' },
];

/** Max chips on a roster row; overflow collapses into a … circle. */
const MAX_ROSTER_INDICATORS = 5;

/** Compact roster indicators — OA + Behavior; hover title names the category. */
function scaleIndicatorCols(schema) {
  const byId = new Map((schema?.columns || []).map((col) => [col.id, col]));
  return FALLBACK_SCALE_COLS.map((fallback) => {
    const col = byId.get(fallback.id);
    if (col && col.enabled !== false && (col.type === 'scale' || !col.type)) {
      return { id: col.id, short: fallback.short, title: col.label || fallback.title };
    }
    return fallback;
  });
}

/** All enabled scale survey categories for the grade summary table. */
function allScaleCategoryCols(schema) {
  const cols = (schema?.columns || []).filter(
    (col) => col.enabled !== false && (col.type === 'scale' || !col.type),
  );
  if (cols.length) {
    return cols.map((col) => ({
      id: col.id,
      title: col.label || col.id,
    }));
  }
  return FALLBACK_SCALE_COLS.map((col) => ({ id: col.id, title: col.title }));
}

function MoreIndicatorsCircle({ labels, isDarkMode }) {
  const tip = labels.length ? labels.join(' · ') : 'More indicators';
  return (
    <span
      className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
        isDarkMode
          ? 'bg-slate-700 text-slate-200'
          : 'bg-slate-200 text-slate-700'
      }`}
      title={tip}
      aria-label={tip}
    >
      …
    </span>
  );
}

function levelCountsForStudents(schema, students, ratings, columnId) {
  const levels = scaleForColumn(schema, columnId).levels || [];
  return levels.map((level) => {
    let n = 0;
    for (const student of students || []) {
      const value = ratings?.[student.id]?.[columnId];
      if (sameScaleValue(value, level.value)) n += 1;
    }
    return { level, count: n };
  });
}

/** Female + male always; other/unset only when present. */
function genderRatioForStudents(students, schema) {
  const colors = schema?.genderColors || DEFAULT_GENDER_COLORS;
  const counts = { female: 0, male: 0, other: 0 };
  for (const student of students || []) {
    counts[normalizeGenderKey(student?.gender)] += 1;
  }
  const rows = [
    { key: 'female', label: 'Female', count: counts.female, hex: colors.female },
    { key: 'male', label: 'Male', count: counts.male, hex: colors.male },
  ];
  if (counts.other > 0) {
    rows.push({
      key: 'other',
      label: 'Other / unset',
      count: counts.other,
      hex: colors.other,
    });
  }
  return rows;
}

/** Grade summary table — teacher rows × category columns of level-count circles. */
function GradeRatingSummaryTable({
  schema,
  rooms,
  ratings,
  isDarkMode,
  theme,
  yearLabel = '',
}) {
  const cols = allScaleCategoryCols(schema);
  if (!rooms?.length || !cols.length) return null;

  const prefix = yearLabel ? `${yearLabel} · ` : '';
  const stickySurface = isDarkMode ? '#0f172a' : '#ffffff';
  /** Inner grid only — outer stroke comes from the grade header + section border-b. */
  const gridRule = `border-r border-b ${theme.colorOutline}`;
  const lastCol = cols.length - 1;

  return (
    <div
      className={`-mx-5 sm:-mx-6 -mt-4 overflow-x-auto border-b ${theme.colorOutline}`}
    >
      <table className="w-full min-w-[36rem] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[10.5rem]" />
          <col className="w-[7.5rem]" />
          {cols.map((col) => (
            <col key={col.id} />
          ))}
        </colgroup>
        <thead>
          <tr className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
            <th
              className={`sticky left-0 z-10 px-3 py-2 text-left ${TYPE.labelMicro} ${gridRule}`}
              style={{ backgroundColor: stickySurface }}
            >
              Teacher
            </th>
            <th
              className={`px-2 py-2 text-center ${TYPE.labelMicro} ${gridRule}`}
              style={{ backgroundColor: stickySurface }}
              title="Gender ratio"
            >
              Gender
            </th>
            {cols.map((col, index) => (
              <th
                key={col.id}
                className={`px-2 py-2 text-center ${TYPE.labelMicro} border-b ${theme.colorOutline} ${
                  index < lastCol ? `border-r ${theme.colorOutline}` : ''
                }`}
                style={{ backgroundColor: stickySurface }}
                title={col.title}
              >
                <span className="block truncate">{col.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, roomIndex) => {
            const isLastRow = roomIndex === rooms.length - 1;
            const rowRule = isLastRow
              ? `border-r ${theme.colorOutline}`
              : gridRule;
            return (
            <tr key={room.classId || `${room.teacherName}-${room.className}`}>
              <th
                scope="row"
                className={`sticky left-0 z-10 px-3 py-2 text-left align-middle font-semibold ${rowRule} ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
                style={{ backgroundColor: stickySurface }}
              >
                <span className="block truncate">{room.teacherName}</span>
                {room.className ? (
                  <span
                    className={`mt-0.5 block truncate ${TYPE.bodySm} font-normal ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {room.className}
                  </span>
                ) : null}
              </th>
              <td className={`px-2 py-2 text-center align-middle ${rowRule}`}>
                <span className="inline-flex flex-wrap items-center justify-center gap-1">
                  {genderRatioForStudents(room.students, schema).map((row) => {
                    const on = bestOnColor(row.hex || '#64748b');
                    const tip = `${prefix}${room.teacherName} · ${row.label}: ${row.count}`;
                    return (
                      <span
                        key={row.key}
                        className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums"
                        style={{
                          backgroundColor: row.hex || '#64748b',
                          color: on.hex,
                        }}
                        title={tip}
                        aria-label={tip}
                      >
                        {row.count}
                      </span>
                    );
                  })}
                </span>
              </td>
              {cols.map((col, index) => {
                const counts = levelCountsForStudents(
                  schema,
                  room.students,
                  ratings,
                  col.id,
                );
                const isLastCol = index === lastCol;
                const cellRule = [
                  !isLastRow ? `border-b ${theme.colorOutline}` : '',
                  !isLastCol ? `border-r ${theme.colorOutline}` : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <td
                    key={`${room.classId || room.teacherName}-${col.id}`}
                    className={`px-2 py-2 text-center align-middle ${cellRule}`}
                  >
                    <span className="inline-flex flex-wrap items-center justify-center gap-1">
                      {counts.map(({ level, count }) => {
                        if (!count) return null;
                        const style = ratingSwatchStyle(schema, level.value, col.id);
                        const tip = `${prefix}${room.teacherName} · ${col.title}: ${count} · ${level.label}`;
                        return (
                          <span
                            key={`${col.id}-${level.value}`}
                            className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums"
                            style={
                              style
                                ? {
                                    backgroundColor: style.backgroundColor,
                                    color: style.color,
                                  }
                                : undefined
                            }
                            title={tip}
                            aria-label={tip}
                          >
                            {count}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RatingCircle({
  schema,
  value,
  title,
  columnId,
  isDarkMode,
  yearLabel = '',
}) {
  const style = ratingSwatchStyle(schema, value, columnId);
  const prefix = yearLabel ? `${yearLabel} · ` : '';
  const tip = style
    ? `${prefix}${title}: ${value} · ${style.label}`
    : `${prefix}${title}: not rated`;
  if (!style) {
    return (
      <span
        className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed text-[10px] tabular-nums ${
          isDarkMode ? 'border-slate-600 text-slate-600' : 'border-slate-300 text-slate-300'
        }`}
        title={tip}
        aria-label={tip}
      >
        ·
      </span>
    );
  }
  return (
    <span
      className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
      title={tip}
      aria-label={tip}
    >
      {value}
    </span>
  );
}

/**
 * Teacher-column roster tables (Dashboard Current + Archive).
 *
 * @param {object} props
 * @param {object} props.theme
 * @param {boolean} props.isDarkMode
 * @param {object} [props.schema] — gender-color schema from the active run
 * @param {Record<string, object>} [props.ratings] — studentId → rating fields
 * @param {string} [props.ratingYearLabel] — e.g. "Previous year" on hover tips
 * @param {Record<string, string>} [props.gradeColors] — Setup grade header colors
 * @param {Record<string, string>} [props.gradeShapes] — Setup grade accent shapes
 * @param {{ grade: string, rooms: { classId?: string, className?: string, teacherName: string, students: object[] }[] }[]} props.cards
 * @param {string} props.emptyMessage
 * @param {boolean} [props.editable] — show per-grade edit for mid-year roster changes
 * @param {(studentId: string, fromClassId: string, toClassId: string) => void} [props.onMoveStudent]
 * @param {(classId: string, studentId: string) => void} [props.onRemoveStudent]
 * @param {(classId: string, grade: string, name: string) => void} [props.onAddStudent]
 */
export function GradeRosterGrid({
  theme,
  isDarkMode,
  schema,
  ratings = {},
  ratingYearLabel = '',
  gradeColors = {},
  gradeShapes = {},
  cards,
  emptyMessage,
  editable = false,
  onMoveStudent,
  onRemoveStudent,
  onAddStudent,
}) {
  const [editingGrade, setEditingGrade] = useState('');
  const [collapsedGrades, setCollapsedGrades] = useState(() => new Set());
  const [dragPayload, setDragPayload] = useState(null);
  const [dropClassId, setDropClassId] = useState('');
  const [addingClassId, setAddingClassId] = useState('');
  const [addName, setAddName] = useState('');

  const hasAny = cards.some((card) => card.rooms.length > 0);
  if (!hasAny) {
    return (
      <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
        {emptyMessage}
      </p>
    );
  }

  const commitAdd = (classId, grade) => {
    const name = addName.trim();
    if (!name || !onAddStudent) return;
    onAddStudent(classId, grade, name);
    setAddName('');
    setAddingClassId('');
  };

  return (
    <div className="space-y-3">
      {cards.map(({ grade, rooms }) => {
        const studentTotal = rooms.reduce((n, room) => n + (room.students?.length || 0), 0);
        const rowCount = Math.max(0, ...rooms.map((room) => room.students.length));
        const isEditing = editable && editingGrade === grade;
        const isCollapsed = collapsedGrades.has(grade);
        const gradeColor = String(gradeColors?.[grade] || '').trim();
        const headerOn = gradeColor ? bestOnColor(gradeColor) : null;
        const gradeShape = gradeShapeFor(grade, gradeShapes);

        return (
          <AppBoard key={grade} mode="scroll" pad="board" theme={theme}>
            <div className={cardHeaderClass(theme, isCollapsed ? '!mb-0 !border-b-0' : '')}>
              <div className="min-w-0 flex items-center gap-2.5">
                <ShapeSurface
                  shape={gradeShape}
                  className="h-8 w-8 shrink-0"
                  style={{
                    backgroundColor: gradeColor
                      ? '#ffffff'
                      : isDarkMode
                        ? '#e2e8f0'
                        : '#0f172a',
                  }}
                  aria-hidden
                />
                <div className="min-w-0">
                <h1 className={`${TYPE.titleLg} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {grade}
                </h1>
                <p className={`mt-1 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {rooms.length} {rooms.length === 1 ? 'class' : 'classes'} · {studentTotal}{' '}
                  students
                </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {editable ? (
                  <button
                    type="button"
                    className={`${toolBtnClass(isDarkMode)} edu-control shrink-0 ${
                      isEditing ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                    }`}
                    onClick={() => {
                      setEditingGrade((current) => (current === grade ? '' : grade));
                      setAddingClassId('');
                      setAddName('');
                      setDragPayload(null);
                      setDropClassId('');
                      setCollapsedGrades((prev) => {
                        if (!prev.has(grade)) return prev;
                        const next = new Set(prev);
                        next.delete(grade);
                        return next;
                      });
                    }}
                    aria-label={isEditing ? `Done editing ${grade}` : `Edit ${grade} roster`}
                    title={isEditing ? 'Done' : 'Edit roster'}
                    aria-pressed={isEditing}
                  >
                    {isEditing ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Pencil className="w-4 h-4" />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${toolBtnClass(isDarkMode)} edu-control shrink-0`}
                  onClick={() => {
                    setCollapsedGrades((prev) => {
                      const next = new Set(prev);
                      if (next.has(grade)) next.delete(grade);
                      else next.add(grade);
                      return next;
                    });
                    if (!isCollapsed) {
                      setEditingGrade((current) => (current === grade ? '' : current));
                      setAddingClassId('');
                      setAddName('');
                      setDragPayload(null);
                      setDropClassId('');
                    }
                  }}
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? `Expand ${grade}` : `Collapse ${grade}`}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isCollapsed ? '' : 'rotate-180'
                    }`}
                  />
                </button>
              </div>
            </div>
            {isCollapsed ? null : rooms.length === 0 ? (
              <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No classes
              </p>
            ) : (
              <>
              <GradeRatingSummaryTable
                schema={schema}
                rooms={rooms}
                ratings={ratings}
                isDarkMode={isDarkMode}
                theme={theme}
                yearLabel={ratingYearLabel}
              />
              <div className="overflow-x-auto -mx-1 px-1 pt-5 sm:pt-6">
                <div className="flex w-full flex-wrap justify-center gap-2">
                  {rooms.map((room) => {
                    const classId = room.classId || '';
                    const isDropTarget = isEditing && dropClassId === classId && dragPayload;
                    const listLength = isEditing ? room.students.length : rowCount;
                    return (
                      <div
                        key={classId || `${room.teacherName}-${room.className}`}
                        className={`w-[18rem] min-w-[16rem] max-w-[22rem] shrink-0 overflow-hidden rounded-xl ${
                          isDropTarget ? `ring-2 ${theme.ring}` : ''
                        }`}
                        onDragOver={
                          isEditing && classId
                            ? (e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDropClassId(classId);
                              }
                            : undefined
                        }
                        onDragLeave={
                          isEditing
                            ? () => {
                                if (dropClassId === classId) setDropClassId('');
                              }
                            : undefined
                        }
                        onDrop={
                          isEditing && classId
                            ? (e) => {
                                e.preventDefault();
                                const studentId =
                                  e.dataTransfer.getData('text/student-id') ||
                                  dragPayload?.studentId;
                                const fromClassId =
                                  e.dataTransfer.getData('text/from-class-id') ||
                                  dragPayload?.fromClassId;
                                setDropClassId('');
                                setDragPayload(null);
                                if (!studentId || !fromClassId) return;
                                onMoveStudent?.(studentId, fromClassId, classId);
                              }
                            : undefined
                        }
                      >
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${
                          gradeColor
                            ? ''
                            : isDarkMode
                              ? 'bg-slate-800/50'
                              : 'bg-slate-50'
                        }`}
                        style={
                          gradeColor
                            ? { backgroundColor: gradeColor, color: headerOn.hex }
                            : undefined
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={`${TYPE.titleMd} ${
                              gradeColor
                                ? ''
                                : isDarkMode
                                  ? 'text-white'
                                  : 'text-slate-900'
                            }`}
                            style={gradeColor ? { color: headerOn.hex } : undefined}
                          >
                            {room.teacherName}
                          </p>
                          <p
                            className={`mt-1 min-w-0 truncate ${TYPE.bodySm} font-normal ${
                              gradeColor
                                ? 'opacity-80'
                                : isDarkMode
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                            }`}
                            style={gradeColor ? { color: headerOn.hex } : undefined}
                          >
                            {room.className}
                          </p>
                        </div>
                        <ShapeSurface
                          shape={gradeShape}
                          className="h-10 w-10 shrink-0 text-sm font-bold tabular-nums"
                          style={
                            gradeColor
                              ? { backgroundColor: '#ffffff', color: headerOn.hex }
                              : isDarkMode
                                ? { backgroundColor: '#334155', color: '#f1f5f9' }
                                : { backgroundColor: '#ffffff', color: '#0f172a' }
                          }
                          aria-label={`${room.students.length} students`}
                          title={`${room.students.length} students`}
                        >
                          {room.students.length}
                        </ShapeSurface>
                      </div>
                      <div
                        className={`overflow-hidden rounded-b-xl border-x-[1.5px] border-b-[1.5px] ${theme.colorOutline}`}
                      >
                      <ul>
                        {isEditing && room.students.length === 0 ? (
                          <li
                            className={`px-3 py-3 ${TYPE.bodySm} ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Drop a student here
                          </li>
                        ) : null}
                        {Array.from({ length: listLength }).map((_, rowIndex) => {
                          const student = room.students[rowIndex];
                          if (isEditing && !student) return null;
                          const fill = student
                            ? studentRowBackground(schema, student, rowIndex, isDarkMode)
                            : schema?.genderColors?.enabled
                              ? undefined
                              : studentRowBackground(schema, null, rowIndex, isDarkMode);
                          const isLast = rowIndex === listLength - 1;
                          const previousTeacher = student
                            ? mostRecentPreviousTeacher(student)
                            : '';
                          return (
                            <li
                              key={
                                student
                                  ? `${classId}-${student.id}`
                                  : `${classId || room.teacherName}-${rowIndex}`
                              }
                              draggable={Boolean(isEditing && student && classId)}
                              onDragStart={
                                isEditing && student && classId
                                  ? (e) => {
                                      setDragPayload({
                                        studentId: student.id,
                                        fromClassId: classId,
                                      });
                                      e.dataTransfer.setData(
                                        'text/student-id',
                                        String(student.id),
                                      );
                                      e.dataTransfer.setData(
                                        'text/from-class-id',
                                        String(classId),
                                      );
                                      e.dataTransfer.effectAllowed = 'move';
                                    }
                                  : undefined
                              }
                              onDragEnd={
                                isEditing
                                  ? () => {
                                      setDragPayload(null);
                                      setDropClassId('');
                                    }
                                  : undefined
                              }
                              className={`flex items-center gap-1.5 px-3 py-2 ${
                                isLast && !isEditing ? '' : `border-b ${theme.colorOutline}`
                              } ${
                                isEditing && student
                                  ? 'cursor-grab active:cursor-grabbing'
                                  : ''
                              } ${
                                dragPayload?.studentId === student?.id ? 'opacity-50' : ''
                              }`}
                              style={fill || undefined}
                            >
                              {isEditing && student ? (
                                <GripVertical
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                                  }`}
                                  aria-hidden
                                />
                              ) : null}
                              {student ? (
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`truncate text-sm font-semibold leading-snug ${
                                      isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}
                                  >
                                    {studentDisplayName(student)}
                                  </p>
                                  {previousTeacher ? (
                                    <p
                                      className={`mt-0.5 truncate ${TYPE.bodySm} ${
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                      }`}
                                      title={`Previous teacher: ${previousTeacher}`}
                                    >
                                      {previousTeacher}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="min-w-0 flex-1 text-transparent select-none">
                                  —
                                </span>
                              )}
                              {student ? (
                                <span className="shrink-0 inline-flex items-center gap-1">
                                  {(() => {
                                    const rating = ratings[student.id] || {};
                                    const tagsById = new Map(
                                      (schema?.serviceTags || []).map((tag) => [
                                        tag.id,
                                        tag.label,
                                      ]),
                                    );
                                    const scaleItems = scaleIndicatorCols(schema).map(
                                      (col) => ({
                                        kind: 'scale',
                                        key: col.id,
                                        col,
                                        value: rating[col.id],
                                        label: col.title,
                                      }),
                                    );
                                    const serviceItems = (
                                      Array.isArray(rating.services) ? rating.services : []
                                    ).map((tagId) => {
                                      const label = tagsById.get(tagId) || tagId;
                                      return {
                                        kind: 'service',
                                        key: `svc-${tagId}`,
                                        tagId,
                                        label,
                                      };
                                    });
                                    const items = [...scaleItems, ...serviceItems];
                                    const overflow = items.length > MAX_ROSTER_INDICATORS;
                                    const visible = overflow
                                      ? items.slice(0, MAX_ROSTER_INDICATORS - 1)
                                      : items;
                                    const hidden = overflow
                                      ? items.slice(MAX_ROSTER_INDICATORS - 1)
                                      : [];
                                    const hiddenLabels = hidden.map((item) => {
                                      if (item.kind === 'scale') {
                                        const style = ratingSwatchStyle(
                                          schema,
                                          item.value,
                                          item.col.id,
                                        );
                                        return style
                                          ? `${item.label}: ${item.value} · ${style.label}`
                                          : `${item.label}: not rated`;
                                      }
                                      return `Services: ${item.label}`;
                                    });
                                    return (
                                      <>
                                        {visible.map((item) => {
                                          if (item.kind === 'scale') {
                                            return (
                                              <RatingCircle
                                                key={item.key}
                                                schema={schema}
                                                columnId={item.col.id}
                                                value={item.value}
                                                title={item.label}
                                                yearLabel={ratingYearLabel}
                                                isDarkMode={isDarkMode}
                                              />
                                            );
                                          }
                                          const tip = `Services: ${item.label}`;
                                          return (
                                            <span
                                              key={item.key}
                                              className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-[9px] font-semibold ${
                                                isDarkMode
                                                  ? 'bg-slate-700 text-slate-200'
                                                  : 'bg-slate-200 text-slate-700'
                                              }`}
                                              title={tip}
                                              aria-label={tip}
                                            >
                                              {String(item.label).slice(0, 3)}
                                            </span>
                                          );
                                        })}
                                        {overflow ? (
                                          <MoreIndicatorsCircle
                                            labels={hiddenLabels}
                                            isDarkMode={isDarkMode}
                                          />
                                        ) : null}
                                      </>
                                    );
                                  })()}
                                </span>
                              ) : null}
                              {isEditing && student && classId ? (
                                <button
                                  type="button"
                                  className="edu-control shrink-0 p-1 rounded-lg text-slate-500 hover:text-rose-600"
                                  aria-label={`Remove ${studentDisplayName(student)}`}
                                  title="Remove from class"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveStudent?.(classId, student.id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                      {isEditing && classId ? (
                        <div
                          className={`border-t px-2 py-2 ${theme.colorOutline} ${
                            isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/80'
                          }`}
                        >
                          {addingClassId === classId ? (
                            <form
                              className="flex items-center gap-1.5"
                              onSubmit={(e) => {
                                e.preventDefault();
                                commitAdd(classId, grade);
                              }}
                            >
                              <input
                                className={`edu-control min-w-0 flex-1 px-2 py-1.5 rounded-lg border text-sm ${
                                  isDarkMode
                                    ? 'bg-slate-800 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                                }`}
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder="Student name"
                                aria-label="New student name"
                                autoFocus
                              />
                              <button
                                type="submit"
                                className={`${toolBtnClass(isDarkMode)} edu-control !h-8 !px-2`}
                                aria-label="Add student"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              className={`edu-control w-full inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                                isDarkMode
                                  ? 'text-slate-300 hover:bg-slate-800'
                                  : 'text-slate-600 hover:bg-white'
                              }`}
                              onClick={() => {
                                setAddingClassId(classId);
                                setAddName('');
                              }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add student
                            </button>
                          )}
                        </div>
                      ) : null}
                      </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
            )}
          </AppBoard>
        );
      })}
    </div>
  );
}
