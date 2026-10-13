/**
 * Resolve today’s planned resources for the Dashboard hub.
 */

import { toIsoDate } from '../calendar/calendarModel';
import { readAcademic, readClosures } from '../calendar/calendarStorage';
import { resourceToLesson } from '../resources/resourceModel';
import { getResource } from '../resources/resourceStorage';
import { todaySessionDayNumber } from '../schedule/dayNumber';
import { readSchedule } from '../schedule/scheduleStorage';
import { itemsForDay } from './planModel';
import { readPlan } from './planStorage';

/**
 * @param {string} classId
 * @param {Date} [now]
 * @returns {{ dayNumber: number|null, lessons: object[], items: object[] }}
 */
export function getTodayPlanLessons(classId, now = new Date()) {
  if (!classId) return { dayNumber: null, lessons: [], items: [] };
  const academic = readAcademic(classId);
  const closures = readClosures(classId);
  const schedule = readSchedule(classId);
  const dayNumber = todaySessionDayNumber(
    academic,
    closures,
    schedule.dayNumbering,
    now,
  );
  if (dayNumber == null) {
    return { dayNumber: null, lessons: [], items: [], iso: toIsoDate(now) };
  }
  const plan = readPlan(classId);
  const items = itemsForDay(plan, dayNumber).filter((i) => i.status === 'planned');
  const lessons = [];
  const seen = new Set();
  for (const item of items) {
    for (const rid of item.resourceIds) {
      if (seen.has(rid)) continue;
      const res = getResource(classId, rid);
      if (!res) continue;
      seen.add(rid);
      const lesson = resourceToLesson(res);
      if (lesson) {
        lessons.push({
          ...lesson,
          label: item.title || lesson.label,
          desc: `Plan · Day #${dayNumber}`,
        });
      }
    }
  }
  return { dayNumber, lessons, items, iso: toIsoDate(now) };
}
