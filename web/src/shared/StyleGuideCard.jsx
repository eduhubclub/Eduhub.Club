import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { APP_GRID_CARD, APP_NESTED_CARD } from './layout';
import { TYPE } from './typography';

/**
 * Reference card for the Design Guide — matches APP_GRID_CARD (white surface).
 * Header collapses the body (specs, do/don't, live preview).
 */
export function StyleGuideCard({
  title,
  token,
  description,
  isDarkMode,
  accentClass = '',
  children,
  specs = [],
  doList = [],
  dontList = [],
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-600'
    : 'bg-white border-slate-300';
  const nested = isDarkMode
    ? 'border-slate-700 bg-slate-800/60'
    : 'border-slate-200 bg-slate-50';

  const hasBody =
    Boolean(children) || specs.length > 0 || doList.length > 0 || dontList.length > 0;

  return (
    <article className={`${APP_GRID_CARD} overflow-hidden relative ${surface}`}>
      {hasBody ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          onClick={() => setOpen((v) => !v)}
          className={`absolute top-2.5 right-3 sm:top-3 sm:right-3.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.25}
            className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      ) : null}
      <div
        className={`px-5 sm:px-6 py-4 pr-14 sm:pr-16 ${
          open && hasBody
            ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`
            : ''
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3
            className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            {title}
          </h3>
          {token ? (
            <code
              className={`text-[11px] font-mono ${accentClass || (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}
            >
              {token}
            </code>
          ) : null}
        </div>
        {description ? (
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </p>
        ) : null}
      </div>

      {open && hasBody ? (
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
          {children}

          {specs.length > 0 ? (
            <dl className="grid sm:grid-cols-2 gap-3">
              {specs.map(({ label, value, note }) => (
                <div key={label} className={`${APP_NESTED_CARD} p-3 ${nested}`}>
                  <dt
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </dt>
                  <dd
                    className={`${TYPE.titleSm} mt-1 font-mono ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {value}
                  </dd>
                  {note ? (
                    <dd
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {note}
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}

          {doList.length > 0 || dontList.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {doList.length > 0 ? (
                <div>
                  <p
                    className={`${TYPE.labelMicro} mb-2 ${
                      isDarkMode ? 'text-emerald-500' : 'text-emerald-600'
                    }`}
                  >
                    Do
                  </p>
                  <ul
                    className={`${TYPE.bodySm} space-y-1.5 list-disc pl-4 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {doList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {dontList.length > 0 ? (
                <div>
                  <p
                    className={`${TYPE.labelMicro} mb-2 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}
                  >
                    Don&apos;t
                  </p>
                  <ul
                    className={`${TYPE.bodySm} space-y-1.5 list-disc pl-4 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {dontList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
