import { useEffect, useMemo, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { toIsoDate } from '../../../data/calendar/calendarModel';
import { FUN_DAY_COLOR, funDayOptionsOn } from '../../../data/calendar/funDays';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

/**
 * Today’s novelty / Fun Day observances (from Edu.Calendar catalog).
 */
export function NoveltyWidget({ theme, pin }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const iso = useMemo(() => {
    void tick;
    return toIsoDate(new Date());
  }, [tick]);

  const options = useMemo(() => funDayOptionsOn(iso), [iso]);

  return (
    <WidgetShell theme={theme} title="Fun Day" icon={PartyPopper} pin={pin}>
      <div className="flex flex-col">
        {options.length ? (
          <ul className="space-y-2">
            {options.map((opt) => (
              <li
                key={opt.id}
                className={`min-w-0 ${TYPE.titleMd} leading-snug ${theme.colorOnSurface}`}
                style={{ borderLeft: `3px solid ${FUN_DAY_COLOR}`, paddingLeft: '0.6rem' }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No novelty days on the calendar today.
          </p>
        )}
      </div>
    </WidgetShell>
  );
}
