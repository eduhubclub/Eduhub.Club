import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useModalBodyEl } from './Modal';
import { TYPE } from './typography';

/**
 * Standard icon choice control for modals.
 * Circle buttons, consistent hit target + icon size everywhere.
 */
export const MODAL_ICON_BUTTON =
  'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0';
export const MODAL_ICON_SIZE = 18;

/** One row max — 8th slot becomes "More" when there are additional icons. */
export const MODAL_ICON_ROW_MAX = 8;

export function ModalIconOption({
  selected,
  theme,
  isDarkMode,
  onClick,
  children,
  label,
  type = 'button',
}) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`${MODAL_ICON_BUTTON} ${
        selected
          ? `${theme.colorPrimary} ${theme.colorOnPrimary} shadow-md`
          : isDarkMode
            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Icon row for modals. Never wraps to a second line.
 * If options.length > 8, shows 7 icons + More — More covers the modal body
 * under the header with the remaining icons.
 *
 * options: [{ name: string, icon: LucideIcon }, ...]
 */
export function ModalIconPicker({
  options,
  value,
  onChange,
  theme,
  isDarkMode,
  maxAcross = MODAL_ICON_ROW_MAX,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const bodyEl = useModalBodyEl();

  const needsMore = options.length > maxAcross;
  const visibleCount = needsMore ? maxAcross - 1 : options.length;
  const visible = options.slice(0, visibleCount);
  const overflow = needsMore ? options.slice(visibleCount) : [];

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const selectedInOverflow = overflow.some((o) => o.name === value);

  const morePanel =
    moreOpen && bodyEl
      ? createPortal(
          <div
            className={`absolute inset-0 z-20 flex flex-col ${
              isDarkMode ? 'bg-slate-900' : 'bg-white'
            }`}
            role="dialog"
            aria-label="More icons"
          >
            <div
              className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                isDarkMode ? 'border-slate-700' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className={`inline-flex items-center gap-2 ${TYPE.labelLg} rounded-lg px-2 py-1.5 transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
                Back
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
              {/* Same spacing as the primary icon row; wraps and scrolls vertically if needed */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 -m-1.5">
                {overflow.map((opt) => {
                  const selected = value === opt.name;
                  const Icon = opt.icon;
                  return (
                    <div key={opt.name} className="shrink-0 p-0.5">
                      <ModalIconOption
                        label={opt.name}
                        selected={selected}
                        theme={theme}
                        isDarkMode={isDarkMode}
                        onClick={() => {
                          onChange(opt.name);
                          setMoreOpen(false);
                        }}
                      >
                        <Icon size={MODAL_ICON_SIZE} strokeWidth={selected ? 2.5 : 2} />
                      </ModalIconOption>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          bodyEl
        )
      : null;

  return (
    <>
      {/* Padding keeps selected icon shadows from clipping */}
      <div className="flex flex-nowrap items-center justify-between gap-2 p-1.5 -m-1.5">
        {visible.map((opt) => {
          const selected = value === opt.name;
          const Icon = opt.icon;
          return (
            <div key={opt.name} className="shrink-0 p-0.5">
              <ModalIconOption
                label={opt.name}
                selected={selected}
                theme={theme}
                isDarkMode={isDarkMode}
                onClick={() => onChange(opt.name)}
              >
                <Icon size={MODAL_ICON_SIZE} strokeWidth={selected ? 2.5 : 2} />
              </ModalIconOption>
            </div>
          );
        })}

        {needsMore && (
          <div className="shrink-0 p-0.5">
            <ModalIconOption
              label="More icons"
              selected={selectedInOverflow || moreOpen}
              theme={theme}
              isDarkMode={isDarkMode}
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal size={MODAL_ICON_SIZE} strokeWidth={2.5} />
            </ModalIconOption>
          </div>
        )}
      </div>
      {morePanel}
    </>
  );
}
