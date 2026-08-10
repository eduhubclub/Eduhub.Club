/** Format seconds as MM:SS. */
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format short countdown for student rows (M:SS). */
export function formatShortCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format stopwatch milliseconds as MM:SS.CS. */
export function formatStopwatch(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/** Build a human label from minute/second inputs. */
export function labelFromDuration(min, sec) {
  const m = parseInt(min, 10) || 0;
  const s = parseInt(sec, 10) || 0;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m} min`;
  return `${s} sec`;
}

/** Total minutes (fractional) from minute/second inputs. */
export function minutesFromDuration(min, sec) {
  const m = parseInt(min, 10) || 0;
  const s = parseInt(sec, 10) || 0;
  return m + s / 60;
}

/** Total seconds from minute/second inputs. */
export function secondsFromDuration(min, sec) {
  const m = parseInt(min, 10) || 0;
  const s = parseInt(sec, 10) || 0;
  return m * 60 + s;
}

/**
 * Countdown color classes.
 * Under 1 minute: thirds of the total — late third yellow, final third red.
 * 1 minute+: absolute cues — amber at 30s, red at 15s.
 */
export function countdownColorClass(timeLeft, isDarkMode, totalSeconds) {
  const total =
    typeof totalSeconds === 'number' && Number.isFinite(totalSeconds)
      ? totalSeconds
      : null;

  if (total != null && total > 0 && total < 60) {
    if (timeLeft <= total / 3) return 'text-rose-500';
    if (timeLeft <= (total * 2) / 3) return 'text-amber-500';
    return isDarkMode ? 'text-slate-100' : 'text-slate-800';
  }

  if (timeLeft <= 15) return 'text-rose-500';
  if (timeLeft <= 30) return 'text-amber-500';
  return isDarkMode ? 'text-slate-100' : 'text-slate-800';
}

/** Yellow / red warning thresholds for countdown UI (digital + analog). */
export function countdownWarnThresholds(totalSeconds) {
  const total =
    typeof totalSeconds === 'number' && Number.isFinite(totalSeconds)
      ? totalSeconds
      : null;

  if (total != null && total > 0 && total < 60) {
    return { yellowAt: (total * 2) / 3, redAt: total / 3 };
  }

  return { yellowAt: 30, redAt: 15 };
}
