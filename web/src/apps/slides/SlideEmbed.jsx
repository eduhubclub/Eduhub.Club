import { useEffect, useState } from 'react';
import { Clock, Pause, Play, Sparkles } from 'lucide-react';
import { TYPE } from '../../shared/typography';
import { formatCountdown } from '../timer/timerUtils';
import { localDateKey } from '../../data/ofTheDay/dateKey';
import { loadTypeItem } from '../../data/ofTheDay/pick';
import { OF_THE_DAY_META } from '../../data/ofTheDay/types';

/**
 * Compact timer + Of the Day embeds for slide objects.
 */
export function SlideEmbed({ object, theme, interactive = false }) {
  if (object?.embedType === 'ofTheDay') {
    return <OfTheDayEmbed theme={theme} />;
  }
  return <TimerEmbed object={object} theme={theme} interactive={interactive} />;
}

function TimerEmbed({ object, theme, interactive }) {
  const duration = Math.max(5, Number(object?.durationSec) || 60);
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(duration);
    setRunning(false);
  }, [duration]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <div className="flex h-full min-h-0 flex-col justify-center gap-2 p-2">
      <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
        <Clock size={12} className="mr-1 inline" />
        Timer
      </p>
      <p
        className={`font-mono tabular-nums leading-none ${TYPE.displaySm} ${theme.colorOnSurface}`}
        aria-live="polite"
      >
        {formatCountdown(remaining)}
      </p>
      {interactive ? (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1 rounded-lg px-2 py-1 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={(e) => {
              e.stopPropagation();
              if (remaining === 0) setRemaining(duration);
              setRunning((v) => !v);
            }}
          >
            {running ? <Pause size={12} /> : <Play size={12} />}
            {running ? 'Pause' : 'Start'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OfTheDayEmbed({ theme }) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadTypeItem('joke', localDateKey())
      .then((row) => {
        if (!cancelled) setItem(row);
      })
      .catch(() => {
        if (!cancelled) setItem(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = OF_THE_DAY_META.joke;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden p-2">
      <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
        <Sparkles size={12} className="mr-1 inline" />
        {meta.label} of the Day
      </p>
      <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{item?.title || 'Loading…'}</p>
      {item?.body ? (
        <p className={`min-h-0 overflow-hidden ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {item.body}
        </p>
      ) : null}
    </div>
  );
}
