import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import {
  assessmentsInLibrary,
  assignAssessment,
  assignmentForClass,
  copyAssessment,
  setAssessmentArchived,
} from '../../../data/tests/storage';
import { PURPOSE_LABELS, SCORE_MODE_LABELS } from '../../../data/tests/model';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { AssessmentEditor } from './AssessmentEditor';

export { AssessmentEditor };

const LIBRARY_COPY = {
  saved: {
    title: 'Saved Assessments',
    description: (className) =>
      className
        ? `Your tests for ${className}. Assign one, or archive it when you are finished with it.`
        : 'Your tests. Choose a class in the sidebar before you assign one.',
    empty: 'No saved assessments yet. Use Create Assessments to write one.',
  },
  archived: {
    title: 'Archived Assessments',
    description: () => 'Archived tests stay out of Saved. Restore one when you want to assign it again.',
    empty: 'Nothing is archived.',
  },
  district: {
    title: 'Saved by District',
    description: () =>
      'Assessments saved by the district. Assign one to the class, or make a copy if you need to change it.',
    empty: 'No district assessments yet.',
  },
  community: {
    title: 'Community Assessments',
    description: () => 'Shared assessments from other teachers. Make a copy, then edit and assign that copy.',
    empty: 'No community assessments yet.',
  },
};

export function TestsHomeView({
  theme,
  isDarkMode,
  store,
  ownerId,
  selectedClass,
  library = 'saved',
  onCreate,
  onOpenStudent,
  onCopied,
}) {
  const [editing, setEditing] = useState(null);
  const copy = LIBRARY_COPY[library] || LIBRARY_COPY.saved;
  const rows = useMemo(
    () =>
      assessmentsInLibrary(store, {
        ownerId,
        shelf: library === 'saved' || library === 'archived' ? 'mine' : library,
        archived: library === 'archived',
      }),
    [store, ownerId, library],
  );

  if (editing) {
    return (
      <AssessmentEditor
        theme={theme}
        isDarkMode={isDarkMode}
        ownerId={ownerId}
        classId={selectedClass?.id || ''}
        className={selectedClass?.name || ''}
        initial={editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  const canAssign = library === 'saved' || library === 'district';
  const canCopy = library === 'district' || library === 'community';

  return (
    <AppPageShell variant="scroll" className="h-full overflow-y-auto">
      <PageHeader
        title={copy.title}
        description={copy.description(selectedClass?.name || '')}
        isDarkMode={isDarkMode}
        actions={
          library === 'saved' ? (
            <button
              type="button"
              onClick={onCreate}
              className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              Create
            </button>
          ) : null
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={copy.empty}
          illustration={<ClipboardCheck size={36} className="text-slate-400" />}
        />
      ) : (
        <ContentCardGrid>
          {rows.map((assessment) => {
            const assigned =
              canAssign && selectedClass
                ? assignmentForClass(store, assessment.id, selectedClass.id)
                : null;
            return (
              <AppBoard key={assessment.id} mode="grid" theme={theme} className="flex flex-col gap-3">
                <div>
                  <h2 className={TYPE.titleMd}>{assessment.title}</h2>
                  <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {assessment.subject} · {PURPOSE_LABELS[assessment.purpose]} ·{' '}
                    {SCORE_MODE_LABELS[assessment.scoreMode]}
                  </p>
                  <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {assessment.items.length}{' '}
                    {assessment.items.length === 1 ? 'question' : 'questions'}
                    {assigned ? ' · Assigned' : ''}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {library === 'saved' ? (
                    <button
                      type="button"
                      onClick={() => setEditing(assessment)}
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    >
                      Edit
                    </button>
                  ) : null}
                  {canAssign ? (
                    <button
                      type="button"
                      disabled={!selectedClass || Boolean(assigned)}
                      onClick={() =>
                        assignAssessment({
                          assessmentId: assessment.id,
                          classId: selectedClass.id,
                          delivery: 'self_paced',
                        })
                      }
                      className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-50`}
                    >
                      {assigned ? 'Assigned' : 'Assign'}
                    </button>
                  ) : null}
                  {canCopy ? (
                    <button
                      type="button"
                      onClick={() => {
                        copyAssessment(assessment, ownerId);
                        onCopied?.();
                      }}
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    >
                      Make a copy
                    </button>
                  ) : null}
                  {library === 'saved' && assigned ? (
                    <button
                      type="button"
                      onClick={onOpenStudent}
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    >
                      Student view
                    </button>
                  ) : null}
                  {library === 'saved' ? (
                    <button
                      type="button"
                      onClick={() => setAssessmentArchived(assessment.id, true)}
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    >
                      Archive
                    </button>
                  ) : null}
                  {library === 'archived' ? (
                    <button
                      type="button"
                      onClick={() => setAssessmentArchived(assessment.id, false)}
                      className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                    >
                      Restore
                    </button>
                  ) : null}
                </div>
              </AppBoard>
            );
          })}
        </ContentCardGrid>
      )}
    </AppPageShell>
  );
}
