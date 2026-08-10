import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TEACHER_PIN,
  applyTransaction,
  makeTransaction,
  seedAccountsFromRoster,
  seedPendingApprovals,
  syncAccountsWithRoster,
  undoTransaction,
} from './bankState';
import {
  loadBankAccounts,
  saveBankAccounts,
} from './bankAccountsStorage';

const BankContext = createContext(null);

function initialAccounts(classId, roster) {
  const stored = loadBankAccounts(classId);
  if (stored && Object.keys(stored).length) {
    return syncAccountsWithRoster(stored, roster);
  }
  return seedAccountsFromRoster(roster);
}

export function BankProvider({ roster, classId, children }) {
  const [accounts, setAccounts] = useState(() =>
    initialAccounts(classId, roster),
  );
  const [pendingApprovals, setPendingApprovals] = useState(() =>
    seedPendingApprovals(roster),
  );
  const [seededClassId, setSeededClassId] = useState(classId);
  // When Store/Behavior write accounts in localStorage, skip the next
  // auto-save so in-memory state cannot clobber the fresher ledger.
  const skipNextSaveRef = useRef(false);
  const rosterRef = useRef(roster);
  rosterRef.current = roster;

  useEffect(() => {
    if (classId !== seededClassId) {
      const next = initialAccounts(classId, roster);
      setAccounts(next);
      saveBankAccounts(classId, next);
      setPendingApprovals(seedPendingApprovals(roster));
      setSeededClassId(classId);
      return;
    }
    setAccounts((prev) => syncAccountsWithRoster(prev, roster));
  }, [roster, classId, seededClassId]);

  // Reload when Store / Behavior / another tab writes accounts.
  useEffect(() => {
    const refresh = (event) => {
      if (!classId) return;
      const detailId = event?.detail?.classId;
      if (detailId && detailId !== String(classId)) return;
      const stored = loadBankAccounts(classId);
      if (!stored) return;
      skipNextSaveRef.current = true;
      setAccounts(syncAccountsWithRoster(stored, rosterRef.current));
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('eduHub.bank.accountsUpdated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('eduHub.bank.accountsUpdated', refresh);
    };
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveBankAccounts(classId, accounts);
  }, [accounts, classId]);

  const rosterById = useMemo(() => {
    const map = {};
    for (const s of roster) map[String(s.id)] = s;
    return map;
  }, [roster]);

  const getAccount = useCallback(
    (studentId) => accounts[String(studentId)] || null,
    [accounts],
  );

  const updateAccount = useCallback((studentId, updater) => {
    const id = String(studentId);
    setAccounts((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: updater(current) };
    });
  }, []);

  const depositOrDeduct = useCallback(
    ({ studentId, amount, type, description, pin }) => {
      const account = accounts[String(studentId)];
      if (!account) return { ok: false, error: 'Student not found.' };
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: 'Please enter a valid amount.' };
      }
      if (pin != null && pin !== account.pin) {
        return { ok: false, error: 'Incorrect PIN. Try again.' };
      }
      const tx = makeTransaction({
        description:
          description || (type === 'deposit' ? 'Deposit' : 'Deduction'),
        amount: value,
        type,
      });
      updateAccount(studentId, (a) => applyTransaction(a, tx));
      return { ok: true };
    },
    [accounts, updateAccount],
  );

  const classDeposit = useCallback(
    ({ amount, description, teacherPin }) => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: 'Please enter a valid amount.' };
      }
      if (teacherPin !== TEACHER_PIN) {
        return {
          ok: false,
          error: `Incorrect Teacher PIN. (Hint: use ${TEACHER_PIN})`,
        };
      }
      const tx = makeTransaction({
        description: description || 'Class Deposit',
        amount: value,
        type: 'deposit',
      });
      setAccounts((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          next[id] = applyTransaction(next[id], {
            ...tx,
            id: `${tx.id}-${id}`,
          });
        }
        return next;
      });
      return { ok: true };
    },
    [],
  );

  const payday = useCallback(
    ({ studentIds, teacherPin }) => {
      if (teacherPin !== TEACHER_PIN) {
        return {
          ok: false,
          error: `Incorrect Teacher PIN. (Hint: use ${TEACHER_PIN})`,
        };
      }
      if (!studentIds?.length) {
        return { ok: false, error: 'Please select at least one student.' };
      }
      const selected = new Set(studentIds.map(String));
      setAccounts((prev) => {
        const next = { ...prev };
        for (const id of selected) {
          const a = next[id];
          if (!a || !a.salary) continue;
          const tx = makeTransaction({
            description: `Payday: ${a.job}`,
            amount: a.salary,
            type: 'deposit',
          });
          next[id] = applyTransaction(a, tx);
        }
        return next;
      });
      return { ok: true };
    },
    [],
  );

  const setPin = useCallback(
    (studentId, pin) => {
      if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'PIN must be 4 digits.' };
      updateAccount(studentId, (a) => ({ ...a, pin }));
      return { ok: true };
    },
    [updateAccount],
  );

  const setGoal = useCallback(
    (studentId, goal) => {
      updateAccount(studentId, (a) => ({ ...a, goal }));
    },
    [updateAccount],
  );

  /**
   * Deduct `amount` equally across the roster for a class goal cash-in.
   * Skips students who cannot cover their share when possible; fails if the
   * class cannot fund the full amount.
   */
  const cashInClassGoal = useCallback(
    ({ amount, description }) => {
      const total = Math.round(Number(amount) || 0);
      if (!Number.isFinite(total) || total <= 0) {
        return { ok: false, error: 'Invalid goal amount.' };
      }
      const ids = roster.map((s) => String(s.id)).filter((id) => accounts[id]);
      if (!ids.length) {
        return { ok: false, error: 'No student accounts to cash in from.' };
      }

      const classTotal = ids.reduce(
        (sum, id) => sum + (Number(accounts[id]?.balance) || 0),
        0,
      );
      if (classTotal < total) {
        return {
          ok: false,
          error: `Not enough in student accounts (need $${total}, have $${classTotal}).`,
        };
      }

      // Greedy equal split: assign shares, then top up from students with leftover.
      const shares = {};
      let remaining = total;
      let pool = ids.map((id) => ({
        id,
        balance: Number(accounts[id].balance) || 0,
      }));

      while (remaining > 0 && pool.length) {
        const per = Math.floor(remaining / pool.length);
        if (per === 0) {
          // Distribute leftover $1 at a time
          for (const s of pool) {
            if (remaining <= 0) break;
            if (s.balance <= 0) continue;
            shares[s.id] = (shares[s.id] || 0) + 1;
            s.balance -= 1;
            remaining -= 1;
          }
          pool = pool.filter((s) => s.balance > 0);
          if (remaining > 0 && !pool.length) break;
          continue;
        }

        let took = 0;
        for (const s of pool) {
          const take = Math.min(per, s.balance);
          if (take <= 0) continue;
          shares[s.id] = (shares[s.id] || 0) + take;
          s.balance -= take;
          took += take;
        }
        remaining -= took;
        pool = pool.filter((s) => s.balance > 0);
        if (took === 0) break;
      }

      if (remaining > 0) {
        return {
          ok: false,
          error: `Could not split $${total} across student balances.`,
        };
      }

      const label = description || 'Class goal cash-in';
      setAccounts((prev) => {
        const next = { ...prev };
        for (const [id, share] of Object.entries(shares)) {
          if (!share || !next[id]) continue;
          const tx = makeTransaction({
            description: label,
            amount: share,
            type: 'deduct',
          });
          next[id] = applyTransaction(next[id], tx);
        }
        return next;
      });
      return { ok: true };
    },
    [accounts, roster],
  );

  const undoTx = useCallback((studentId, transactionId) => {
    updateAccount(studentId, (a) => undoTransaction(a, transactionId));
  }, [updateAccount]);

  const approvePending = useCallback((request) => {
    updateAccount(request.studentId, (a) =>
      applyTransaction(
        a,
        makeTransaction({
          description: request.description,
          amount: request.amount,
          type: request.type,
        }),
      ),
    );
    setPendingApprovals((prev) => prev.filter((r) => r.id !== request.id));
  }, [updateAccount]);

  const denyPending = useCallback((requestId) => {
    setPendingApprovals((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const value = {
    accounts,
    pendingApprovals,
    rosterById,
    getAccount,
    depositOrDeduct,
    classDeposit,
    payday,
    setPin,
    setGoal,
    cashInClassGoal,
    undoTx,
    approvePending,
    denyPending,
  };

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used within BankProvider');
  return ctx;
}
