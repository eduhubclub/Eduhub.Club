import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import {
  clockPartsFromDayMinutes,
  dayMinutesFromClockParts,
  MINUTES_PER_DAY,
  normalizeDayMinutes,
} from './teachingClockMath';

export const NUMBER_LINE_TICK_OPTIONS = [
  { id: 1, label: '1 min' },
  { id: 5, label: '5 min' },
  { id: 15, label: '15 min' },
  { id: 30, label: '30 min' },
  { id: 60, label: '1 hr' },
];

const MERIDIEM_OPTIONS = [
  { id: 'AM', label: 'AM' },
  { id: 'PM', label: 'PM' },
];

/** Span in minutes from start → end (overnight wraps past midnight). */
export function numberLineSpanMinutes(startMinutes, endMinutes) {
  const start = normalizeDayMinutes(startMinutes);
  const end = normalizeDayMinutes(endMinutes);
  let span = end - start;
  if (span <= 0) span += MINUTES_PER_DAY;
  return span;
}

function TimeFields({
  label,
  hours,
  minutes,
  meridiem,
  onHours,
  onMinutes,
  onMeridiem,
  isDarkMode,
  theme,
}) {
  const inputClass = `w-full px-2 py-2 rounded-xl border text-base font-black outline-none tabular-nums text-center placeholder:font-black placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  const fieldLabel = `${TYPE.labelMicro} mb-1.5 block ${theme.colorOnSurfaceVariant}`;

  return (
    <div className="space-y-2">
      <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>{label}</p>
      <div className="flex items-end gap-2">
        <div className="w-[4.25rem] shrink-0">
          <label className={fieldLabel}>Hour</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={hours}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
              if (!raw) {
                onHours('');
                return;
              }
              let n = parseInt(raw, 10);
              if (!Number.isFinite(n)) {
                onHours('');
                return;
              }
              if (n > 12) n = 12;
              onHours(String(n));
            }}
            placeholder="12"
            aria-label={`${label} hour`}
            className={inputClass}
          />
        </div>
        <span
          className={`pb-2 text-base font-black ${theme.colorOnSurface}`}
          aria-hidden
        >
          :
        </span>
        <div className="w-[4.25rem] shrink-0">
          <label className={fieldLabel}>Min</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={minutes}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
              if (!raw) {
                onMinutes('');
                return;
              }
              let n = parseInt(raw, 10);
              if (!Number.isFinite(n)) {
                onMinutes('');
                return;
              }
              if (n > 59) n = 59;
              onMinutes(String(n).padStart(raw.length >= 2 ? 2 : 1, '0'));
            }}
            placeholder="00"
            aria-label={`${label} minutes`}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 flex-1 pb-0.5">
          <p className={fieldLabel}>AM / PM</p>
          <SegmentControl
            isDarkMode={isDarkMode}
            theme={theme}
            value={meridiem}
            onChange={onMeridiem}
            options={MERIDIEM_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Configure a time number line: start, end, and tick interval.
 */
export function TimeNumberLineModal({
  isOpen,
  onClose,
  onApply,
  isDarkMode,
  theme,
  initialStartMinutes = 9 * 60,
  initialEndMinutes = 10 * 60,
  initialTickMinutes = 5,
  initialMatchAnalog = false,
  isEditing = false,
}) {
  const [startHours, setStartHours] = useState('9');
  const [startMinutes, setStartMinutes] = useState('00');
  const [startMeridiem, setStartMeridiem] = useState('AM');
  const [endHours, setEndHours] = useState('10');
  const [endMinutes, setEndMinutes] = useState('00');
  const [endMeridiem, setEndMeridiem] = useState('AM');
  const [tickMinutes, setTickMinutes] = useState(5);
  const [matchAnalog, setMatchAnalog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const start = clockPartsFromDayMinutes(initialStartMinutes);
    const end = clockPartsFromDayMinutes(initialEndMinutes);
    setStartHours(String(start.hours));
    setStartMinutes(String(start.minutes).padStart(2, '0'));
    setStartMeridiem(start.meridiem);
    setEndHours(String(end.hours));
    setEndMinutes(String(end.minutes).padStart(2, '0'));
    setEndMeridiem(end.meridiem);
    setTickMinutes(initialTickMinutes);
    setMatchAnalog(Boolean(initialMatchAnalog));
  }, [
    isOpen,
    initialStartMinutes,
    initialEndMinutes,
    initialTickMinutes,
    initialMatchAnalog,
  ]);

  const apply = () => {
    let sh = parseInt(startHours, 10);
    let eh = parseInt(endHours, 10);
    if (!Number.isFinite(sh) || sh === 0) sh = 12;
    if (!Number.isFinite(eh) || eh === 0) eh = 12;
    const start = dayMinutesFromClockParts({
      hours: sh,
      minutes: parseInt(startMinutes, 10) || 0,
      meridiem: startMeridiem,
    });
    const end = dayMinutesFromClockParts({
      hours: eh,
      minutes: parseInt(endMinutes, 10) || 0,
      meridiem: endMeridiem,
    });
    onApply({
      startMinutes: start,
      endMinutes: end,
      tickMinutes,
      matchAnalog,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Time number line"
      theme={theme}
      isDarkMode={isDarkMode}
      maxWidth="max-w-sm"
      footer={
        <div className="flex w-full justify-end">
          <ModalPrimaryButton theme={theme} onClick={apply}>
            {isEditing ? 'Update number line' : 'Add number line'}
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        <TimeFields
          label="Start"
          hours={startHours}
          minutes={startMinutes}
          meridiem={startMeridiem}
          onHours={setStartHours}
          onMinutes={setStartMinutes}
          onMeridiem={setStartMeridiem}
          isDarkMode={isDarkMode}
          theme={theme}
        />
        <TimeFields
          label="End"
          hours={endHours}
          minutes={endMinutes}
          meridiem={endMeridiem}
          onHours={setEndHours}
          onMinutes={setEndMinutes}
          onMeridiem={setEndMeridiem}
          isDarkMode={isDarkMode}
          theme={theme}
        />
        <div>
          <p className={`mb-2 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Tick marks
          </p>
          <div className="flex flex-wrap gap-2">
            {NUMBER_LINE_TICK_OPTIONS.map((opt) => {
              const active = tickMinutes === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTickMinutes(opt.id)}
                  className={`edu-control rounded-full px-3 py-2.5 ${TYPE.labelMd} transition-colors ${
                    active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : isDarkMode
                        ? `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} ${theme.colorOutline} border`
                        : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`
                  }`}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
              Match analog clock
            </p>
            <p className={`mt-1 ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
              Blocks on this line also appear on the clock
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={matchAnalog}
            aria-label="Match analog clock"
            onClick={() => setMatchAnalog((v) => !v)}
            className={`edu-control relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              matchAnalog
                ? theme.colorPrimary
                : isDarkMode
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                matchAnalog ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </Modal>
  );
}
