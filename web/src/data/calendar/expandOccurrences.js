/**
 * Expand layers + events into display occurrences for a date range.
 */

import { addDaysIso, parseIsoDate } from './calendarModel';
import { isSessionDay, rotationSlotForDate } from './sessionDays';

function eachIsoInRange(startIso, endIso) {
  const out = [];
  if (!startIso || !endIso || startIso > endIso) return out;
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDaysIso(cur, 1);
    if (!cur) break;
  }
  return out;
}

function eventOccursOn(event, iso, academic, closures) {
  if (!event) return false;
  if ((event.excludedDates || []).includes(iso)) return false;

  if (!event.isRecurring) {
    return iso >= event.startDate && iso <= event.endDate;
  }

  // Recurring: only on session days when academic provided; weekly by weekday match
  if (academic && !isSessionDay(iso, academic, closures)) return false;
  const start = parseIsoDate(event.startDate);
  const target = parseIsoDate(iso);
  if (!start || !target || target < start) return false;
  if (event.endDate && iso > event.endDate) return false;

  if (event.frequency === 'Daily') return true;
  if (event.frequency === 'Monthly') {
    return target.getDate() === start.getDate();
  }
  // Weekly
  return target.getDay() === start.getDay();
}

/**
 * @returns {Array<{
 *   id: string,
 *   date: string,
 *   title: string,
 *   color: string,
 *   classId: string,
 *   className: string,
 *   layerId: string,
 *   layerName: string,
 *   kind: 'rotation'|'event',
 *   startTime?: string,
 *   endTime?: string,
 *   notes?: string,
 *   sourceEventId?: string,
 * }>}
 */
export function expandOccurrencesForRange({
  rangeStart,
  rangeEnd,
  classIds,
  classMetaById,
  getAcademic,
  getClosures,
  getLayers,
  getEvents,
}) {
  const rows = [];
  const days = eachIsoInRange(rangeStart, rangeEnd);

  for (const classId of classIds.map(String)) {
    const meta = classMetaById?.[classId] || {};
    const className = meta.name || 'Class';
    const academic = getAcademic(classId);
    const closures = getClosures(classId);
    const layers = (getLayers(classId) || []).filter((l) => l.visible !== false);
    const events = getEvents(classId) || [];

    for (const iso of days) {
      for (const layer of layers) {
        if (layer.type === 'rotation' && layer.slots?.length) {
          const hit = rotationSlotForDate(iso, layer, academic, closures);
          if (hit?.slot) {
            rows.push({
              id: `rot-${classId}-${layer.id}-${iso}`,
              date: iso,
              title: hit.slot.label,
              color: hit.slot.color || layer.color,
              classId,
              className,
              layerId: layer.id,
              layerName: layer.name,
              kind: 'rotation',
              notes: `${layer.name} · day ${hit.index + 1}/${layer.slots.length}`,
            });
          }
        }
      }

      for (const event of events) {
        const layer = layers.find((l) => l.id === event.layerId) ||
          (getLayers(classId) || []).find((l) => l.id === event.layerId);
        if (event.layerId && layer && layer.visible === false) continue;
        if (!eventOccursOn(event, iso, academic, closures)) continue;
        rows.push({
          id: `evt-${event.id}-${iso}`,
          date: iso,
          title: event.title,
          color: layer?.color || '#6366f1',
          classId,
          className,
          layerId: event.layerId || '',
          layerName: layer?.name || '',
          kind: 'event',
          startTime: event.startTime,
          endTime: event.endTime,
          notes: event.notes,
          sourceEventId: event.id,
        });
      }
    }
  }

  return rows.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return String(a.title).localeCompare(String(b.title));
  });
}
