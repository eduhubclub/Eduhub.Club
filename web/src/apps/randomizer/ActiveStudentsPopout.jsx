import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';

/**
 * Toolbar control listing students still in the active pool.
 */
export function ActiveStudentsPopout({
  activeStudents,
  fullRoster,
  theme,
  isDarkMode,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={`${toolBtn} ${open ? theme.text : ''}`}
      >
        <span>
          {activeStudents.length} / {fullRoster.length} Active
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Active students"
          className={`absolute right-0 top-full mt-2 z-30 w-64 max-h-[50vh] overflow-y-auto rounded-2xl shadow-xl border flex flex-col text-left ${
            isDarkMode
              ? 'bg-slate-900 border-slate-600 text-slate-200'
              : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div
            className={`p-3 border-b sticky top-0 z-10 ${
              isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-200'
            }`}
          >
            <span className={TYPE.titleSm}>Active students</span>
          </div>
          <div className="p-2 space-y-1">
            {activeStudents.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-2 rounded-xl ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                }`}
              >
                <StudentAvatar student={s} theme={theme} size="sm" isDarkMode={isDarkMode} />
                <span className={`${TYPE.titleSm} truncate`}>{s.name}</span>
              </div>
            ))}
            {activeStudents.length === 0 ? (
              <div className={`p-4 text-center ${TYPE.bodyMd} opacity-50`}>
                All students removed.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
