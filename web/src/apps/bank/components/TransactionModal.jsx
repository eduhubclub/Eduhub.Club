import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { useBank } from '../BankContext';
import { BankKeypad, applyKeypadKey } from './BankKeypad';
import { studentDisplayName } from '../../../data/students/displayName';

export function TransactionModal({
  open,
  student,
  type,
  theme,
  isDarkMode,
  onClose,
}) {
  const { depositOrDeduct } = useBank();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeField, setActiveField] = useState('amount');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setDescription('');
    setPin('');
    setError('');
    setShowKeypad(false);
    setActiveField('amount');
  }, [open, student?.id, type]);

  if (!open || !student) return null;

  const title = type === 'deposit' ? 'Deposit' : 'Deduct';
  const fieldClass = (field) =>
    `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none transition-shadow ${
      activeField === field && showKeypad ? `ring-2 ${theme.ring}` : ''
    } ${
      isDarkMode
        ? 'bg-slate-900 border-slate-600 text-slate-100'
        : 'bg-white border-slate-300 text-slate-900'
    }`;

  const onKey = (key) => {
    if (activeField === 'pin') {
      setPin((prev) => applyKeypadKey(prev, key, { maxLength: 4 }));
      return;
    }
    setAmount((prev) =>
      applyKeypadKey(prev, key, { maxLength: 6, stripLeadingZeros: true }),
    );
  };

  const submit = () => {
    const result = depositOrDeduct({
      studentId: student.id,
      amount,
      type,
      description,
      pin,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      title={`${title} — ${studentDisplayName(student)}`}
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
              Confirm
            </ModalPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-6">
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
            placeholder="0"
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
            placeholder={type === 'deposit' ? 'Deposit' : 'Deduction'}
          />
        </label>
        <label className="block space-y-1">
          <span
            className={`${TYPE.labelMd} ${
              activeField === 'pin' && showKeypad
                ? theme.text
                : theme.colorOnSurfaceVariant
            }`}
          >
            Student PIN
          </span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onFocus={() => setActiveField('pin')}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className={fieldClass('pin')}
            placeholder="••••"
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
