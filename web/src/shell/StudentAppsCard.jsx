import { useCallback, useEffect, useMemo, useState } from 'react';
import { launcherApps } from '../apps/launcher';
import {
  opensDetail,
  scheduleLabel,
  timeInputValue,
  WEEKDAY_NAMES,
  WEEKDAY_SHORT,
} from '../data/access/accessCopy';
import {
  accessErrorMessage,
  loadClassAccess,
  loadDemoClassAccess,
  loadTeacherClasses,
  saveAppPolicy,
  saveClassTimeZone,
  saveDemoAppPolicy,
  saveDemoStudentOverride,
  saveDemoTimezone,
  saveStudentOverride,
} from '../data/access/studentAccessApi';
import {
  LOCAL_DEMO_CLASS_ID,
  localDemoPolicies,
  saveLocalDemoPolicy,
  saveLocalDemoTimezone,
} from '../data/access/demoAccess';
import {
  appParts,
  browserTimeZone,
  CLASS_TIME_ZONES,
  DEFAULT_WEEKDAYS,
  isStudentApp,
  normalizeParts,
  partEnabled,
  partsHeading,
  STUDENT_APP_IDS,
  STUDENT_APP_NAMES,
  withPart,
} from '../data/access/studentApps';
import { TYPE } from '../shared/typography';

const APP_META = Object.fromEntries(launcherApps.map((app) => [app.id, app]));

function blankPolicy(appId) {
  return {
    appId,
    enabled: false,
    weekdays: [...DEFAULT_WEEKDAYS],
    windowStart: '',
    windowEnd: '',
    dailyMinutes: null,
    parts: {},
  };
}

function policyFromRow(row) {
  return {
    appId: row.app_id,
    enabled: Boolean(row.enabled),
    weekdays: (row.weekdays || []).map(Number),
    windowStart: timeInputValue(row.window_start),
    windowEnd: timeInputValue(row.window_end),
    dailyMinutes: row.daily_minutes ?? null,
    parts: normalizeParts(row.parts),
  };
}

function windowError(policy) {
  const start = policy.windowStart;
  const end = policy.windowEnd;
  if (!start && !end) return '';
  if (!start || !end) return 'Add both a start and an end, or clear both for all day.';
  if (start >= end) return 'The end time has to be later than the start.';
  return '';
}

function AccessSwitch({ checked, label, onClick, theme, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`edu-control relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? theme.colorPrimary : theme.colorSurfaceVariant
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function StudentAppsCard({ theme, appIds }) {
  const visibleIds = (appIds?.length ? appIds : STUDENT_APP_IDS).filter(isStudentApp);
  const scoped = visibleIds.length === 1;
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [demoClassId, setDemoClassId] = useState('');
  const [localDemo, setLocalDemo] = useState(false);
  const [timezone, setTimezone] = useState(browserTimeZone);
  const [timezoneSaved, setTimezoneSaved] = useState(false);
  const [policies, setPolicies] = useState({});
  const [members, setMembers] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [openAppId, setOpenAppId] = useState(scoped ? visibleIds[0] : '');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const zones = useMemo(() => {
    const detected = browserTimeZone();
    return CLASS_TIME_ZONES.includes(detected)
      ? CLASS_TIME_ZONES
      : [detected, ...CLASS_TIME_ZONES];
  }, []);

  const applyClass = useCallback(async (nextClassId, demoId, local) => {
    const usingDemo = local || (demoId && nextClassId === demoId);
    const access = local
      ? {
          timezone: localDemoPolicies().timezone,
          policies: Object.entries(localDemoPolicies().policies).map(([appId, row]) => ({
            app_id: appId,
            enabled: row.enabled,
            weekdays: row.weekdays,
            window_start: row.windowStart,
            window_end: row.windowEnd,
            daily_minutes: row.dailyMinutes,
            parts: row.parts,
          })),
          members: [],
          overrides: [],
        }
      : usingDemo
        ? await loadDemoClassAccess()
        : await loadClassAccess(nextClassId);
    const next = {};
    for (const appId of STUDENT_APP_IDS) next[appId] = blankPolicy(appId);
    for (const row of access.policies || []) {
      if (next[row.app_id]) next[row.app_id] = policyFromRow(row);
    }
    setPolicies(next);
    setMembers(access.members || []);
    setOverrides(access.overrides || []);
    setTimezone(access.timezone || browserTimeZone());
    setTimezoneSaved(Boolean(access.timezone));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let demo = null;
      let demoError = '';
      try {
        demo = await loadDemoClassAccess();
      } catch (err) {
        demoError = accessErrorMessage(err);
      }
      let mine = [];
      try {
        mine = await loadTeacherClasses();
      } catch (err) {
        if (!demo && !demoError) demoError = accessErrorMessage(err);
      }
      if (cancelled) return;

      if (demo?.id) {
        const rest = mine.filter((row) => row.id !== demo.id);
        setDemoClassId(demo.id);
        setLocalDemo(false);
        setClasses([{ id: demo.id, name: 'Demo Class', demo: true }, ...rest]);
        setClassId(demo.id);
        await applyClass(demo.id, demo.id, false);
        setLoading(false);
        return;
      }

      if (mine.length > 0) {
        setClasses(mine);
        setClassId(mine[0].id);
        await applyClass(mine[0].id, '', false);
        if (demoError) setError(demoError);
        setLoading(false);
        return;
      }

      setLocalDemo(true);
      setDemoClassId(LOCAL_DEMO_CLASS_ID);
      setClasses([{ id: LOCAL_DEMO_CLASS_ID, name: 'Demo Class', demo: true }]);
      setClassId(LOCAL_DEMO_CLASS_ID);
      await applyClass(LOCAL_DEMO_CLASS_ID, LOCAL_DEMO_CLASS_ID, true);
      if (demoError) setError(demoError);
      setLoading(false);
    })().catch((err) => {
      if (!cancelled) {
        setError(accessErrorMessage(err));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applyClass]);

  const isDemoClass = localDemo || (demoClassId && classId === demoClassId);

  async function onClassChange(nextId) {
    setClassId(nextId);
    setError('');
    setStatus('');
    setOpenAppId('');
    try {
      await applyClass(nextId, demoClassId, localDemo && nextId === LOCAL_DEMO_CLASS_ID);
    } catch (err) {
      setError(accessErrorMessage(err));
    }
  }

  async function ensureTimeZone() {
    if (timezoneSaved || !classId || isDemoClass) return;
    await saveClassTimeZone(classId, timezone);
    setTimezoneSaved(true);
  }

  async function persistPolicy(next) {
    const problem = windowError(next);
    setPolicies((current) => ({ ...current, [next.appId]: next }));
    if (problem) {
      setError(problem);
      setStatus('');
      return;
    }
    if (next.enabled && next.weekdays.length === 0) {
      setError('Choose at least one day.');
      setStatus('');
      return;
    }
    setError('');
    try {
      if (isDemoClass && localDemo) {
        saveLocalDemoPolicy(next, timezone);
      } else if (isDemoClass) {
        await saveDemoAppPolicy(next, timezone);
        setTimezoneSaved(true);
      } else {
        await ensureTimeZone();
        await saveAppPolicy(classId, next);
      }
      setStatus('Saved');
    } catch (err) {
      setStatus('');
      setError(accessErrorMessage(err));
    }
  }

  async function onTimeZoneChange(nextZone) {
    setTimezone(nextZone);
    setError('');
    if (!classId) return;
    try {
      if (isDemoClass && localDemo) {
        saveLocalDemoTimezone(nextZone);
      } else if (isDemoClass) {
        await saveDemoTimezone(nextZone);
      } else {
        await saveClassTimeZone(classId, nextZone);
      }
      setTimezoneSaved(true);
      setStatus('Saved');
    } catch (err) {
      setError(accessErrorMessage(err));
    }
  }

  function toggleWeekday(policy, day) {
    const has = policy.weekdays.includes(day);
    if (has && policy.weekdays.length === 1) {
      setError('Choose at least one day.');
      return;
    }
    const weekdays = has
      ? policy.weekdays.filter((item) => item !== day)
      : [...policy.weekdays, day].sort((a, b) => a - b);
    persistPolicy({ ...policy, weekdays });
  }

  function overrideFor(studentId, appId) {
    return overrides.find((row) => row.student_id === studentId && row.app_id === appId);
  }

  async function persistOverride(next) {
    setError('');
    setOverrides((current) => {
      const rest = current.filter(
        (row) => !(row.student_id === next.studentId && row.app_id === next.appId),
      );
      if (!next.blocked && next.dailyMinutes == null) return rest;
      return [
        ...rest,
        {
          student_id: next.studentId,
          app_id: next.appId,
          blocked: next.blocked,
          daily_minutes: next.dailyMinutes,
        },
      ];
    });
    try {
      if (isDemoClass && !localDemo) await saveDemoStudentOverride(next);
      else if (!isDemoClass) await saveStudentOverride(classId, next);
      setStatus('Saved');
    } catch (err) {
      setStatus('');
      setError(accessErrorMessage(err));
    }
  }

  const muted = theme.colorOnSurfaceVariant;
  const ink = theme.colorOnSurface;

  return (
    <div className="px-5 py-5 sm:px-6 sm:py-6">
      {loading ? (
        <p className={`${TYPE.bodySm} ${muted}`}>Loading class rules…</p>
      ) : null}
      {!loading && classes.length === 0 ? (
        <p className={`${TYPE.bodySm} ${ink}`}>
          Open the site demo once so the demo account exists, then reload. Rules for testing live on Demo Class.
        </p>
      ) : null}
      {!loading && classes.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {classes.length > 1 ? (
              <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
                Class
                <select
                  value={classId}
                  onChange={(event) => onClassChange(event.target.value)}
                  className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                >
                  {classes.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className={`${TYPE.bodySm} ${ink}`}>
                {isDemoClass
                  ? 'Demo Class — the shared class for building and for the site demo. You do not need a separate classroom to test this.'
                  : `${classes[0]?.name || 'Class'} — students who sign into this class.`}
              </p>
            )}
            <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
              Class time zone
              <select
                value={timezone}
                onChange={(event) => onTimeZoneChange(event.target.value)}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className={`${TYPE.bodySm} ${muted}`}>
            {isDemoClass
              ? 'Demo Class is the shared test class. What you set here is what the site demo and a student view of that class will see. '
              : ''}
            Times and the daily reset use this time zone, not the student&apos;s device.
            {status ? ` ${status}.` : ''}
          </p>
          <ul className="flex flex-col gap-3">
            {visibleIds.map((appId) => {
              const policy = policies[appId] || blankPolicy(appId);
              const meta = APP_META[appId];
              const Icon = meta?.icon;
              const open = openAppId === appId;
              const parts = appParts(appId);
              const closedParts = parts.filter((part) => !partEnabled(policy.parts, part.id)).length;
              const summary = policy.enabled
                ? `${scheduleLabel(policy.weekdays, policy.windowStart, policy.windowEnd)}${
                    policy.dailyMinutes ? ` · ${policy.dailyMinutes} min` : ''
                  }${closedParts ? ` · ${closedParts} off` : ''}`
                : 'Off';
              const problem = windowError(policy);
              return (
                <li
                  key={appId}
                  className={`rounded-2xl border-[1.5px] ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <button
                      type="button"
                      className={`edu-control min-w-0 flex-1 text-left ${TYPE.labelMd} ${ink}`}
                      aria-expanded={open}
                      onClick={() => setOpenAppId(open ? '' : appId)}
                    >
                      <span className="flex items-center gap-2">
                        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                        {STUDENT_APP_NAMES[appId]}
                      </span>
                      <span className={`mt-0.5 block ${TYPE.bodySm} ${muted}`}>
                        {summary}
                      </span>
                    </button>
                    <AccessSwitch
                      checked={policy.enabled}
                      label={`${policy.enabled ? 'Turn off' : 'Turn on'} ${STUDENT_APP_NAMES[appId]}`}
                      theme={theme}
                      onClick={() => persistPolicy({ ...policy, enabled: !policy.enabled })}
                    />
                  </div>
                  {open ? (
                    <div className={`flex flex-col gap-4 border-t-[1.5px] px-3 py-3 ${theme.colorOutline}`}>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAY_SHORT.map((label, day) => {
                          const selected = policy.weekdays.includes(day);
                          return (
                            <button
                              key={`${appId}-${day}`}
                              type="button"
                              aria-pressed={selected}
                              aria-label={WEEKDAY_NAMES[day]}
                              onClick={() => toggleWeekday(policy, day)}
                              className={`edu-control h-9 w-9 rounded-xl border-[1.5px] ${TYPE.labelSm} ${
                                selected
                                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                                  : `${theme.colorSurface} ${ink} ${theme.colorOutline}`
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
                          Starts
                          <input
                            type="time"
                            value={policy.windowStart}
                            onChange={(event) =>
                              persistPolicy({ ...policy, windowStart: event.target.value })
                            }
                            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                          />
                        </label>
                        <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
                          Ends
                          <input
                            type="time"
                            value={policy.windowEnd}
                            onChange={(event) =>
                              persistPolicy({ ...policy, windowEnd: event.target.value })
                            }
                            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                          />
                        </label>
                        <label className={`flex flex-col gap-1 ${TYPE.labelSm} ${ink}`}>
                          Minutes a day
                          <input
                            type="number"
                            min="1"
                            max="240"
                            inputMode="numeric"
                            placeholder="No limit"
                            value={policy.dailyMinutes ?? ''}
                            onChange={(event) => {
                              const raw = event.target.value;
                              const dailyMinutes = raw === '' ? null : Number(raw);
                              if (dailyMinutes != null && (!Number.isFinite(dailyMinutes) || dailyMinutes < 1)) {
                                return;
                              }
                              persistPolicy({ ...policy, dailyMinutes });
                            }}
                            className={`edu-control w-28 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                          />
                        </label>
                        {policy.windowStart || policy.windowEnd ? (
                          <button
                            type="button"
                            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelSm} ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                            onClick={() =>
                              persistPolicy({ ...policy, windowStart: '', windowEnd: '' })
                            }
                          >
                            All day
                          </button>
                        ) : null}
                      </div>
                      {problem ? (
                        <p className={`${TYPE.bodySm} ${theme.colorOnErrorContainer}`}>{problem}</p>
                      ) : null}
                      <p className={`${TYPE.bodySm} ${muted}`}>
                        {policy.enabled
                          ? opensDetail(policy.weekdays, policy.windowStart, policy.windowEnd)
                          : 'Closed until you turn it on.'}
                        {policy.dailyMinutes
                          ? ` ${policy.dailyMinutes} ${policy.dailyMinutes === 1 ? 'minute' : 'minutes'} a day.`
                          : ''}
                      </p>
                      {parts.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          <p className={`${TYPE.labelSm} ${ink}`}>{partsHeading(appId)}</p>
                          <p className={`${TYPE.bodySm} ${muted}`}>
                            {policy.enabled
                              ? 'A turned-off part stays visible. Tapping it tells the student it is closed.'
                              : `Turn ${STUDENT_APP_NAMES[appId]} on before choosing ${partsHeading(appId).toLowerCase()}.`}
                          </p>
                          {parts.map((part) => {
                            const on = policy.enabled && partEnabled(policy.parts, part.id);
                            return (
                              <div
                                key={part.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <p className={`${TYPE.bodySm} ${ink}`}>{part.name}</p>
                                <AccessSwitch
                                  checked={on}
                                  disabled={!policy.enabled}
                                  label={`${on ? 'Turn off' : 'Turn on'} ${part.name}`}
                                  theme={theme}
                                  onClick={() =>
                                    persistPolicy({
                                      ...policy,
                                      parts: withPart(
                                        policy.parts,
                                        part.id,
                                        !partEnabled(policy.parts, part.id),
                                      ),
                                    })
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-2">
                        <p className={`${TYPE.labelSm} ${ink}`}>Exceptions</p>
                        {members.length === 0 ? (
                          <p className={`${TYPE.bodySm} ${muted}`}>No students on this class yet.</p>
                        ) : (
                          members.map((member) => {
                            const exception = overrideFor(member.student_id, appId);
                            const blocked = Boolean(exception?.blocked);
                            return (
                              <div
                                key={member.id}
                                className="flex flex-wrap items-center justify-between gap-3"
                              >
                                <p className={`${TYPE.bodySm} ${ink}`}>{member.display_name}</p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <label className={`flex items-center gap-2 ${TYPE.labelSm} ${ink}`}>
                                    <AccessSwitch
                                      checked={blocked}
                                      label={`Turn ${STUDENT_APP_NAMES[appId]} off for ${member.display_name}`}
                                      theme={theme}
                                      disabled={!member.student_id}
                                      onClick={() =>
                                        persistOverride({
                                          studentId: member.student_id,
                                          appId,
                                          blocked: !blocked,
                                          dailyMinutes: exception?.daily_minutes ?? null,
                                        })
                                      }
                                    />
                                    Off
                                  </label>
                                  <label className={`flex items-center gap-2 ${TYPE.labelSm} ${ink}`}>
                                    Minutes
                                    <input
                                      type="number"
                                      min="1"
                                      max="240"
                                      inputMode="numeric"
                                      placeholder="Class"
                                      disabled={!member.student_id || blocked}
                                      value={exception?.daily_minutes ?? ''}
                                      onChange={(event) => {
                                        const raw = event.target.value;
                                        const dailyMinutes = raw === '' ? null : Number(raw);
                                        if (
                                          dailyMinutes != null &&
                                          (!Number.isFinite(dailyMinutes) || dailyMinutes < 1)
                                        ) {
                                          return;
                                        }
                                        persistOverride({
                                          studentId: member.student_id,
                                          appId,
                                          blocked,
                                          dailyMinutes,
                                        });
                                      }}
                                      className={`edu-control w-24 rounded-xl border-[1.5px] px-3 py-2 disabled:opacity-50 ${theme.colorSurface} ${theme.colorOutline} ${ink}`}
                                    />
                                  </label>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {error ? (
        <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnErrorContainer}`}>{error}</p>
      ) : null}
    </div>
  );
}
