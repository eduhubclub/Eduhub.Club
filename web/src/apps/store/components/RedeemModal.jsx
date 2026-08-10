import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { StudentMultiSelect } from '../../behavior/components/StudentMultiSelect';
import {
  formatStorePrice,
  itemAllowsEitherWallet,
  resolveStoreWallet,
} from '../../../data/store/storeModel';
import { readBehaviorSyncToBank } from '../../behavior/BehaviorContext';
import { studentDisplayName } from '../../../data/students/displayName';
import { getBankBalance } from '../../bank/bankAccountsStorage';
import { getBehaviorPoints } from '../../behavior/behaviorState';
import { studentHasPurchased } from '../../../data/store/storeStorage';

/**
 * Teacher multi-select redeem, or single-student self-serve with PIN.
 */
export function RedeemModal({
  isOpen,
  item,
  roster,
  classId,
  theme,
  isDarkMode,
  settings,
  mode = 'teacher', // 'teacher' | 'selfServe'
  onClose,
  onRedeem,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [preferredWallet, setPreferredWallet] = useState('bank');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const syncToBank = readBehaviorSyncToBank();
  const needsWalletPick =
    Boolean(item) &&
    itemAllowsEitherWallet(item.currency) &&
    settings.connectBank &&
    settings.connectBehavior &&
    !syncToBank;

  const [eligibilityTick, setEligibilityTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPreferredWallet('bank');
      setError('');
      setSelectedIds([]);
      setStudentId('');
      setPin('');
      setEligibilityTick((n) => n + 1);
    }
  }, [isOpen, item?.id]);

  const wallet = useMemo(() => {
    if (!item) return null;
    return resolveStoreWallet({
      connectBank: settings.connectBank,
      connectBehavior: settings.connectBehavior,
      syncToBank,
      itemCurrency: item.currency,
      preferredWallet: needsWalletPick ? preferredWallet : null,
    });
  }, [item, settings, syncToBank, needsWalletPick, preferredWallet]);

  const { disabledIds, disabledReasonById } = useMemo(() => {
    const ids = [];
    const reasons = {};
    if (!item || !classId) {
      return { disabledIds: ids, disabledReasonById: reasons };
    }
    const price = Math.max(0, Number(item.price) || 0);
    for (const s of roster || []) {
      const id = String(s.id);
      if (
        !item.allowRepurchase &&
        studentHasPurchased(classId, id, item.id)
      ) {
        ids.push(id);
        reasons[id] = 'Already purchased';
        continue;
      }
      if (!wallet) continue;
      const balance =
        wallet === 'bank'
          ? getBankBalance({ classId, roster, studentId: id })
          : getBehaviorPoints(classId, id);
      if (balance < price) {
        ids.push(id);
        reasons[id] = 'Not enough balance';
      }
    }
    return { disabledIds: ids, disabledReasonById: reasons };
    // eligibilityTick forces a re-read of purchase/balance storage when modal opens
  }, [item, wallet, classId, roster, eligibilityTick]);

  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds]);

  useEffect(() => {
    if (!disabledSet.size) return;
    setSelectedIds((ids) => ids.filter((id) => !disabledSet.has(String(id))));
    setStudentId((id) => (disabledSet.has(String(id)) ? '' : id));
  }, [disabledSet]);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const payload = needsWalletPick ? { preferredWallet } : {};
      const result =
        mode === 'selfServe'
          ? onRedeem({
              item,
              selfServeStudentId: studentId,
              pin,
              ...payload,
            })
          : onRedeem({
              item,
              studentIds: selectedIds,
              ...payload,
            });
      if (!result?.ok) {
        setError(result?.error || 'Redeem failed.');
        return;
      }
      setSelectedIds([]);
      setStudentId('');
      setPin('');
      setEligibilityTick((n) => n + 1);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!item) return null;

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <Modal
      isOpen={isOpen}
      title={item.name}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <ModalPrimaryButton
          theme={theme}
          onClick={submit}
          disabled={
            busy ||
            !wallet ||
            (mode === 'teacher' ? !selectedIds.length : !studentId)
          }
        >
          {settings.requireApproval && mode === 'selfServe'
            ? 'Submit for approval'
            : `Redeem · ${formatStorePrice(item, wallet)}`}
        </ModalPrimaryButton>
      }
    >
      <div className="space-y-4 p-6">
        {needsWalletPick ? (
          <label className="block space-y-1">
            <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              Pay with
            </span>
            <select
              className={fieldClass}
              value={preferredWallet}
              onChange={(e) => setPreferredWallet(e.target.value)}
            >
              <option value="bank">Bank $</option>
              <option value="points">Behavior points</option>
            </select>
          </label>
        ) : null}

        {mode === 'teacher' ? (
          <StudentMultiSelect
            roster={roster}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            theme={theme}
            isDarkMode={isDarkMode}
            disabledIds={disabledIds}
            disabledReasonById={disabledReasonById}
          />
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                Student
              </span>
              <select
                className={fieldClass}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">Select…</option>
                {roster.map((s) => {
                  const id = String(s.id);
                  const reason = disabledReasonById[id];
                  return (
                    <option key={id} value={id} disabled={Boolean(reason)}>
                      {studentDisplayName(s)}
                      {reason ? ` (${reason})` : ''}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                Bank PIN
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className={fieldClass}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder="4-digit PIN"
              />
            </label>
          </div>
        )}

        {error ? (
          <p className={`${TYPE.bodySm} text-rose-500`}>{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
