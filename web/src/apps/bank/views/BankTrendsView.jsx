import { useMemo } from 'react';
import { PiggyBank, ShoppingBag, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import { APP_BOARD_PAD, APP_GRID_CARD } from '../../../shared/layout';
import { formatMoney } from '../bankState';
import { useBank } from '../BankContext';
import {
  buildStudentTrendRows,
  pickBiggestSaver,
  pickBiggestSpender,
  topByField,
} from '../bankTrends';

function CalloutCard({
  theme,
  isDarkMode,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  amount,
  amountClass,
  student,
  emptyLabel,
}) {
  return (
    <div
      className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
        >
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            {eyebrow}
          </p>
          {student ? (
            <>
              <div className="mt-2 flex items-center gap-3">
                <StudentAvatar student={student} theme={theme} size="md" />
                <div className="min-w-0">
                  <p className={`${TYPE.titleMd} truncate ${theme.colorOnSurface}`}>
                    {title}
                  </p>
                  {subtitle ? (
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className={`mt-3 ${TYPE.titleLg} tabular-nums ${amountClass}`}>
                {amount}
              </p>
            </>
          ) : (
            <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              {emptyLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  description,
  rows,
  valueKey,
  theme,
  isDarkMode,
  barClass,
  formatValue = formatMoney,
}) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);

  return (
    <section
      className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{title}</h2>
      {description ? (
        <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {description}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={`mt-4 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          No data yet for this chart.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const value = Number(row[valueKey]) || 0;
            const pct = Math.round((value / max) * 100);
            return (
              <li key={row.studentId}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className={`min-w-0 truncate ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                    {row.name}
                  </p>
                  <p
                    className={`shrink-0 tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    {formatValue(value)}
                  </p>
                </div>
                <div
                  className={`h-2.5 overflow-hidden rounded-full ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full transition-[width] ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Bank Trends — callouts and charts for classroom economy patterns.
 */
export function BankTrendsView({ roster, isDarkMode, theme, classLabel }) {
  const { accounts } = useBank();

  const rows = useMemo(
    () => buildStudentTrendRows(accounts, roster),
    [accounts, roster],
  );
  const biggestSpender = useMemo(() => pickBiggestSpender(rows), [rows]);
  const biggestSaver = useMemo(() => pickBiggestSaver(rows), [rows]);
  const topSpenders = useMemo(() => topByField(rows, 'spent', 3), [rows]);
  const topBalances = useMemo(() => topByField(rows, 'balance', 3), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trends"
        description={
          classLabel
            ? `${classLabel} · spending and saving patterns`
            : 'Graphs, charts, and classroom economy callouts'
        }
        isDarkMode={isDarkMode}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CalloutCard
          theme={theme}
          isDarkMode={isDarkMode}
          icon={ShoppingBag}
          eyebrow="Biggest spender"
          title={biggestSpender?.name}
          subtitle={biggestSpender?.job}
          amount={biggestSpender ? formatMoney(biggestSpender.spent) : null}
          amountClass="text-rose-500"
          student={biggestSpender?.student}
          emptyLabel="No purchases yet — deducts will show here."
        />
        <CalloutCard
          theme={theme}
          isDarkMode={isDarkMode}
          icon={PiggyBank}
          eyebrow="Biggest saver"
          title={biggestSaver?.name}
          subtitle={biggestSaver?.job}
          amount={biggestSaver ? formatMoney(biggestSaver.balance) : null}
          amountClass="text-emerald-600"
          student={biggestSaver?.student}
          emptyLabel="No balances yet."
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HorizontalBarChart
          title="Top spenders"
          description="Total deducted from each account."
          rows={topSpenders}
          valueKey="spent"
          theme={theme}
          isDarkMode={isDarkMode}
          barClass="bg-rose-500"
        />
        <HorizontalBarChart
          title="Highest balances"
          description="Who is holding the most right now."
          rows={topBalances}
          valueKey="balance"
          theme={theme}
          isDarkMode={isDarkMode}
          barClass={theme.colorPrimary}
        />
      </div>

      <section
        className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={18} className={theme.colorOnSurfaceVariant} />
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
            More charts coming
          </h2>
        </div>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          This space will grow with deposit trends, payday totals, and class goal
          progress over time.
        </p>
      </section>
    </div>
  );
}
