import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Contact,
  DollarSign,
  Grid,
  List,
  MoreVertical,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { toolBtnClass } from '../../../shared/toolBtn';
import { SegmentControl } from '../../../shared/SegmentControl';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
  APP_NESTED_CARD,
  APP_SCROLL_BOARD,
  appFabStackClass,
} from '../../../shared/layout';
import { formatMoney } from '../bankState';
import { useBank } from '../BankContext';
import { studentDisplayName } from '../../../data/students/displayName';
import { TransactionModal } from '../components/TransactionModal';
import { ClassDepositModal } from '../components/ClassDepositModal';
import { PaydayModal } from '../components/PaydayModal';
import { BankStudentDetail } from './BankStudentsView';
import { useJobsSyncToBankPreference } from '../../jobs/JobsContext';

/**
 * Classroom Bank — balances grid/list + deposit / deduct / payday.
 * Bank Profile opens from the ⋮ menu on each student card.
 */
export function BankView({ roster, isDarkMode, theme, isLeft, classLabel }) {
  const { getAccount } = useBank();
  const jobsSyncedToBank = useJobsSyncToBankPreference();
  const [viewMode, setViewMode] = useState('grid');
  const [txModal, setTxModal] = useState(null);
  const [classDepositOpen, setClassDepositOpen] = useState(false);
  const [paydayOpen, setPaydayOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [openCardMenu, setOpenCardMenu] = useState(null);
  const menuRef = useRef(null);
  const toolBtn = toolBtnClass(isDarkMode);

  const selectedStudent = useMemo(
    () =>
      roster.find((s) => String(s.id) === String(selectedStudentId)) || null,
    [roster, selectedStudentId],
  );

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenCardMenu(null);
      }
    };
    if (openCardMenu != null) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openCardMenu]);

  const total = roster.reduce(
    (sum, s) => sum + (getAccount(s.id)?.balance || 0),
    0,
  );

  const hasAssignedJobs = roster.some((s) => {
    const account = getAccount(s.id);
    if (!account) return false;
    const job = account.job;
    if (!job || job === 'Unassigned') return false;
    return (Number(account.salary) || 0) > 0;
  });
  const paydayEnabled = jobsSyncedToBank && hasAssignedJobs;
  const paydayTitle = !jobsSyncedToBank
    ? 'Turn on Jobs sync to Bank in Jobs or Bank settings'
    : hasAssignedJobs
      ? 'Payday'
      : 'Assign jobs in the Jobs app before payday';

  if (selectedStudent) {
    return (
      <BankStudentDetail
        student={selectedStudent}
        isDarkMode={isDarkMode}
        theme={theme}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  const openProfile = (studentId) => {
    setOpenCardMenu(null);
    setSelectedStudentId(studentId);
  };

  const cardMenu = (studentId) =>
    openCardMenu === studentId ? (
      <div
        className={`absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border-[1.5px] shadow-lg ${
          isDarkMode
            ? 'border-slate-600 bg-slate-800'
            : 'border-slate-300 bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1">
          <button
            type="button"
            className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.labelMd} ${
              isDarkMode
                ? 'text-slate-200 hover:bg-slate-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => openProfile(studentId)}
          >
            <Contact size={16} />
            Bank Profile
          </button>
        </div>
      </div>
    ) : null;

  const moreBtn = (studentId) => (
    <div className="relative" ref={openCardMenu === studentId ? menuRef : undefined}>
      <button
        type="button"
        className={`edu-control rounded-md p-1.5 transition-colors ${
          isDarkMode
            ? 'text-slate-400 hover:bg-slate-800'
            : 'text-slate-500 hover:bg-slate-100'
        }`}
        aria-label="Student options"
        aria-expanded={openCardMenu === studentId}
        onClick={(e) => {
          e.stopPropagation();
          setOpenCardMenu(openCardMenu === studentId ? null : studentId);
        }}
      >
        <MoreVertical size={18} />
      </button>
      {cardMenu(studentId)}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bank"
        description={
          classLabel
            ? `${classLabel} · ${roster.length} students · ${formatMoney(total)} total`
            : 'Classroom balances and payouts'
        }
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={viewMode}
          onChange={setViewMode}
          options={[
            { id: 'grid', label: 'Grid', icon: Grid },
            { id: 'list', label: 'List', icon: List },
          ]}
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={toolBtn}
            onClick={() => setClassDepositOpen(true)}
          >
            <Users size={16} className="mr-1.5 inline" />
            Class deposit
          </button>
          <button
            type="button"
            className={`${toolBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800`}
            onClick={() => setPaydayOpen(true)}
            disabled={!paydayEnabled}
            title={paydayTitle}
            aria-disabled={!paydayEnabled}
          >
            <Coins size={16} className="mr-1.5 inline" />
            Payday
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roster.map((student) => {
            const account = getAccount(student.id);
            return (
              <div
                key={student.id}
                className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <StudentAvatar student={student} theme={theme} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
                        {studentDisplayName(student)}
                      </p>
                      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        {account?.job || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  {moreBtn(student.id)}
                </div>
                <div
                  className={`mt-3 flex items-center gap-3 ${APP_NESTED_CARD} px-3 py-3 ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.colorSurface} ${theme.colorOnSurfaceVariant} border-[1.5px] ${theme.colorOutlineVariant}`}
                    aria-hidden
                  >
                    <DollarSign size={18} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                      Balance
                    </p>
                    <p className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
                      {formatMoney(account?.balance)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className={`edu-control inline-flex flex-1 items-center justify-center gap-1 rounded-xl border-[1.5px] border-emerald-600 px-2 py-2 ${TYPE.labelMd} bg-transparent text-emerald-700`}
                    onClick={() => setTxModal({ student, type: 'deposit' })}
                  >
                    <ArrowUpCircle size={16} />
                    Deposit
                  </button>
                  <button
                    type="button"
                    className={`edu-control inline-flex flex-1 items-center justify-center gap-1 rounded-xl border-[1.5px] border-rose-500 px-2 py-2 ${TYPE.labelMd} bg-transparent text-rose-600`}
                    onClick={() => setTxModal({ student, type: 'deduct' })}
                  >
                    <ArrowDownCircle size={16} />
                    Deduct
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}
        >
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {roster.map((student) => {
              const account = getAccount(student.id);
              return (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <StudentAvatar student={student} theme={theme} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
                      {studentDisplayName(student)}
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {account?.job || 'Unassigned'} · salary{' '}
                      {formatMoney(account?.salary)}
                    </p>
                  </div>
                  <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                    {formatMoney(account?.balance)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] border-emerald-600 px-3 py-2 ${TYPE.labelMd} bg-transparent text-emerald-700`}
                      onClick={() => setTxModal({ student, type: 'deposit' })}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] border-rose-500 px-3 py-2 ${TYPE.labelMd} bg-transparent text-rose-600`}
                      onClick={() => setTxModal({ student, type: 'deduct' })}
                    >
                      Deduct
                    </button>
                    {moreBtn(student.id)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={appFabStackClass(isLeft)}>
        <button
          type="button"
          className={`edu-control flex h-14 w-14 items-center justify-center rounded-full shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={() => setPaydayOpen(true)}
          disabled={!paydayEnabled}
          aria-label={paydayEnabled ? 'Payday' : paydayTitle}
          title={paydayTitle}
        >
          <Coins size={22} />
        </button>
      </div>

      <TransactionModal
        open={Boolean(txModal)}
        student={txModal?.student}
        type={txModal?.type || 'deposit'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setTxModal(null)}
      />
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
    </div>
  );
}
