import { useMemo, useState } from 'react';
import { Library } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { copiesForTitle, shelfSummaries } from '../../../data/library/storage';

/**
 * Teacher shelf — titles with copy counts.
 */
export function ShelfView({ theme, isDarkMode, classLabel, refreshKey, onOpenManage }) {
  const rows = useMemo(() => {
    void refreshKey;
    return shelfSummaries();
  }, [refreshKey]);
  const [openId, setOpenId] = useState(null);
  const toolBtn = toolBtnClass(isDarkMode);

  const openCopies = openId ? copiesForTitle(openId) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Library"
        description={
          classLabel
            ? `${classLabel} · Your classroom library on this device`
            : 'Your classroom library on this device'
        }
        isDarkMode={isDarkMode}
        actions={
          onOpenManage ? (
            <button type="button" className={toolBtn} onClick={onOpenManage}>
              Manage titles
            </button>
          ) : null
        }
      />

      {!rows.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No books yet. Open Manage Library to add titles."
          illustration={<Library size={36} className="text-slate-400" />}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map(({ title, copies, inCount, outCount, unlabeled }) => {
            const open = openId === title.id;
            return (
              <li
                key={title.id}
                className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <button
                  type="button"
                  className="edu-control w-full text-left p-4 flex gap-3"
                  onClick={() => setOpenId(open ? null : title.id)}
                >
                  {title.coverUrl ? (
                    <img
                      src={title.coverUrl}
                      alt=""
                      className={`h-20 w-14 shrink-0 rounded-lg object-cover ${theme.colorSurfaceVariant}`}
                    />
                  ) : (
                    <div
                      className={`h-20 w-14 shrink-0 rounded-lg flex items-center justify-center ${theme.colorSurfaceVariant}`}
                    >
                      <Library size={20} className={theme.colorOnSurfaceVariant} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>{title.title}</p>
                    <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                      {title.author}
                      {title.isbn ? ` · ${title.isbn}` : ''}
                    </p>
                    <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
                      {copies} cop{copies === 1 ? 'y' : 'ies'} · {inCount} in · {outCount} out
                      {unlabeled ? ` · ${unlabeled} unlabeled` : ''}
                    </p>
                  </div>
                </button>
                {open ? (
                  <ul className={`border-t-[1.5px] px-4 py-3 space-y-2 ${theme.colorOutline}`}>
                    {openCopies.map((c) => (
                      <li
                        key={c.id}
                        className={`flex items-center justify-between gap-2 ${TYPE.bodySm}`}
                      >
                        <span className={theme.colorOnSurface}>
                          Copy {c.copyNumber}
                          {c.shortCode ? ` · ${c.shortCode}` : ''}
                        </span>
                        <span className={theme.colorOnSurfaceVariant}>
                          {c.status === 'out' ? 'Out' : 'In'}
                          {!c.labeledAt ? ' · needs label' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
