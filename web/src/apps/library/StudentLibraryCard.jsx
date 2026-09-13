import { useEffect, useMemo, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { APP_BOARD_PAD, APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { LIBRARY_UPDATED_EVENT } from '../../data/library/types';
import { listActiveLoans } from '../../data/library/storage';

function dueLabel(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Checkouts and due dates for one student — used on student profiles.
 */
export function StudentLibraryCard({ student, theme }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(LIBRARY_UPDATED_EVENT, bump);
    window.addEventListener('storage', bump);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener(LIBRARY_UPDATED_EVENT, bump);
      window.removeEventListener('storage', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);

  const rows = useMemo(() => {
    void tick;
    const id = String(student?.id || '');
    if (!id) return [];
    return listActiveLoans().filter((row) => String(row.loan.studentId) === id);
  }, [student?.id, tick]);

  const overdueCount = rows.filter((r) => r.overdue).length;

  return (
    <div className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
        >
          <BookMarked size={18} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>Library</p>
          {!rows.length ? (
            <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Nothing checked out
            </p>
          ) : (
            <>
              <p className={`mt-1 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
                {rows.length} book{rows.length === 1 ? '' : 's'} out
                {overdueCount ? (
                  <span className="text-rose-500">
                    {' '}
                    · {overdueCount} overdue
                  </span>
                ) : null}
              </p>
              <ul className="mt-2 space-y-2">
                {rows.map(({ loan, copy, title, overdue }) => (
                  <li key={loan.id} className="min-w-0">
                    <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                      {title?.title || 'Book'}
                      {copy ? ` · copy ${copy.copyNumber}` : ''}
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      due{' '}
                      <span className={overdue ? 'text-rose-500 font-semibold' : ''}>
                        {dueLabel(loan.dueAt)}
                        {overdue ? ' · overdue' : ''}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
