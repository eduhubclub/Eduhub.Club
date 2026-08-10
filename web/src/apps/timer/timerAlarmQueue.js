import { playAlarmForDuration } from '../../data/settings/AlarmSoundPreferencesContext';

/** Cap each sound when several timers finish together. */
export const MAX_CHAINED_ALARM_SEC = 3;

let nextId = 0;
let playing = false;
let playingId = null;
let stopCurrent = null;
let flushScheduled = false;
const queue = [];

function stampChainCapIfNeeded() {
  if (queue.length > 1) {
    for (const entry of queue) entry.chainCap = true;
  }
}

function pump() {
  if (playing || queue.length === 0) return;

  const entry = queue.shift();
  if (entry.cancelled) {
    pump();
    return;
  }

  playing = true;
  playingId = entry.id;
  const durationSec = entry.chainCap
    ? Math.min(entry.durationSec, MAX_CHAINED_ALARM_SEC)
    : entry.durationSec;

  stopCurrent = playAlarmForDuration(entry.url, durationSec, {
    volume: entry.volume,
    onEnd: () => {
      playing = false;
      playingId = null;
      stopCurrent = null;
      entry.onEnd?.();
      // Next item may already be queued — stamp if a new simultaneous batch arrived.
      if (queue.length > 1) stampChainCapIfNeeded();
      pump();
    },
  });
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    stampChainCapIfNeeded();
    if (!playing) pump();
  });
}

/**
 * Play a timer-finished alarm. Simultaneous finishes queue and play one after
 * another (each capped at {@link MAX_CHAINED_ALARM_SEC}). Solo finishes use
 * the full requested duration.
 *
 * Returns a cancel function (dequeue or stop if this entry is playing).
 */
export function enqueueTimerAlarm({ url, durationSec, volume, onEnd }) {
  const id = ++nextId;
  const entry = {
    id,
    url,
    durationSec,
    volume,
    onEnd,
    cancelled: false,
    chainCap: false,
  };
  queue.push(entry);
  scheduleFlush();

  return () => {
    if (entry.cancelled) return;
    entry.cancelled = true;
    const idx = queue.findIndex((e) => e.id === id);
    if (idx >= 0) {
      queue.splice(idx, 1);
      return;
    }
    if (playingId === id && stopCurrent) {
      stopCurrent();
    }
  };
}
