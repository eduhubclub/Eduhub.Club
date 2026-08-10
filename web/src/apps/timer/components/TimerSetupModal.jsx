import { useEffect, useState } from 'react';
import { Delete, Keyboard, Play, Plus } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';

/**
 * Set minutes/seconds for whole-class, individual, or saved timers.
 */
export function TimerSetupModal({
  isOpen,
  onClose,
  onSave,
  onStart,
  isDarkMode,
  theme,
  title,
  icon: Icon,
  showSavePreset = false,
  startLabel = 'Start',
  initialMin = '',
  initialSec = '',
}) {
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeInput, setActiveInput] = useState('min');

  useEffect(() => {
    if (!isOpen) return;
    setMin(initialMin === 0 || initialMin ? String(initialMin) : '');
    setSec(initialSec === 0 || initialSec ? String(initialSec) : '');
    setShowKeypad(false);
    setActiveInput('min');
  }, [isOpen, initialMin, initialSec]);

  const handleKeypress = (val) => {
    if (val === 'del') {
      if (activeInput === 'min') setMin((prev) => prev.slice(0, -1));
      else setSec((prev) => prev.slice(0, -1));
      return;
    }
    if (activeInput === 'min') {
      setMin((prev) => {
        const next = prev === '0' ? val : prev + val;
        return next.slice(0, 3);
      });
    } else {
      setSec((prev) => {
        const next = prev === '0' ? val : prev + val;
        const num = parseInt(next, 10);
        if (num > 59) return '59';
        return next.slice(0, 2);
      });
    }
  };

  const hasDuration = Boolean(min || sec);

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-xl font-black outline-none transition-all shadow-sm ${
      activeInput === field && showKeypad
        ? `ring-2 ${theme.ring} border-transparent`
        : ''
    } ${
      isDarkMode
        ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-500`
        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-400`
    }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      theme={theme}
      isDarkMode={isDarkMode}
      maxWidth="max-w-sm"
      headerStart={
        Icon ? (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Icon size={18} />
          </div>
        ) : null
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center ${
              showKeypad
                ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`
            }`}
            title="Toggle on-screen keypad"
          >
            <Keyboard size={20} />
          </button>
          <div className="flex gap-2">
            {showSavePreset && onSave ? (
              <button
                type="button"
                onClick={() => onSave(min, sec)}
                disabled={!hasDuration}
                className={`px-4 py-2.5 rounded-xl ${TYPE.labelLg} transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  isDarkMode
                    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
                    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`
                }`}
              >
                Save
              </button>
            ) : null}
            <ModalPrimaryButton
              theme={theme}
              disabled={!hasDuration}
              onClick={() => onStart(min, sec)}
            >
              {startLabel === 'Start' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Play size={16} fill="currentColor" /> {startLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Plus size={16} strokeWidth={2.5} /> {startLabel}
                </span>
              )}
            </ModalPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              className={`block ${TYPE.labelMicro} mb-2 ${
                activeInput === 'min' && showKeypad
                  ? theme.text
                  : theme.colorOnSurfaceVariant
              }`}
            >
              Minutes
            </label>
            <input
              type="number"
              min="0"
              value={min}
              onFocus={() => setActiveInput('min')}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
              className={inputClass('min')}
            />
          </div>
          <div className="flex-1">
            <label
              className={`block ${TYPE.labelMicro} mb-2 ${
                activeInput === 'sec' && showKeypad
                  ? theme.text
                  : theme.colorOnSurfaceVariant
              }`}
            >
              Seconds
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={sec}
              onFocus={() => setActiveInput('sec')}
              onChange={(e) => setSec(e.target.value)}
              placeholder="0"
              className={inputClass('sec')}
            />
          </div>
        </div>

        {showKeypad ? (
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map(
              (num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypress(num)}
                  className={`p-3 rounded-xl text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border ${
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
              onClick={() => handleKeypress('del')}
              className={`p-3 flex items-center justify-center rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border ${
                isDarkMode
                  ? `${theme.colorErrorContainer} ${theme.colorOnErrorContainer} ${theme.colorOutline}`
                  : 'bg-rose-50 text-rose-500 border-rose-200'
              }`}
            >
              <Delete size={24} />
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
