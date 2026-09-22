import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileUp,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { SegmentControl } from '../../../shared/SegmentControl';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { downloadBlob, zipBlobs } from '../../../data/convert/imageConvert';
import {
  PDF_COMPRESS_PRESETS,
  compressPdf,
  downloadPdfBytes,
  downloadPdfFiles,
  getPdfPageCount,
  imagesToPdf,
  mergePdfs,
  pdfToImages,
  reorderPdfPages,
  rotatePdf,
  splitPdf,
  stampPdf,
} from '../../../data/convert/pdfConvert';

const MODES = [
  { id: 'merge', label: 'Merge' },
  { id: 'split', label: 'Split' },
  { id: 'rotate', label: 'Rotate' },
  { id: 'edit', label: 'Edit' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'compress', label: 'Compress' },
  { id: 'toImages', label: 'PDF → images' },
  { id: 'fromImages', label: 'Images → PDF' },
];

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function baseName(name) {
  return String(name || 'document').replace(/\.pdf$/i, '') || 'document';
}

/**
 * Edu.Convert → PDF tools (merge through compress).
 */
export function PdfView({ theme, isDarkMode }) {
  const inputId = useId();
  const [mode, setMode] = useState('merge');
  const [items, setItems] = useState([]);
  const [pageOrder, setPageOrder] = useState([]);
  const [ranges, setRanges] = useState('');
  const [splitMode, setSplitMode] = useState('extract');
  const [rotation, setRotation] = useState(90);
  const [imageFormat, setImageFormat] = useState('jpeg');
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState(1.5);
  const [stampNumbers, setStampNumbers] = useState(true);
  const [stampPosition, setStampPosition] = useState('bottom-center');
  const [stampStart, setStampStart] = useState('1');
  const [watermark, setWatermark] = useState('');
  const [compressPreset, setCompressPreset] = useState('classroom');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const toolBtn = toolBtnClass(isDarkMode);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const wantsPdf = mode !== 'fromImages';
  const accept = wantsPdf
    ? 'application/pdf,.pdf'
    : 'image/png,image/jpeg,.png,.jpg,.jpeg';
  const multiFile = mode === 'merge' || mode === 'fromImages';
  const primaryFile = items[0]?.file;
  const compressMeta = PDF_COMPRESS_PRESETS[compressPreset];

  const clearItems = () => {
    setItems((prev) => {
      for (const item of prev) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
    setPageOrder([]);
  };

  const onModeChange = (next) => {
    setMode(next);
    setError('');
    setNote('');
    clearItems();
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f && f.size > 0);
    if (!files.length) return;
    setError('');
    setNote('');

    if (wantsPdf) {
      const pdfs = files.filter(
        (f) =>
          (f.type || '').includes('pdf') || /\.pdf$/i.test(f.name || ''),
      );
      if (!pdfs.length) {
        setError('Choose PDF files for this tool.');
        return;
      }
      const toAdd = multiFile ? pdfs : pdfs.slice(0, 1);
      const next = [];
      for (const file of toAdd) {
        let pageCount = null;
        let err = '';
        try {
          pageCount = await getPdfPageCount(file);
        } catch (e) {
          err = e?.message || 'Could not read this PDF.';
        }
        next.push({
          id: nextId(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
          error: err,
          previewUrl: null,
          kind: 'pdf',
        });
      }
      setItems((prev) => {
        if (!multiFile) {
          for (const item of prev) {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          }
          return next;
        }
        return [...prev, ...next];
      });
      if (!multiFile && next[0]?.pageCount) {
        setPageOrder(Array.from({ length: next[0].pageCount }, (_, i) => i));
      } else if (!multiFile) {
        setPageOrder([]);
      }
      return;
    }

    const images = files.filter((f) => {
      const t = (f.type || '').toLowerCase();
      const n = (f.name || '').toLowerCase();
      return (
        t.includes('png') ||
        t.includes('jpeg') ||
        t.includes('jpg') ||
        n.endsWith('.png') ||
        n.endsWith('.jpg') ||
        n.endsWith('.jpeg')
      );
    });
    if (!images.length) {
      setError('Images → PDF needs JPG or PNG. Convert WEBP in Images first.');
      return;
    }
    setItems((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: nextId(),
        file,
        name: file.name,
        size: file.size,
        pageCount: null,
        error: '',
        previewUrl: URL.createObjectURL(file),
        kind: 'image',
      })),
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setPageOrder([]);
  };

  const movePage = (index, delta) => {
    setPageOrder((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const removePageAt = (index) => {
    setPageOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const onRun = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNote('');
    try {
      if (mode === 'merge') {
        if (items.length < 2) throw new Error('Add at least two PDFs to merge.');
        const result = await mergePdfs(items.map((i) => i.file));
        downloadPdfBytes(result.bytes, result.filename);
        setNote(`Merged ${items.length} PDFs into ${result.pageCount} pages.`);
      } else if (mode === 'split') {
        if (!primaryFile) throw new Error('Add a PDF to split.');
        const result = await splitPdf(primaryFile, {
          mode: splitMode,
          ranges,
          baseName: baseName(items[0].name),
        });
        await downloadPdfFiles(result.files);
        setNote(
          splitMode === 'each'
            ? `Split into ${result.files.length} PDF${result.files.length === 1 ? '' : 's'}.`
            : `Extracted ${result.files[0].pageCount} page${result.files[0].pageCount === 1 ? '' : 's'}.`,
        );
      } else if (mode === 'rotate') {
        if (!primaryFile) throw new Error('Add a PDF to rotate.');
        const result = await rotatePdf(primaryFile, {
          degrees: rotation,
          ranges,
          baseName: baseName(items[0].name),
        });
        downloadPdfBytes(result.bytes, result.filename);
        setNote(`Rotated pages by ${rotation}°.`);
      } else if (mode === 'edit') {
        if (!primaryFile) throw new Error('Add a PDF to edit.');
        if (!pageOrder.length) throw new Error('Keep at least one page.');
        const result = await reorderPdfPages(primaryFile, pageOrder, {
          baseName: baseName(items[0].name),
        });
        downloadPdfBytes(result.bytes, result.filename);
        setNote(`Saved ${result.pageCount} page${result.pageCount === 1 ? '' : 's'}.`);
      } else if (mode === 'stamp') {
        if (!primaryFile) throw new Error('Add a PDF to stamp.');
        const result = await stampPdf(primaryFile, {
          pageNumbers: stampNumbers,
          position: stampPosition,
          startAt: Number.parseInt(stampStart, 10) || 1,
          watermark,
          ranges,
          baseName: baseName(items[0].name),
        });
        downloadPdfBytes(result.bytes, result.filename);
        setNote('Stamped PDF ready.');
      } else if (mode === 'compress') {
        if (!primaryFile) throw new Error('Add a PDF to compress.');
        const result = await compressPdf(primaryFile, {
          preset: compressPreset,
          ranges,
          baseName: baseName(items[0].name),
        });
        downloadPdfBytes(result.bytes, result.filename);
        setNote(
          `Compressed ${formatBytes(result.originalBytes)} → ${formatBytes(result.outputBytes)} (${result.pageCount} pages). Text may become harder to select.`,
        );
      } else if (mode === 'toImages') {
        if (!primaryFile) throw new Error('Add a PDF to convert.');
        const result = await pdfToImages(primaryFile, {
          format: imageFormat,
          quality: quality / 100,
          scale,
          ranges,
          baseName: baseName(items[0].name),
        });
        if (result.images.length === 1) {
          downloadBlob(result.images[0].blob, result.images[0].filename);
        } else {
          const zip = await zipBlobs(
            result.images.map((img) => ({
              name: img.filename,
              blob: img.blob,
            })),
          );
          downloadBlob(zip, `${baseName(items[0].name)}-pages.zip`);
        }
        setNote(
          `Exported ${result.images.length} image${result.images.length === 1 ? '' : 's'}.`,
        );
      } else if (mode === 'fromImages') {
        if (!items.length) throw new Error('Add JPG or PNG images.');
        const result = await imagesToPdf(
          items.map((i) => i.file),
          { baseName: 'images' },
        );
        downloadPdfBytes(result.bytes, result.filename);
        setNote(`Built a ${result.pageCount}-page PDF.`);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const canRun =
    mode === 'merge'
      ? items.length >= 2
      : mode === 'fromImages'
        ? items.length >= 1
        : mode === 'edit'
          ? items.length === 1 && !items[0].error && pageOrder.length > 0
          : mode === 'stamp'
            ? items.length === 1 &&
              !items[0].error &&
              (stampNumbers || watermark.trim())
            : items.length === 1 && !items[0].error;

  const dropLabel = wantsPdf
    ? multiFile
      ? 'Drop PDFs or click to choose'
      : 'Drop a PDF or click to choose'
    : 'Drop JPG/PNG images or click to choose';

  const dropClass = `edu-control flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed px-4 py-8 transition-colors ${theme.colorSurface} ${
    dragOver ? theme.colorPrimary : theme.colorOutline
  } ${theme.colorOnSurface}`;

  const showRanges =
    mode === 'split' ||
    mode === 'rotate' ||
    mode === 'stamp' ||
    mode === 'compress' ||
    mode === 'toImages';

  return (
    <>
      <PageHeader
        title="PDF"
        description="Merge, edit, stamp, compress, and convert — processed on this device, nothing uploaded."
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 overflow-x-auto pb-1">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={mode}
          onChange={onModeChange}
          options={MODES}
        />
      </div>

      {error ? (
        <p className={`${TYPE.bodyMd} mb-3 text-rose-600`} role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p className={`${TYPE.bodyMd} mb-3 ${theme.colorOnSurface}`}>{note}</p>
      ) : null}
      {busy ? (
        <p className={`${TYPE.bodyMd} mb-3 ${theme.colorOnSurfaceVariant}`}>
          Working…
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          <label
            htmlFor={inputId}
            className={dropClass}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void addFiles(e.dataTransfer.files);
            }}
          >
            <FileUp size={28} className="text-slate-400" aria-hidden />
            <span className={TYPE.titleMd}>{dropLabel}</span>
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {wantsPdf
                ? 'PDF only — stays on this device'
                : 'JPG or PNG only (use Images for WEBP)'}
            </span>
            <input
              id={inputId}
              type="file"
              accept={accept}
              multiple={multiFile}
              className="sr-only"
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {items.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
                >
                  {item.previewUrl ? (
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`${TYPE.labelMd} truncate ${theme.colorOnSurface}`}
                        title={item.name}
                      >
                        {mode === 'merge' ? `${index + 1}. ` : ''}
                        {item.name}
                      </p>
                      <button
                        type="button"
                        className={`edu-control inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toolBtn}`}
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {formatBytes(item.size)}
                      {item.pageCount != null
                        ? ` · ${item.pageCount} page${item.pageCount === 1 ? '' : 's'}`
                        : ''}
                    </p>
                    {item.error ? (
                      <p className={`${TYPE.bodySm} text-rose-600`} role="alert">
                        {item.error}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {mode === 'edit' && pageOrder.length ? (
            <ol
              className={`divide-y overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              {pageOrder.map((srcIdx, index) => (
                <li
                  key={`${srcIdx}-${index}`}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <span className={`${TYPE.labelMd} w-8 ${theme.colorOnSurface}`}>
                    {index + 1}.
                  </span>
                  <span className={`${TYPE.bodyMd} flex-1 ${theme.colorOnSurface}`}>
                    Original page {srcIdx + 1}
                  </span>
                  <button
                    type="button"
                    className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-lg ${toolBtn}`}
                    aria-label="Move up"
                    disabled={index === 0 || busy}
                    onClick={() => movePage(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-lg ${toolBtn}`}
                    aria-label="Move down"
                    disabled={index === pageOrder.length - 1 || busy}
                    onClick={() => movePage(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className={`edu-control inline-flex h-8 w-8 items-center justify-center rounded-lg ${toolBtn}`}
                    aria-label="Remove page"
                    disabled={pageOrder.length <= 1 || busy}
                    onClick={() => removePageAt(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <aside
          className={`flex h-fit flex-col gap-4 p-5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          {mode === 'split' ? (
            <div>
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Split as</h2>
              <div className="mt-3">
                <SegmentControl
                  isDarkMode={isDarkMode}
                  theme={theme}
                  value={splitMode}
                  onChange={setSplitMode}
                  options={[
                    { id: 'extract', label: 'One PDF' },
                    { id: 'each', label: 'Each page' },
                  ]}
                />
              </div>
            </div>
          ) : null}

          {mode === 'rotate' ? (
            <div>
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                Rotate clockwise
              </h2>
              <div className="mt-3">
                <SegmentControl
                  isDarkMode={isDarkMode}
                  theme={theme}
                  value={String(rotation)}
                  onChange={(id) => setRotation(Number(id))}
                  options={[
                    { id: '90', label: '90°' },
                    { id: '180', label: '180°' },
                    { id: '270', label: '270°' },
                  ]}
                />
              </div>
            </div>
          ) : null}

          {mode === 'edit' ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Reorder or remove pages, then download. Removing a page here deletes
              it from the exported PDF.
            </p>
          ) : null}

          {mode === 'stamp' ? (
            <>
              <label className={`flex items-center gap-2 ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                <input
                  type="checkbox"
                  className="edu-control h-4 w-4"
                  checked={stampNumbers}
                  onChange={(e) => setStampNumbers(e.target.checked)}
                />
                Page numbers
              </label>
              {stampNumbers ? (
                <>
                  <div>
                    <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                      Position
                    </h2>
                    <div className="mt-3">
                      <SegmentControl
                        isDarkMode={isDarkMode}
                        theme={theme}
                        value={stampPosition}
                        onChange={setStampPosition}
                        options={[
                          { id: 'bottom-center', label: 'Bottom' },
                          { id: 'bottom-right', label: 'BR' },
                          { id: 'top-center', label: 'Top' },
                        ]}
                      />
                    </div>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                      Start at
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={stampStart}
                      onChange={(e) => setStampStart(e.target.value)}
                      className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                    />
                  </label>
                </>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                  Watermark
                </span>
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder="e.g. DRAFT or Room 12"
                  className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                />
              </label>
            </>
          ) : null}

          {mode === 'compress' ? (
            <>
              <div>
                <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Preset</h2>
                <div className="mt-3">
                  <SegmentControl
                    isDarkMode={isDarkMode}
                    theme={theme}
                    value={compressPreset}
                    onChange={setCompressPreset}
                    options={Object.values(PDF_COMPRESS_PRESETS).map((p) => ({
                      id: p.id,
                      label: p.label,
                    }))}
                  />
                </div>
              </div>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Rasterizes pages to JPEG ({Math.round((compressMeta?.quality || 0.75) * 100)}%
                · {compressMeta?.scale}×). Best for photo-heavy scans; selectable text is lost.
              </p>
            </>
          ) : null}

          {mode === 'toImages' ? (
            <>
              <div>
                <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  Image format
                </h2>
                <div className="mt-3">
                  <SegmentControl
                    isDarkMode={isDarkMode}
                    theme={theme}
                    value={imageFormat}
                    onChange={setImageFormat}
                    options={[
                      { id: 'jpeg', label: 'JPG' },
                      { id: 'png', label: 'PNG' },
                      { id: 'webp', label: 'WEBP' },
                    ]}
                  />
                </div>
              </div>
              {imageFormat !== 'png' ? (
                <label className="flex flex-col gap-2">
                  <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                    Quality · {quality}%
                  </span>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="edu-control w-full accent-current"
                  />
                </label>
              ) : null}
              <label className="flex flex-col gap-2">
                <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                  Render scale · {scale.toFixed(1)}×
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="edu-control w-full accent-current"
                />
              </label>
            </>
          ) : null}

          {showRanges ? (
            <label className="flex flex-col gap-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                Pages
              </span>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="All pages (or 1-3,5)"
                className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              />
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Leave blank for every page. Example: 1-3,5
              </span>
            </label>
          ) : null}

          {mode === 'merge' ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Files merge in the order shown. Remove and re-add to reorder.
            </p>
          ) : null}

          {mode === 'fromImages' ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Each image becomes one Letter page, centered and fit to margins.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-50`}
              disabled={!canRun || busy}
              onClick={() => void onRun()}
            >
              <Download size={16} />
              {busy ? 'Working…' : 'Download'}
            </button>
            {items.length ? (
              <button
                type="button"
                className={toolBtn}
                disabled={busy}
                onClick={() => {
                  clearItems();
                  setError('');
                  setNote('');
                }}
              >
                <Trash2 size={16} />
                Clear
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
