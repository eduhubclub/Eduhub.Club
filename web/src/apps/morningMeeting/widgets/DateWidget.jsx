import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

/**
 * Today’s weekday and date only.
 */
export function DateWidget({ theme, pin }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(), [tick]);
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const dateLabel = now.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <WidgetShell theme={theme} title="Today" icon={CalendarDays} pin={pin}>
      <div className="flex flex-col min-w-0 gap-0.5">
        <p className={`${TYPE.titleLg} leading-tight ${theme.colorOnSurface}`}>{weekday}</p>
        <p className={`${TYPE.bodyMd} leading-snug ${theme.colorOnSurfaceVariant}`}>{dateLabel}</p>
      </div>
    </WidgetShell>
  );
}
