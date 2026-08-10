import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { studentShortName } from '../../../data/students/displayName';

/**
 * Kid-facing paginated how-to for a classroom job (shown from Dashboard).
 */
export function JobHowToModal({
  open,
  student,
  job,
  theme,
  isDarkMode,
  onClose,
}) {
  const pages = Array.isArray(job?.howToPages) ? job.howToPages : [];
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (open) setPageIndex(0);
  }, [open, job?.id, student?.id]);

  if (!open || !student) return null;

  const unassigned = !job || job.title === 'Unassigned';
  const page = pages[pageIndex] || null;
  const pageCount = pages.length;
  const hasPages = pageCount > 0;

  return (
    <Modal
      isOpen={open}
      title={unassigned ? 'No job yet' : `${job.icon || ''} ${job.title}`.trim()}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        hasPages ? (
          <div className="flex w-full items-center justify-between gap-2">
            <button
              type="button"
              className={`edu-control inline-flex items-center gap-1 rounded-xl px-3 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} disabled:opacity-40`}
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <p className={`${TYPE.labelMd} tabular-nums ${theme.colorOnSurfaceVariant}`}>
              {pageIndex + 1} / {pageCount}
            </p>
            <button
              type="button"
              className={`edu-control inline-flex items-center gap-1 rounded-xl px-3 py-2 ${TYPE.labelLg} ${
                pageIndex >= pageCount - 1
                  ? theme.colorOnSurfaceVariant
                  : `${theme.colorPrimary} ${theme.colorOnPrimary}`
              } disabled:opacity-40`}
              disabled={pageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((i) => Math.min(pageCount - 1, i + 1))
              }
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex w-full justify-end">
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <StudentAvatar student={student} theme={theme} size="md" />
          <div className="min-w-0">
            <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              {studentShortName(student)}
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {unassigned
                ? 'You do not have a classroom job yet.'
                : 'Your classroom job'}
            </p>
          </div>
        </div>

        {unassigned ? null : !hasPages ? (
          <div
            className={`rounded-2xl border-[1.5px] px-4 py-6 text-center ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
          >
            <p className={`text-4xl`} aria-hidden>
              {job.icon || '💼'}
            </p>
            <p className={`mt-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
              {job.title}
            </p>
            {job.description ? (
              <p
                className={`mt-2 whitespace-pre-wrap text-left ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
              >
                {job.description}
              </p>
            ) : (
              <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Your teacher has not added how-to steps for this job yet.
              </p>
            )}
            {job.description ? (
              <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                No step-by-step pages yet — check back after your teacher adds
                them.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {job.description ? (
              <p
                className={`whitespace-pre-wrap ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
              >
                {job.description}
              </p>
            ) : null}
            {page?.image ? (
              <div
                className={`overflow-hidden rounded-2xl border-[1.5px] ${theme.colorOutlineVariant}`}
              >
                <img
                  src={page.image}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            ) : null}
            {page?.title ? (
              <p className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
                {page.title}
              </p>
            ) : (
              <p className={`${TYPE.titleLg} ${theme.colorOnSurface}`}>
                Step {pageIndex + 1}
              </p>
            )}
            {page?.body ? (
              <p
                className={`${TYPE.bodyMd} whitespace-pre-wrap ${theme.colorOnSurface}`}
              >
                {page.body}
              </p>
            ) : null}
            <div className="flex justify-center gap-1.5 pt-1">
              {pages.map((p, i) => (
                <button
                  key={p.id || i}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === pageIndex ? 'step' : undefined}
                  onClick={() => setPageIndex(i)}
                  className={`edu-control h-2.5 w-2.5 rounded-full transition-colors ${
                    i === pageIndex
                      ? theme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-600'
                        : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
