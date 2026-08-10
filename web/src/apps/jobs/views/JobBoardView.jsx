import { useRef, useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
  APP_SCROLL_BOARD,
  appFabClass,
} from '../../../shared/layout';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { bestOnColor } from '../../../shared/colorContrast';
import { formatMoney } from '../jobsState';
import { useJobs } from '../JobsContext';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 1_200_000;

function emptyDraft() {
  return {
    id: `jb-${Date.now().toString(36)}`,
    title: '',
    description: '',
    pay: 5,
    images: [],
    at: Date.now(),
    status: 'open',
  };
}

function formatPostedAt(at) {
  if (!at) return '';
  try {
    return new Date(at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Jobs → Job Board — one-off classroom odd jobs with pay.
 */
export function JobBoardView({ isDarkMode, theme, isLeft, classLabel }) {
  const { boardPosts, saveBoardPost, deleteBoardPost } = useJobs();
  const [editor, setEditor] = useState(null); // null | { mode, post, error }
  const fileRef = useRef(null);

  const openCreate = () => {
    setEditor({ mode: 'create', post: emptyDraft(), error: '' });
  };

  const openEdit = (post) => {
    setEditor({
      mode: 'edit',
      post: {
        ...post,
        images: Array.isArray(post.images) ? [...post.images] : [],
      },
      error: '',
    });
  };

  const updatePost = (patch) => {
    setEditor((prev) =>
      prev ? { ...prev, post: { ...prev.post, ...patch }, error: '' } : prev,
    );
  };

  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !editor) return;
    const room = MAX_IMAGES - (editor.post.images?.length || 0);
    if (room <= 0) return;

    files.slice(0, room).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_BYTES) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        setEditor((prev) => {
          if (!prev) return prev;
          const images = [...(prev.post.images || []), reader.result].slice(
            0,
            MAX_IMAGES,
          );
          return { ...prev, post: { ...prev.post, images } };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setEditor((prev) => {
      if (!prev) return prev;
      const images = (prev.post.images || []).filter((_, i) => i !== index);
      return { ...prev, post: { ...prev.post, images } };
    });
  };

  const save = () => {
    if (!editor) return;
    const result = saveBoardPost({
      mode: editor.mode,
      post: editor.post,
    });
    if (!result.ok) {
      setEditor((prev) => (prev ? { ...prev, error: result.error } : prev));
      return;
    }
    setEditor(null);
  };

  const posts = boardPosts || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Job Board"
        description={classLabel || undefined}
        isDarkMode={isDarkMode}
      />

      {posts.length === 0 ? (
        <div
          className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No odd jobs posted yet. Tap + to add a title, description, pay, and
            optional photos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {posts.map((post) => {
            const payOn = bestOnColor(
              post.status === 'done' ? '#94a3b8' : '#10b981',
            );
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => openEdit(post)}
                className={`edu-control flex flex-col overflow-hidden text-left transition hover:-translate-y-0.5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                {post.images?.[0] ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <img
                      src={post.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className={`${APP_BOARD_PAD} flex flex-1 flex-col gap-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`min-w-0 flex-1 ${TYPE.titleMd} ${theme.colorOnSurface}`}
                    >
                      {post.title}
                    </p>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
                      style={{
                        backgroundColor:
                          post.status === 'done' ? '#94a3b8' : '#10b981',
                        color: payOn.hex,
                      }}
                    >
                      {formatMoney(post.pay)}
                    </span>
                  </div>
                  {post.description ? (
                    <p
                      className={`line-clamp-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                    >
                      {post.description}
                    </p>
                  ) : null}
                  <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                    {post.status === 'done' ? 'Done' : 'Open'}
                    {post.at ? ` · ${formatPostedAt(post.at)}` : ''}
                    {post.images?.length > 1
                      ? ` · ${post.images.length} photos`
                      : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={`${appFabClass(isLeft)} edu-control flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        onClick={openCreate}
        aria-label="Post odd job"
      >
        <Plus size={22} />
      </button>

      <Modal
        isOpen={Boolean(editor)}
        title={editor?.mode === 'edit' ? 'Edit odd job' : 'Post odd job'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setEditor(null)}
        maxWidth="max-w-lg"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            {editor?.mode === 'edit' ? (
              <button
                type="button"
                className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} text-rose-500`}
                onClick={() => {
                  deleteBoardPost(editor.post.id);
                  setEditor(null);
                }}
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <ModalPrimaryButton theme={theme} onClick={save}>
                {editor?.mode === 'edit' ? 'Save' : 'Post'}
              </ModalPrimaryButton>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {editor?.error ? (
            <p className={`${TYPE.bodySm} text-rose-500`}>{editor.error}</p>
          ) : null}

          <label className="block space-y-1.5">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Title
            </span>
            <input
              type="text"
              value={editor?.post.title || ''}
              onChange={(e) => updatePost({ title: e.target.value })}
              placeholder="e.g. Wipe whiteboard trays"
              maxLength={60}
              className={`edu-control w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Description
            </span>
            <textarea
              value={editor?.post.description || ''}
              onChange={(e) => updatePost({ description: e.target.value })}
              placeholder="What needs doing, and any tips for students…"
              rows={4}
              maxLength={500}
              className={`edu-control w-full resize-y rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Payment
            </span>
            <div className="relative max-w-[10rem]">
              <span
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}
              >
                $
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={editor?.post.pay ?? ''}
                onChange={(e) =>
                  updatePost({
                    pay: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                className={`edu-control w-full rounded-xl border-[1.5px] py-2.5 pl-7 pr-3 tabular-nums ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
              />
            </div>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Photos
              </span>
              <button
                type="button"
                className={`edu-control inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.text}`}
                onClick={() => fileRef.current?.click()}
                disabled={(editor?.post.images?.length || 0) >= MAX_IMAGES}
              >
                <ImagePlus size={16} />
                Add
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickImages}
              />
            </div>
            {(editor?.post.images?.length || 0) === 0 ? (
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Optional — up to {MAX_IMAGES} images.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {editor.post.images.map((url, index) => (
                  <div
                    key={`${index}-${url.slice(0, 24)}`}
                    className={`relative aspect-square overflow-hidden rounded-xl border-[1.5px] ${theme.colorOutline}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="edu-control absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white"
                      aria-label="Remove photo"
                      onClick={() => removeImage(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editor?.mode === 'edit' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="edu-control h-4 w-4 rounded border-slate-300"
                checked={editor.post.status === 'done'}
                onChange={(e) =>
                  updatePost({ status: e.target.checked ? 'done' : 'open' })
                }
              />
              <span className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                Mark as done
              </span>
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
