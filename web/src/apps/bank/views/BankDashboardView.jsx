import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Award,
  Briefcase,
  Coins,
  Landmark,
  LayoutDashboard,
  Lock,
  Target,
  Unlock,
  Users,
} from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
} from '../../../shared/layout';
import { flattenTransactions, formatMoney } from '../bankState';
import {
  classGoalDaysLeft,
  classGoalProgress,
  clearClassGoal,
  loadClassGoal,
  saveClassGoal,
} from '../classGoalStorage';
import { useBank } from '../BankContext';
import { useBankAccess } from '../../../data/bank/BankAccessContext';
import { ClassDepositModal } from '../components/ClassDepositModal';
import { ClassGoalModal } from '../components/ClassGoalModal';
import { PaydayModal } from '../components/PaydayModal';
import { useJobsSyncToBankPreference } from '../../jobs/JobsContext';

/**
 * Bank landing — class snapshot + quick actions (deposit, payday, section jumps).
 */
export function BankDashboardView({
  roster,
  isDarkMode,
  theme,
  classLabel,
  classId,
  onSetActiveTab,
  onOpenApp,
}) {
  const { getAccount, accounts, pendingApprovals, rosterById, cashInClassGoal } =
    useBank();
  const { isBankOpen, toggleBankOpen } = useBankAccess();
  const jobsSyncedToBank = useJobsSyncToBankPreference();
  const [classDepositOpen, setClassDepositOpen] = useState(false);
  const [paydayOpen, setPaydayOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [classGoal, setClassGoal] = useState(() => loadClassGoal(classId));
  const [cashInError, setCashInError] = useState('');

  useEffect(() => {
    setClassGoal(loadClassGoal(classId));
    setCashInError('');
  }, [classId]);

  useEffect(() => {
    const refresh = (event) => {
      const detailId = event?.detail?.classId;
      if (detailId && classId && detailId !== String(classId)) return;
      setClassGoal(loadClassGoal(classId));
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('eduHub.bank.classGoalUpdated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('eduHub.bank.classGoalUpdated', refresh);
    };
  }, [classId]);

  const bankOpen = isBankOpen(classId);

  const total = roster.reduce(
    (sum, s) => sum + (getAccount(s.id)?.balance || 0),
    0,
  );
  const recent = flattenTransactions(accounts, rosterById).slice(0, 5);
  const studentCount = roster.length;

  const progress = classGoalProgress(classGoal, total);
  const daysLeft = classGoal ? classGoalDaysLeft(classGoal) : null;
  const goalReached = Boolean(classGoal && progress.reached);

  const hasAssignedJobs = roster.some((s) => {
    const account = getAccount(s.id);
    if (!account) return false;
    const job = account.job;
    if (!job || job === 'Unassigned') return false;
    return (Number(account.salary) || 0) > 0;
  });
  const paydayEnabled = jobsSyncedToBank && hasAssignedJobs;

  const go = (tab) => onSetActiveTab?.(tab);

  const handleSaveGoal = (goal) => {
    saveClassGoal(classId, goal);
    setClassGoal(goal);
    setCashInError('');
  };

  const handleCashIn = () => {
    if (!classGoal) return;
    const result = cashInClassGoal({
      amount: classGoal.targetAmount,
      description: `Class goal: ${classGoal.name}`,
    });
    if (!result.ok) {
      setCashInError(result.error);
      return;
    }
    clearClassGoal(classId);
    setClassGoal(null);
    setCashInError('');
  };

  const timeframeLabel = (() => {
    if (!classGoal) return null;
    if (daysLeft == null) return null;
    if (daysLeft < 0) {
      const overdue = Math.abs(daysLeft);
      return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
    }
    if (daysLeft === 0) return 'Due today';
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  })();

  const quickActions = [
    {
      id: 'class-deposit',
      title: 'Class deposit',
      blurb: 'Credit every student the same amount',
      icon: Users,
      onClick: () => setClassDepositOpen(true),
      primary: true,
    },
    {
      id: 'payday',
      title: 'Payday',
      blurb: !jobsSyncedToBank
        ? 'Turn on Jobs sync to Bank in settings'
        : hasAssignedJobs
          ? 'Pay job salaries to selected students'
          : 'Assign jobs in Jobs before payday',
      icon: Coins,
      onClick: () => setPaydayOpen(true),
      primary: true,
      disabled: !paydayEnabled,
    },
    {
      id: 'balances',
      title: 'Balances',
      blurb: 'Deposit or deduct per student',
      icon: Landmark,
      onClick: () => go('Bank'),
    },
    {
      id: 'behavior',
      title: 'Behavior',
      blurb: 'Open Behavior to award points',
      icon: Award,
      onClick: () => onOpenApp?.('behavior'),
    },
    {
      id: 'jobs',
      title: 'Jobs',
      blurb: 'Open Jobs for roles and salaries',
      icon: Briefcase,
      onClick: () => onOpenApp?.('jobs'),
    },
    {
      id: 'transactions',
      title: 'Transactions',
      blurb:
        pendingApprovals.length > 0
          ? `${pendingApprovals.length} pending approval${pendingApprovals.length === 1 ? '' : 's'}`
          : 'Ledger and pending approvals',
      icon: ArrowLeftRight,
      onClick: () => go('Transactions'),
    },
  ];

  const stats = [
    { label: 'Class Balance', value: formatMoney(total) },
    {
      label: 'ToDos',
      value: String(pendingApprovals.length),
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className={`h-2 w-full ${theme.colorPrimary}`} aria-hidden />
        <div className={`${APP_BOARD_PAD} flex items-center gap-4`}>
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Users size={26} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className={`${TYPE.titleLg} truncate ${theme.colorOnSurface}`}>
              {classLabel || 'Class'}
            </h1>
            <p className={`mt-1 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              {studentCount} student{studentCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${APP_GRID_CARD} p-3 sm:p-4 ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              {stat.label}
            </p>
            <p className={`mt-1 ${TYPE.titleMd} tabular-nums ${theme.colorOnSurface}`}>
              {stat.value}
            </p>
          </div>
        ))}
        <div
          className={`${APP_GRID_CARD} p-3 sm:p-4 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Student bank
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p
              className={`inline-flex items-center gap-1.5 ${TYPE.titleMd} ${
                bankOpen ? 'text-emerald-600' : theme.colorOnSurfaceVariant
              }`}
            >
              {bankOpen ? (
                <Unlock size={18} strokeWidth={2.25} aria-hidden />
              ) : (
                <Lock size={18} strokeWidth={2.25} aria-hidden />
              )}
              {bankOpen ? 'Open' : 'Closed'}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={bankOpen}
              aria-label={
                bankOpen
                  ? 'Close student bank for this class'
                  : 'Open student bank for this class'
              }
              onClick={() => toggleBankOpen(classId)}
              className={`edu-control relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                bankOpen
                  ? theme.colorPrimary
                  : isDarkMode
                    ? 'bg-slate-700'
                    : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  bankOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {!classGoal ? (
        <button
          type="button"
          onClick={() => setGoalModalOpen(true)}
          className={`edu-control w-full ${APP_GRID_CARD} ${APP_BOARD_PAD} text-left transition-colors ${theme.colorSurface} ${theme.colorOutline} ${
            isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
            >
              <Target size={20} strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                Set a class goal
              </p>
              <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Name a reward, dollar target, and timeframe
              </p>
            </div>
          </div>
        </button>
      ) : goalReached ? (
        <div
          className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
                Class goal reached
              </p>
              <p className={`mt-1 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
                {classGoal.name}
              </p>
              <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {formatMoney(progress.saved)} saved of {formatMoney(progress.target)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                onClick={() => setGoalModalOpen(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                onClick={handleCashIn}
              >
                Cash in {formatMoney(classGoal.targetAmount)}
              </button>
            </div>
          </div>
          <div
            className={`mt-4 h-2.5 overflow-hidden rounded-full ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
            role="progressbar"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Class goal progress"
          >
            <div className={`h-full w-full rounded-full ${theme.colorPrimary}`} />
          </div>
          {cashInError ? (
            <p className={`mt-2 ${TYPE.bodySm} text-rose-500`} role="alert">
              {cashInError}
            </p>
          ) : (
            <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Cash in splits the goal amount equally across student accounts.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setGoalModalOpen(true)}
          className={`edu-control w-full ${APP_GRID_CARD} ${APP_BOARD_PAD} text-left transition-colors ${theme.colorSurface} ${theme.colorOutline} ${
            isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={`min-w-0 truncate ${TYPE.titleMd} ${theme.colorOnSurface}`}>
              {classGoal.name}
            </h2>
            <h3 className={`shrink-0 tabular-nums ${TYPE.titleSm}`}>
              <span className={theme.text}>{formatMoney(progress.saved)}</span>
              <span className={`font-medium ${theme.colorOnSurfaceVariant}`}>
                {' '}
                / {formatMoney(progress.target)}
              </span>
            </h3>
          </div>
          <div
            className={`mt-3 h-2.5 overflow-hidden rounded-full ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
            role="progressbar"
            aria-valuenow={Math.round(progress.ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${classGoal.name} progress`}
          >
            <div
              className={`h-full rounded-full transition-[width] ${theme.colorPrimary}`}
              style={{ width: `${Math.round(progress.ratio * 100)}%` }}
            />
          </div>
          {timeframeLabel ? (
            <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {timeframeLabel}
            </p>
          ) : null}
        </button>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <LayoutDashboard size={18} className={theme.colorOnSurfaceVariant} />
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.disabled ? action.blurb : undefined}
                className={`edu-control ${APP_GRID_CARD} ${APP_BOARD_PAD} text-left transition-colors ${theme.colorSurface} ${theme.colorOutline} ${
                  action.disabled
                    ? 'cursor-not-allowed opacity-40'
                    : isDarkMode
                      ? 'hover:bg-slate-800/80'
                      : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      action.primary
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                        : `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                      {action.title}
                    </p>
                    <p
                      className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                    >
                      {action.blurb}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Recent activity
          </h2>
          <button
            type="button"
            className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.text}`}
            onClick={() => go('Transactions')}
          >
            View all
          </button>
        </div>
        {recent.length === 0 ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No transactions yet. Use Class deposit or Payday to get started.
          </p>
        ) : (
          <ul className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
            {recent.map((row) => (
              <li
                key={`${row.studentId}-${row.id}`}
                className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
                    {row.studentName}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {row.description} · {row.date}
                  </p>
                </div>
                <p
                  className={`${TYPE.titleSm} tabular-nums ${
                    row.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {row.type === 'deposit' ? '+' : '−'}
                  {formatMoney(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ClassDepositModal
        open={classDepositOpen}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setClassDepositOpen(false)}
      />
      <PaydayModal
        open={paydayOpen}
        roster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setPaydayOpen(false)}
      />
      <ClassGoalModal
        open={goalModalOpen}
        theme={theme}
        isDarkMode={isDarkMode}
        existingGoal={classGoal}
        classBalance={total}
        onClose={() => setGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}
