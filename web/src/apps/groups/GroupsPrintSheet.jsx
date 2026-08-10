import { createPortal } from 'react-dom';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { TYPE } from '../../shared/typography';
import { studentDisplayName } from '../../data/students/displayName';

/**
 * Letter-size print layout for Groups (previewed via browser print dialog).
 * Portaled to body and pinned top-left on an 8.5×11in page.
 */
export function GroupsPrintSheet({
  title = 'Student Groups',
  className = '',
  groups = [],
  groupNames = [],
  unassigned = [],
  theme,
}) {
  if (!groups?.length && !unassigned?.length) return null;

  const printed = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const studentCount =
    groups.reduce((n, g) => n + (g?.length || 0), 0) + (unassigned?.length || 0);

  const labelFor = (index) => {
    const label = (groupNames?.[index] || '').trim();
    return label || `Group ${index + 1}`;
  };

  const studentRow = (student) => (
    <li key={student.id} className={`flex items-center gap-2 ${TYPE.bodyMd}`}>
      <StudentAvatar student={student} theme={theme} size="xs" />
      <span>{studentDisplayName(student)}</span>
    </li>
  );

  const sheet = (
    <div className="edu-print-sheet hidden print:block bg-white text-slate-900 text-left">
      <header className="mb-5 pb-3 border-b-2 border-slate-300">
        <h1 className="text-2xl font-black tracking-tight text-black">{title}</h1>
        {className ? (
          <p className={`${TYPE.titleSm} text-slate-700 mt-1`}>{className}</p>
        ) : null}
        <p className={`${TYPE.bodySm} text-slate-500 mt-1`}>
          {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          {studentCount ? ` · ${studentCount} students` : ''}
          {` · Printed ${printed}`}
        </p>
      </header>

      <div className="edu-print-groups grid grid-cols-2 gap-4">
        {groups.map((group, index) => (
          <section
            key={index}
            className="edu-print-group border-2 border-slate-300 rounded-lg p-3 break-inside-avoid"
          >
            <h2 className={`${TYPE.labelMicro} text-slate-800 border-b border-slate-300 pb-2 mb-2`}>
              {labelFor(index)}
              <span className={`ml-2 ${TYPE.bodySm} normal-case tracking-normal text-slate-500`}>
                ({group.length})
              </span>
            </h2>
            {group.length === 0 ? (
              <p className={`${TYPE.bodySm} italic text-slate-400`}>Empty</p>
            ) : (
              <ul className="space-y-1.5">{group.map(studentRow)}</ul>
            )}
          </section>
        ))}
      </div>

      {unassigned?.length > 0 ? (
        <section className="edu-print-group mt-5 border-2 border-dashed border-slate-300 rounded-lg p-3 break-inside-avoid">
          <h2 className={`${TYPE.labelMicro} text-slate-800 border-b border-slate-300 pb-2 mb-2`}>
            Unassigned
            <span className={`ml-2 ${TYPE.bodySm} normal-case tracking-normal text-slate-500`}>
              ({unassigned.length})
            </span>
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {unassigned.map(studentRow)}
          </ul>
        </section>
      ) : null}
    </div>
  );

  return createPortal(sheet, document.body);
}
