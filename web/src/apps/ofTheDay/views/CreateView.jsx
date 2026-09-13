import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  addTeacherItem,
  deleteTeacherItem,
  readTeacherItems,
  setTeacherItemVisibility,
} from '../../../data/ofTheDay/storage';
import { OF_THE_DAY_META, OF_THE_DAY_TYPES } from '../../../data/ofTheDay/types';

const AUTHOR_TYPES = OF_THE_DAY_TYPES.filter((t) => t !== 'word');

/**
 * Teacher-authored catalog items (not Word — Dictionary owns that bank).
 */
export function CreateView({ theme, isDarkMode }) {
  const [custom, setCustom] = useState(() => readTeacherItems());
  const [type, setType] = useState('joke');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [listenUrl, setListenUrl] = useState('');
  const [listPublic, setListPublic] = useState(false);
  const [note, setNote] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  const refresh = () => setCustom(readTeacherItems());

  useEffect(() => {
    refresh();
  }, []);

  const addCustom = (e) => {
    e.preventDefault();
    const item = addTeacherItem({
      type,
      title,
      body,
      listenUrl,
      visibility: listPublic ? 'public' : 'private',
    });
    if (!item) return;
    setTitle('');
    setBody('');
    setListenUrl('');
    setListPublic(false);
    refresh();
    setNote(`Added “${item.title}” to the ${OF_THE_DAY_META[type]?.label || type} bank.`);
  };

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <AppPageShell variant="page">
      <PageHeader
        title="Create"
        description="Add your own jokes, art notes, animals, quotes, facts, and songs. They join the daily bank and can be listed in Community."
        isDarkMode={isDarkMode}
      />

      {note ? (
        <p className={`${TYPE.bodySm} mb-4 ${theme.colorOnSurfaceVariant}`}>{note}</p>
      ) : null}

      <form
        onSubmit={addCustom}
        className={`flex flex-col gap-3 p-4 max-w-xl ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Type</span>
          <select
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {AUTHOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {OF_THE_DAY_META[t].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Title</span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Body</span>
          <textarea
            className={`${fieldClass} min-h-[5rem]`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        {type === 'song' ? (
          <label className="flex flex-col gap-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Listen link (YouTube)
            </span>
            <input
              className={fieldClass}
              value={listenUrl}
              onChange={(e) => setListenUrl(e.target.value)}
              placeholder="https://www.youtube.com/…"
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="edu-control size-4 rounded border-[1.5px]"
            checked={listPublic}
            onChange={(e) => setListPublic(e.target.checked)}
          />
          <span className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>List in Community</span>
        </label>
        <button type="submit" className={`${toolBtn} self-start`}>
          <Plus size={16} strokeWidth={2.5} />
          Add to bank
        </button>
      </form>

      {custom.length ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 max-w-3xl">
          {custom.map((item) => (
            <li
              key={item.id}
              className={`flex items-start justify-between gap-3 p-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <div className="min-w-0">
                <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                  {OF_THE_DAY_META[item.type]?.label || item.type}
                  {item.visibility === 'public' ? ' · Community' : ''}
                </p>
                <p className={`${TYPE.labelLg} mt-1 ${theme.colorOnSurface}`}>{item.title}</p>
                <p className={`${TYPE.bodySm} mt-1 line-clamp-3 ${theme.colorOnSurfaceVariant}`}>
                  {item.body}
                </p>
                <button
                  type="button"
                  className={`${toolBtn} mt-3`}
                  onClick={() => {
                    setTeacherItemVisibility(
                      item.id,
                      item.visibility === 'public' ? 'private' : 'public',
                    );
                    refresh();
                  }}
                >
                  {item.visibility === 'public' ? 'Unlist' : 'List in Community'}
                </button>
              </div>
              <button
                type="button"
                className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant}`}
                title="Delete item"
                aria-label={`Delete ${item.title}`}
                onClick={() => {
                  deleteTeacherItem(item.id);
                  refresh();
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 max-w-xl">
          <EmptyState
            isDarkMode={isDarkMode}
            message="Nothing of yours in the bank yet. Add a joke, quote, or song above."
          />
        </div>
      )}
    </AppPageShell>
  );
}
