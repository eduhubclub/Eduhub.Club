import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  MessageSquareText,
  Briefcase,
  PartyPopper,
  Utensils,
  ImagePlus,
  CloudSun,
} from 'lucide-react';
import { DateWidget } from './DateWidget';
import { MessageWidget } from './MessageWidget';
import { AttendanceWidget } from './AttendanceWidget';
import { LunchWidget } from './LunchWidget';
import { JobsWidget } from './JobsWidget';
import { TimerWidget } from './TimerWidget';
import { NoveltyWidget } from './NoveltyWidget';
import { CustomWidget } from './CustomWidget';
import { WeatherWidget } from './WeatherWidget';

/**
 * Legacy CSS spans (prefer stored layout rects on the live board).
 * @type {Record<string, string>}
 */
export const PIN_SIZE_CLASS = {
  s: 'col-span-2 row-span-2 min-h-0 min-w-0',
  m: 'col-span-4 row-span-2 min-h-0 min-w-0',
  l: 'col-span-6 row-span-3 min-h-0 min-w-0',
  banner: 'col-span-12 row-span-1 min-h-0 min-w-0',
};

/** @type {Record<string, string>} */
export const PIN_SIZE_CLASS_VERTICAL = {
  s: 'col-span-2 row-span-2 min-h-0 min-w-0',
  m: 'col-span-3 row-span-2 min-h-0 min-w-0',
  l: 'col-span-6 row-span-2 min-h-0 min-w-0',
};

/**
 * @param {string} [size]
 * @param {string} [orientation]
 */
export function pinLayoutClass(size, orientation) {
  const map =
    orientation === 'vertical' ? PIN_SIZE_CLASS_VERTICAL : PIN_SIZE_CLASS;
  return map[size] || map.m;
}

/** Board fills the stage; no outer scroll. */
export const BOARD_MASONRY_CLASS =
  'grid h-full min-h-0 w-full grid-cols-12 gap-2 sm:gap-3 [grid-auto-flow:dense] [grid-auto-rows:minmax(0,1fr)] content-stretch';

export const WIDGET_CATALOG = [
  {
    type: 'date',
    label: 'Today',
    description: 'Weekday and date',
    Icon: CalendarDays,
    defaultSize: 'm',
  },
  {
    type: 'weather',
    label: 'Weather',
    description: 'Local temperature and conditions',
    Icon: CloudSun,
    defaultSize: 's',
  },
  {
    type: 'novelty',
    label: 'Fun Day',
    description: 'Novelty calendar — today’s fun observances',
    Icon: PartyPopper,
    defaultSize: 'm',
  },
  {
    type: 'message',
    label: 'Instructions',
    description: 'Small card — morning message and optional image',
    Icon: MessageSquareText,
    defaultSize: 's',
  },
  {
    type: 'attendance',
    label: 'Check in',
    description: 'Students tap their name to check in',
    Icon: ClipboardCheck,
    defaultSize: 'l',
  },
  {
    type: 'lunch',
    label: 'Hot lunch',
    description: 'Students choose school or home lunch',
    Icon: Utensils,
    defaultSize: 'l',
  },
  {
    type: 'jobs',
    label: 'Jobs',
    description: 'Classroom job assignments',
    Icon: Briefcase,
    defaultSize: 'm',
  },
  {
    type: 'timer',
    label: 'Timer',
    description: 'Quick countdown for morning routines',
    Icon: Clock,
    defaultSize: 's',
  },
  {
    type: 'custom',
    label: 'Custom card',
    description: 'Small card — title, text, and optional image',
    Icon: ImagePlus,
    defaultSize: 's',
    allowMultiple: true,
  },
];

/** @type {Record<string, import('react').ComponentType<any>>} */
export const WIDGET_COMPONENTS = {
  date: DateWidget,
  weather: WeatherWidget,
  novelty: NoveltyWidget,
  message: MessageWidget,
  attendance: AttendanceWidget,
  lunch: LunchWidget,
  jobs: JobsWidget,
  timer: TimerWidget,
  custom: CustomWidget,
};

export function getWidgetMeta(type) {
  return WIDGET_CATALOG.find((w) => w.type === type) || null;
}
