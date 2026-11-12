import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DETAILS_PAGE_ID,
  getAssessmentEditorPanel,
  setAssessmentEditorPanel,
  subscribeAssessmentEditorPanel,
} from '../../../data/tests/editorPanel';
import {
  assignAssessment,
  upsertAssessment,
} from '../../../data/tests/storage';
import {
  blankItem,
  defaultAssessment,
  newId,
  validateAssessment,
} from '../../../data/tests/model';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { testFieldClass } from '../fields';

function editorItem(item) {
  return {
    ...item,
    standardText: (item.standardIds || []).join(', '),
    choices: item.choices ? item.choices.map((choice) => ({ ...choice })) : undefined,
  };
}

function itemKind(type) {
  if (type === 'number') return 'Number';
  if (type === 'short_write') return 'Writing';
  return 'Choice';
}

/**
 * Page-by-page assessment authoring.
 * Question previews live in the shell SecondaryPanel beside the primary sidebar.
 */
export function AssessmentEditor({
  theme,
  isDarkMode,
  ownerId,
  classId,
  className,
  initial,
  onDone,
}) {
  const [draft, setDraft] = useState(() => {
    const base = initial || defaultAssessment(ownerId);
    return {
      ...base,
      ownerId,
      items: (base.items || []).map(editorItem),
    };
  });
  const [page, setPage] = useState(
    () => getAssessmentEditorPanel().page || DETAILS_PAGE_ID,
  );
  const [errors, setErrors] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  const itemIndex = draft.items.findIndex((item) => item.id === page);
  const onDetails = page === DETAILS_PAGE_ID;
  const activeItem = itemIndex >= 0 ? draft.items[itemIndex] : null;
  const onLastQuestion =
    !onDetails && itemIndex >= 0 && itemIndex >= draft.items.length - 1;

  // Attach / detach the shell secondary sidebar for this editor session.
  useEffect(() => {
    setAssessmentEditorPanel({
      open: true,
      title: draft.title,
      page,
      items: draft.items.map((item) => ({
        id: item.id,
        type: item.type,
        prompt: item.prompt,
      })),
    });
    return () => {
      setAssessmentEditorPanel({
        open: false,
        requestAdd: false,
        page: DETAILS_PAGE_ID,
        items: [],
        title: '',
      });
    };
    // Mount / unmount only — live updates below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAssessmentEditorPanel({
      title: draft.title,
      page,
      items: draft.items.map((item) => ({
        id: item.id,
        type: item.type,
        prompt: item.prompt,
      })),
    });
  }, [draft.title, draft.items, page]);

  useEffect(() => {
    return subscribeAssessmentEditorPanel((outline) => {
      if (outline.page && outline.page !== page) {
        setPage(outline.page);
      }
      if (outline.requestAdd) {
        setAddOpen(true);
        setAssessmentEditorPanel({ requestAdd: false });
      }
    });
  }, [page]);

  function patch(partial) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function patchItem(id, partial) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));
  }

  function addItem(type) {
    const next = editorItem(blankItem(type));
    setDraft((current) => ({ ...current, items: [...current.items, next] }));
    setPage(next.id);
    setAddOpen(false);
    setErrors([]);
  }

  function removeItem(id) {
    const idx = draft.items.findIndex((row) => row.id === id);
    const items = draft.items.filter((row) => row.id !== id);
    setDraft((current) => ({
      ...current,
      items: current.items.filter((row) => row.id !== id),
    }));
    if (page === id) {
      const fallback = items[Math.min(Math.max(0, idx), items.length - 1)];
      setPage(fallback ? fallback.id : DETAILS_PAGE_ID);
    }
  }

  function save(andAssign) {
    const { assessment, errors: nextErrors } = validateAssessment({ ...draft, ownerId });
    if (nextErrors.length) {
      setErrors(nextErrors);
      if (!String(draft.title || '').trim() || !String(draft.subject || '').trim()) {
        setPage(DETAILS_PAGE_ID);
      } else if (assessment.items?.[0]) {
        setPage(assessment.items[0].id);
      }
      return;
    }
    if (andAssign && !classId) {
      setErrors(['Choose a class in the sidebar before assigning.']);
      return;
    }
    const saved = upsertAssessment(assessment);
    if (andAssign) {
      assignAssessment({
        assessmentId: saved.id,
        classId,
        delivery: 'self_paced',
      });
    }
    onDone();
  }

  function goNext() {
    setErrors([]);
    if (onDetails) {
      if (draft.items[0]) setPage(draft.items[0].id);
      else setAddOpen(true);
      return;
    }
    if (itemIndex < 0) return;
    if (itemIndex < draft.items.length - 1) {
      setPage(draft.items[itemIndex + 1].id);
    }
  }

  function goBack() {
    setErrors([]);
    if (onDetails) {
      onDone();
      return;
    }
    if (itemIndex <= 0) {
      setPage(DETAILS_PAGE_ID);
      return;
    }
    setPage(draft.items[itemIndex - 1].id);
  }

  const primaryLabel = onDetails
    ? draft.items.length
      ? 'Next'
      : 'Add a question'
    : onLastQuestion
      ? className
        ? `Save and assign to ${className}`
        : 'Save and assign'
      : 'Next';

  return (
    <AppPageShell variant="stage" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <PageHeader
            title={initial ? 'Edit assessment' : 'Create Assessments'}
            description={
              onDetails
                ? 'Name it, pick the subject, then choose how it counts and how you score.'
                : `Question ${itemIndex + 1} of ${draft.items.length}`
            }
            isDarkMode={isDarkMode}
          />

          <AppBoard mode="scroll" theme={theme} className="mt-3 flex flex-col gap-4">
            {addOpen ? (
              <div className="flex flex-col gap-2">
                <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Add a question</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: 'choose_one', label: 'Choice' },
                    { type: 'number', label: 'Number' },
                    { type: 'short_write', label: 'Writing' },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => addItem(opt.type)}
                      className={`edu-control rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {onDetails ? (
              <DetailsPage
                theme={theme}
                isDarkMode={isDarkMode}
                draft={draft}
                onPatch={patch}
              />
            ) : activeItem ? (
              <QuestionCard
                theme={theme}
                index={itemIndex}
                item={activeItem}
                onChange={(partial) => patchItem(activeItem.id, partial)}
                onRemove={() => removeItem(activeItem.id)}
              />
            ) : (
              <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                Pick a question in the sidebar, or add one with +.
              </p>
            )}

            {errors.length ? (
              <ul className={`${TYPE.bodySm} ${theme.colorOnSurface}`}>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </AppBoard>
        </div>

        <div
          className={`flex shrink-0 flex-wrap items-center gap-2 border-t-[1.5px] px-4 py-3 md:px-6 ${theme.colorOutline}`}
        >
          <button
            type="button"
            onClick={goBack}
            className={`edu-control inline-flex items-center gap-1 rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          >
            <ChevronLeft size={18} aria-hidden />
            {onDetails ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            onClick={() => (onLastQuestion ? save(true) : goNext())}
            className={`edu-control inline-flex items-center gap-1 rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            {primaryLabel}
            {!onDetails && !onLastQuestion ? (
              <ChevronRight size={18} aria-hidden />
            ) : null}
          </button>
          {!onDetails ? (
            <button
              type="button"
              onClick={() => save(false)}
              className={`edu-control rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
            >
              Save
            </button>
          ) : null}
          {!onDetails && !onLastQuestion ? (
            <button
              type="button"
              onClick={() => save(true)}
              className={`edu-control rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
            >
              {className ? `Save and assign to ${className}` : 'Save and assign'}
            </button>
          ) : null}
        </div>
      </div>
    </AppPageShell>
  );
}

function DetailsPage({ theme, isDarkMode, draft, onPatch }) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span className={TYPE.labelMd}>Title</span>
        <input
          value={draft.title}
          onChange={(event) => onPatch({ title: event.target.value })}
          className={testFieldClass(theme)}
          placeholder="Addition check"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={TYPE.labelMd}>Subject</span>
        <input
          value={draft.subject}
          onChange={(event) => onPatch({ subject: event.target.value })}
          className={testFieldClass(theme)}
          placeholder="Math"
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className={TYPE.labelMd}>Purpose</span>
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={draft.purpose}
          onChange={(purpose) => onPatch({ purpose })}
          options={[
            { id: 'summative', label: 'Summative' },
            { id: 'formative', label: 'Formative' },
          ]}
        />
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Formative scores stay in the grade book and do not count toward the compiled subject
          grade.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className={TYPE.labelMd}>Score</span>
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={draft.scoreMode}
          onChange={(scoreMode) => onPatch({ scoreMode })}
          options={[
            { id: 'points', label: 'Points' },
            { id: 'proficiency', label: 'Proficiency' },
            { id: 'both', label: 'Both' },
          ]}
        />
      </div>
    </>
  );
}

function QuestionCard({ theme, index, item, onChange, onRemove }) {
  const kind = itemKind(item.type);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className={TYPE.titleSm}>
          {index + 1}. {kind}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
        >
          Remove
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className={TYPE.labelMd}>Prompt</span>
        <textarea
          value={item.prompt}
          onChange={(event) => onChange({ prompt: event.target.value })}
          rows={3}
          className={testFieldClass(theme)}
        />
      </label>
      <label className="flex max-w-[8rem] flex-col gap-1">
        <span className={TYPE.labelMd}>Points</span>
        <input
          type="number"
          min="0"
          step="1"
          value={item.points}
          onChange={(event) => onChange({ points: Number(event.target.value) })}
          className={testFieldClass(theme)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={TYPE.labelMd}>Standards</span>
        <input
          value={item.standardText || ''}
          onChange={(event) => onChange({ standardText: event.target.value })}
          className={testFieldClass(theme)}
          placeholder="RL.2, 3.OA.1"
        />
      </label>
      {item.type === 'choose_one' ? (
        <ChoiceFields theme={theme} item={item} onChange={onChange} />
      ) : null}
      {item.type === 'number' ? (
        <label className="flex flex-col gap-1">
          <span className={TYPE.labelMd}>Correct number</span>
          <input
            value={item.correctNumber || ''}
            onChange={(event) => onChange({ correctNumber: event.target.value })}
            className={testFieldClass(theme)}
            inputMode="decimal"
          />
        </label>
      ) : null}
      {item.type === 'short_write' ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Students write an answer. You score it in Grades.
        </p>
      ) : null}
    </div>
  );
}

function ChoiceFields({ theme, item, onChange }) {
  const choices = item.choices || [];
  function patchChoice(id, label) {
    onChange({
      choices: choices.map((choice) => (choice.id === id ? { ...choice, label } : choice)),
    });
  }
  return (
    <div className="flex flex-col gap-2">
      <span className={TYPE.labelMd}>Choices — mark the correct one</span>
      {choices.map((choice, index) => {
        const selected = item.correctChoiceId === choice.id;
        return (
          <div key={choice.id} className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ correctChoiceId: choice.id })}
              className={`edu-control shrink-0 rounded-xl px-3 py-2 ${TYPE.labelMd} ${
                selected
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : `border-[1.5px] ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
              }`}
            >
              {selected ? 'Correct' : 'Mark'}
            </button>
            <input
              value={choice.label}
              onChange={(event) => patchChoice(choice.id, event.target.value)}
              className={testFieldClass(theme)}
              placeholder={`Choice ${index + 1}`}
              aria-label={`Choice ${index + 1}`}
            />
          </div>
        );
      })}
      {choices.length < 4 ? (
        <button
          type="button"
          onClick={() =>
            onChange({
              choices: [...choices, { id: newId(), label: '' }],
            })
          }
          className={`edu-control self-start rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
        >
          Add a choice
        </button>
      ) : null}
    </div>
  );
}
