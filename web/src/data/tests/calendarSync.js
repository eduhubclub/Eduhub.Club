import { CALENDAR_SWATCHES } from '../calendar/calendarModel';
import { readEvents, upsertLayer, writeEvents } from '../calendar/calendarStorage';

export const ASSESSMENT_LAYER_ID = 'layer-assessments';

export function scheduleEventPrefix(schedule) {
  if (!schedule) return '';
  if (schedule.scope === 'district') return `assess-d-${schedule.assessmentId}-`;
  return `assess-c-${schedule.classId}-${schedule.assessmentId}-`;
}

/** Calendar events for one schedule. The Calendar app reads these per class. */
export function eventsForSchedule(schedule, title) {
  const prefix = scheduleEventPrefix(schedule);
  const name = title || 'Assessment';
  const layerId = ASSESSMENT_LAYER_ID;
  const events = [];
  if (schedule?.windowStart && schedule?.windowEnd) {
    events.push({
      id: `${prefix}window`,
      layerId,
      title: `${name} window`,
      startDate: schedule.windowStart,
      endDate: schedule.windowEnd,
      notes: 'Assessment window',
    });
  }
  for (const day of schedule?.testingDays || []) {
    events.push({
      id: `${prefix}test-${day}`,
      layerId,
      title: `${name} testing day`,
      startDate: day,
      endDate: day,
      notes: 'Testing day',
    });
  }
  if (schedule?.assignOn) {
    events.push({
      id: `${prefix}assign`,
      layerId,
      title: `${name} assigned`,
      startDate: schedule.assignOn,
      endDate: schedule.assignOn,
      notes: 'Students receive this assessment',
    });
  }
  for (const [studentId, date] of Object.entries(schedule?.studentAssignOn || {})) {
    if (!date || date === schedule.assignOn) continue;
    events.push({
      id: `${prefix}assign-${studentId}`,
      layerId,
      title: `${name} assigned`,
      startDate: date,
      endDate: date,
      notes: 'One student receives this assessment',
    });
  }
  return events;
}

function writeScheduleEvents(classId, schedule, title) {
  if (!classId) return;
  upsertLayer(classId, {
    id: ASSESSMENT_LAYER_ID,
    name: 'Assessments',
    type: 'standard',
    color: CALENDAR_SWATCHES[7],
    visible: true,
  });
  const prefixes = [scheduleEventPrefix(schedule)];
  if (schedule.scope === 'class') prefixes.push(`assess-d-${schedule.assessmentId}-`);
  const kept = readEvents(classId).filter(
    (event) => !prefixes.some((prefix) => event.id.startsWith(prefix)),
  );
  writeEvents(classId, [...kept, ...eventsForSchedule(schedule, title)]);
}

export function publishSchedule(schedule, title, classIds, schedules = []) {
  if (!schedule) return;
  if (schedule.scope === 'district') {
    for (const classId of classIds) {
      const override = schedules.find(
        (row) =>
          row.scope === 'class' &&
          row.classId === String(classId) &&
          row.assessmentId === schedule.assessmentId,
      );
      if (override) continue;
      writeScheduleEvents(classId, schedule, title);
    }
    return;
  }
  writeScheduleEvents(schedule.classId, schedule, title);
}
