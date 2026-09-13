import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { importPdfDeck } from '../../../data/slides/importPdf';
import { importPptxDeck } from '../../../data/slides/importPptx';
import { importGoogleSlideFile, listGoogleSlidesDecks } from '../../../data/slides/importGoogle';
import { readSlidesSettings } from '../../../data/slides/settings';

/**
 * Official Google G — do not recolor with theme roles.
 */
function GoogleMark({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * PDF first, then PPTX, then Google export / upload.
 */
export function ImportView({ theme, isDarkMode, onOpenEdit }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [googleFiles, setGoogleFiles] = useState([]);
  const [googleToken, setGoogleToken] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);
  const clientId = readSlidesSettings().googleClientId;
  const dropClass = `edu-control flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed px-4 py-8 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const run = async (label, work) => {
    setBusy(label);
    setError('');
    setNote('');
    try {
      const deck = await work();
      setNote(`Imported “${deck.name}” with ${deck.slides.length} slide${deck.slides.length === 1 ? '' : 's'}.`);
      onOpenEdit?.();
    } catch (err) {
      setError(err?.message || 'Could not import that file.');
    } finally {
      setBusy('');
    }
  };

  const onFile = (file) => {
    if (!file) return;
    const name = file.name || 'Imported lesson';
    const lower = name.toLowerCase();
    file.arrayBuffer().then((buf) => {
      if (lower.endsWith('.pdf')) {
        run('PDF', () => importPdfDeck(buf, name));
      } else if (lower.endsWith('.pptx') || lower.endsWith('.zip')) {
        run('PowerPoint', () => importPptxDeck(buf, name));
      } else {
        setError('Use a PDF or a PowerPoint (.pptx) file.');
      }
    });
  };

  const dropProps = {
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDrop: (e) => {
      e.preventDefault();
      onFile(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <>
      <PageHeader
        title="Import"
        description="PDF pages become background slides. PowerPoint maps text and pictures onto the canvas. Google Slides export uses the same importers."
        isDarkMode={isDarkMode}
      />
      {error ? (
        <p className={`${TYPE.bodyMd} mb-3 text-rose-600`} role="alert">
          {error}
        </p>
      ) : null}
      {note ? <p className={`${TYPE.bodyMd} mb-3 ${theme.colorOnSurface}`}>{note}</p> : null}
      {busy ? <p className={`${TYPE.bodyMd} mb-3 ${theme.colorOnSurfaceVariant}`}>{busy}…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`p-5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>PDF</h2>
          <p className={`${TYPE.bodySm} mt-1 mb-4 ${theme.colorOnSurfaceVariant}`}>
            Each page becomes one full-bleed background image.
          </p>
          <label className={dropClass} {...dropProps}>
            <FileUp size={28} className="text-slate-400" />
            Drop a PDF or click to choose
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </section>

        <section className={`p-5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>PowerPoint</h2>
          <p className={`${TYPE.bodySm} mt-1 mb-4 ${theme.colorOnSurfaceVariant}`}>
            Text boxes and pictures become objects. SmartArt and charts may be skipped.
          </p>
          <label className={dropClass} {...dropProps}>
            <FileUp size={28} className="text-slate-400" />
            Drop a .pptx or click to choose
            <input
              type="file"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </section>

        <section className={`p-5 lg:col-span-2 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Google Slides</h2>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                Sign in to export a Google Slides file as PowerPoint, or upload a download.
              </p>
            </div>
            <button
              type="button"
              disabled={!clientId || Boolean(busy)}
              className="edu-control inline-flex items-center gap-2 rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043]"
              onClick={async () => {
                setError('');
                setBusy('Google');
                try {
                  const { token, files } = await listGoogleSlidesDecks();
                  setGoogleToken(token);
                  setGoogleFiles(files);
                  if (!files.length) setNote('No Google Slides files found in that Drive account.');
                } catch (err) {
                  setError(err?.message || 'Google sign-in failed.');
                } finally {
                  setBusy('');
                }
              }}
            >
              <GoogleMark />
              Connect Google
            </button>
          </div>
          {!clientId ? (
            <p className={`${TYPE.bodySm} mt-3 ${theme.colorOnSurfaceVariant}`}>
              Add an OAuth client ID in Settings, or upload a Google Slides export below.
            </p>
          ) : null}
          {googleFiles.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {googleFiles.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    className={`${toolBtn} w-full justify-start`}
                    onClick={() =>
                      run('Google Slides', () =>
                        importGoogleSlideFile(file.id, file.name, googleToken),
                      )
                    }
                  >
                    {file.name || 'Untitled'}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <label className={`${dropClass} mt-4`} {...dropProps}>
            <FileUp size={28} className="text-slate-400" />
            Upload a Google export (.pptx or .pdf)
            <input
              type="file"
              accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </section>
      </div>
    </>
  );
}
