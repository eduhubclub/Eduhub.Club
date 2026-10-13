import { useEffect, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { TYPE } from '../../shared/typography';
import {
  hasClassScheduleOverride,
  readDistrictScheduleDefaults,
  readSchedule,
  resetScheduleToDistrict,
  writeDistrictScheduleDefaults,
  writeSchedule,
  SCHEDULE_UPDATED_EVENT,
} from '../../data/schedule/scheduleStorage';

/**
 * Schedule controls on the shell Settings page.
 */
export function ScheduleSettingsCards({ theme, isDarkMode, Card }) {
  const { selectedClass } = useClasses();
  const classId = selectedClass?.id;
  const [schedule, setSchedule] = useState(() => readSchedule(classId));
  const [districtSaved, setDistrictSaved] = useState(() =>
    Boolean(readDistrictScheduleDefaults()),
  );

  useEffect(() => {
    const refresh = () => {
      setSchedule(readSchedule(classId));
      setDistrictSaved(Boolean(readDistrictScheduleDefaults()));
    };
    refresh();
    window.addEventListener(SCHEDULE_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, refresh);
    };
  }, [classId]);

  const fieldClass = `edu-control w-full max-w-sm rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const classLabel = selectedClass?.name || 'No class selected';

  return (
    <>
      <Card
        title="Day numbering"
        description={`${classLabel} · Day #N follows Calendar session days.`}
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-4">
          <label className="block space-y-1">
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Label prefix
            </span>
            <input
              className={fieldClass}
              value={schedule.dayNumbering.labelPrefix}
              disabled={!classId}
              onChange={(e) => {
                const next = {
                  ...schedule,
                  dayNumbering: {
                    ...schedule.dayNumbering,
                    labelPrefix: e.target.value,
                  },
                  source: 'teacher',
                };
                writeSchedule(classId, next);
                setSchedule(readSchedule(classId));
              }}
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              First session day number
            </span>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Set to 23 if the year already started and tomorrow should be Day
              #24.
            </p>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={schedule.dayNumbering.anchorSessionDay}
              disabled={!classId}
              onChange={(e) => {
                const next = {
                  ...schedule,
                  dayNumbering: {
                    ...schedule.dayNumbering,
                    anchorSessionDay: Number(e.target.value) || 1,
                  },
                  source: 'teacher',
                };
                writeSchedule(classId, next);
                setSchedule(readSchedule(classId));
              }}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="min-w-0">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Mode</p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                Day slots (elementary) or timed periods (secondary).
              </p>
            </span>
            <select
              className={fieldClass}
              value={schedule.mode}
              disabled={!classId}
              onChange={(e) => {
                writeSchedule(classId, {
                  ...schedule,
                  mode: e.target.value,
                  source: 'teacher',
                });
                setSchedule(readSchedule(classId));
              }}
            >
              <option value="daySlots">Day slots</option>
              <option value="periods">Timed periods</option>
            </select>
          </label>
        </div>
      </Card>

      <Card
        title="District schedule defaults"
        description="Publish this class’s day shape as a district template teachers can inherit."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3">
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {districtSaved
              ? 'District schedule defaults are saved on this device.'
              : 'No district schedule defaults yet.'}
            {classId && hasClassScheduleOverride(classId)
              ? ' This class has a teacher override.'
              : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              disabled={!classId}
              onClick={() => {
                writeDistrictScheduleDefaults(readSchedule(classId));
                setDistrictSaved(true);
              }}
            >
              Publish class → district
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              disabled={!classId}
              onClick={() => {
                resetScheduleToDistrict(classId);
                setSchedule(readSchedule(classId));
              }}
            >
              Reset class to district
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() => {
                writeDistrictScheduleDefaults(null);
                setDistrictSaved(false);
              }}
            >
              Clear district defaults
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
