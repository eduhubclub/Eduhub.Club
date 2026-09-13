import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { localDateKey } from '../../../data/ofTheDay/dateKey';
import { deleteSavedSet, readSavedSets, writeDayPicks } from '../../../data/ofTheDay/storage';

/**
 * Teacher Saved days (device = this teacher, reusable across classes).
 */
export function SavedView({ theme, isDarkMode, onOpenToday }) {
  const [sets, setSets] = useState(() => readSavedSets());
  const [note, setNote] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  const refresh = () => setSets(readSavedSets());

  useEffect(() => {
    refresh();
  }, []);

  const applySet = (row) => {
    writeDayPicks(localDateKey(), row.picks || {});
    setNote(`Applied “${row.label}” to today.`);
    onOpenToday?.();
  };

  return (
    <AppPageShell variant="page">
      <PageHeader
        title="Saved"
        description="Days you save live on this device for the teacher and can be applied to any class."
        isDarkMode={isDarkMode}
      />

      {note ? (
        <p className={`${TYPE.bodySm} mb-4 ${theme.colorOnSurfaceVariant}`}>{note}</p>
      ) : null}

      {!sets.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No saved days yet. Open Today and tap Save today."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {sets.map((row) => (
            <li
              key={row.id}
              className={`flex items-start justify-between gap-3 p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <div className="min-w-0">
                <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>{row.label}</p>
                <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                  {Object.keys(row.picks || {}).length} picks
                </p>
                <button type="button" className={`${toolBtn} mt-3`} onClick={() => applySet(row)}>
                  Use today
                </button>
              </div>
              <button
                type="button"
                className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant}`}
                title="Delete saved day"
                aria-label={`Delete ${row.label}`}
                onClick={() => {
                  deleteSavedSet(row.id);
                  refresh();
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppPageShell>
  );
}
