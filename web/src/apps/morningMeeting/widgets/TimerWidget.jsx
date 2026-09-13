import { useEffect, useState } from 'react';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { formatCountdown } from '../../timer/timerUtils';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

const PRESETS = [1, 2, 5];

/**
 * Compact morning countdown timer.
 */
export function TimerWidget({ theme, pin }) {
  const defaultMinutes = Number(pin?.props?.minutes) > 0 ? Number(pin.props.minutes) : 5;
  const [duration, setDuration] = useState(defaultMinutes * 60);
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);

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

  const pick = (minutes) => {
    const secs = minutes * 60;
    setDuration(secs);
    setRemaining(secs);
    setRunning(false);
  };

  const reset = () => {
    setRemaining(duration);
    setRunning(false);
  };

  return (
    <WidgetShell theme={theme} title="Timer" icon={Clock} pin={pin}>
      <div className="flex flex-col gap-2">
        <p
          className={`font-mono text-3xl sm:text-4xl tabular-nums tracking-tight leading-none ${theme.colorOnSurface}`}
          aria-live="polite"
        >
          {formatCountdown(remaining)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              className={`edu-control rounded-lg border-[1.5px] px-2 py-1 ${TYPE.labelSm} ${
                duration === m * 60
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
              }`}
              onClick={() => pick(m)}
            >
              {m}m
            </button>
          ))}
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1 rounded-lg px-2 py-1 ${TYPE.labelSm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => {
              if (remaining === 0) setRemaining(duration);
              setRunning((v) => !v);
            }}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1 rounded-lg border-[1.5px] px-2 py-1 ${TYPE.labelSm} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            onClick={reset}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
