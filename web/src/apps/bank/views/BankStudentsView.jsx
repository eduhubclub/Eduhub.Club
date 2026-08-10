import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, QrCode } from 'lucide-react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { StudentBankQr } from '../../../shared/StudentBankQr';
import { TYPE } from '../../../shared/typography';
import { APP_BOARD_PAD, APP_SCROLL_BOARD } from '../../../shared/layout';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { formatMoney } from '../bankState';
import { useBank } from '../BankContext';
import { studentDisplayName } from '../../../data/students/displayName';
import { resolveStoreBankTxImage } from '../storeTxImage';

/**
 * Single-student bank profile (PIN / goal / ClassBank QR).
 * Opened from a Bank balance card.
 */
export function BankStudentDetail({ student, isDarkMode, theme, onBack }) {
  const { getAccount, setPin, setGoal } = useBank();
  const [pinVisible, setPinVisible] = useState(false);
  const [editedPin, setEditedPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const account = student ? getAccount(student.id) : null;

  const inputClass = `w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${
    isDarkMode
      ? 'bg-slate-900 border-slate-600 text-slate-100'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  if (!student || !account) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
          onClick={onBack}
        >
          <ChevronLeft size={18} />
          Back to bank
        </button>
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          Student account not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        className={`edu-control inline-flex items-center gap-1 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
        onClick={() => {
          setPinVisible(false);
          setPinError('');
          onBack?.();
        }}
      >
        <ChevronLeft size={18} />
        Back to bank
      </button>

      <div
        className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <StudentAvatar student={student} theme={theme} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
              {studentDisplayName(student)}
            </h1>
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              {account.job} · {formatMoney(account.salary)} salary
            </p>
          </div>
          <p className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
            {formatMoney(account.balance)}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div
            className={`rounded-xl border-[1.5px] p-4 ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
          >
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Behavior points
            </p>
            <p className={`${TYPE.titleMd} mt-1 ${theme.colorOnSurface}`}>
              {account.behaviorPoints}
            </p>
          </div>
          <div
            className={`rounded-xl border-[1.5px] p-4 ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
          >
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Savings goal
            </p>
            <p className={`${TYPE.titleMd} mt-1 ${theme.colorOnSurface}`}>
              {account.goal?.item || 'None'} · {formatMoney(account.goal?.amount)}
            </p>
            <button
              type="button"
              className={`edu-control mt-2 rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={() =>
                setGoal(student.id, {
                  item: 'Prize Box',
                  amount: 100,
                })
              }
            >
              Set Prize Box goal
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>PIN</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type={pinVisible ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={4}
              className={`${inputClass} max-w-[8rem]`}
              value={editedPin || account.pin}
              onChange={(e) =>
                setEditedPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
            />
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] p-2 ${theme.colorOutline}`}
              onClick={() => setPinVisible((v) => !v)}
              aria-label={pinVisible ? 'Hide PIN' : 'Show PIN'}
            >
              {pinVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={() => {
                const pin = editedPin || account.pin;
                const result = setPin(student.id, pin);
                if (!result.ok) setPinError(result.error);
                else {
                  setPinError('');
                  setEditedPin('');
                }
              }}
            >
              Save PIN
            </button>
            <button
              type="button"
              className={`edu-control inline-flex items-center gap-1 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() => setQrOpen(true)}
            >
              <QrCode size={16} />
              Bank card QR
            </button>
          </div>
          {pinError ? (
            <p className={`${TYPE.bodySm} text-rose-500`}>{pinError}</p>
          ) : null}
        </div>

        <div className="mt-6">
          <p className={`${TYPE.titleSm} mb-2 ${theme.colorOnSurface}`}>
            Recent transactions
          </p>
          <ul className="space-y-2">
            {(account.transactions || []).slice(0, 8).map((tx) => {
              const storeImage = resolveStoreBankTxImage(tx);
              return (
                <li
                  key={tx.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutlineVariant}`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    {storeImage ? (
                      <img
                        src={storeImage}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                      />
                    ) : null}
                    <span
                      className={`min-w-0 truncate ${TYPE.bodySm} ${theme.colorOnSurface}`}
                    >
                      {tx.description} · {tx.date}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 ${TYPE.labelMd} ${
                      tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {tx.type === 'deposit' ? '+' : '−'}
                    {formatMoney(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={qrOpen}
        title="Bank card QR"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setQrOpen(false)}
        footer={
          <div className="flex justify-end">
            <ModalPrimaryButton theme={theme} onClick={() => setQrOpen(false)}>
              Done
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="space-y-3 p-6 text-center">
          <StudentAvatar
            student={student}
            theme={theme}
            size="lg"
            className="mx-auto"
          />
          <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            {studentDisplayName(student)}
          </p>
          <StudentBankQr
            student={student}
            size={160}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Print or save this card for classroom login. PIN is entered after
            scanning.
          </p>
        </div>
      </Modal>
    </div>
  );
}
