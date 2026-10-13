import { useEffect, useRef, useState } from 'react';
import { Cloud, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { docPreviewBlocksFromDoc } from '../../../data/docs/docPreview';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

/**
 * Google Docs–style letter preview thumbnail for a local doc.
 */
export function DocThumbnailCard({
  doc,
  theme,
  isDarkMode,
  onOpen,
  onTrash,
  onEdit,
  openLabel,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const previewBlocks = docPreviewBlocksFromDoc(doc, {
    maxText: 220,
    maxImages: 3,
  });

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <article
      className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden flex flex-col`}
    >
      <div
        className={`relative aspect-[8.5/11] w-full overflow-hidden ${
          isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
        }`}
      >
        <button
          type="button"
          className="edu-control absolute inset-0 z-0"
          onClick={() => onOpen(doc.id)}
          aria-label={openLabel || `Open ${doc.title}`}
        />
        <div
          className="pointer-events-none absolute inset-[8%] bg-white text-slate-800 shadow-sm border border-slate-200/80 overflow-hidden"
          aria-hidden
        >
          <div className="h-full w-full p-[8%] text-[7px] leading-[1.35] sm:text-[8px] origin-top-left space-y-[0.35em] overflow-hidden">
            <p className="font-semibold text-[1.15em] truncate text-slate-900">
              {doc.title}
            </p>
            {previewBlocks.length ? (
              previewBlocks.map((block, i) =>
                block.type === 'image' ? (
                  <img
                    key={`img-${i}`}
                    src={block.src}
                    alt=""
                    className="block w-full max-h-[4.5em] object-cover rounded-[0.2em] border border-slate-200/80 bg-slate-50"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <p
                    key={`txt-${i}`}
                    className="whitespace-pre-wrap break-words text-slate-600 line-clamp-6"
                  >
                    {block.text}
                  </p>
                ),
              )
            ) : (
              <p className="text-slate-400 italic">Empty document</p>
            )}
          </div>
        </div>

        {onTrash ? (
          <div
            ref={menuRef}
            className="absolute top-2 right-2 z-20"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`edu-control rounded-lg p-1.5 ${
                isDarkMode
                  ? 'bg-slate-900/80 text-slate-200 hover:bg-slate-900'
                  : 'bg-white/90 text-slate-600 hover:bg-white shadow-sm border border-slate-200'
              }`}
              aria-label={`More actions for ${doc.title}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="More actions"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreVertical size={16} strokeWidth={2.5} />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                aria-label={`${doc.title} actions`}
                className={`absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border-[1.5px] p-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
              >
                {onEdit ? (
                  <button
                    type="button"
                    role="menuitem"
                    className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface}`}
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(doc.id);
                    }}
                  >
                    <Pencil size={14} strokeWidth={2.5} className="shrink-0" />
                    Edit template
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onTrash(doc.id);
                  }}
                >
                  <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
                  Trash
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="edu-control border-t border-inherit p-3 space-y-1 text-left"
        onClick={() => onOpen(doc.id)}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}>
          {doc.title}
        </p>
        {doc.cloud?.fileId ? (
          <p
            className={`${TYPE.labelMicro} flex items-center gap-1 ${theme.colorOnSurfaceVariant}`}
          >
            <Cloud className="w-3 h-3" aria-hidden />
            {doc.cloud.provider === 'onedrive' ? 'OneDrive' : 'Drive'}
          </p>
        ) : null}
      </button>
    </article>
  );
}

export { formatWhen };
