import { createPortal } from 'react-dom';
import { TYPE } from '../../shared/typography';

/**
 * Letter-size print layout for Class Creator draft classes.
 */
export function ClassCreatorPrintSheet({ run }) {
  if (!run?.destinationTeachers?.length) return null;

  const printed = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const sheet = (
    <div className="edu-print-sheet hidden print:block bg-white text-slate-900 text-left">
      <header className="mb-5 pb-3 border-b-2 border-slate-300">
        <h1 className="text-2xl font-black tracking-tight text-black">
          Class Creator draft
        </h1>
        <p className={`${TYPE.titleSm} text-slate-700 mt-1`}>
          {[run.schoolName, run.gradeBand === 'k6' ? 'K–6' : 'K–5', run.yearLabel]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={`${TYPE.bodySm} text-slate-500 mt-1`}>Printed {printed}</p>
      </header>

      <div className="edu-print-groups grid grid-cols-2 gap-4">
        {run.destinationTeachers.map((teacher) => {
          const ids = run.draftClasses?.[teacher.id] || [];
          return (
            <section
              key={teacher.id}
              className="edu-print-group border-2 border-slate-300 rounded-lg p-3 break-inside-avoid"
            >
              <h2 className={`${TYPE.labelMicro} text-slate-800 border-b border-slate-300 pb-2 mb-2`}>
                {teacher.name}
                {teacher.destinationGrade ? ` · ${teacher.destinationGrade}` : ''}
                {teacher.isProvisional ? ' (Open)' : ''}
                <span className={`ml-2 ${TYPE.bodySm} normal-case tracking-normal text-slate-500`}>
                  ({ids.length})
                </span>
              </h2>
              {ids.length === 0 ? (
                <p className={`${TYPE.bodySm} italic text-slate-400`}>Empty</p>
              ) : (
                <ul className="space-y-1">
                  {ids.map((id) => (
                    <li key={id} className={TYPE.bodyMd}>
                      {run.students[id]?.name || id}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {run.unassigned?.length ? (
        <section className="edu-print-group mt-5 border-2 border-dashed border-slate-300 rounded-lg p-3">
          <h2 className={`${TYPE.labelMicro} text-slate-800 mb-2`}>
            Unassigned ({run.unassigned.length})
          </h2>
          <ul className="space-y-1">
            {run.unassigned.map((id) => (
              <li key={id}>{run.students[id]?.name || id}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );

  return createPortal(sheet, document.body);
}
