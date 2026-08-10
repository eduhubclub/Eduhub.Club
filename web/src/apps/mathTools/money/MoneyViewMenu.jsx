import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye } from 'lucide-react';
import { FitPopout } from '../../../shared/usePopoutFit';
import { TYPE } from '../../../shared/typography';

/** View options for Bank Learning — extend as more desk chrome is toggleable. */
export const MONEY_VIEW_ITEMS = [{ key: 'total', label: 'Total' }];

/**
 * Eye / View popout with on/off switches (Timer Learning clock pattern).
 */
export function MoneyViewMenu({
  isDarkMode,
  theme,
  toolBtn,
  open,
  onOpenChange,
  showTotal,
  onToggleTotal,
  items = MONEY_VIEW_ITEMS,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, bottom: 0 });

  const checked = { total: showTotal };
  const toggles = { total: onToggleTotal };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setPos({
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inTrigger && !inPanel) onOpenChange(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        className={toolBtn}
        aria-expanded={open}
        aria-haspopup="menu"
        title="View desk options"
        aria-label="View desk options"
      >
        <Eye size={16} strokeWidth={2.5} />
        <span className="hidden xl:inline">View</span>
      </button>
      {open
        ? createPortal(
            <FitPopout
              ref={panelRef}
              open={open}
              centerX
              style={{ left: pos.left, bottom: pos.bottom }}
              className={`fixed z-[300] w-56 rounded-2xl border-[1.5px] p-2 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
              role="menu"
              aria-label="Desk view options"
            >
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const on = Boolean(checked[item.key]);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2"
                      role="presentation"
                    >
                      <span className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
                        {item.label}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={item.label}
                        onClick={() => toggles[item.key]?.()}
                        className={`edu-control relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          on
                            ? theme.colorPrimary
                            : isDarkMode
                              ? 'bg-slate-700'
                              : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            on ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </FitPopout>,
            document.body,
          )
        : null}
    </div>
  );
}
