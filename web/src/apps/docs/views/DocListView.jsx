import { RotateCcw, Trash2 } from 'lucide-react';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { APP_GRID_CARD } from '../../../shared/layout';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { CreateDocTile } from './CreateDocTile';
import { DocThumbnailCard, formatWhen } from './DocThumbnailCard';

/**
 * Document home — Create tile + preview thumbnails.
 */
export function DocListView({
  theme,
  isDarkMode,
  title,
  description,
  docs,
  mode = 'active',
  onOpen,
  onCreate,
  onEdit,
  onTrash,
  onRestore,
  onPurge,
  onEmptyTrash,
  onOpenFromCloud,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const showThumbnails =
    mode === 'active' ||
    mode === 'files' ||
    mode === 'shared' ||
    mode === 'templates';
  const showCreate =
    mode === 'active' || mode === 'files' || mode === 'templates';
  const isTemplates = mode === 'templates';

  const empty =
    mode === 'trash'
      ? 'Trash is empty.'
      : mode === 'shared'
        ? 'No cloud copies yet. Open a doc and Save to Drive or OneDrive — files stay as .edudoc so Word won’t rewrite them.'
        : mode === 'templates'
          ? 'No templates yet. Create one to reuse later.'
          : null;

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {mode !== 'active' && mode !== 'templates' ? (
            <PageHeader
              title={title}
              description={description}
              isDarkMode={isDarkMode}
            />
          ) : null}
        </div>

        {mode === 'trash' && docs.length ? (
          <button
            type="button"
            className={`edu-control ${toolBtn} shrink-0`}
            onClick={onEmptyTrash}
          >
            Empty trash
          </button>
        ) : null}
      </div>

      {mode === 'shared' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`edu-control ${toolBtn}`}
            onClick={() => onOpenFromCloud?.('google')}
          >
            Open from Google Drive
          </button>
          <button
            type="button"
            className={`edu-control ${toolBtn}`}
            onClick={() => onOpenFromCloud?.('onedrive')}
          >
            Open from OneDrive
          </button>
        </div>
      ) : null}

      {showThumbnails ? (
        <>
          {!docs.length && empty ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              {empty}
            </p>
          ) : null}
          <ContentCardGrid columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {showCreate ? (
              <CreateDocTile
                theme={theme}
                isDarkMode={isDarkMode}
                onCreate={onCreate}
                label={isTemplates ? 'Create template' : 'Create Doc'}
                hint={
                  isTemplates
                    ? 'Blank template to edit and reuse'
                    : 'Blank document'
                }
              />
            ) : null}
            {docs.map((doc) => (
              <DocThumbnailCard
                key={doc.id}
                doc={doc}
                theme={theme}
                isDarkMode={isDarkMode}
                onOpen={onOpen}
                onEdit={isTemplates ? onEdit : undefined}
                openLabel={
                  isTemplates
                    ? `Use template ${doc.title}`
                    : `Open ${doc.title}`
                }
                onTrash={mode === 'trash' ? undefined : onTrash}
              />
            ))}
          </ContentCardGrid>
        </>
      ) : !docs.length ? (
        <div
          className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-8 text-center`}
        >
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            {empty || 'Nothing here.'}
          </p>
        </div>
      ) : (
        <ContentCardGrid>
          {docs.map((doc) => (
            <article
              key={doc.id}
              className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 flex flex-col gap-3`}
            >
              <button
                type="button"
                className="edu-control text-left space-y-1"
                onClick={() => onOpen(doc.id)}
              >
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}>
                  {doc.title}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  Trashed {formatWhen(doc.trashedAt)}
                </p>
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`edu-control ${toolBtn}`}
                  onClick={() => onRestore(doc.id)}
                >
                  <RotateCcw className="w-4 h-4" aria-hidden />
                  Restore
                </button>
                <button
                  type="button"
                  className={`edu-control ${toolBtn}`}
                  onClick={() => onPurge(doc.id)}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                  Delete forever
                </button>
              </div>
            </article>
          ))}
        </ContentCardGrid>
      )}
    </div>
  );
}
