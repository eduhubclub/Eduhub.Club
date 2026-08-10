import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Globe2 } from 'lucide-react';
import { FitPopout } from '../../../shared/usePopoutFit';
import { TYPE } from '../../../shared/typography';
import { MONEY_CURRENCIES } from './moneyDenoms';

/**
 * Currency picker popout (FitPopout above the footer trigger).
 */
export function MoneyCurrencyMenu({
  isDarkMode,
  theme,
  toolBtn,
  open,
  onOpenChange,
  currencyId,
  currencyLabel,
  onSelect,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, bottom: 0 });

  const toggleClass = open
    ? `edu-control inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl ${TYPE.labelMd} transition-colors ${theme.colorPrimary} ${theme.colorOnPrimary} border border-transparent`
    : toolBtn;

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
        className={toggleClass}
        aria-pressed={open}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={
          open ? 'Hide currency options' : `Currency — ${currencyLabel}`
        }
        aria-label={
          open ? 'Hide currency options' : `Currency — ${currencyLabel}`
        }
      >
        <Globe2 size={16} strokeWidth={2.5} />
        <span>Currency</span>
      </button>
      {open
        ? createPortal(
            <FitPopout
              ref={panelRef}
              open={open}
              centerX
              style={{ left: pos.left, bottom: pos.bottom }}
              className={`fixed z-[300] w-56 rounded-2xl border-[1.5px] p-2 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
              role="listbox"
              aria-label="Choose currency"
            >
              <p
                className={`mb-1.5 px-2 ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}
              >
                Denominations
              </p>
              <div className="flex flex-col gap-1">
                {MONEY_CURRENCIES.map((option) => {
                  const selected = option.id === currencyId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => onSelect(option.id)}
                      className={`edu-control flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                        isDarkMode
                          ? `${theme.colorOnSurface} hover:bg-slate-800`
                          : `${theme.colorOnSurface} hover:bg-slate-100`
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide ${
                          isDarkMode
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {option.short}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate ${TYPE.labelMd}`}>
                          {option.label}
                        </span>
                        <span
                          className={`block truncate ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}
                        >
                          {option.code}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          size={16}
                          strokeWidth={2.5}
                          className={`shrink-0 ${theme.text}`}
                          aria-hidden
                        />
                      ) : (
                        <span className="w-4 shrink-0" aria-hidden />
                      )}
                    </button>
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
