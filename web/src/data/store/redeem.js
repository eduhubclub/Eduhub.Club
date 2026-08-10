/**
 * Edu.Store redeem orchestration (stock, repurchase, wallet, pending).
 */

import { readBehaviorSyncToBank } from '../../apps/behavior/BehaviorContext';
import {
  applyStoreRedeemToBank,
  getBankBalance,
  verifyBankPin,
} from '../../apps/bank/bankAccountsStorage';
import {
  getBehaviorPoints,
  spendBehaviorPoints,
} from '../../apps/behavior/behaviorState';
import { resolveStoreWallet } from './storeModel';
import { resolveStoreItemImageSrc } from './demoStoreImages';
import { readStoreSettings } from './storeSettings';
import {
  getRemainingStock,
  readPending,
  readPurchases,
  studentHasPurchased,
  upsertCatalogItem,
  writePending,
  writePurchases,
  readCatalog,
} from './storeStorage';

function newPendingId() {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function refreshItemStock(item) {
  if (!item || item.inventoryMode === 'unlimited') return item;
  // Stock on catalog item is the original capacity; remaining is derived from purchases.
  return item;
}

function chargeStudents({
  classId,
  roster,
  studentIds,
  wallet,
  amount,
  itemName,
  itemId,
  imageSrc,
}) {
  if (wallet === 'bank') {
    return applyStoreRedeemToBank({
      classId,
      roster,
      studentIds,
      amount,
      itemName,
      itemId,
      imageSrc,
    });
  }
  return spendBehaviorPoints({
    classId,
    roster,
    studentIds,
    amount,
    itemName,
  });
}

function canStudentBuy(item, classId, studentId) {
  if (!item.allowRepurchase && studentHasPurchased(classId, studentId, item.id)) {
    return { ok: false, error: 'Already purchased.' };
  }
  const remaining = getRemainingStock(item, classId);
  if (remaining <= 0) return { ok: false, error: 'Out of stock.' };
  return { ok: true };
}

/**
 * Teacher or approved redeem. If requireApproval && !forceComplete, enqueue pending.
 */
export function redeemStoreItem({
  classId,
  roster,
  studentIds,
  item,
  settings: settingsPatch,
  pin,
  selfServeStudentId,
  preferredWallet = null,
  forceComplete = false,
}) {
  const settings = { ...readStoreSettings(), ...(settingsPatch || {}) };
  const catalogItem =
    refreshItemStock(item) ||
    readCatalog().find((i) => i.id === String(item?.id));
  if (!catalogItem) return { ok: false, error: 'Item not found.' };

  const syncToBank = readBehaviorSyncToBank();
  const wallet = resolveStoreWallet({
    connectBank: settings.connectBank,
    connectBehavior: settings.connectBehavior,
    syncToBank,
    itemCurrency: catalogItem.currency,
    preferredWallet,
  });
  if (!wallet) {
    if (
      catalogItem.currency === 'both' &&
      settings.connectBank &&
      settings.connectBehavior &&
      !syncToBank
    ) {
      return { ok: false, error: 'Choose Bank or Behavior points.' };
    }
    return { ok: false, error: 'Connect Store to Bank or Behavior in Settings.' };
  }

  let ids = (studentIds || []).map(String).filter(Boolean);
  if (selfServeStudentId) {
    ids = [String(selfServeStudentId)];
    if (settings.studentSelfServe) {
      if (wallet === 'bank') {
        const pinCheck = verifyBankPin({
          classId,
          roster,
          studentId: selfServeStudentId,
          pin,
        });
        if (!pinCheck.ok) return pinCheck;
      } else {
        // Points-only: require bank PIN when an account exists; otherwise teacher-only.
        const pinCheck = verifyBankPin({
          classId,
          roster,
          studentId: selfServeStudentId,
          pin,
        });
        if (!pinCheck.ok) {
          return {
            ok: false,
            error:
              pinCheck.error === 'No bank account.'
                ? 'Self-serve needs a bank PIN. Ask your teacher to redeem.'
                : pinCheck.error,
          };
        }
      }
    }
  }

  if (!ids.length) return { ok: false, error: 'Select at least one student.' };

  if (settings.requireApproval && !forceComplete && !selfServeStudentId) {
    // Teacher redeem still goes pending when approval required? Plan: teacher redeem always works OR approval for self-serve.
    // Spec: "Teacher must approve pending requests" + teacher redeem always. So only self-serve enqueues.
  }

  if (settings.requireApproval && selfServeStudentId && !forceComplete) {
    const pending = readPending(classId);
    pending.unshift({
      id: newPendingId(),
      at: Date.now(),
      itemId: catalogItem.id,
      itemName: catalogItem.name,
      price: catalogItem.price,
      currency: catalogItem.currency,
      preferredWallet: wallet,
      studentIds: ids,
      status: 'pending',
    });
    writePending(classId, pending);
    return { ok: true, pending: true };
  }

  // Stock / repurchase checks (count how many can buy)
  const eligible = [];
  const skipped = [];
  let remaining = getRemainingStock(catalogItem, classId);
  for (const id of ids) {
    const gate = canStudentBuy(catalogItem, classId, id);
    if (!gate.ok) {
      skipped.push({ studentId: id, error: gate.error });
      continue;
    }
    if (remaining !== Infinity && remaining <= 0) {
      skipped.push({ studentId: id, error: 'Out of stock.' });
      continue;
    }
    // Balance check
    if (wallet === 'bank') {
      if (getBankBalance({ classId, roster, studentId: id }) < catalogItem.price) {
        skipped.push({ studentId: id, error: 'Insufficient balance.' });
        continue;
      }
    } else if (getBehaviorPoints(classId, id) < catalogItem.price) {
      skipped.push({ studentId: id, error: 'Insufficient points.' });
      continue;
    }
    eligible.push(id);
    if (remaining !== Infinity) remaining -= 1;
  }

  if (!eligible.length) {
    return {
      ok: false,
      error: skipped[0]?.error || 'No eligible students.',
      failed: skipped,
    };
  }

  const charged = chargeStudents({
    classId,
    roster,
    studentIds: eligible,
    wallet,
    amount: catalogItem.price,
    itemName: catalogItem.name,
    itemId: catalogItem.id,
    imageSrc: resolveStoreItemImageSrc(catalogItem),
  });

  if (!charged.ok) return charged;

  const redeemedIds = charged.redeemedIds || eligible;
  const purchases = readPurchases(classId);
  const at = Date.now();
  for (const studentId of redeemedIds) {
    purchases.unshift({
      id: `purchase-${at}-${studentId}`,
      at,
      itemId: catalogItem.id,
      itemName: catalogItem.name,
      studentId,
      price: catalogItem.price,
      wallet,
    });
  }
  writePurchases(classId, purchases);

  return {
    ok: true,
    redeemedIds,
    failed: [...(charged.failed || []), ...skipped],
    wallet,
  };
}

export function approvePendingRedeem({ classId, roster, pendingId }) {
  const pending = readPending(classId);
  const entry = pending.find((p) => p.id === pendingId);
  if (!entry) return { ok: false, error: 'Request not found.' };
  const item = readCatalog().find((i) => i.id === entry.itemId);
  if (!item) return { ok: false, error: 'Item no longer in catalog.' };

  const result = redeemStoreItem({
    classId,
    roster,
    studentIds: entry.studentIds,
    item,
    preferredWallet: entry.preferredWallet || null,
    forceComplete: true,
  });
  if (!result.ok) return result;

  writePending(
    classId,
    pending.filter((p) => p.id !== pendingId),
  );
  return result;
}

export function denyPendingRedeem({ classId, pendingId }) {
  writePending(
    classId,
    readPending(classId).filter((p) => p.id !== pendingId),
  );
  return { ok: true };
}

// Re-export for callers that upsert after edit
export { upsertCatalogItem };
