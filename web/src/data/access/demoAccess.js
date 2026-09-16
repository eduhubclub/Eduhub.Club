import { scheduleLabel } from './accessCopy';
import { browserTimeZone, DEFAULT_WEEKDAYS, normalizeParts, STUDENT_APP_IDS } from './studentApps';

export const LOCAL_DEMO_CLASS_ID = 'demo-3rd-grade';
const STORAGE_KEY = 'edu.demoAppAccess';

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function emptyStore() {
  return { timezone: browserTimeZone(), policies: {}, usage: {} };
}

export function readLocalDemoAccess() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      timezone: parsed.timezone || browserTimeZone(),
      policies: parsed.policies || {},
      usage: parsed.usage || {},
    };
  } catch {
    return emptyStore();
  }
}

function writeLocalDemoAccess(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveLocalDemoTimezone(timezone) {
  const store = readLocalDemoAccess();
  store.timezone = timezone || store.timezone;
  writeLocalDemoAccess(store);
}

export function saveLocalDemoPolicy(policy, timezone) {
  const store = readLocalDemoAccess();
  store.timezone = timezone || store.timezone;
  store.policies[policy.appId] = {
    enabled: Boolean(policy.enabled),
    weekdays: policy.weekdays,
    windowStart: policy.windowStart || '',
    windowEnd: policy.windowEnd || '',
    dailyMinutes: policy.dailyMinutes ?? null,
    parts: normalizeParts(policy.parts),
  };
  writeLocalDemoAccess(store);
}

function zonedNow(timeZone, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function clockToMinutes(value) {
  if (!value) return null;
  const [hour, minute] = String(value).slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function closed(appId, reason, detail, extra = {}) {
  return {
    app_id: appId,
    open: false,
    reason,
    detail,
    minutes_left: extra.minutes_left ?? null,
    daily_minutes: extra.daily_minutes ?? null,
    seconds_used: extra.seconds_used ?? 0,
    parts: extra.parts || {},
  };
}

export function evaluateLocalDemoApp(appId, store = readLocalDemoAccess(), date = new Date()) {
  const policy = store.policies[appId];
  const now = zonedNow(store.timezone || 'UTC', date);
  const used = store.usage[`${appId}:${now.date}`] || 0;
  const parts = normalizeParts(policy?.parts);
  if (!policy?.enabled) {
    return closed(appId, 'closed', 'Your teacher has this closed.', { seconds_used: used, parts });
  }
  const weekdays = policy.weekdays?.length ? policy.weekdays : DEFAULT_WEEKDAYS;
  const schedule = scheduleLabel(weekdays, policy.windowStart, policy.windowEnd);
  if (!weekdays.includes(now.weekday)) {
    return closed(appId, 'not_today', `Opens ${schedule}.`, {
      daily_minutes: policy.dailyMinutes,
      seconds_used: used,
      parts,
    });
  }
  const start = clockToMinutes(policy.windowStart);
  const end = clockToMinutes(policy.windowEnd);
  if (start != null && end != null && (now.minutes < start || now.minutes >= end)) {
    return closed(appId, 'outside_window', `Opens ${schedule}.`, {
      daily_minutes: policy.dailyMinutes,
      seconds_used: used,
      parts,
    });
  }
  if (policy.dailyMinutes != null && used >= policy.dailyMinutes * 60) {
    return closed(appId, 'minutes_used', `Today's time is used. Opens ${schedule}.`, {
      minutes_left: 0,
      daily_minutes: policy.dailyMinutes,
      seconds_used: used,
      parts,
    });
  }
  const remaining =
    policy.dailyMinutes == null ? null : Math.max(policy.dailyMinutes * 60 - used, 0);
  const minutesLeft =
    remaining == null ? null : remaining === 0 ? 0 : Math.max(1, Math.ceil(remaining / 60));
  return {
    app_id: appId,
    open: true,
    reason: 'open',
    detail: minutesLeft == null ? '' : `${minutesLeft} minutes left today.`,
    minutes_left: minutesLeft,
    daily_minutes: policy.dailyMinutes,
    seconds_used: used,
    parts,
  };
}

export function localDemoBoard() {
  const store = readLocalDemoAccess();
  return STUDENT_APP_IDS.map((appId) => evaluateLocalDemoApp(appId, store));
}

export function touchLocalDemoApp(appId, addSeconds = 0) {
  const store = readLocalDemoAccess();
  const before = evaluateLocalDemoApp(appId, store);
  if (!before.open || addSeconds <= 0) return before;
  const now = zonedNow(store.timezone || 'UTC');
  const key = `${appId}:${now.date}`;
  store.usage[key] = (store.usage[key] || 0) + Math.min(Math.max(addSeconds, 0), 45);
  writeLocalDemoAccess(store);
  return evaluateLocalDemoApp(appId, store);
}

export function localDemoPolicies() {
  return readLocalDemoAccess();
}
