import { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  formatOfTheDayDate,
  formatOfTheDayDateShort,
  localDateKey,
  weekPreviewKeys,
} from '../../../data/ofTheDay/dateKey';
import { loadTodayItems, loadTypeItem, loadTypeRange, reshuffleType } from '../../../data/ofTheDay/pick';
import { readDayPicks, saveSet } from '../../../data/ofTheDay/storage';
import { OF_THE_DAY_META, OF_THE_DAY_TYPES, OF_THE_DAY_UPDATED_EVENT } from '../../../data/ofTheDay/types';
import { OfTheDayCard } from '../OfTheDayCard';

/**
 * Today — all seven types, or one type with today + the next 7 days.
 */
export function TodayView({ theme, isDarkMode, focus = 'all' }) {
  const dateKey = localDateKey();
  const dateLabel = formatOfTheDayDate(dateKey);
  const weekKeys = useMemo(() => weekPreviewKeys(dateKey, 7), [dateKey]);
  const [items, setItems] = useState(/** @type {Record<string, object | null>} */ ({}));
  const [week, setWeek] = useState(/** @type {Array<{ dateKey: string, item: object | null }>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [savedNote, setSavedNote] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);
  const meta = focus !== 'all' ? OF_THE_DAY_META[focus] : null;
  const showAll = focus === 'all';

  useEffect(() => {
    let cancelled = false;
    const load = (showLoad) => {
      if (showLoad) setLoading(true);
      const job = showAll
        ? loadTodayItems(dateKey).then((next) => {
            if (!cancelled) setItems(next);
          })
        : loadTypeRange(focus, weekKeys).then((rows) => {
            if (!cancelled) setWeek(rows);
          });
      job.catch(() => {}).finally(() => {
        if (!cancelled) setLoading(false);
      });
    };
    load(true);
    const onChange = () => load(false);
    window.addEventListener(OF_THE_DAY_UPDATED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(OF_THE_DAY_UPDATED_EVENT, onChange);
    };
  }, [dateKey, focus, showAll, weekKeys]);

  const onReshuffle = async (type, forDate = dateKey) => {
    reshuffleType(type, forDate);
    const next = await loadTypeItem(type, forDate);
    if (showAll) {
      setItems((prev) => ({ ...prev, [type]: next }));
      return;
    }
    setWeek((prev) =>
      prev.map((row) => (row.dateKey === forDate ? { ...row, item: next } : row)),
    );
  };

  const saveToday = () => {
    const picks = readDayPicks(dateKey);
    for (const type of OF_THE_DAY_TYPES) {
      if (items[type]?.id && !picks[type]) picks[type] = items[type].id;
    }
    const row = saveSet({
      label: dateLabel || `Saved ${dateKey}`,
      picks,
    });
    setSavedNote(`Saved “${row.label}”. Find it under Saved.`);
    window.setTimeout(() => setSavedNote(''), 4000);
  };

  const todayRow = week[0];
  const upcoming = week.slice(1);
  const waiting = loading && (showAll ? !Object.keys(items).length : !week.length);

  return (
    <AppPageShell variant="page">
      <PageHeader
        title={showAll ? 'Today' : `${meta.label} of the Day`}
        description={
          showAll
            ? `${dateLabel}. All-ages picks for the class — reshuffle any card, then save the set for other classes.`
            : `${dateLabel} plus the next 7 days — reshuffle any card to plan ahead.`
        }
        isDarkMode={isDarkMode}
        actions={
          showAll ? (
            <button type="button" className={toolBtn} onClick={saveToday}>
              <BookmarkPlus size={16} strokeWidth={2.5} />
              Save today
            </button>
          ) : null
        }
      />

      {savedNote ? (
        <p className={`${TYPE.bodySm} mb-3 ${theme.colorOnSurfaceVariant}`}>{savedNote}</p>
      ) : null}

      {waiting ? (
        <EmptyState isDarkMode={isDarkMode} message="Loading today’s set…" />
      ) : showAll ? (
        <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {OF_THE_DAY_TYPES.map((type) => (
            <li key={type} className="min-h-[16rem]">
              <OfTheDayCard
                theme={theme}
                isDarkMode={isDarkMode}
                item={items[type]}
                dateLabel={dateLabel}
                onReshuffle={() => onReshuffle(type)}
                compact
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="max-w-xl">
            <OfTheDayCard
              theme={theme}
              isDarkMode={isDarkMode}
              item={todayRow?.item}
              dateLabel={todayRow ? `Today · ${formatOfTheDayDate(todayRow.dateKey)}` : dateLabel}
              onReshuffle={() => onReshuffle(focus, todayRow?.dateKey || dateKey)}
            />
          </div>
          {upcoming.length ? (
            <section>
              <h2 className={`${TYPE.titleSm} mb-3 ${theme.colorOnSurface}`}>Coming up</h2>
              <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((row) => (
                  <li key={row.dateKey} className="min-h-[14rem]">
                    <OfTheDayCard
                      theme={theme}
                      isDarkMode={isDarkMode}
                      item={row.item}
                      dateLabel={formatOfTheDayDateShort(row.dateKey)}
                      onReshuffle={() => onReshuffle(focus, row.dateKey)}
                      compact
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </AppPageShell>
  );
}
