import { useState } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { studentRowBackground } from '../../../data/class-creator/classCreatorModel';
import {
  checkMoveConstraints,
  moveStudent,
  runPlacement,
} from '../../../data/class-creator/placementEngine';

/**
 * Run the sorter and refine with drag-and-drop (warn on constraint breaks).
 */
export function PlaceView({ theme, isDarkMode, run, upsertActiveRun }) {
  const [warnings, setWarnings] = useState([]);
  const [breakNotice, setBreakNotice] = useState([]);
  const [dragId, setDragId] = useState(null);

  if (!run) {
    return (
      <EmptyState
        message="Start a placement run first — Preplacement (school, teachers, and rooms) is on Setup. Finish surveys, then come back here to place."
        isDarkMode={isDarkMode}
      />
    );
  }

  if (!run.destinationTeachers.length) {
    return (
      <EmptyState
        message="No next-year rooms yet — Preplacement happens on Setup: include teachers and sections there, then return to Place."
        isDarkMode={isDarkMode}
      />
    );
  }

  const onRun = () => {
    const result = runPlacement(run);
    upsertActiveRun({
      draftClasses: result.draftClasses,
      unassigned: result.unassigned,
      status: 'placed',
    });
    setWarnings(result.warnings);
    setBreakNotice([]);
  };

  const applyMove = (studentId, toTeacherId) => {
    const proposed = moveStudent(
      run.draftClasses,
      run.unassigned,
      studentId,
      toTeacherId,
    );
    const check = checkMoveConstraints(
      run,
      proposed.draftClasses,
      studentId,
      toTeacherId,
    );
    if (!check.ok) {
      setBreakNotice(check.breaks);
    } else {
      setBreakNotice([]);
    }
    upsertActiveRun({
      draftClasses: proposed.draftClasses,
      unassigned: proposed.unassigned,
      status: 'placed',
    });
  };

  const onDrop = (toTeacherId) => {
    if (!dragId) return;
    applyMove(dragId, toTeacherId);
    setDragId(null);
  };

  const studentChip = (studentId, rowIndex = 0) => {
    const student = run.students[studentId];
    if (!student) return null;
    const locked = Boolean(run.locks[studentId]);
    const genderOn = Boolean(run.schema?.genderColors?.enabled);
    const fill = genderOn
      ? studentRowBackground(run.schema, student, rowIndex, isDarkMode)
      : null;
    return (
      <div
        key={studentId}
        draggable
        onDragStart={() => setDragId(studentId)}
        className={`edu-control px-2.5 py-1.5 rounded-xl border text-sm cursor-grab active:cursor-grabbing ${theme.colorOutline} ${
          fill
            ? isDarkMode
              ? 'text-white'
              : 'text-slate-900'
            : isDarkMode
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-900'
        } ${locked ? 'ring-1 ring-amber-400' : ''}`}
        style={fill || undefined}
        title={locked ? 'Locked' : student.name}
      >
        {student.name}
        {locked ? <span className="ml-1 text-amber-500 text-[10px]">LOCK</span> : null}
      </div>
    );
  };

  const hasDraft = Object.values(run.draftClasses || {}).some((list) => list.length);

  return (
    <div className="space-y-4">
      <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Place · school-wide
            </h2>
            <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Preplacement (teachers, sections, and schema) lives on Setup. Here you run the
              sorter into next-year rooms — locks, pairings, and separations apply. Drag to
              adjust; breaks are flagged but allowed.
            </p>
          </div>
          <button
            type="button"
            className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={onRun}
          >
            <Play className="w-4 h-4" />
            Run placement
          </button>
        </div>
        {warnings.length ? (
          <ul className={`mt-3 space-y-1 ${TYPE.bodySm} text-amber-700`}>
            {warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        ) : null}
        {breakNotice.length ? (
          <div
            className={`mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 ${TYPE.bodySm} text-amber-900`}
            role="status"
          >
            <p className="font-semibold mb-1">Constraint warning — move kept</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {breakNotice.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </AppBoard>

      {!hasDraft && !run.unassigned.length ? (
        <EmptyState
        message="No draft classes yet — Run placement to generate balanced lists, then drag students between teachers."
        isDarkMode={isDarkMode}
      />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {run.destinationTeachers.map((teacher) => {
            const ids = run.draftClasses[teacher.id] || [];
            return (
              <div
                key={teacher.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(teacher.id)}
                className={`rounded-2xl border-[1.5px] p-3 min-h-[12rem] ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {teacher.name}
                    {teacher.destinationGrade ? (
                      <span
                        className={`ml-2 text-xs font-normal ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {teacher.destinationGrade}
                      </span>
                    ) : null}
                    {teacher.isProvisional ? (
                      <span className="ml-2 text-xs font-normal text-amber-600">Open</span>
                    ) : null}
                  </h3>
                  <span className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {ids.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ids.map((id, index) => studentChip(id, index))}
                </div>
              </div>
            );
          })}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(null)}
            className={`rounded-2xl border-[1.5px] border-dashed p-3 min-h-[8rem] ${theme.colorOutline} ${
              isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'
            }`}
          >
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Unassigned ({run.unassigned.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {run.unassigned.map((id, index) => studentChip(id, index))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
