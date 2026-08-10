import { Download } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { APP_BOARD_PAD, APP_SCROLL_BOARD } from '../../../shared/layout';
import {
  downloadTransactionsCsv,
  flattenTransactions,
  formatMoney,
} from '../bankState';
import { useBank } from '../BankContext';

/**
 * Transaction log + pending approvals.
 */
export function TransactionsView({ roster, isDarkMode, theme, classLabel }) {
  const {
    accounts,
    rosterById,
    pendingApprovals,
    approvePending,
    denyPending,
    undoTx,
  } = useBank();
  const toolBtn = toolBtnClass(isDarkMode);
  const rows = flattenTransactions(accounts, rosterById);

  const exportCsv = () => {
    downloadTransactionsCsv(rows, classLabel || 'class');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transactions"
        description="Pending approvals and the class ledger."
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={`${toolBtn} disabled:cursor-not-allowed disabled:opacity-40`}
          onClick={exportCsv}
          disabled={!rows.length}
          title={rows.length ? 'Download ledger as CSV' : 'No transactions to export'}
        >
          <Download size={16} className="mr-1.5 inline" />
          Export CSV
        </button>
      </div>

      {pendingApprovals.length ? (
        <div
          className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <h2 className={`${TYPE.titleMd} mb-3 ${theme.colorOnSurface}`}>
            Pending approvals
          </h2>
          <ul className="space-y-3">
            {pendingApprovals.map((req) => (
              <li
                key={req.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] px-3 py-3 ${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {req.studentName}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {req.description} · {req.date}
                  </p>
                </div>
                <p
                  className={`${TYPE.titleSm} ${
                    req.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {req.type === 'deposit' ? '+' : '−'}
                  {formatMoney(req.amount)}
                </p>
                <button
                  type="button"
                  className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  onClick={() => approvePending(req)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
                  onClick={() => denyPending(req.id)}
                >
                  Deny
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        className={`${APP_SCROLL_BOARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}
      >
        <div className={`${APP_BOARD_PAD} border-b ${theme.colorOutline}`}>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Ledger</h2>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {rows.length} entries · {roster.length} students
          </p>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {rows.slice(0, 80).map((row) => (
            <li
              key={`${row.studentId}-${row.id}`}
              className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {row.studentName}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {row.description} · {row.date}
                </p>
              </div>
              <p
                className={`${TYPE.titleSm} ${
                  row.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {row.type === 'deposit' ? '+' : '−'}
                {formatMoney(row.amount)}
              </p>
              <button
                type="button"
                className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                onClick={() => undoTx(row.studentId, row.id)}
              >
                Undo
              </button>
            </li>
          ))}
          {!rows.length ? (
            <li className={`px-5 py-8 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              No transactions yet.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
