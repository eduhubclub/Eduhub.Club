import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import {
  compareCopyAccuracy,
  formatAccuracyPercent,
} from '../../../data/eduType/copyAccuracy';

function MetricCard({ theme, label, ratio, detail }) {
  return (
    <div
      className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 space-y-1`}
    >
      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      <p className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
        {formatAccuracyPercent(ratio)}
      </p>
      {detail ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{detail}</p>
      ) : null}
    </div>
  );
}

function DiffPreview({ theme, spans, missingSpans }) {
  if (!spans.length && !missingSpans.length) {
    return (
      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        Paste both texts to see a marked preview.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p
        className={`${TYPE.bodyMd} ${theme.colorOnSurface} whitespace-pre-wrap break-words leading-relaxed`}
        aria-label="Marked student writing"
      >
        {spans.map((span, i) => {
          if (span.status === 'ok') {
            return <span key={i}>{span.text}</span>;
          }
          if (span.status === 'extra') {
            return (
              <span
                key={i}
                className="rounded-sm bg-sky-200/80 text-sky-950"
                title="Extra in student writing"
              >
                {span.text}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="rounded-sm bg-rose-200/80 text-rose-950"
              title="Does not match the source"
            >
              {span.text}
            </span>
          );
        })}
      </p>
      {missingSpans.length ? (
        <div className="space-y-1">
          <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Missing from student
          </p>
          <p
            className={`${TYPE.bodyMd} whitespace-pre-wrap break-words leading-relaxed rounded-sm bg-amber-200/80 text-amber-950 px-2 py-1`}
          >
            {missingSpans.map((span) => span.text).join('')}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Teacher tool: paste source doc + student writing, score words / punct / caps.
 */
export function AccuracyCheckView({ theme, isDarkMode }) {
  const [expected, setExpected] = useState('');
  const [student, setStudent] = useState('');

  const result = useMemo(
    () => compareCopyAccuracy(expected, student),
    [expected, student],
  );

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const ready = expected.trim().length > 0 && student.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Accuracy check"
        description="Paste the source doc and a student’s writing. Scores words, punctuation, and capitalization."
        isDarkMode={isDarkMode}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Source (what they should copy)
          </span>
          <textarea
            className={`${fieldClass} min-h-[12rem]`}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="Paste the teacher document…"
            spellCheck
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Student writing
          </span>
          <textarea
            className={`${fieldClass} min-h-[12rem]`}
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            placeholder="Paste what the student typed or wrote…"
            spellCheck
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          onClick={() => {
            setExpected('');
            setStudent('');
          }}
        >
          Clear both
        </button>
        <button
          type="button"
          className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          disabled={!student}
          onClick={() => setStudent('')}
        >
          Clear student
        </button>
      </div>

      {ready ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              theme={theme}
              label="Overall"
              ratio={result.overall}
              detail="Words + punctuation + capitals combined"
            />
            <MetricCard
              theme={theme}
              label="Words"
              ratio={result.words.ratio}
              detail={`${result.words.correct} of ${result.words.total} source words`}
            />
            <MetricCard
              theme={theme}
              label="Punctuation"
              ratio={result.punctuation.ratio}
              detail={
                result.punctuation.total
                  ? `${result.punctuation.correct} of ${result.punctuation.total} marks`
                  : 'No punctuation in the source'
              }
            />
            <MetricCard
              theme={theme}
              label="Capitalization"
              ratio={result.capitalization.ratio}
              detail={
                result.capitalization.total
                  ? `${result.capitalization.correct} of ${result.capitalization.total} letters`
                  : 'No matching words to check case'
              }
            />
          </div>

          <div
            className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
          >
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Marked preview
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Plain text matches. Rose is wrong. Sky is extra. Amber lists what the
              student left out.
            </p>
            <DiffPreview
              theme={theme}
              spans={result.studentSpans}
              missingSpans={result.missingSpans}
            />
          </div>
        </>
      ) : (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Scores appear once both boxes have text.
        </p>
      )}
    </div>
  );
}
