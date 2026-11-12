import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { sortStudentsByLastName } from '../../../data/classes/seed';
import { studentDisplayName } from '../../../data/students/displayName';
import {
  PURPOSE_LABELS,
  countsTowardCompile,
  formatNativeScore,
  pointsPossible,
} from '../../../data/tests/model';
import { attemptFor, closeAttempt } from '../../../data/tests/storage';
import { AppPageShell } from '../../../shared/AppPageShell';
import { EmptyState } from '../../../shared/EmptyState';
import { InternalScrollBoard } from '../../../shared/InternalScrollBoard';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { testFieldClass } from '../../tests/fields';

export function BookView({ theme, isDarkMode, store, ownerId, selectedClass }) {
  const roster = useMemo(
    () => sortStudentsByLastName(selectedClass?.studentList || []),
    [selectedClass],
  );
  const columns = useMemo(() => {
    if (!selectedClass) return [];
    return store.assignments
      .filter((assignment) => assignment.classId === selectedClass.id)
      .map((assignment) => {
        const assessment = store.assessments.find((row) => row.id === assignment.assessmentId);
        return assessment ? { assignment, assessment } : null;
      })
      .filter(Boolean);
  }, [store, selectedClass]);

  const subjects = useMemo(() => {
    const names = [];
    for (const column of columns) {
      if (column.assessment.subject && !names.includes(column.assessment.subject)) {
        names.push(column.assessment.subject);
      }
    }
    return names;
  }, [columns]);
  const [subject, setSubject] = useState('all');
  const [editing, setEditing] = useState(null);

  const visible = columns.filter(
    (column) => subject === 'all' || column.assessment.subject === subject,
  );

  return (
    <AppPageShell variant="stage">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PageHeader
          title="Book"
          description={
            selectedClass
              ? `${selectedClass.name}. Formative scores stay out of the compiled subject grade.`
              : 'Choose a class to see scores.'
          }
          isDarkMode={isDarkMode}
        />
        {subjects.length > 1 ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <FilterChip
              theme={theme}
              selected={subject === 'all'}
              onClick={() => setSubject('all')}
              label="All subjects"
            />
            {subjects.map((name) => (
              <FilterChip
                key={name}
                theme={theme}
                selected={subject === name}
                onClick={() => setSubject(name)}
                label={name}
              />
            ))}
          </div>
        ) : null}
        {visible.length === 0 ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message="No tests are assigned to this class yet. Assign one in Tests."
            illustration={<Star size={36} className="text-slate-400" />}
          />
        ) : (
          <InternalScrollBoard
            theme={theme}
            isDarkMode={isDarkMode}
            pad="none"
            className="min-h-0 flex-1"
            header={
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Tap a score to enter points and close the test. Closed tests leave the student list.
              </p>
            }
          >
            <div className="min-h-0 overflow-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className={`border-b-[1.5px] ${theme.colorOutline}`}>
                    <th className={`sticky left-0 z-[1] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface}`}>
                      Student
                    </th>
                    {visible.map((column) => (
                      <th key={column.assignment.id} className="min-w-[8rem] px-3 py-2 align-bottom">
                        <span className={`block ${TYPE.labelMd}`}>{column.assessment.title}</span>
                        <span className={`mt-1 block ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                          {column.assessment.subject} · {PURPOSE_LABELS[column.assessment.purpose]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => (
                    <tr key={student.id} className={`border-b-[1.5px] ${theme.colorOutline}`}>
                      <th
                        className={`sticky left-0 z-[1] px-3 py-2 text-left ${TYPE.bodyMd} ${theme.colorSurface}`}
                      >
                        {studentDisplayName(student)}
                      </th>
                      {visible.map((column) => {
                        const attempt = attemptFor(store, column.assignment.id, student.id);
                        const native = formatNativeScore(attempt);
                        return (
                          <td key={column.assignment.id} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  student,
                                  assignment: column.assignment,
                                  assessment: column.assessment,
                                  attempt,
                                })
                              }
                              className={`edu-control flex min-h-12 w-full flex-col items-start justify-center rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                            >
                              <span className={TYPE.titleSm}>{native.label}</span>
                              {native.detail ? (
                                <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                                  {native.detail}
                                </span>
                              ) : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InternalScrollBoard>
        )}
      </div>
      {editing ? (
        <ScoreDialog
          theme={theme}
          isDarkMode={isDarkMode}
          ownerId={ownerId}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </AppPageShell>
  );
}

function FilterChip({ theme, selected, onClick, label }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${
        selected
          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
          : `border-[1.5px] ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
      }`}
    >
      {label}
    </button>
  );
}

function ScoreDialog({ theme, isDarkMode, ownerId, editing, onClose }) {
  const possibleDefault =
    editing.attempt?.pointsPossible ?? pointsPossible(editing.assessment.items);
  const earnedDefault =
    editing.attempt?.pointsEarned == null ? '' : String(editing.attempt.pointsEarned);
  const [earned, setEarned] = useState(earnedDefault);
  const [possible, setPossible] = useState(String(possibleDefault));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formative = !countsTowardCompile(editing.assessment);

  async function save() {
    const pointsEarned = Number(earned);
    const pointsPossibleValue = Number(possible);
    if (!Number.isFinite(pointsEarned) || pointsEarned < 0) {
      setError('Enter the points earned.');
      return;
    }
    if (!Number.isFinite(pointsPossibleValue) || pointsPossibleValue < 0) {
      setError('Enter the points possible.');
      return;
    }
    setBusy(true);
    await closeAttempt({
      assignment: editing.assignment,
      studentId: editing.student.id,
      actorId: ownerId,
      pointsEarned,
      pointsPossible: pointsPossibleValue,
    });
    setBusy(false);
    onClose();
  }

  return (
    <Modal
      isOpen
      title="Enter score"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={`edu-control rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} disabled={busy} onClick={save}>
            Save and close
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-6 py-5">
        <p className={TYPE.bodyMd}>
          {studentDisplayName(editing.student)} · {editing.assessment.title}
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {formative
            ? 'This formative score is saved and does not count toward the compiled subject grade.'
            : 'This summative score counts toward the compiled subject grade once that column is on.'}
        </p>
        <label className="flex flex-col gap-1">
          <span className={TYPE.labelMd}>Points earned</span>
          <input
            value={earned}
            onChange={(event) => setEarned(event.target.value)}
            inputMode="decimal"
            className={testFieldClass(theme)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={TYPE.labelMd}>Points possible</span>
          <input
            value={possible}
            onChange={(event) => setPossible(event.target.value)}
            inputMode="decimal"
            className={testFieldClass(theme)}
          />
        </label>
        {error ? <p className={TYPE.bodySm}>{error}</p> : null}
      </div>
    </Modal>
  );
}
