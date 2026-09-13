import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Library, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { lookupIsbn } from '../../../data/library/isbn';
import {
  looksLikeIsbn,
  normalizeIsbn,
  parseLibraryLabelPayload,
} from '../../../data/library/labelPayload';
import {
  addCopy,
  addTitle,
  copiesForTitle,
  deleteCopy,
  deleteTitle,
  findTitleByIsbn,
  shelfSummaries,
  updateTitle,
} from '../../../data/library/storage';
import { useBarcodeCamera } from '../useBarcodeCamera';
import { BarcodeCameraPreview } from '../BarcodeCameraPreview';

/**
 * Build and manage titles and copies.
 */
export function ManageLibraryView({ theme, isDarkMode, refreshKey, onOpenLabels }) {
  const rows = useMemo(() => {
    void refreshKey;
    return shelfSummaries();
  }, [refreshKey]);
  const isbnInputRef = useRef(null);
  const [openId, setOpenId] = useState(null);
  const [isbn, setIsbn] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(null);
  const addIsbnRef = useRef(/** @type {(raw: string) => Promise<void>} */ (async () => {}));
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const { videoRef, overlayRef, cameraOn, lockLabel, startCamera, stopCamera } = useBarcodeCamera({
    onScan: (value) => addIsbnRef.current(value),
    onError: (message) => setError(message),
  });

  const focusIsbn = useCallback(() => {
    window.setTimeout(() => isbnInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    focusIsbn();
  }, [focusIsbn]);

  const addIsbnValue = async (raw) => {
    setError('');
    setNote('');
    const text = String(raw || '').trim();
    if (parseLibraryLabelPayload(text)) {
      setError('That’s a Library copy label. Add books here with the publisher ISBN on the back of the book.');
      focusIsbn();
      return;
    }
    const key = looksLikeIsbn(text) ? normalizeIsbn(text) : '';
    if (!key) {
      setError('Enter or scan a 10- or 13-digit ISBN.');
      focusIsbn();
      return;
    }
    setIsbn(key);
    const existing = findTitleByIsbn(key);
    if (existing) {
      const copy = addCopy(existing.id);
      setIsbn('');
      setOpenId(existing.id);
      setNote(`Added copy ${copy.copyNumber} of “${existing.title}”.`);
      focusIsbn();
      return;
    }
    setBusy(true);
    try {
      const looked = await lookupIsbn(key);
      const title = addTitle({
        isbn: key,
        title: looked?.title || `ISBN ${key}`,
        author: looked?.author,
        coverUrl: looked?.coverUrl,
        pageCount: looked?.pageCount,
      });
      const copy = addCopy(title.id);
      setIsbn('');
      setOpenId(title.id);
      setNote(`Added “${title.title}” (copy ${copy.copyNumber}). Print a label in Labels.`);
    } finally {
      setBusy(false);
      focusIsbn();
    }
  };
  addIsbnRef.current = addIsbnValue;

  const addByIsbn = (e) => {
    e.preventDefault();
    addIsbnValue(isbn);
  };

  const addManual = (e) => {
    e.preventDefault();
    setError('');
    const title = addTitle({
      title: manualTitle,
      author: manualAuthor,
      coverUrl: manualCover,
    });
    if (!title) {
      setError('Title is required.');
      return;
    }
    addCopy(title.id);
    setManualTitle('');
    setManualAuthor('');
    setManualCover('');
    setOpenId(title.id);
    setNote(`Added “${title.title}”.`);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!edit) return;
    updateTitle(edit.id, {
      title: edit.title,
      author: edit.author,
      isbn: edit.isbn,
      coverUrl: edit.coverUrl,
    });
    setEdit(null);
    setNote('Title updated.');
  };

  const openCopies = openId ? copiesForTitle(openId) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Library"
        description="Add titles by ISBN or by hand, then add copies and keep the catalog current."
        isDarkMode={isDarkMode}
        actions={
          onOpenLabels ? (
            <button type="button" className={toolBtn} onClick={onOpenLabels}>
              Print labels
            </button>
          ) : null
        }
      />

      <div className="grid gap-3 lg:grid-cols-2 max-w-4xl">
        <form
          onSubmit={addByIsbn}
          className={`p-4 space-y-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>Add by ISBN</p>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Type, use a USB or Bluetooth scanner, or open the camera. Built-in
            iMac cameras need the barcode about an arm’s length away, in bright
            light — they won’t focus if the book is close.
          </p>
          <input
            ref={isbnInputRef}
            className={fieldClass}
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="978…"
            autoComplete="off"
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={toolBtn} disabled={busy}>
              <Plus size={16} strokeWidth={2.5} />
              {busy ? 'Looking up…' : 'Add ISBN'}
            </button>
            {cameraOn ? (
              <button type="button" className={toolBtn} onClick={stopCamera}>
                Stop camera
              </button>
            ) : (
              <button
                type="button"
                className={toolBtn}
                onClick={() => {
                  setError('');
                  startCamera();
                }}
                disabled={busy}
              >
                <Camera size={16} strokeWidth={2.5} />
                Camera / QR
              </button>
            )}
          </div>
          <BarcodeCameraPreview
            videoRef={videoRef}
            overlayRef={overlayRef}
            cameraOn={cameraOn}
            lockLabel={lockLabel}
          />
        </form>
        <form
          onSubmit={addManual}
          className={`p-4 space-y-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>Add without ISBN</p>
          <input
            className={fieldClass}
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <input
            className={fieldClass}
            value={manualAuthor}
            onChange={(e) => setManualAuthor(e.target.value)}
            placeholder="Author"
          />
          <CoverImageField
            value={manualCover}
            onChange={setManualCover}
            theme={theme}
            toolBtn={toolBtn}
          />
          <button type="submit" className={toolBtn}>
            <Plus size={16} strokeWidth={2.5} />
            Add title
          </button>
        </form>
      </div>

      {note ? <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>{note}</p> : null}
      {error ? <p className={`${TYPE.bodyMd} text-rose-500`}>{error}</p> : null}

      {!rows.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No titles yet. Scan an ISBN or add a book by title above."
          illustration={<Library size={36} className="text-slate-400" />}
        />
      ) : (
        <ul className="grid gap-2 max-w-4xl">
          {rows.map(({ title, copies, inCount, outCount }) => {
            const open = openId === title.id;
            const editing = edit?.id === title.id;
            return (
              <li
                key={title.id}
                className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    className="edu-control min-w-0 flex-1 text-left flex gap-3"
                    onClick={() => setOpenId(open ? null : title.id)}
                  >
                    {title.coverUrl ? (
                      <img
                        src={title.coverUrl}
                        alt=""
                        className={`h-20 w-14 shrink-0 rounded-lg object-cover ${theme.colorSurfaceVariant}`}
                      />
                    ) : (
                      <div
                        className={`h-20 w-14 shrink-0 rounded-lg flex items-center justify-center ${theme.colorSurfaceVariant}`}
                      >
                        <Library size={20} className={theme.colorOnSurfaceVariant} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                    <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>{title.title}</p>
                    <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                      {title.author}
                      {title.isbn ? ` · ${title.isbn}` : ''}
                    </p>
                    <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
                      {copies} cop{copies === 1 ? 'y' : 'ies'} · {inCount} in · {outCount} out
                    </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={toolBtn}
                      onClick={() => {
                        addCopy(title.id);
                        setOpenId(title.id);
                        setNote(`Added a copy of “${title.title}”.`);
                      }}
                    >
                      Add copy
                    </button>
                    <button
                      type="button"
                      className={toolBtn}
                      onClick={() =>
                        setEdit(
                          editing
                            ? null
                            : {
                                id: title.id,
                                title: title.title,
                                author: title.author,
                                isbn: title.isbn || '',
                                coverUrl: title.coverUrl || '',
                              },
                        )
                      }
                    >
                      {editing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant}`}
                      title="Delete title"
                      aria-label={`Delete ${title.title}`}
                      onClick={() => {
                        const result = deleteTitle(title.id);
                        if (!result.ok) setError(result.error);
                        else {
                          setNote(`Removed “${title.title}”.`);
                          if (openId === title.id) setOpenId(null);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editing ? (
                  <form
                    onSubmit={saveEdit}
                    className={`border-t-[1.5px] px-4 py-3 space-y-2 ${theme.colorOutline}`}
                  >
                    <input
                      className={fieldClass}
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                    />
                    <input
                      className={fieldClass}
                      value={edit.author}
                      onChange={(e) => setEdit({ ...edit, author: e.target.value })}
                    />
                    <input
                      className={fieldClass}
                      value={edit.isbn}
                      onChange={(e) => setEdit({ ...edit, isbn: e.target.value })}
                      placeholder="ISBN"
                    />
                    <CoverImageField
                      value={edit.coverUrl || ''}
                      onChange={(coverUrl) => setEdit({ ...edit, coverUrl })}
                      theme={theme}
                      toolBtn={toolBtn}
                    />
                    <button type="submit" className={toolBtn}>
                      Save title
                    </button>
                  </form>
                ) : null}

                {open ? (
                  <ul className={`border-t-[1.5px] px-4 py-3 space-y-2 ${theme.colorOutline}`}>
                    {openCopies.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className={`${TYPE.bodySm} ${theme.colorOnSurface}`}>
                          Copy {c.copyNumber}
                          {c.shortCode ? ` · ${c.shortCode}` : ''}
                          {' · '}
                          {c.status === 'out' ? 'Out' : 'In'}
                        </span>
                        <button
                          type="button"
                          className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant}`}
                          title="Delete copy"
                          aria-label={`Delete copy ${c.copyNumber}`}
                          onClick={() => {
                            const result = deleteCopy(c.id);
                            if (!result.ok) setError(result.error);
                            else setNote(`Removed copy ${c.copyNumber}.`);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const MAX_COVER_BYTES = 1.5 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compact book-cover picker: upload from the device.
 */
function CoverImageField({ value, onChange, theme, toolBtn }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setError('Image is too large — keep uploads under about 1.5 MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
      setError('');
    } catch {
      setError('Couldn’t read that file.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className={`h-20 w-14 shrink-0 rounded-lg object-cover ${theme.colorSurfaceVariant}`}
          />
        ) : (
          <div
            className={`h-20 w-14 shrink-0 rounded-lg flex items-center justify-center ${theme.colorSurfaceVariant}`}
          >
            <ImagePlus size={18} className={theme.colorOnSurfaceVariant} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={toolBtn}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={16} strokeWidth={2.5} />
            {value ? 'Change image' : 'Add an image'}
          </button>
          {value ? (
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                onChange('');
                setError('');
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handleFile(file);
          }}
        />
      </div>
      {error ? <p className={`${TYPE.bodySm} text-rose-500`}>{error}</p> : null}
    </div>
  );
}
