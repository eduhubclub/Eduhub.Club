import { useMemo } from 'react';
import { BookMarked } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';
import { useClasses } from '../../../data/classes/ClassContext';
import { listActiveLoans } from '../../../data/library/storage';
import { returnCopy } from '../../../data/library/loans';

/**
 * Currently borrowed books — overdue first.
 */
export function OutView({ theme, isDarkMode, classLabel, roster, refreshKey }) {
  const { classes } = useClasses();
  const rows = useMemo(() => {
    void refreshKey;
    return listActiveLoans();
  }, [refreshKey]);
  const toolBtn = toolBtnClass(isDarkMode);
  const studentById = useMemo(() => {
    const map = {};
    for (const s of roster || []) map[String(s.id)] = s;
    for (const c of classes || []) {
      for (const s of c.studentList || []) {
        if (!map[String(s.id)]) map[String(s.id)] = s;
      }
    }
    return map;
  }, [roster, classes]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Out"
        description={
          classLabel
            ? `${classLabel} · Books currently checked out (overdue first)`
            : 'Books currently checked out (overdue first)'
        }
        isDarkMode={isDarkMode}
      />

      {!rows.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="Nothing checked out. Open Circulation and scan a copy label to loan a book."
          illustration={<BookMarked size={36} className="text-slate-400" />}
        />
      ) : (
        <ul className="grid gap-2">
          {rows.map(({ loan, copy, title, overdue }) => {
            const student = studentById[String(loan.studentId)];
            const dueLabel = loan.dueAt
              ? new Date(loan.dueAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : '—';
            return (
              <li
                key={loan.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="min-w-0">
                  <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
                    {title?.title || 'Book'}
                    {copy ? ` · copy ${copy.copyNumber}` : ''}
                  </p>
                  <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                    {student ? studentDisplayName(student) : `Student ${loan.studentId}`}
                    {' · due '}
                    <span className={overdue ? 'text-rose-500 font-semibold' : ''}>
                      {dueLabel}
                      {overdue ? ' · overdue' : ''}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className={toolBtn}
                  onClick={() => returnCopy(copy?.id || loan.copyId)}
                >
                  Return
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
