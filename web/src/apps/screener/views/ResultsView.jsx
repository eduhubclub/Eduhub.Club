import { useEffect, useState } from 'react';
import { levelLabel } from '../../../data/screener/letrsBank';
import { scoreLetrs } from '../../../data/screener/letrsScore';
import {
  loadScreenerResults,
  removeScreenerResult,
} from '../../../data/screener/screenerStorage';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { screenerById } from '../catalog';
import { LetrsReport } from './LetrsReport';

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ResultsView({ theme, isDarkMode, classId, className }) {
  const [rows, setRows] = useState(() => loadScreenerResults(classId));
  const [openId, setOpenId] = useState('');
  const [confirmId, setConfirmId] = useState('');

  useEffect(() => {
    setRows(loadScreenerResults(classId));
    setOpenId('');
    setConfirmId('');
  }, [classId]);

  const open = rows.find((row) => row.id === openId) || null;

  function refresh() {
    setRows(loadScreenerResults(classId));
  }

  if (open?.screenerId === 'letrs') {
    const scored = scoreLetrs(open.answers, open.level);
    return (
      <AppPageShell variant="scroll">
        <button
          type="button"
          onClick={() => setOpenId('')}
          className={`edu-control mb-3 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
        >
          All results
        </button>
        <AppBoard mode="scroll" theme={theme}>
          <LetrsReport
            scored={scored}
            theme={theme}
            isDarkMode={isDarkMode}
            meta={{
              studentName: open.studentName || 'Student',
              teacherName: open.teacherName,
              grade: open.grade,
              dateLabel: formatDate(open.createdAt),
            }}
            actions={
              <button
                type="button"
                onClick={() => window.print()}
                className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Print
              </button>
            }
          />
        </AppBoard>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Results"
        description={
          className
            ? `Saved screeners for ${className} stay on this device.`
            : 'Saved screeners stay on this device.'
        }
        isDarkMode={isDarkMode}
      />
      {rows.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No screener results for this class yet. Finish a screener and it will show up here."
        />
      ) : (
        <ContentCardGrid>
          {rows.map((row) => {
            const screener = screenerById(row.screenerId);
            const scored = row.screenerId === 'letrs' ? scoreLetrs(row.answers, row.level) : null;
            const confirming = confirmId === row.id;
            return (
              <AppBoard key={row.id} mode="grid" theme={theme} className="flex flex-col">
                <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                  {screener?.name || 'Screener'}
                  {row.level ? ` · ${levelLabel(row.level)}` : ''}
                </p>
                <h2 className={`mt-1 ${TYPE.titleMd}`}>{row.studentName || 'Student'}</h2>
                <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {formatDate(row.createdAt)}
                  {scored ? ` · ${scored.wordsCorrect}/${scored.wordsTotal} words` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(row.id)}
                    className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirming) {
                        setConfirmId(row.id);
                        return;
                      }
                      removeScreenerResult(row.id);
                      setConfirmId('');
                      refresh();
                    }}
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                  >
                    {confirming ? 'Remove this result' : 'Remove'}
                  </button>
                </div>
              </AppBoard>
            );
          })}
        </ContentCardGrid>
      )}
    </AppPageShell>
  );
}
