import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';

const KIND_COPY = {
  Office: 'Word and PowerPoint conversion — coming soon.',
  Media: 'Audio and video convert and compress — coming soon.',
};

/**
 * Placeholder for Convert tabs not yet shipped.
 */
export function ComingSoonView({ kind, isDarkMode, theme }) {
  const title = kind || 'Convert';
  const description =
    KIND_COPY[kind] ||
    'More conversion tools are on the way. Images are ready now.';

  return (
    <>
      <PageHeader title={title} description={description} isDarkMode={isDarkMode} />
      <EmptyState
        message={
          kind === 'Office' || kind === 'Media'
            ? `${title} tools are coming soon. Use Images or PDF in the meantime.`
            : `${title} tools are coming soon.`
        }
        isDarkMode={isDarkMode}
      />
      <p className={`mt-3 text-center text-sm ${theme.colorOnSurfaceVariant}`}>
        Processed on this device — nothing is uploaded.
      </p>
    </>
  );
}
