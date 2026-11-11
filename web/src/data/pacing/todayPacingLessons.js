/**
 * Today's paced lessons for Dashboard Lessons panel + week glance.
 */

import {
  findSlot,
  placementsForDate,
  toIsoDate,
  weekDates,
  weekMonday,
} from './pacingModel';
import { readPacingStore } from './pacingStorage';

/**
 * @returns {{ iso: string, lessons: object[] }}
 */
export function getTodayPacingLessons(now = new Date()) {
  const store = readPacingStore();
  const iso = toIsoDate(now);
  const placements = placementsForDate(store, iso);
  const lessons = placements.map((pl) => {
    const found = findSlot(store, pl.pacingId, pl.slotId);
    const link = found?.lesson?.links?.[0]?.url || '';
    return {
      id: `pacing-${pl.id}`,
      label: found?.lesson?.title || 'Pacing lesson',
      desc: `${found?.pacing?.title || 'Pacing'} · ${pl.minutesPlanned}m · ${pl.status}`,
      icon: 'BookOpen',
      link,
      pacingPlacementId: pl.id,
      pacingStatus: pl.status,
      source: 'pacing',
    };
  });
  return { iso, lessons, placements, store };
}

/**
 * Mon–Fri glance rows for Dashboard.
 */
export function getWeekAtAGlance(now = new Date()) {
  const store = readPacingStore();
  const monday = weekMonday(toIsoDate(now));
  const days = weekDates(monday);
  return days.map((iso) => {
    const placements = placementsForDate(store, iso);
    return {
      iso,
      blocked: (store.blockOutDates || []).includes(iso),
      items: placements.map((pl) => {
        const found = findSlot(store, pl.pacingId, pl.slotId);
        return {
          id: pl.id,
          title: found?.lesson?.title || 'Lesson',
          pacingTitle: found?.pacing?.title || '',
          status: pl.status,
          minutesPlanned: pl.minutesPlanned,
          contentKey: pl.contentKey,
        };
      }),
    };
  });
}
