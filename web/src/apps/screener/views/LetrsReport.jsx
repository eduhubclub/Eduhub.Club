import { useEffect } from 'react';
import { levelLabel } from '../../../data/screener/letrsBank';
import { TYPE } from '../../../shared/typography';

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .screener-print-root, .screener-print-root * { visibility: visible; }
  .screener-print-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: #fff;
    color: #111827;
  }
  .screener-no-print { display: none !important; }
}
@page { size: landscape; margin: 0.4in; }
`;

function cellTone(ok, isDarkMode) {
  if (ok) {
    return isDarkMode ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-100 text-emerald-950';
  }
  return isDarkMode ? 'bg-red-950 text-red-100' : 'bg-red-100 text-red-950';
}

function columnMinWidths(scored) {
  const widths = scored.words.map(() => 0);
  scored.featureResults.forEach((row) => {
    if (row.name === 'Word Correct') return;
    scored.words.forEach((_, index) => {
      (row.byWord[index] || []).forEach((mark) => {
        widths[index] = Math.max(widths[index], String(mark.label || '').length);
      });
    });
  });
  return widths.map((len) => {
    if (len >= 8) return '4.6rem';
    if (len >= 5) return '3.3rem';
    return '2.15rem';
  });
}

/**
 * LETRS feature grid, targets, and spellings. Shared by the teacher
 * end screen and the saved Results tab.
 */
export function LetrsReport({
  scored,
  meta,
  theme,
  isDarkMode,
  actions = null,
}) {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-screener-print', 'letrs');
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const title =
    scored.level === 'advanced'
      ? 'LETRS Advanced Spelling Screener (3+)'
      : 'LETRS Basic Spelling Screener (K–2)';
  const widths = columnMinWidths(scored);
  const sticky = `sticky left-0 z-10 ${theme.colorSurface}`;
  const line = isDarkMode ? 'border-slate-500' : 'border-slate-700';

  return (
    <div className="screener-print-root">
      <article className={`screener-print-root ${theme.colorOnSurface}`}>
        <h2 className={TYPE.titleLg}>{title}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ['Name', meta.studentName],
            ['Teacher', meta.teacherName || '—'],
            ['Grade', meta.grade || '—'],
            ['Date', meta.dateLabel],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>{label}</dt>
              <dd className={`mt-1 border-b-[1.5px] pb-1 ${TYPE.titleSm} ${line}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div
          className={`mt-4 flex flex-wrap gap-6 rounded-2xl border-[1.5px] px-4 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={TYPE.displaySm}>
            {scored.wordsCorrect}/{scored.wordsTotal}{' '}
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>words correct</span>
          </p>
          <p className={TYPE.displaySm}>
            {scored.grandEarned}/{scored.grandMax}{' '}
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>total points</span>
          </p>
        </div>

        <ul className={`mt-3 flex flex-wrap gap-4 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          <li className="flex items-center gap-2">
            <i className={`inline-block h-3 w-3 border ${cellTone(true, isDarkMode)} ${line}`} />
            Feature or word correct
          </li>
          <li className="flex items-center gap-2">
            <i className={`inline-block h-3 w-3 border ${cellTone(false, isDarkMode)} ${line}`} />
            Missed item
          </li>
        </ul>

        <div className={`mt-3 overflow-x-auto rounded-xl border-[1.5px] ${theme.colorOutline}`}>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th
                  className={`${sticky} min-w-36 border px-2 py-1 text-left ${TYPE.labelMd} ${line}`}
                >
                  Feature
                </th>
                {scored.words.map((word, index) => (
                  <th
                    key={word}
                    scope="col"
                    style={{ minWidth: widths[index] }}
                    className={`h-28 border px-0.5 ${line} ${index % 2 ? theme.colorSurfaceVariant : ''}`}
                  >
                    <span className="inline-block [writing-mode:vertical-rl] rotate-180 font-semibold">
                      {word}
                    </span>
                  </th>
                ))}
                <th className={`border px-2 ${TYPE.labelMd} ${line}`}>Totals</th>
              </tr>
            </thead>
            <tbody>
              {scored.featureResults.map((row) => {
                const wordRow = row.name === 'Word Correct';
                const pct = row.max ? (row.earned / row.max) * 100 : 100;
                const concern = !wordRow && pct < 80;
                return (
                  <tr key={row.name}>
                    <th
                      scope="row"
                      className={`${sticky} border px-2 py-1 text-left font-semibold ${line}`}
                    >
                      {row.name}
                    </th>
                    {scored.words.map((word, index) => {
                      const marks = row.byWord[index];
                      const stripe = index % 2 ? theme.colorSurfaceVariant : '';
                      if (!marks?.length) {
                        return (
                          <td key={word} className={`border ${line} ${stripe}`} />
                        );
                      }
                      const ok = marks.every((mark) => mark.ok);
                      const text = wordRow
                        ? ok
                          ? '✓'
                          : '✗'
                        : marks.map((mark) => mark.label).join('\n');
                      return (
                        <td
                          key={word}
                          className={`border px-0.5 py-1 text-center whitespace-pre-line ${line} ${cellTone(ok, isDarkMode)}`}
                        >
                          {text}
                        </td>
                      );
                    })}
                    <td
                      className={`border px-1 text-center font-semibold ${line} ${
                        concern
                          ? isDarkMode
                            ? 'bg-amber-900 text-amber-100'
                            : 'bg-amber-200 text-amber-950'
                          : ''
                      }`}
                    >
                      {row.earned}/{row.max}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <th
                  scope="row"
                  className={`${sticky} border px-2 py-1 text-left font-semibold ${line}`}
                >
                  Word Totals
                </th>
                {scored.words.map((word, index) => (
                  <td
                    key={word}
                    className={`border ${line} ${index % 2 ? theme.colorSurfaceVariant : ''}`}
                  />
                ))}
                <td className={`border px-1 text-center font-semibold ${line}`}>
                  {scored.grandEarned}/{scored.grandMax}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-5">
          <h3 className={TYPE.titleSm}>Instructional targets (&lt; 80%)</h3>
          {scored.concerns.length === 0 ? (
            <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              No major areas of concern.
            </p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {scored.concerns.map((item) => (
                <li
                  key={item.name}
                  className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline}`}
                >
                  <span>
                    <span className={TYPE.titleSm}>{item.name}</span>
                    <span className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {item.earned}/{item.max}
                    </span>
                  </span>
                  <span className={TYPE.titleSm}>{item.pct}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 break-before-page">
          <h3 className={TYPE.titleMd}>
            Student spellings — {meta.studentName}, {levelLabel(scored.level)}
          </h3>
          <table className="mt-3 w-full max-w-xl border-collapse">
            <thead>
              <tr>
                <th className={`border px-3 py-2 text-left ${TYPE.labelMd} ${line}`}>Word</th>
                <th className={`border px-3 py-2 text-left ${TYPE.labelMd} ${line}`}>
                  Student spelling
                </th>
              </tr>
            </thead>
            <tbody>
              {scored.wordRows.map((row) => (
                <tr key={row.target}>
                  <td className={`border px-3 py-1.5 ${TYPE.bodyMd} ${line}`}>{row.target}</td>
                  <td
                    className={`border px-3 py-1.5 ${TYPE.bodyMd} ${line} ${cellTone(row.correct, isDarkMode)}`}
                  >
                    {row.answer || 'No answer'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
      {actions ? <div className="screener-no-print mt-5 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
