import { Copy, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  createDeck,
  deleteDeck,
  duplicateDeck,
  readDecks,
  writeActiveDeckId,
} from '../../../data/slides/storage';
import { SlideCanvas } from '../SlideCanvas';

/**
 * Teacher deck library on this device.
 */
export function DecksView({
  theme,
  isDarkMode,
  settings,
  refreshKey,
  onOpenEdit,
}) {
  const decks = readDecks();
  const toolBtn = toolBtnClass(isDarkMode);
  void refreshKey;

  const open = (id) => {
    writeActiveDeckId(id);
    onOpenEdit?.();
  };

  return (
    <>
      <PageHeader
        title="Decks"
        description="Lessons on this teacher device. Classes only pick who is following."
        isDarkMode={isDarkMode}
        actions={
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => {
              createDeck('Untitled lesson');
              onOpenEdit?.();
            }}
          >
            <Plus size={16} />
            New deck
          </button>
        }
      />

      {!decks.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No decks yet. Start a blank lesson or import a PDF."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <li
              key={deck.id}
              className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <button
                type="button"
                className="edu-control block w-full overflow-hidden text-left"
                onClick={() => open(deck.id)}
              >
                <SlideCanvas
                  slide={deck.slides[0]}
                  theme={theme}
                  aspect={settings.aspect}
                />
              </button>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>{deck.name}</p>
                  <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                    {deck.slides.length} slide{deck.slides.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className={toolBtn}
                    title="Duplicate"
                    aria-label={`Duplicate ${deck.name}`}
                    onClick={() => {
                      duplicateDeck(deck.id);
                      onOpenEdit?.();
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className={toolBtn}
                    title="Delete"
                    aria-label={`Delete ${deck.name}`}
                    onClick={() => deleteDeck(deck.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
