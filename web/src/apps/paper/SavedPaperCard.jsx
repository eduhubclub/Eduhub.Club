import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { APP_BOARD_PAD, APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { FitPopout } from '../../shared/usePopoutFit';
import { buildPaperSheet } from '../../data/paper/paperGeometry';
import { PAPER_TYPES, paperSizeById } from '../../data/paper/paperModel';
import { PaperSheet } from './PaperSheet';

function typeLabel(id) {
  return PAPER_TYPES.find((t) => t.id === id)?.label || id;
}

/**
 * Saved paper preset card — preview + click-to-load, ⋮ Edit / Delete.
 */
export function SavedPaperCard({
  preset,
  theme,
  isDarkMode,
  onLoad,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const sheet = useMemo(
    () => buildPaperSheet(preset.settings),
    [preset.settings],
  );
  const landscape = preset.settings.orientation === 'landscape';
  const pageSize = paperSizeById(preset.settings.pageSize);
  const aspectW = landscape ? pageSize.heightIn : pageSize.widthIn;
  const aspectH = landscape ? pageSize.widthIn : pageSize.heightIn;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const menuItemClass = (danger = false) =>
    `edu-control w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${TYPE.labelLg} transition-colors ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
        : isDarkMode
          ? 'text-slate-200 hover:bg-slate-800'
          : 'text-slate-700 hover:bg-slate-100'
    }`;

  const orientationLabel = landscape ? 'Horizontal' : 'Vertical';

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onLoad?.(preset)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLoad?.(preset);
          }
        }}
        className={`relative flex gap-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div
          className={`shrink-0 overflow-hidden rounded-md border-[1.5px] bg-white ${theme.colorOutline}`}
          style={{
            aspectRatio: `${aspectW} / ${aspectH}`,
            height: '4.75rem',
            width: 'auto',
          }}
          aria-hidden
        >
          <PaperSheet sheet={sheet} className="block h-full w-full" />
        </div>

        <div className="min-w-0 flex-1 pr-8">
          <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{preset.name}</p>
          <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {typeLabel(preset.settings.type)} · {orientationLabel} ·{' '}
            {preset.settings.spacingIn.toFixed(2)} in
          </p>
        </div>

        <div
          ref={menuRef}
          className="absolute top-3 right-3 z-20"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`More actions for ${preset.name}`}
            title="More actions"
            className={`edu-control rounded-lg p-2 ${theme.colorOnSurfaceVariant} ${
              isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            <MoreVertical size={16} strokeWidth={2.5} />
          </button>
          {menuOpen ? (
            <FitPopout
              open={menuOpen}
              className={`absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border-[1.5px] p-1 shadow-lg ${
                isDarkMode
                  ? 'border-slate-600 bg-slate-900'
                  : 'border-slate-300 bg-white'
              }`}
              role="menu"
              aria-label={`${preset.name} actions`}
            >
              <button
                type="button"
                role="menuitem"
                className={menuItemClass()}
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.(preset);
                }}
              >
                <Pencil size={14} strokeWidth={2.5} className="shrink-0" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass(true)}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(preset);
                }}
              >
                <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
                Delete
              </button>
            </FitPopout>
          ) : null}
        </div>
      </div>
    </li>
  );
}
