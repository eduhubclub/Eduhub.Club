import { useEffect, useRef, useState } from 'react';
import { Layers, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { FitPopout } from '../../../shared/usePopoutFit';
import { labelFromDuration } from '../timerUtils';

function labelFromMinutes(totalMin) {
  const totalSec = Math.round(Number(totalMin || 0) * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return labelFromDuration(m, s);
}

/** Saved small-group rotation preset card. */
export function SavedRotationCard({
  title,
  groups = [],
  minutes,
  isDarkMode,
  theme,
  onClick,
  onEdit,
  onRemove,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const count = groups.length;
  const groupLabel = count === 1 ? '1 group' : `${count} groups`;
  const timeLabel =
    typeof minutes === 'number' && minutes > 0
      ? labelFromMinutes(minutes)
      : null;

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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative w-full text-left p-5 ${APP_GRID_CARD} transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${theme.colorSurface} ${theme.colorOutline}`}
    >
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
          aria-label="More actions"
          title="More actions"
          className={`edu-control p-1.5 rounded-full transition-colors ${theme.colorOnSurfaceVariant} hover:bg-slate-100 dark:hover:bg-slate-800`}
        >
          <MoreVertical size={16} strokeWidth={2.5} />
        </button>

        {menuOpen ? (
          <FitPopout
            open={menuOpen}
            className={`absolute right-0 top-full mt-1 w-40 rounded-xl border-[1.5px] shadow-lg z-30 overflow-hidden p-1 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-600'
                : 'bg-white border-slate-300'
            }`}
            role="menu"
            aria-label="Rotation actions"
          >
            <button
              type="button"
              role="menuitem"
              className={menuItemClass()}
              onClick={() => {
                setMenuOpen(false);
                onEdit?.();
              }}
            >
              <Pencil size={14} strokeWidth={2.5} className="shrink-0" />
              Edit timer
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass(true)}
              onClick={() => {
                setMenuOpen(false);
                onRemove?.();
              }}
            >
              <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
              Delete
            </button>
          </FitPopout>
        ) : null}
      </div>

      <div className="pr-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Layers size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`${TYPE.titleMd} min-w-0 truncate ${theme.colorOnSurface}`}>
              {title}
            </h4>
            <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {groupLabel}
            </p>
          </div>
        </div>
        {timeLabel ? (
          <p
            className={`mt-3 font-mono text-2xl font-black tabular-nums leading-none ${theme.colorOnSurface}`}
          >
            {timeLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
