import { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  addResourceFromUrl,
  removeResource,
} from '../../../data/resources/resourceStorage';

/**
 * Paste curriculum / Drive / OneDrive URLs into the class library.
 */
export function ResourcesView({
  theme,
  isDarkMode,
  classId,
  resources,
  refresh,
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const onAdd = () => {
    setError('');
    if (!url.trim()) {
      setError('Paste a link first.');
      return;
    }
    try {
      const before = resources.length;
      const list = addResourceFromUrl(classId, url, {
        title: title.trim() || undefined,
      });
      if (list.length === before && !list.some((r) => r.url.includes(url.trim()))) {
        setError('Could not parse that link.');
        return;
      }
      setUrl('');
      setTitle('');
      refresh();
    } catch (e) {
      setError(e?.message || 'Could not add that link.');
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Add a link
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          We store the URL only — not the file. Works with Drive, OneDrive, and
          any curriculum site.
        </p>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            URL
          </span>
          <input
            className={fieldClass}
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Title (optional)
          </span>
          <input
            className={fieldClass}
            placeholder="Day 23 Math slides"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {error ? (
          <p className={`${TYPE.bodySm} text-red-600`}>{error}</p>
        ) : null}
        <button type="button" className={`edu-control ${toolBtn}`} onClick={onAdd}>
          Add to library
        </button>
      </div>

      <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
        Library ({resources.length})
      </p>
      {!resources.length ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          No links yet. Paste a URL above or use Cloud pick to search Drive /
          OneDrive.
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => (
            <li
              key={r.id}
              className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 flex items-center justify-between gap-3`}
            >
              <div className="min-w-0">
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}>
                  {r.title}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant} truncate`}>
                  {r.source} · {r.url}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`edu-control ${toolBtn}`}
                  aria-label="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  className={`edu-control ${toolBtn}`}
                  aria-label="Remove"
                  onClick={() => {
                    removeResource(classId, r.id);
                    refresh();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
