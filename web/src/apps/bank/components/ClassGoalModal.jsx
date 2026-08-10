import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { TIMEFRAME_PRESETS, createClassGoal } from '../classGoalStorage';

/**
 * Create or edit the class savings goal (name, amount, timeframe).
 */
export function ClassGoalModal({
  open,
  theme,
  isDarkMode,
  existingGoal = null,
  classBalance,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframeId, setTimeframeId] = useState('14');
  const [customDays, setCustomDays] = useState('21');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existingGoal) {
      setName(existingGoal.name || '');
      setAmount(String(existingGoal.targetAmount || ''));
      const match = TIMEFRAME_PRESETS.find(
        (p) => p.days === Number(existingGoal.timeframeDays),
      );
      if (match) {
        setTimeframeId(match.id);
      } else {
        setTimeframeId('custom');
        setCustomDays(String(existingGoal.timeframeDays || 21));
      }
    } else {
      setName('');
      setAmount('');
      setTimeframeId('14');
      setCustomDays('21');
    }
    setError('');
  }, [open, existingGoal]);

  if (!open) return null;

  const fieldClass = `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none ${
    isDarkMode
      ? 'bg-slate-900 border-slate-600 text-slate-100'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  const timeframeDays =
    timeframeId === 'custom'
      ? Number(customDays)
      : TIMEFRAME_PRESETS.find((p) => p.id === timeframeId)?.days || 14;

  const submit = () => {
    const result = createClassGoal(
      {
        name,
        targetAmount: amount,
        timeframeDays,
      },
      // Editing keeps original starting balance so progress is not reset.
      existingGoal
        ? existingGoal.startingBalance
        : classBalance,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const goal = existingGoal
      ? {
          ...result.goal,
          createdAt: existingGoal.createdAt,
          startingBalance: existingGoal.startingBalance,
        }
      : result.goal;
    onSave(goal);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      title={existingGoal ? 'Edit class goal' : 'Set class goal'}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} onClick={submit}>
            {existingGoal ? 'Save goal' : 'Start goal'}
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Progress counts money the class earns after you start — not the
          balance already in student accounts.
        </p>

        <div>
          <label className={`mb-1.5 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Goal name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Class pizza party"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={`mb-1.5 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Dollar amount
          </label>
          <div className="relative">
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}
            >
              $
            </span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className={`${fieldClass} pl-7`}
            />
          </div>
        </div>

        <div>
          <label className={`mb-1.5 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Timeframe
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIMEFRAME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTimeframeId(preset.id)}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} transition-colors ${
                  timeframeId === preset.id
                    ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                    : isDarkMode
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTimeframeId('custom')}
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} transition-colors ${
                timeframeId === 'custom'
                  ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                  : isDarkMode
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Custom
            </button>
          </div>
          {timeframeId === 'custom' ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className={`${fieldClass} max-w-[8rem]`}
                aria-label="Custom days"
              />
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                days
              </span>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className={`${TYPE.bodySm} text-rose-500`} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
