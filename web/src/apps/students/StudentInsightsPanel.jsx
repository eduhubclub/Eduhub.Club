import { useEffect, useState } from 'react';
import { Award, Briefcase, Landmark } from 'lucide-react';
import { APP_BOARD_PAD, APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { getStudentCrossAppInsights } from './studentAppInsights';

function InsightCard({ theme, isDarkMode, icon: Icon, title, children, empty }) {
  return (
    <div
      className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
        >
          <Icon size={18} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>{title}</p>
          {empty ? (
            <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              No data yet
            </p>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Cross-app insights for a student — Bank balance, Behavior points, Jobs role.
 */
export function StudentInsightsPanel({
  student,
  classes = [],
  theme,
  isDarkMode,
}) {
  const [insights, setInsights] = useState(() =>
    getStudentCrossAppInsights(student, classes),
  );

  useEffect(() => {
    const refresh = () => setInsights(getStudentCrossAppInsights(student, classes));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('eduHub.bank.accountsUpdated', refresh);
    window.addEventListener('eduHub.behavior.pointsUpdated', refresh);
    window.addEventListener('eduHub.jobs.dataUpdated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('eduHub.bank.accountsUpdated', refresh);
      window.removeEventListener('eduHub.behavior.pointsUpdated', refresh);
      window.removeEventListener('eduHub.jobs.dataUpdated', refresh);
    };
  }, [student, classes]);

  const { bank, behavior, jobs } = insights;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <InsightCard
        theme={theme}
        isDarkMode={isDarkMode}
        icon={Landmark}
        title="Bank"
        empty={!bank}
      >
        <p className={`mt-1 ${TYPE.titleMd} tabular-nums ${theme.colorOnSurface}`}>
          {bank?.balanceLabel}
        </p>
        {bank?.job ? (
          <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {bank.job} · {bank.salaryLabel}/week
            {bank.classLabel ? ` · ${bank.classLabel}` : ''}
          </p>
        ) : bank?.classLabel ? (
          <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {bank.classLabel}
          </p>
        ) : null}
        {bank?.recent?.length ? (
          <ul className="mt-2 space-y-1">
            {bank.recent.map((tx) => (
              <li
                key={`${tx.id}-${tx.className || ''}`}
                className={`flex justify-between gap-2 ${TYPE.bodySm}`}
              >
                <span className={`min-w-0 truncate ${theme.colorOnSurfaceVariant}`}>
                  {tx.description}
                </span>
                <span
                  className={`shrink-0 tabular-nums ${
                    tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {tx.type === 'deposit' ? '+' : '−'}
                  {typeof tx.amount === 'number'
                    ? `$${tx.amount}`
                    : tx.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </InsightCard>

      <InsightCard
        theme={theme}
        isDarkMode={isDarkMode}
        icon={Award}
        title="Behavior"
        empty={!behavior}
      >
        <p
          className={`mt-1 ${TYPE.titleMd} tabular-nums ${
            behavior?.points > 0
              ? 'text-emerald-600'
              : behavior?.points < 0
                ? 'text-rose-500'
                : theme.colorOnSurface
          }`}
        >
          {behavior?.pointsLabel} pts
        </p>
        {behavior?.classLabel ? (
          <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {behavior.classLabel}
          </p>
        ) : null}
      </InsightCard>

      <InsightCard
        theme={theme}
        isDarkMode={isDarkMode}
        icon={Briefcase}
        title="Jobs"
        empty={!jobs}
      >
        <p className={`mt-1 ${TYPE.titleMd} ${theme.colorOnSurface}`}>{jobs?.job}</p>
        <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {jobs?.salaryLabel}/week
          {jobs?.classLabel ? ` · ${jobs.classLabel}` : ''}
        </p>
      </InsightCard>
    </div>
  );
}
