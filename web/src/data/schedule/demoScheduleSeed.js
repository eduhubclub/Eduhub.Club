/**
 * Demo Class (`demo-3rd-grade`) elementary schedule seed.
 * Monday–Thursday and Friday block times from classroom.
 */

export const DEMO_SCHEDULE_CLASS_ID = 'demo-3rd-grade';
export const DEMO_SCHEDULE_SEED_REVISION = 2;
export const DEMO_SCHEDULE_REV_KEY = 'eduHub.schedule.demoSeedRevision';

const MTH_SLOTS = [
  { label: 'First Fifteen', startTime: '09:10', endTime: '09:25' },
  { label: 'Flag Salute / Morning Meeting', startTime: '09:20', endTime: '09:30' },
  { label: 'Arts & Letters', startTime: '09:30', endTime: '10:25' },
  { label: '95%', startTime: '10:25', endTime: '10:55' },
  { label: 'Recess / Transition', startTime: '10:55', endTime: '11:10' },
  { label: 'ELA WIN', startTime: '11:10', endTime: '11:40' },
  { label: 'Science / Social Studies', startTime: '11:40', endTime: '12:10' },
  { label: 'Lunch / Recess', startTime: '12:10', endTime: '12:50' },
  { label: 'Math', startTime: '12:50', endTime: '13:50' },
  { label: 'Math WIN', startTime: '13:50', endTime: '14:20' },
  { label: 'Class Jobs', startTime: '14:20', endTime: '14:30' },
  { label: 'Drop Backpacks at Specialist', startTime: '14:30', endTime: '14:35' },
  { label: 'Recess', startTime: '14:35', endTime: '14:50' },
  { label: 'Specialist', startTime: '14:50', endTime: '15:35' },
  { label: 'Dismissal', startTime: '15:35', endTime: '15:40' },
];

const FRI_SLOTS = [
  { label: 'First Fifteen', startTime: '09:10', endTime: '09:20' },
  { label: 'Flag Salute / Morning Meeting', startTime: '09:20', endTime: '09:30' },
  { label: 'Arts & Letters', startTime: '09:30', endTime: '10:15' },
  { label: 'Recess', startTime: '10:15', endTime: '10:35' },
  { label: 'ELA WIN', startTime: '10:35', endTime: '11:00' },
  { label: '95%', startTime: '11:00', endTime: '11:25' },
  { label: 'Lunch and Recess', startTime: '11:25', endTime: '12:05' },
  { label: 'Specialist', startTime: '12:05', endTime: '12:35' },
  { label: 'Transition', startTime: '12:35', endTime: '12:40' },
  { label: 'Math', startTime: '12:40', endTime: '13:40' },
  { label: 'Science / SEL / PDR', startTime: '13:40', endTime: '14:00' },
  { label: 'Class Jobs', startTime: '14:00', endTime: '14:10' },
  { label: 'Dismissal', startTime: '14:10', endTime: '14:15' },
];

function slotsWithIds(prefix, slots) {
  return slots.map((slot, order) => ({
    id: `${prefix}-${order}`,
    label: slot.label,
    order,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

/** Stable demo schedule shape (normalized later by scheduleStorage). */
export function demoClassScheduleSeed() {
  const mthId = 'demo-tmpl-mth';
  const friId = 'demo-tmpl-fri';
  return {
    mode: 'periods',
    dayNumbering: { anchorSessionDay: 1, labelPrefix: 'Day' },
    source: 'teacher',
    templates: [
      {
        id: mthId,
        name: 'Monday–Thursday',
        slots: slotsWithIds('demo-slot-mth', MTH_SLOTS),
      },
      {
        id: friId,
        name: 'Friday',
        slots: slotsWithIds('demo-slot-fri', FRI_SLOTS),
      },
    ],
    // JS getDay(): 0 Sun … 6 Sat
    weekdayTemplateIds: {
      1: mthId, // Mon
      2: mthId,
      3: mthId,
      4: mthId,
      5: friId, // Fri
    },
  };
}
