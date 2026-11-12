import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  DEFAULT_BODY_COUNT,
  GENRES,
  LENGTHS,
  clampBodyCount,
} from '../../../data/writingBuddy/constants';
import { CURRICULUM_PACKS } from '../../../data/writingBuddy/curriculumTemplates';
import {
  assignTemplateToClass,
  assignedTemplateIdForClass,
  customizeCurriculumTemplate,
  getTemplate,
  readTemplates,
  removeTemplate,
  upsertTemplate,
} from '../../../data/writingBuddy/storage';
import {
  blankSectionQuestions,
  countSectionQuestions,
  normalizeSectionQuestions,
  previewSectionQuestions,
  QUESTION_SECTIONS,
  sectionQuestionsForForm,
} from '../../../data/writingBuddy/sectionQuestions';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';

function blankForm() {
  return {
    id: '',
    name: '',
    questions: blankSectionQuestions(),
    genre: '',
    length: 'essay',
    bodyCount: DEFAULT_BODY_COUNT,
    curriculumId: '',
  };
}

const VIEW_OPTIONS = [
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'mine', label: 'My templates' },
];

/**
 * Teacher CRUD for writing templates + curriculum packs + class assignment.
 */
export function TemplatesView({
  theme,
  isDarkMode,
  classId = '',
  selectedClassName = '',
}) {
  const [templates, setTemplates] = useState(() => readTemplates());
  const [assignedId, setAssignedId] = useState(() =>
    assignedTemplateIdForClass(classId),
  );
  const [form, setForm] = useState(null);
  const [view, setView] = useState('curriculum');

  useEffect(() => {
    setAssignedId(assignedTemplateIdForClass(classId));
  }, [classId]);

  function refresh() {
    setTemplates(readTemplates());
    setAssignedId(assignedTemplateIdForClass(classId));
  }

  function openNew() {
    setForm(blankForm());
    setView('mine');
  }

  function openEdit(template) {
    if (template.builtIn) {
      const copy = customizeCurriculumTemplate(template.id);
      if (!copy) return;
      refresh();
      setView('mine');
      setForm({
        id: copy.id,
        name: copy.name,
        questions: sectionQuestionsForForm(copy.questions),
        genre: copy.genre || '',
        length: copy.length || 'essay',
        bodyCount: copy.bodyCount || DEFAULT_BODY_COUNT,
        curriculumId: copy.curriculumId || '',
      });
      return;
    }
    setForm({
      id: template.id,
      name: template.name,
      questions: sectionQuestionsForForm(template.questions),
      genre: template.genre || '',
      length: template.length || 'essay',
      bodyCount: template.bodyCount || DEFAULT_BODY_COUNT,
      curriculumId: template.curriculumId || '',
    });
    setView('mine');
  }

  function saveForm() {
    const questions = normalizeSectionQuestions(form.questions);
    if (!String(form.name || '').trim()) return;
    if (countSectionQuestions(questions) === 0) return;
    const pack = CURRICULUM_PACKS.find((p) => p.id === form.curriculumId);
    upsertTemplate({
      id: form.id || undefined,
      name: form.name,
      questions,
      genre: form.genre || null,
      length: form.length || null,
      bodyCount: clampBodyCount(form.bodyCount),
      curriculumId: form.curriculumId || null,
      curriculumName: pack?.name || null,
    });
    setForm(null);
    refresh();
  }

  function onDelete(id) {
    removeTemplate(id);
    if (form?.id === id) setForm(null);
    refresh();
  }

  function onAssign(templateId) {
    if (!classId) return;
    const next = assignedId === templateId ? '' : templateId;
    assignTemplateToClass(classId, next);
    setAssignedId(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {!form ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <SegmentControl
              theme={theme}
              isDarkMode={isDarkMode}
              value={view}
              onChange={setView}
              options={VIEW_OPTIONS}
            />
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {classId
                ? `Assign one template to ${selectedClassName || 'this class'} — students can still pick any buddy.`
                : 'Choose a class to assign a template for Student View.'}
            </p>
          </div>
          <button
            type="button"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={openNew}
          >
            New template
          </button>
        </div>
      ) : null}

      {form ? (
        <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0">
          <TemplateForm
            theme={theme}
            form={form}
            setForm={setForm}
            onSave={saveForm}
            onCancel={() => setForm(null)}
          />
        </AppBoard>
      ) : null}

      {!form && view === 'curriculum' ? (
        <div className="space-y-6">
          {CURRICULUM_PACKS.map((pack) => (
            <section key={pack.id} className="space-y-3">
              <div>
                <h3 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {pack.name}
                </h3>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {pack.blurb}
                </p>
              </div>
              <ContentCardGrid>
                {pack.templates.map((def) => {
                  const t = getTemplate(def.id);
                  if (!t) return null;
                  return (
                    <TemplateCard
                      key={t.id}
                      theme={theme}
                      template={t}
                      assignedId={assignedId}
                      classId={classId}
                      onAssign={onAssign}
                      onEdit={openEdit}
                      builtIn
                    />
                  );
                })}
              </ContentCardGrid>
            </section>
          ))}
        </div>
      ) : null}

      {!form && view === 'mine' ? (
        !templates.length ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message="No custom templates yet. Create one, or customize a curriculum template."
            illustration={<FileText size={36} className="text-slate-400" />}
          />
        ) : (
          <ContentCardGrid>
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                theme={theme}
                template={t}
                assignedId={assignedId}
                classId={classId}
                onAssign={onAssign}
                onEdit={openEdit}
                onDelete={onDelete}
              />
            ))}
          </ContentCardGrid>
        )
      ) : null}
    </div>
  );
}

function TemplateCard({
  theme,
  template: t,
  assignedId,
  classId,
  onAssign,
  onEdit,
  onDelete,
  builtIn = false,
}) {
  const preview = previewSectionQuestions(t.questions);
  const isAssigned = assignedId === t.id;

  return (
    <AppBoard mode="grid" pad="board" theme={theme}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{t.name}</p>
            {t.curriculumName ? (
              <p className={`${TYPE.labelSm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                {t.curriculumName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {builtIn ? (
              <span
                className={`rounded-lg border-[1.5px] px-2 py-0.5 ${TYPE.labelSm} ${theme.colorSurface} ${theme.colorOnSurfaceVariant} ${theme.colorOutline}`}
              >
                Built-in
              </span>
            ) : null}
            {isAssigned ? (
              <span
                className={`rounded-lg px-2 py-0.5 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Assigned
              </span>
            ) : null}
          </div>
        </div>
        {t.blurb ? (
          <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
            {t.blurb}
          </p>
        ) : null}
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
          {preview.total} question{preview.total === 1 ? '' : 's'}
          {t.genre ? ` · ${t.genre}` : ''}
          {t.length ? ` · ${t.length}` : ''}
          {t.length === 'essay' || !t.length ? ` · ${t.bodyCount} body` : ''}
        </p>
        <ul className={`mt-2 space-y-1 ${TYPE.bodySm} ${theme.colorOnSurface}`}>
          {preview.items.map((item, i) => (
            <li key={i}>
              <span className={theme.colorOnSurfaceVariant}>{item.section}: </span>
              {item.q}
            </li>
          ))}
          {preview.more > 0 ? (
            <li className={theme.colorOnSurfaceVariant}>+{preview.more} more</li>
          ) : null}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
            onClick={() => onEdit(t)}
          >
            {builtIn ? 'Customize' : 'Edit'}
          </button>
          <button
            type="button"
            disabled={!classId}
            className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} disabled:opacity-40 ${
              isAssigned
                ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
            }`}
            onClick={() => onAssign(t.id)}
          >
            {isAssigned ? 'Unassign' : 'Assign to class'}
          </button>
          {!builtIn && onDelete ? (
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
              onClick={() => onDelete(t.id)}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </AppBoard>
  );
}

function TemplateForm({ theme, form, setForm, onSave, onCancel }) {
  function sectionList(sectionId) {
    return Array.isArray(form.questions?.[sectionId])
      ? form.questions[sectionId]
      : [''];
  }

  function setSectionQuestions(sectionId, nextList) {
    setForm({
      ...form,
      questions: {
        ...form.questions,
        [sectionId]: nextList.length ? nextList : [''],
      },
    });
  }

  function setQuestion(sectionId, i, value) {
    const list = [...sectionList(sectionId)];
    list[i] = value;
    setSectionQuestions(sectionId, list);
  }

  function addQuestion(sectionId) {
    setSectionQuestions(sectionId, [...sectionList(sectionId), '']);
  }

  function removeQuestion(sectionId, i) {
    setSectionQuestions(
      sectionId,
      sectionList(sectionId).filter((_, idx) => idx !== i),
    );
  }

  function move(sectionId, i, dir) {
    const list = [...sectionList(sectionId)];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
    setSectionQuestions(sectionId, list);
  }

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <div className="space-y-5">
      <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
        {form.id ? 'Edit template' : 'New template'}
      </h2>

      <label className="block max-w-md space-y-1.5">
        <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Name</span>
        <input
          className={fieldClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Opinion essay"
        />
      </label>

      <label className="block max-w-md space-y-1.5">
        <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
          Curriculum{' '}
          <span className={`font-normal ${theme.colorOnSurfaceVariant}`}>
            (optional)
          </span>
        </span>
        <select
          className={fieldClass}
          value={form.curriculumId || ''}
          onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}
        >
          <option value="">None</option>
          {CURRICULUM_PACKS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Genre{' '}
            <span className={`font-normal ${theme.colorOnSurfaceVariant}`}>
              (optional)
            </span>
          </span>
          <select
            className={fieldClass}
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          >
            <option value="">Student chooses</option>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Length</span>
          <select
            className={fieldClass}
            value={form.length}
            onChange={(e) => setForm({ ...form, length: e.target.value })}
          >
            {LENGTHS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Body paragraphs
          </span>
          <select
            className={fieldClass}
            value={form.bodyCount}
            onChange={(e) =>
              setForm({ ...form, bodyCount: clampBodyCount(e.target.value) })
            }
            disabled={form.length && form.length !== 'essay'}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Questions by section
          </p>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Works with any buddy. Use {'{topic}'} for the student topic. Body
            questions repeat for each body paragraph.
          </p>
        </div>
        {QUESTION_SECTIONS.map((section) => {
          const list = sectionList(section.id);
          return (
            <div
              key={section.id}
              className={`space-y-2 rounded-2xl border-[1.5px] p-3 sm:p-4 ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline}`}
            >
              <div>
                <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
                  {section.label}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {section.hint}
                </p>
              </div>
              <div className="space-y-2">
                {list.map((q, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span
                      className={`${TYPE.labelMd} w-6 shrink-0 tabular-nums ${theme.colorOnSurfaceVariant}`}
                    >
                      {i + 1}.
                    </span>
                    <input
                      className={`min-w-[12rem] flex-1 ${fieldClass}`}
                      value={q}
                      onChange={(e) => setQuestion(section.id, i, e.target.value)}
                      placeholder={
                        section.id === 'intro'
                          ? 'e.g. What is your big idea about {topic}?'
                          : section.id === 'body'
                            ? 'e.g. What is one reason about {topic}?'
                            : 'e.g. How will you wrap up {topic}?'
                      }
                    />
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] px-2.5 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline} disabled:opacity-40`}
                      onClick={() => move(section.id, i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] px-2.5 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline} disabled:opacity-40`}
                      onClick={() => move(section.id, i, 1)}
                      disabled={i === list.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] px-2.5 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                      onClick={() => removeQuestion(section.id, i)}
                      aria-label="Remove question"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                onClick={() => addQuestion(section.id)}
              >
                Add {section.label.toLowerCase()} question
              </button>
            </div>
          );
        })}
      </div>

      <div
        className={`flex flex-wrap gap-2 border-t-[1.5px] pt-4 ${theme.colorOutline}`}
      >
        <button
          type="button"
          className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={onSave}
        >
          Save template
        </button>
      </div>
    </div>
  );
}
