import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Landmark, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
  appFabClass,
} from '../../../shared/layout';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import {
  EMOJI_LIBRARY,
  searchEmojiAvatars,
} from '../../../data/classes/avatar';
import {
  MAX_HOWTO_IMAGE_BYTES,
  MAX_HOWTO_PAGES,
  createHowToPage,
  formatMoney,
} from '../jobsState';
import { useJobs } from '../JobsContext';
import { StudentMultiSelect } from '../components/StudentMultiSelect';
import { JobsKeypad, applyKeypadKey } from '../components/JobsKeypad';

function CategoryChip({ label, active, onClick, theme, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`edu-control rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active
          ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
          : isDarkMode
            ? 'border-slate-600 text-slate-400 hover:bg-slate-800'
            : 'border-slate-300 text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Classroom jobs board — salaries, assign, create/edit + Bank payday sync.
 */
export function JobsBoardView({ roster, isDarkMode, theme, isLeft }) {
  const {
    jobs,
    assignments,
    holdersFor,
    saveJob,
    deleteJob,
    assignJob,
    syncToBank,
    setSyncToBank,
  } = useJobs();
  const [manage, setManage] = useState(null);
  const [assign, setAssign] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeField, setActiveField] = useState('salary');
  const [emojiQuery, setEmojiQuery] = useState('');
  const [emojiCategory, setEmojiCategory] = useState(
    () => EMOJI_LIBRARY[0]?.id || 'faces',
  );

  useEffect(() => {
    if (!manage) return;
    setShowKeypad(false);
    setActiveField('salary');
    setEmojiQuery('');
    setEmojiCategory(EMOJI_LIBRARY[0]?.id || 'faces');
  }, [manage?.job?.id, manage?.mode]);

  const emojiCategories = useMemo(
    () => searchEmojiAvatars(emojiQuery),
    [emojiQuery],
  );
  const pageEmojis = useMemo(() => {
    if (emojiQuery.trim()) {
      return emojiCategories.flatMap((cat) =>
        cat.emojis.map((item) => ({ ...item, catId: cat.id })),
      );
    }
    const cat =
      emojiCategories.find((c) => c.id === emojiCategory) || emojiCategories[0];
    return (cat?.emojis || []).map((item) => ({
      ...item,
      catId: cat.id,
    }));
  }, [emojiCategories, emojiCategory, emojiQuery]);

  const inputClass = (field) =>
    `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none transition-shadow ${
      activeField === field && showKeypad ? `ring-2 ${theme.ring}` : ''
    } ${
      isDarkMode
        ? 'bg-slate-900 border-slate-600 text-slate-100'
        : 'bg-white border-slate-300 text-slate-900'
    }`;

  const openCreate = () => {
    setManage({
      mode: 'create',
      job: {
        id: `j-${Date.now()}`,
        title: '',
        description: '',
        salary: 10,
        icon: '💼',
        howToPages: [],
      },
      oldTitle: '',
      error: '',
    });
  };

  const openEdit = (job) => {
    setManage({
      mode: 'edit',
      job: {
        ...job,
        description: job.description || '',
        howToPages: Array.isArray(job.howToPages)
          ? job.howToPages.map((p) => ({ ...p }))
          : [],
      },
      oldTitle: job.title,
      error: '',
    });
  };

  const patchHowToPage = (pageId, patch) => {
    setManage((prev) => {
      if (!prev) return prev;
      const howToPages = (prev.job.howToPages || []).map((p) =>
        p.id === pageId ? { ...p, ...patch } : p,
      );
      return { ...prev, job: { ...prev.job, howToPages } };
    });
  };

  const addHowToPage = () => {
    setManage((prev) => {
      if (!prev) return prev;
      const pages = prev.job.howToPages || [];
      if (pages.length >= MAX_HOWTO_PAGES) return prev;
      return {
        ...prev,
        job: { ...prev.job, howToPages: [...pages, createHowToPage()] },
      };
    });
  };

  const removeHowToPage = (pageId) => {
    setManage((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        job: {
          ...prev.job,
          howToPages: (prev.job.howToPages || []).filter((p) => p.id !== pageId),
        },
      };
    });
  };

  const onHowToImage = (pageId, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_HOWTO_IMAGE_BYTES) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      patchHowToPage(pageId, { image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const openAssign = (job) => {
    const selectedIds = Object.entries(assignments)
      .filter(([, a]) => a.job === job.title)
      .map(([id]) => id);
    setAssign({ job, selectedIds });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Job Assignments"
        description="Classroom roles and weekly salaries."
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div
          className={`inline-flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              syncToBank
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : theme.colorSurfaceVariant
            }`}
          >
            <Landmark size={12} />
          </span>
          <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Sync to Bank
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={syncToBank}
            aria-label="Sync job salaries to Bank for payday"
            onClick={() => setSyncToBank(!syncToBank)}
            className={`edu-control relative h-[22px] w-10 rounded-full transition-colors ${
              syncToBank
                ? theme.colorPrimary
                : isDarkMode
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                syncToBank ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden>
                {job.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  {job.title}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {formatMoney(job.salary)} · {holdersFor(job.title)} assigned
                  {(job.howToPages?.length || 0) > 0
                    ? ` · ${job.howToPages.length} how-to step${
                        job.howToPages.length === 1 ? '' : 's'
                      }`
                    : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                onClick={() => openAssign(job)}
              >
                Assign
              </button>
              <button
                type="button"
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
                onClick={() => openEdit(job)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${appFabClass(isLeft)} edu-control flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        onClick={openCreate}
        aria-label="New job"
      >
        <Plus size={22} />
      </button>

      <Modal
        isOpen={Boolean(manage)}
        title={manage?.mode === 'create' ? 'New job' : 'Edit job'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setManage(null)}
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKeypad((v) => !v)}
                className={`edu-control px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center ${
                  showKeypad
                    ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
                }`}
                title="Toggle on-screen keypad"
                aria-label="Toggle on-screen keypad"
                aria-pressed={showKeypad}
              >
                <Keyboard size={20} />
              </button>
              {manage?.mode === 'edit' ? (
                <button
                  type="button"
                  className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} text-rose-500`}
                  onClick={() => {
                    deleteJob(manage);
                    setManage(null);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
                onClick={() => setManage(null)}
              >
                Cancel
              </button>
              <ModalPrimaryButton
                theme={theme}
                onClick={() => {
                  const result = saveJob(manage);
                  if (!result.ok) {
                    setManage((prev) =>
                      prev ? { ...prev, error: result.error } : prev,
                    );
                    return;
                  }
                  setManage(null);
                }}
              >
                Save
              </ModalPrimaryButton>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Title
            </span>
            <input
              type="text"
              className={inputClass('title')}
              value={manage?.job.title || ''}
              onFocus={() => setActiveField('title')}
              onChange={(e) =>
                setManage((prev) =>
                  prev
                    ? { ...prev, job: { ...prev.job, title: e.target.value } }
                    : prev,
                )
              }
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Description
            </span>
            <textarea
              rows={3}
              className={`${inputClass('description')} resize-y`}
              value={manage?.job.description || ''}
              placeholder="What this job is responsible for"
              onFocus={() => setActiveField('description')}
              onChange={(e) =>
                setManage((prev) =>
                  prev
                    ? {
                        ...prev,
                        job: { ...prev.job, description: e.target.value },
                      }
                    : prev,
                )
              }
            />
          </label>
          <label className="block space-y-1">
            <span
              className={`${TYPE.labelMd} ${
                activeField === 'salary' && showKeypad
                  ? theme.text
                  : theme.colorOnSurfaceVariant
              }`}
            >
              Salary
            </span>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass('salary')}
              value={manage?.job.salary ?? ''}
              onFocus={() => setActiveField('salary')}
              onChange={(e) =>
                setManage((prev) =>
                  prev
                    ? {
                        ...prev,
                        job: {
                          ...prev.job,
                          salary: e.target.value.replace(/\D/g, '').slice(0, 6),
                        },
                      }
                    : prev,
                )
              }
            />
          </label>
          <div className="space-y-3">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Icon
            </p>
            <div
              className={`flex h-10 items-center overflow-hidden rounded-xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
              <input
                type="search"
                value={emojiQuery}
                onChange={(e) => setEmojiQuery(e.target.value)}
                placeholder="Search emoji library…"
                className={`h-full flex-1 bg-transparent px-2 outline-none ${TYPE.bodySm} ${theme.colorOnSurface} placeholder:text-slate-400`}
              />
              {emojiQuery ? (
                <button
                  type="button"
                  className="edu-control p-2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                  onClick={() => setEmojiQuery('')}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {!emojiQuery.trim() ? (
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_LIBRARY.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.label}
                    active={emojiCategory === cat.id}
                    onClick={() => setEmojiCategory(cat.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
              {pageEmojis.length === 0 ? (
                <p
                  className={`col-span-full py-8 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                >
                  No emojis match your search.
                </p>
              ) : (
                pageEmojis.map((item) => {
                  const emoji = item.emoji;
                  const on = manage?.job.icon === emoji;
                  return (
                    <button
                      key={`${item.catId}-${emoji}`}
                      type="button"
                      title={item.keywords.split(' ').slice(0, 3).join(', ')}
                      aria-label={`Choose ${item.keywords.split(' ')[0] || emoji}`}
                      aria-pressed={on}
                      onClick={() =>
                        setManage((prev) =>
                          prev
                            ? { ...prev, job: { ...prev.job, icon: emoji } }
                            : prev,
                        )
                      }
                      className={`edu-control flex aspect-square items-center justify-center rounded-xl text-xl transition-colors sm:text-2xl ${
                        on
                          ? `${theme.colorPrimaryContainer} ring-2 ring-inset ${theme.ring}`
                          : isDarkMode
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                  How-to steps
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  Kids tap their Dashboard card to see these pages.
                </p>
              </div>
              <button
                type="button"
                className={`edu-control shrink-0 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface} disabled:opacity-40`}
                onClick={addHowToPage}
                disabled={(manage?.job.howToPages?.length || 0) >= MAX_HOWTO_PAGES}
              >
                <Plus size={14} className="mr-1 inline" />
                Add step
              </button>
            </div>
            {(manage?.job.howToPages || []).length === 0 ? (
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                No steps yet — add a title, directions, and optional photo for
                each step.
              </p>
            ) : (
              <div className="space-y-3">
                {(manage.job.howToPages || []).map((page, index) => (
                  <div
                    key={page.id}
                    className={`space-y-2 rounded-2xl border-[1.5px] p-3 ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      >
                        Step {index + 1}
                      </p>
                      <button
                        type="button"
                        className="edu-control rounded-lg p-1.5 text-rose-500"
                        aria-label={`Remove step ${index + 1}`}
                        onClick={() => removeHowToPage(page.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Step title"
                      value={page.title || ''}
                      onChange={(e) =>
                        patchHowToPage(page.id, { title: e.target.value })
                      }
                      className={`edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                    />
                    <textarea
                      rows={3}
                      placeholder="Directions for this step"
                      value={page.body || ''}
                      onChange={(e) =>
                        patchHowToPage(page.id, { body: e.target.value })
                      }
                      className={`edu-control w-full resize-y rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                    />
                    {page.image ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={page.image}
                          alt=""
                          className="aspect-[16/10] w-full object-cover"
                        />
                        <button
                          type="button"
                          className="edu-control absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white"
                          aria-label="Remove photo"
                          onClick={() => patchHowToPage(page.id, { image: '' })}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`edu-control flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed px-3 py-3 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
                      >
                        <Upload size={16} />
                        Add photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onHowToImage(page.id, e)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {showKeypad && activeField === 'salary' ? (
            <JobsKeypad
              theme={theme}
              isDarkMode={isDarkMode}
              onKey={(key) =>
                setManage((prev) => {
                  if (!prev) return prev;
                  const next = applyKeypadKey(String(prev.job.salary ?? ''), key, {
                    maxLength: 6,
                    stripLeadingZeros: true,
                  });
                  return {
                    ...prev,
                    job: { ...prev.job, salary: next === '' ? '' : next },
                  };
                })
              }
            />
          ) : null}
          {manage?.error ? (
            <p className={`${TYPE.bodySm} text-rose-500`}>{manage.error}</p>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(assign)}
        title={assign ? `Assign: ${assign.job.title}` : 'Assign'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setAssign(null)}
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
              onClick={() => setAssign(null)}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              onClick={() => {
                if (!assign?.job) return;
                assignJob({
                  job: assign.job,
                  studentIds: assign.selectedIds || [],
                });
                setAssign(null);
              }}
            >
              Save assignments
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-6">
          <StudentMultiSelect
            roster={roster}
            selectedIds={assign?.selectedIds || []}
            onChange={(ids) =>
              setAssign((prev) => (prev ? { ...prev, selectedIds: ids } : prev))
            }
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </Modal>
    </div>
  );
}
