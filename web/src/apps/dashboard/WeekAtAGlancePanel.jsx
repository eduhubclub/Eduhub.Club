import { useEffect, useState } from 'react';
import { Route } from 'lucide-react';
import { getWeekAtAGlance } from '../../data/pacing/todayPacingLessons';
import { PACING_UPDATED_EVENT } from '../../data/pacing/pacingStorage';
import { TYPE } from '../../shared/typography';
import { APP_GRID_CARD } from '../../shared/layout';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Compact Mon–Fri pacing glance on Dashboard whiteboard home.
 */
export function WeekAtAGlancePanel({ theme, isDarkMode, onOpenPacing }) {
  const [days, setDays] = useState(() => getWeekAtAGlance());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const refresh = () => setDays(getWeekAtAGlance());
    refresh();
    window.addEventListener(PACING_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PACING_UPDATED_EVENT, refresh);
  }, []);

  const hasAny = days.some((d) => d.items.length > 0 || d.blocked);

  return (
    <div
      className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} mx-3 mt-3 mb-0 p-3 shrink-0`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Route size={16} className={theme.colorPrimary?.includes('bg-') ? '' : ''} />
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}>
            Week at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenPacing ? (
            <button
              type="button"
              className={`edu-control text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${theme.colorOnSurfaceVariant}`}
              onClick={onOpenPacing}
            >
              Open Pacing
            </button>
          ) : null}
          <button
            type="button"
            className={`edu-control text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${theme.colorOnSurfaceVariant}`}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      {collapsed ? null : !hasAny ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          No paced lessons this week — add a pacing in the Pacing app.
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {days.map((day, i) => (
            <div
              key={day.iso}
              className={`rounded-lg border-[1.5px] p-1.5 min-h-[72px] ${theme.colorOutline}`}
            >
              <p className={`${TYPE.bodySm} font-medium ${theme.colorOnSurface}`}>
                {DAY_LABELS[i]}
              </p>
              <p className={`text-[10px] ${theme.colorOnSurfaceVariant}`}>
                {day.iso.slice(5)}
              </p>
              {day.blocked ? (
                <p className={`text-[10px] mt-1 ${theme.colorOnSurfaceVariant}`}>
                  Blocked
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {day.items.slice(0, 3).map((item) => (
                    <li
                      key={item.id}
                      className={`text-[10px] truncate ${theme.colorOnSurface}`}
                      title={`${item.title} · ${item.status}`}
                    >
                      {item.status === 'done' ? '✓ ' : item.status === 'partial' ? '◐ ' : ''}
                      {item.title}
                    </li>
                  ))}
                  {day.items.length > 3 ? (
                    <li className={`text-[10px] ${theme.colorOnSurfaceVariant}`}>
                      +{day.items.length - 3} more
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
