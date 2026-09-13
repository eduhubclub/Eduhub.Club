import { useMemo, useState } from 'react';
import { Printer, Tag } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  copiesNeedingLabels,
  getTitle,
  markCopiesLabeled,
  readCopies,
  readTitles,
} from '../../../data/library/storage';
import { downloadLibraryLabelsPdf } from '../../../data/library/labelPdf';

/**
 * Select copies and print unique QR stickers.
 */
export function LabelsView({ theme, isDarkMode, refreshKey }) {
  const unlabeled = useMemo(() => {
    void refreshKey;
    return copiesNeedingLabels();
  }, [refreshKey]);
  const allCopies = useMemo(() => {
    void refreshKey;
    return readCopies();
  }, [refreshKey]);
  const titles = useMemo(() => {
    void refreshKey;
    return readTitles();
  }, [refreshKey]);
  const titleById = useMemo(
    () => Object.fromEntries(titles.map((t) => [t.id, t])),
    [titles],
  );

  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  const list = unlabeled.length ? unlabeled : allCopies;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(list.map((c) => c.id)));
  const clear = () => setSelected(new Set());

  const printSelected = async () => {
    const ids = selected.size ? [...selected] : list.map((c) => c.id);
    if (!ids.length) return;
    const snapshot = ids
      .map(
        (id) =>
          allCopies.find((c) => c.id === id) ||
          unlabeled.find((c) => c.id === id) ||
          list.find((c) => c.id === id),
      )
      .filter(Boolean);
    if (!snapshot.length) return;
    setError('');
    setNote('');
    setBusy(true);
    try {
      await downloadLibraryLabelsPdf(snapshot, titleById);
      markCopiesLabeled(ids);
      setNote(
        `Saved library-labels.pdf (${snapshot.length} label${
          snapshot.length === 1 ? '' : 's'
        }). Open the file to print.`,
      );
    } catch {
      setError('Could not build the label PDF. Try again, or print fewer copies.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Labels"
        description="Print unique QR stickers for each copy. Publisher ISBN barcodes cannot tell copy 1 from copy 2."
        isDarkMode={isDarkMode}
        actions={
          <button
            type="button"
            className={toolBtn}
            disabled={!list.length || busy}
            onClick={printSelected}
          >
            <Printer size={16} strokeWidth={2.5} />
            {busy ? 'Preparing…' : selected.size ? `Print ${selected.size}` : 'Print'}
          </button>
        }
      />

      {!list.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No copies on the shelf yet. Add titles in Manage Library first."
          illustration={<Tag size={36} className="text-slate-400" />}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={toolBtn} onClick={selectAll}>
              Select all ({list.length})
            </button>
            <button type="button" className={toolBtn} onClick={clear}>
              Clear
            </button>
            {unlabeled.length ? (
              <p className={`${TYPE.bodySm} self-center ${theme.colorOnSurfaceVariant}`}>
                Showing copies that still need a printed label.
              </p>
            ) : (
              <p className={`${TYPE.bodySm} self-center ${theme.colorOnSurfaceVariant}`}>
                All copies have been marked labeled — you can still reprint any.
              </p>
            )}
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((copy) => {
              const title = titleById[copy.titleId] || getTitle(copy.titleId);
              const on = selected.has(copy.id);
              return (
                <li key={copy.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(copy.id)}
                    className={`edu-control w-full text-left p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${
                      on ? theme.colorPrimary : theme.colorOutline
                    } ${on ? theme.colorOnPrimary : ''}`}
                  >
                    <p className={`${TYPE.labelLg} ${on ? '' : theme.colorOnSurface}`}>
                      {title?.title || 'Book'} · copy {copy.copyNumber}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 font-mono ${
                        on ? 'opacity-90' : theme.colorOnSurfaceVariant
                      }`}
                    >
                      {copy.shortCode}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          {note ? <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>{note}</p> : null}
          {error ? <p className={`${TYPE.bodyMd} text-rose-500`}>{error}</p> : null}
        </>
      )}
    </div>
  );
}
