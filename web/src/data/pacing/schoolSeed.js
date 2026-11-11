/**
 * Temporary TES Master Schedule 26-27 seed.
 * Swap for District-owned SchoolSchedule later — keep getSchool / listGrades stable.
 */

/** @typedef {'instruction'|'break'|'transition'} PeriodKind */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   start: string,
 *   end: string,
 *   minutes: number,
 *   kind: PeriodKind,
 *   contentKey?: string,
 * }} SchoolPeriod
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   endOfDay: string,
 *   periods: SchoolPeriod[],
 * }} GradeSchedule
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   year: string,
 *   grades: GradeSchedule[],
 * }} SchoolSchedule
 */

function p(id, label, start, end, minutes, kind, contentKey) {
  return {
    id,
    label,
    start,
    end,
    minutes,
    kind,
    ...(contentKey ? { contentKey } : {}),
  };
}

/** @type {GradeSchedule[]} */
const TES_GRADES = [
  {
    id: 'g3',
    label: '3rd',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('al', 'A & L', '09:25', '10:25', 60, 'instruction', 'a-and-l'),
      p('p95', '95%', '10:25', '10:55', 30, 'instruction', '95'),
      p('ob', 'Outdoor Break', '10:55', '11:05', 10, 'break'),
      p('t1', 'Transition', '11:05', '11:10', 5, 'transition'),
      p('ela-win', 'ELA WIN', '11:10', '11:40', 30, 'instruction', 'ela-win'),
      p('ss', 'SS/Science/SEL', '11:40', '12:10', 30, 'instruction', 'ss-science-sel'),
      p('lunch', 'Lunch', '12:10', '12:50', 40, 'break'),
      p('t2', 'Transition', '12:50', '12:55', 5, 'transition'),
      p('math', 'Math', '12:55', '13:50', 55, 'instruction', 'math'),
      p('math-win', 'Math WIN', '13:50', '14:20', 30, 'instruction', 'math-win'),
      p('t3', 'Transition', '14:20', '14:25', 5, 'transition'),
      p('eod-early', 'End of Day', '14:25', '14:30', 5, 'transition'),
      p('backpacks', 'Drop off backpacks', '14:30', '14:35', 5, 'transition'),
      p('recess', 'Recess', '14:35', '14:50', 15, 'break'),
      p('special', 'Specialist', '14:50', '15:40', 50, 'instruction', 'specialist'),
    ],
  },
  {
    id: 'g4',
    label: '4th',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('math', 'Math', '09:25', '10:25', 60, 'instruction', 'math'),
      p('special', 'Special', '10:25', '11:10', 45, 'instruction', 'specialist'),
      p('recess', 'Recess', '11:10', '11:25', 15, 'break'),
      p('t1', 'Transition', '11:25', '11:30', 5, 'transition'),
      p('math-win', 'Math WIN', '11:30', '12:00', 30, 'instruction', 'math-win'),
      p('p95', '95%', '12:00', '12:30', 30, 'instruction', '95'),
      p('t2', 'Transition', '12:30', '12:35', 5, 'transition'),
      p('lunch', 'Lunch', '12:35', '13:15', 40, 'break'),
      p('t3', 'Transition', '13:15', '13:20', 5, 'transition'),
      p('al', 'A & L', '13:20', '14:20', 60, 'instruction', 'a-and-l'),
      p('ob', 'Outdoor Break', '14:20', '14:30', 10, 'break'),
      p('t4', 'Transition', '14:30', '14:35', 5, 'transition'),
      p('ela-win', 'ELA WIN', '14:35', '15:05', 30, 'instruction', 'ela-win'),
      p('ss', 'SS/Science/SEL', '15:05', '15:35', 30, 'instruction', 'ss-science-sel'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
  {
    id: 'g2',
    label: '2nd',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('math', 'Math', '09:25', '10:25', 60, 'instruction', 'math'),
      p('math-win', 'Math WIN', '10:25', '10:55', 30, 'instruction', 'math-win'),
      p('ob', 'Outdoor Break', '10:55', '11:05', 10, 'break'),
      p('t1', 'Transition', '11:05', '11:10', 5, 'transition'),
      p('al', 'A & L', '11:10', '12:10', 60, 'instruction', 'a-and-l'),
      p('lunch', 'Lunch', '12:10', '12:50', 40, 'break'),
      p('t2', 'Transition', '12:50', '12:55', 5, 'transition'),
      p('ela-win', 'ELA WIN', '12:55', '13:25', 30, 'instruction', 'ela-win'),
      p('t3', 'Transition', '13:25', '13:30', 5, 'transition'),
      p('p95', '95%', '13:30', '14:00', 30, 'instruction', '95'),
      p('t4', 'Transition', '14:00', '14:05', 5, 'transition'),
      p('special', 'Specialist', '14:05', '14:50', 45, 'instruction', 'specialist'),
      p('recess', 'Recess', '14:50', '15:05', 15, 'break'),
      p('ss', 'SS/Science/SEL', '15:05', '15:35', 30, 'instruction', 'ss-science-sel'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
  {
    id: 'g5-lapp',
    label: '5th · Lapp',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('special', 'Special', '09:25', '10:10', 45, 'instruction', 'specialist'),
      p('math', 'Math', '10:10', '11:10', 60, 'instruction', 'math'),
      p('recess', 'Recess', '11:10', '11:25', 15, 'break'),
      p('t1', 'Transition', '11:25', '11:30', 5, 'transition'),
      p('ss', 'SS/Science/SEL', '11:30', '12:00', 30, 'instruction', 'ss-science-sel'),
      p('math-win', 'Math WIN', '12:00', '12:30', 30, 'instruction', 'math-win'),
      p('t2', 'Transition', '12:30', '12:35', 5, 'transition'),
      p('lunch', 'Lunch', '12:35', '13:15', 40, 'break'),
      p('t3', 'Transition', '13:15', '13:20', 5, 'transition'),
      p('math2', 'Math', '13:20', '14:20', 60, 'instruction', 'math'),
      p('ob', 'Outdoor Break', '14:20', '14:30', 10, 'break'),
      p('t4', 'Transition', '14:30', '14:35', 5, 'transition'),
      p('ss2', 'SS/Science/SEL', '14:35', '15:05', 30, 'instruction', 'ss-science-sel'),
      p('math-win2', 'Math WIN', '15:05', '15:35', 30, 'instruction', 'math-win'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
  {
    id: 'g5-hotchkiss',
    label: '5th · Hotchkiss',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('special', 'Special', '09:25', '10:10', 45, 'instruction', 'specialist'),
      p('al', 'A & L', '10:10', '11:10', 60, 'instruction', 'a-and-l'),
      p('recess', 'Recess', '11:10', '11:25', 15, 'break'),
      p('t1', 'Transition', '11:25', '11:30', 5, 'transition'),
      p('p95', '95%', '11:30', '12:00', 30, 'instruction', '95'),
      p('ela-win', 'ELA WIN', '12:00', '12:30', 30, 'instruction', 'ela-win'),
      p('t2', 'Transition', '12:30', '12:35', 5, 'transition'),
      p('lunch', 'Lunch', '12:35', '13:15', 40, 'break'),
      p('t3', 'Transition', '13:15', '13:20', 5, 'transition'),
      p('al2', 'A & L', '13:20', '14:20', 60, 'instruction', 'a-and-l'),
      p('ob', 'Outdoor Break', '14:20', '14:30', 10, 'break'),
      p('t4', 'Transition', '14:30', '14:35', 5, 'transition'),
      p('p952', '95%', '14:35', '15:05', 30, 'instruction', '95'),
      p('ela-win2', 'ELA WIN', '15:05', '15:35', 30, 'instruction', 'ela-win'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
  {
    id: 'g1',
    label: '1st',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('al', 'A & L', '09:25', '10:25', 60, 'instruction', 'a-and-l'),
      p('ob', 'Outdoor Break', '10:25', '10:35', 10, 'break'),
      p('t1', 'Transition', '10:35', '10:40', 5, 'transition'),
      p('ela-win', 'ELA WIN', '10:40', '11:10', 30, 'instruction', 'ela-win'),
      p('p95', '95%', '11:10', '11:40', 30, 'instruction', '95'),
      p('t2', 'Transition', '11:40', '11:45', 5, 'transition'),
      p('lunch', 'Lunch', '11:45', '12:25', 40, 'break'),
      p('special', 'Special', '12:25', '13:10', 45, 'instruction', 'specialist'),
      p('t3', 'Transition', '13:10', '13:15', 5, 'transition'),
      p('math-win', 'Math WIN', '13:15', '13:45', 30, 'instruction', 'math-win'),
      p('t4', 'Transition', '13:45', '13:50', 5, 'transition'),
      p('math', 'Math', '13:50', '14:50', 60, 'instruction', 'math'),
      p('recess', 'Recess', '14:50', '15:05', 15, 'break'),
      p('ss', 'SS/Science/SEL', '15:05', '15:35', 30, 'instruction', 'ss-science-sel'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
  {
    id: 'gk-a',
    label: 'K · Group A',
    endOfDay: '15:40',
    periods: [
      p('mm', 'Morning Meeting', '09:10', '09:25', 15, 'instruction', 'morning-meeting'),
      p('ela-win', 'ELA WIN', '09:25', '09:55', 30, 'instruction', 'ela-win'),
      p('p95', '95%', '09:55', '10:25', 30, 'instruction', '95'),
      p('ob', 'Outdoor Break', '10:25', '10:35', 10, 'break'),
      p('t1', 'Transition', '10:35', '10:40', 5, 'transition'),
      p('al', 'A & L', '10:40', '11:40', 60, 'instruction', 'a-and-l'),
      p('t2', 'Transition', '11:40', '11:45', 5, 'transition'),
      p('lunch', 'Lunch', '11:45', '12:25', 40, 'break'),
      p('t3', 'Transition', '12:25', '12:30', 5, 'transition'),
      p('math', 'Math', '12:30', '13:15', 45, 'instruction', 'math'),
      p('special', 'Special', '13:15', '14:00', 45, 'instruction', 'specialist'),
      p('recess', 'Recess', '14:00', '14:15', 15, 'break'),
      p('t4', 'Transition', '14:15', '14:20', 5, 'transition'),
      p('math-win', 'Math WIN', '14:20', '14:50', 30, 'instruction', 'math-win'),
      p('ss', 'PDR/SS/Science/SEL', '14:50', '15:35', 45, 'instruction', 'ss-science-sel'),
      p('eod', 'End of Day', '15:35', '15:40', 5, 'transition'),
    ],
  },
];

/** @type {SchoolSchedule} */
export const TES_SCHOOL = {
  id: 'tes',
  name: 'TES',
  year: '2026-2027',
  grades: TES_GRADES,
};

export const DEFAULT_GRADE_ID = 'g3';

/** @returns {SchoolSchedule} */
export function getSchool(_schoolId = 'tes') {
  return TES_SCHOOL;
}

export function listGrades(schoolId = 'tes') {
  return getSchool(schoolId).grades;
}

export function getGradeSchedule(schoolId, gradeId) {
  const school = getSchool(schoolId);
  return (
    school.grades.find((g) => g.id === gradeId) ||
    school.grades.find((g) => g.id === DEFAULT_GRADE_ID) ||
    school.grades[0]
  );
}

/** Instructional periods only — content blocks teachers attach pacings to. */
export function instructionalPeriods(grade) {
  return (grade?.periods || []).filter((p) => p.kind === 'instruction');
}

/** Unique content keys with total instructional minutes for one day. */
export function availableMinutesByContent(grade) {
  /** @type {Map<string, { contentKey: string, label: string, minutes: number, periodIds: string[] }>} */
  const map = new Map();
  for (const period of instructionalPeriods(grade)) {
    const key = period.contentKey || period.id;
    const prev = map.get(key);
    if (prev) {
      prev.minutes += period.minutes;
      prev.periodIds.push(period.id);
    } else {
      map.set(key, {
        contentKey: key,
        label: period.label,
        minutes: period.minutes,
        periodIds: [period.id],
      });
    }
  }
  return [...map.values()];
}

export function totalInstructionalMinutes(grade) {
  return instructionalPeriods(grade).reduce((sum, p) => sum + p.minutes, 0);
}

/** HH:MM → minutes since midnight */
export function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '00:00')
    .split(':')
    .map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function isPastEndOfDay(grade, now = new Date()) {
  const end = timeToMinutes(grade?.endOfDay || '15:40');
  return now.getHours() * 60 + now.getMinutes() >= end;
}

export function isBeforeSchoolStart(grade, now = new Date()) {
  const first = grade?.periods?.[0];
  if (!first) return now.getHours() < 9;
  return now.getHours() * 60 + now.getMinutes() < timeToMinutes(first.start);
}
