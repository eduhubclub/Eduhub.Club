import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { TEACHER_PIN } from '../bankState';
import { useBank } from '../BankContext';
import { StudentMultiSelect } from './StudentMultiSelect';
import { BankKeypad, applyKeypadKey } from './BankKeypad';

export function PaydayModal({ open, roster, theme, isDarkMode, onClose }) {
  const { payday, getAccount } = useBank();
  const [selectedIds, setSelectedIds] = useState([]);
  const [teacherPin, setTeacherPin] = useState('');
  const [error, setError] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(
      roster
        .filter((s) => (getAccount(s.id)?.salary || 0) > 0)
        .map((s) => String(s.id)),
    );
    setTeacherPin('');
    setError('');
    setShowKeypad(false);
  }, [open, roster, getAccount]);

  if (!open) return null;

  const fieldClass = `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none transition-shadow ${
    showKeypad ? `ring-2 ${theme.ring}` : ''
  } ${
    isDarkMode
      ? 'bg-slate-900 border-slate-600 text-slate-100'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  const submit = () => {
    const result = payday({ studentIds: selectedIds, teacherPin });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      title="Payday"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowKeypad((v) => !v)}
            className={`edu-control px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center ${
              showKeypad
                ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
            }`}
            title="Toggle on-screen keypad"
            aria-label="Toggle on-screen keypad"
            aria-pressed={showKeypad}
          >
            <Keyboard size={20} />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
              onClick={onClose}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={submit}>
              Pay selected
            </ModalPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Pays each selected student their job salary. Teacher PIN hint:{' '}
          {TEACHER_PIN}
        </p>
        <StudentMultiSelect
          roster={roster}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          theme={theme}
          isDarkMode={isDarkMode}
        />
        <label className="block space-y-1">
          <span
            className={`${TYPE.labelMd} ${
              showKeypad ? theme.text : theme.colorOnSurfaceVariant
            }`}
          >
            Teacher PIN
          </span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={teacherPin}
            onChange={(e) =>
              setTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className={fieldClass}
          />
        </label>
        {showKeypad ? (
          <BankKeypad
            theme={theme}
            isDarkMode={isDarkMode}
            onKey={(key) =>
              setTeacherPin((prev) => applyKeypadKey(prev, key, { maxLength: 4 }))
            }
          />
        ) : null}
        {error ? (
          <p className={`${TYPE.bodySm} text-rose-500`}>{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
