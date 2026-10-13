/**
 * Read-only plan chips for Calendar day cells.
 */

import { readAcademic, readClosures } from '../calendar/calendarStorage';
import { sessionDayNumber } from '../schedule/dayNumber';
import { formatDayLabel } from '../schedule/scheduleModel';
import { readSchedule } from '../schedule/scheduleStorage';
import { itemsForDay } from './planModel';
import { readPlan } from './planStorage';

/**
 * @param {string} classId
 * @param {string} iso
 * @returns {{ dayNumber: number|null, label: string, plannedCount: number, titles: string[] } | null}
 */
export function planOverlayForDate(classId, iso) {
  if (!classId || !iso) return null;
  const academic = readAcademic(classId);
  const closures = readClosures(classId);
  const schedule = readSchedule(classId);
  const dayNumber = sessionDayNumber(
    iso,
    academic,
    closures,
    schedule.dayNumbering,
  );
  if (dayNumber == null) return null;
  const plan = readPlan(classId);
  const items = itemsForDay(plan, dayNumber).filter((i) => i.status === 'planned');
  return {
    dayNumber,
    label: formatDayLabel(dayNumber, schedule.dayNumbering.labelPrefix),
    plannedCount: items.length,
    titles: items.map((i) => i.title || 'Lesson'),
  };
}
