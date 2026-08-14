import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { TYPE } from '../../../shared/typography';

/**
 * Multi-select overlay menu: Holidays, Fun Days, Birthdays, Specialist.
 */
export function CalendarLayersMenu({
  theme,
  isDarkMode,
  showHolidays,
  onShowHolidaysChange,
  showFunDays,
  onShowFunDaysChange,
  showBirthdays,
  onShowBirthdaysChange,
  specialistVisible,
  onSpecialistVisibleChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = [
    {
      id: 'holidays',
      label: 'Holidays',
      checked: Boolean(showHolidays),
      onToggle: () => onShowHolidaysChange(!showHolidays),
    },
    {
      id: 'fun-days',
      label: 'Fun Days',
      checked: Boolean(showFunDays),
      onToggle: () => onShowFunDaysChange(!showFunDays),
    },
    {
      id: 'birthdays',
      label: 'Birthdays',
      checked: Boolean(showBirthdays),
      onToggle: () => onShowBirthdaysChange(!showBirthdays),
    },
    {
      id: 'specialist',
      label: 'Specialist',
      checked: Boolean(specialistVisible),
      onToggle: () => onSpecialistVisibleChange(!specialistVisible),
    },
  ];

  const checkedCount = items.filter((i) => i.checked).length;
  const triggerLabel =
    checkedCount === 0
      ? 'Calendars'
      : checkedCount === items.length
        ? 'All calendars'
        : items
            .filter((i) => i.checked)
            .map((i) => i.label)
            .join(', ');

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`edu-control flex max-w-[14rem] items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-2 text-left ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Toggle calendars"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`min-w-0 flex-1 truncate ${TYPE.labelMd}`}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          } ${theme.colorOnSurfaceVariant}`}
        />
      </button>
      {open ? (
        <ul
          role="menu"
          aria-label="Calendars"
          className={`absolute left-0 top-full z-40 mt-1 min-w-[12rem] overflow-hidden rounded-xl border-[1.5px] py-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={item.checked}
                className={`edu-control flex w-full items-center gap-2.5 px-3 py-2 text-left ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                }`}
                onClick={item.onToggle}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] ${
                    item.checked
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                      : `${theme.colorOutline} ${theme.colorSurface}`
                  }`}
                  aria-hidden
                >
                  {item.checked ? <Check size={12} strokeWidth={3} /> : null}
                </span>
                <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
