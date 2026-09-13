import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { localDateKey } from '../../../data/ofTheDay/dateKey';
import { readCommunityItems, setDayPick } from '../../../data/ofTheDay/storage';
import { OF_THE_DAY_META } from '../../../data/ofTheDay/types';

/**
 * Public teacher items (local v1; multi-teacher sync later).
 */
export function CommunityView({ theme, isDarkMode, onOpenToday }) {
  const [items, setItems] = useState(() => readCommunityItems());
  const [note, setNote] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  useEffect(() => {
    setItems(readCommunityItems());
  }, []);

  const useToday = (item) => {
    setDayPick(localDateKey(), item.type, item.id);
    setNote(`“${item.title}” is today’s ${OF_THE_DAY_META[item.type]?.label || item.type}.`);
    onOpenToday?.();
  };

  return (
    <AppPageShell variant="page">
      <PageHeader
        title="Community"
        description="Public Of the Day items on this device. Mark items public in Create. Sharing with other teachers comes later."
        isDarkMode={isDarkMode}
      />

      {note ? (
        <p className={`${TYPE.bodySm} mb-4 ${theme.colorOnSurfaceVariant}`}>{note}</p>
      ) : null}

      {!items.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No public items yet. Open Create and check List in Community."
          illustration={<Users size={36} className="text-slate-400" />}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 max-w-3xl">
          {items.map((item) => (
            <li
              key={item.id}
              className={`p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                {OF_THE_DAY_META[item.type]?.label || item.type}
              </p>
              <p className={`${TYPE.labelLg} mt-1 ${theme.colorOnSurface}`}>{item.title}</p>
              <p className={`${TYPE.bodySm} mt-1 line-clamp-4 ${theme.colorOnSurfaceVariant}`}>
                {item.body}
              </p>
              <button type="button" className={`${toolBtn} mt-3`} onClick={() => useToday(item)}>
                Use today
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppPageShell>
  );
}
