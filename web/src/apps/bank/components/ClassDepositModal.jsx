import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { TEACHER_PIN } from '../bankState';
import { useBank } from '../BankContext';
import { BankKeypad, applyKeypadKey } from './BankKeypad';

export function ClassDepositModal({ open, theme, isDarkMode, onClose }) {
  const { classDeposit } = useBank();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Class Deposit');
  const [teacherPin, setTeacherPin] = useState('');
  const [error, setError] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeField, setActiveField] = useState('amount');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setDescription('Class Deposit');
    setTeacherPin('');
    setError('');
    setShowKeypad(false);
    setActiveField('amount');
  }, [open]);

  if (!open) return null;

  const fieldClass = (field) =>
    `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none transition-shadow ${
      activeField === field && showKeypad ? `ring-2 ${theme.ring}` : ''
    } ${
      isDarkMode
        ? 'bg-slate-900 border-slate-600 text-slate-100'
        : 'bg-white border-slate-300 text-slate-900'
    }`;

  const onKey = (key) => {
    if (activeField === 'teacherPin') {
      setTeacherPin((prev) => applyKeypadKey(prev, key, { maxLength: 4 }));
      return;
    }
    setAmount((prev) =>
      applyKeypadKey(prev, key, { maxLength: 6, stripLeadingZeros: true }),
    );
  };

  const submit = () => {
    const result = classDeposit({ amount, description, teacherPin });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      title="Class Deposit"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
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
              Deposit to all
            </ModalPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Credits every student the same amount. Teacher PIN hint: {TEACHER_PIN}
        </p>
        <label className="block space-y-1">
          <span
            className={`${TYPE.labelMd} ${
              activeField === 'amount' && showKeypad
                ? theme.text
                : theme.colorOnSurfaceVariant
            }`}
          >
            Amount
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onFocus={() => setActiveField('amount')}
            onChange={(e) =>
              setAmount(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className={fieldClass('amount')}
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Description
          </span>
          <input
            type="text"
            value={description}
            onFocus={() => setActiveField('description')}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass('description')}
          />
        </label>
        <label className="block space-y-1">
          <span
            className={`${TYPE.labelMd} ${
              activeField === 'teacherPin' && showKeypad
                ? theme.text
                : theme.colorOnSurfaceVariant
            }`}
          >
            Teacher PIN
          </span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={teacherPin}
            onFocus={() => setActiveField('teacherPin')}
            onChange={(e) =>
              setTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className={fieldClass('teacherPin')}
          />
        </label>
        {showKeypad && activeField !== 'description' ? (
          <BankKeypad theme={theme} isDarkMode={isDarkMode} onKey={onKey} />
        ) : null}
        {error ? (
          <p className={`${TYPE.bodySm} text-rose-500`}>{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
