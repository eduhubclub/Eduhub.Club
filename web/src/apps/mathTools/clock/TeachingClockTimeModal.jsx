import { useEffect, useState } from 'react';
import { Check, Delete, Keyboard } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';

const MERIDIEM_OPTIONS = [
  { id: 'AM', label: 'AM' },
  { id: 'PM', label: 'PM' },
];

/**
 * Set teaching-clock time via fields + on-screen keypad (hours, minutes, seconds).
 */
export function TeachingClockTimeModal({
  isOpen,
  onClose,
  onApply,
  isDarkMode,
  theme,
  hour24 = false,
  initialHours = 12,
  initialMinutes = 0,
  initialSeconds = 0,
  initialMeridiem = 'AM',
}) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [meridiem, setMeridiem] = useState('AM');
  const [showKeypad, setShowKeypad] = useState(true);
  const [activeInput, setActiveInput] = useState('hours');

  useEffect(() => {
    if (!isOpen) return;
    setHours(String(initialHours));
    setMinutes(
      initialMinutes > 0 ? String(initialMinutes).padStart(2, '0') : '',
    );
    setSeconds(
      initialSeconds > 0 ? String(initialSeconds).padStart(2, '0') : '',
    );
    setMeridiem(initialMeridiem === 'PM' ? 'PM' : 'AM');
    setShowKeypad(true);
    setActiveInput('hours');
  }, [
    isOpen,
    initialHours,
    initialMinutes,
    initialSeconds,
    initialMeridiem,
  ]);

  const maxLen = 2;

  /** Normalize typed / keypad digits into a field string. */
  const clampDigits = (field, digits) => {
    const raw = String(digits ?? '').replace(/\D/g, '');
    if (!raw) return '';
    let num = parseInt(raw, 10);
    if (!Number.isFinite(num)) return '';
    if (field === 'hours') {
      if (hour24) {
        if (num > 23) num = 23;
        return String(num);
      }
      if (num > 12) num = 12;
      if (num === 0) return raw.length >= 2 ? '12' : raw;
      return String(num);
    }
    if (num > 59) num = 59;
    return String(num);
  };

  const setField = (field, value) => {
    const next = clampDigits(field, value);
    if (field === 'hours') setHours(next);
    else if (field === 'minutes') setMinutes(next);
    else setSeconds(next);
  };

  const appendKey = (prev, field, val) => {
    const digits = String(prev ?? '').replace(/\D/g, '');
    const emptyOrZero = !digits || /^0+$/.test(digits);
    const full = digits.length >= maxLen;
    // Fresh entry when empty/zero-padded or already at max length.
    if (emptyOrZero || full) {
      return clampDigits(field, val);
    }
    return clampDigits(field, digits + val);
  };

  const handleKeypress = (val) => {
    if (val === 'del') {
      if (activeInput === 'hours') setHours((prev) => prev.slice(0, -1));
      else if (activeInput === 'minutes')
        setMinutes((prev) => prev.slice(0, -1));
      else setSeconds((prev) => prev.slice(0, -1));
      return;
    }
    if (activeInput === 'hours') {
      setHours((prev) => appendKey(prev, 'hours', val));
    } else if (activeInput === 'minutes') {
      setMinutes((prev) => appendKey(prev, 'minutes', val));
    } else {
      setSeconds((prev) => appendKey(prev, 'seconds', val));
    }
  };

  const apply = () => {
    let h = parseInt(hours, 10);
    if (!Number.isFinite(h)) h = hour24 ? 0 : 12;
    if (!hour24 && h === 0) h = 12;
    onApply({
      hours: h,
      minutes: parseInt(minutes, 10) || 0,
      seconds: parseInt(seconds, 10) || 0,
      meridiem,
    });
  };

  const inputClass = (field) =>
    `w-full px-3 py-3 rounded-xl border text-xl font-black outline-none transition-all shadow-sm tabular-nums text-center placeholder:font-black placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
      activeInput === field && showKeypad
        ? `ring-2 ${theme.ring} border-transparent`
        : ''
    } ${
      isDarkMode
        ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-500`
        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-400`
    }`;

  const labelClass = (field) =>
    `block ${TYPE.labelMicro} mb-2 ${
      activeInput === field && showKeypad
        ? theme.text
        : theme.colorOnSurfaceVariant
    }`;

  const fieldInput = (field, value, placeholder) => (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value}
      onFocus={() => setActiveInput(field)}
      onClick={() => setActiveInput(field)}
      onChange={(e) => setField(field, e.target.value)}
      placeholder={placeholder}
      aria-label={field}
      className={inputClass(field)}
    />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set time"
      theme={theme}
      isDarkMode={isDarkMode}
      maxWidth="max-w-sm"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`edu-control px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center ${
              showKeypad
                ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`
            }`}
            title="Toggle on-screen keypad"
            aria-label="Toggle on-screen keypad"
            aria-pressed={showKeypad}
          >
            <Keyboard size={20} />
          </button>
          <ModalPrimaryButton theme={theme} onClick={apply}>
            <span className="inline-flex items-center gap-1.5">
              <Check size={16} strokeWidth={2.5} /> Set time
            </span>
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <label className={labelClass('hours')}>Hours</label>
            {fieldInput('hours', hours, hour24 ? '0' : '12')}
          </div>
          <div className="flex-1 min-w-0">
            <label className={labelClass('minutes')}>Minutes</label>
            {fieldInput('minutes', minutes, '00')}
          </div>
          <div className="flex-1 min-w-0">
            <label className={labelClass('seconds')}>Seconds</label>
            {fieldInput('seconds', seconds, '00')}
          </div>
        </div>

        {!hour24 ? (
          <div>
            <p
              className={`mb-1.5 ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
            >
              AM / PM
            </p>
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              value={meridiem}
              onChange={setMeridiem}
              options={MERIDIEM_OPTIONS}
            />
          </div>
        ) : null}

        {showKeypad ? (
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map(
              (num) => (
                <button
                  key={num}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKeypress(num)}
                  className={`edu-control p-3 rounded-xl text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                    isDarkMode
                      ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} ${theme.colorOutline}`
                      : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutlineVariant}`
                  }`}
                >
                  {num}
                </button>
              ),
            )}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleKeypress('del')}
              className={`edu-control p-3 flex items-center justify-center rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                isDarkMode
                  ? `${theme.colorErrorContainer} ${theme.colorOnErrorContainer} ${theme.colorOutline}`
                  : 'bg-rose-50 text-rose-500 border-rose-200'
              }`}
              aria-label="Delete"
            >
              <Delete size={24} />
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
