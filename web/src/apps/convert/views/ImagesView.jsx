import { useEffect, useId, useRef, useState } from 'react';
import {
  Download,
  FileUp,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { SegmentControl } from '../../../shared/SegmentControl';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  CROP_ASPECT_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  IMAGE_PRESETS,
  IMAGE_PRESET_OPTIONS,
  convertImageFile,
  downloadBlob,
  isLikelyGif,
  isLikelyHeic,
  zipBlobs,
} from '../../../data/convert/imageConvert';

function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Edu.Convert → Images: convert, crop, rotate, presets.
 */
export function ImagesView({ theme, isDarkMode }) {
  const inputId = useId();
  const [items, setItems] = useState([]);
  const [preset, setPreset] = useState('custom');
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [cropAspectId, setCropAspectId] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const toolBtn = toolBtnClass(isDarkMode);
  const lossy = format === 'jpeg' || format === 'webp';

  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const applyPreset = (id) => {
    setPreset(id);
    const p = IMAGE_PRESETS[id];
    if (!p || id === 'custom') return;
    if (p.format) setFormat(p.format);
    setQuality(p.quality);
    setMaxWidth(p.maxWidth != null ? String(p.maxWidth) : '');
    setMaxHeight(p.maxHeight != null ? String(p.maxHeight) : '');
  };

  const markCustom = () => {
    if (preset !== 'custom') setPreset('custom');
  };

  const accept =
    'image/*,.heic,.heif,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff';

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f && f.size > 0);
    if (!files.length) return;
    setError('');
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nextId(),
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        heic: isLikelyHeic(file),
        gif: isLikelyGif(file),
        status: 'ready',
        error: '',
      })),
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    setItems((prev) => {
      for (const item of prev) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
    setError('');
  };

  const parseMax = (raw) => {
    const n = Number.parseInt(String(raw).trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const cropOpt = CROP_ASPECT_OPTIONS.find((o) => o.id === cropAspectId);

  const convertOptions = () => ({
    format,
    quality: quality / 100,
    maxWidth: parseMax(maxWidth),
    maxHeight: parseMax(maxHeight),
    rotate,
    flipH,
    flipV,
    cropAspect: cropOpt?.ratio ?? null,
  });

  const runConvert = async (ids) => {
    const opts = convertOptions();
    const idSet = new Set(ids);
    const results = [];
    const snapshot = items.filter((i) => idSet.has(i.id));

    setItems((prev) =>
      prev.map((item) =>
        idSet.has(item.id)
          ? { ...item, status: 'converting', error: '' }
          : item,
      ),
    );

    for (const item of snapshot) {
      try {
        const out = await convertImageFile(item.file, {
          ...opts,
          filename: item.name,
        });
        results.push({ name: out.filename, blob: out.blob, id: item.id });
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  status: 'done',
                  error: '',
                  outBytes: out.blob.size,
                  outName: out.filename,
                  outWidth: out.width,
                  outHeight: out.height,
                }
              : p,
          ),
        );
      } catch (err) {
        const message = err?.message || 'Could not convert this file.';
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: 'error', error: message }
              : p,
          ),
        );
      }
    }
    return results;
  };

  const onDownloadAll = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setError('');
    try {
      const results = await runConvert(items.map((i) => i.id));
      const ok = results.filter((r) => r.blob);
      if (!ok.length) {
        setError('Nothing could be converted. Check the file messages below.');
        return;
      }
      if (ok.length === 1) {
        downloadBlob(ok[0].blob, ok[0].name);
      } else {
        const zip = await zipBlobs(ok.map((r) => ({ name: r.name, blob: r.blob })));
        downloadBlob(zip, 'edu-convert-images.zip');
      }
    } catch (err) {
      setError(err?.message || 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  const onDownloadOne = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item || busy) return;
    setBusy(true);
    setError('');
    try {
      const results = await runConvert([id]);
      const ok = results[0];
      if (!ok?.blob) {
        setError('Could not convert this file.');
        return;
      }
      downloadBlob(ok.blob, ok.name);
    } catch (err) {
      setError(err?.message || 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  const dropClass = `edu-control flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed px-4 py-8 transition-colors ${theme.colorSurface} ${
    dragOver ? theme.colorPrimary : theme.colorOutline
  } ${theme.colorOnSurface}`;

  const previewTransform = `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;

  return (
    <>
      <PageHeader
        title="Images"
        description="Convert, crop, rotate, and compress photos on this device. Processed on this device — nothing is uploaded."
        isDarkMode={isDarkMode}
      />

      {error ? (
        <p className={`${TYPE.bodyMd} mb-3 text-rose-600`} role="alert">
          {error}
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
              addFiles(e.dataTransfer.files);
            }}
          >
            <FileUp size={28} className="text-slate-400" aria-hidden />
            <span className={TYPE.titleMd}>Drop images or click to choose</span>
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              PNG, JPG, WEBP — HEIC when this browser supports it
            </span>
            <input
              id={inputId}
              type="file"
              accept={accept}
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {items.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-full w-full object-contain transition-transform"
                      style={{ transform: previewTransform }}
                    />
                    <button
                      type="button"
                      className={`edu-control absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${toolBtn}`}
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <p
                      className={`${TYPE.labelMd} truncate ${theme.colorOnSurface}`}
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {formatBytes(item.size)}
                      {item.outBytes != null
                        ? ` → ${formatBytes(item.outBytes)}`
                        : ''}
                      {item.status === 'converting' ? ' · converting…' : ''}
                    </p>
                    {item.gif ? (
                      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        Animated GIFs export as a single frame.
                      </p>
                    ) : null}
                    {item.heic && item.status === 'ready' ? (
                      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        HEIC — works in Safari; other browsers may not open it.
                      </p>
                    ) : null}
                    {item.error ? (
                      <p className={`${TYPE.bodySm} text-rose-600`} role="alert">
                        {item.error}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className={`${toolBtn} self-start`}
                      disabled={busy}
                      onClick={() => onDownloadOne(item.id)}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside
          className={`flex h-fit flex-col gap-4 p-5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Preset</h2>
            <div className="mt-3 overflow-x-auto">
              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={preset}
                onChange={applyPreset}
                options={IMAGE_PRESET_OPTIONS.map((p) => ({
                  id: p.id,
                  label: p.label,
                }))}
              />
            </div>
          </div>

          <div>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Format</h2>
            <div className="mt-3">
              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={format}
                onChange={(id) => {
                  markCustom();
                  setFormat(id);
                }}
                options={IMAGE_FORMAT_OPTIONS.map((f) => ({
                  id: f.id,
                  label: f.label,
                }))}
              />
            </div>
          </div>

          {lossy ? (
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
                onChange={(e) => {
                  markCustom();
                  setQuality(Number(e.target.value));
                }}
                className="edu-control w-full accent-current"
              />
            </label>
          ) : (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              PNG is lossless — quality does not apply.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                Max width
              </span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="None"
                value={maxWidth}
                onChange={(e) => {
                  markCustom();
                  setMaxWidth(e.target.value);
                }}
                className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                Max height
              </span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="None"
                value={maxHeight}
                onChange={(e) => {
                  markCustom();
                  setMaxHeight(e.target.value);
                }}
                className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              />
            </label>
          </div>

          <div>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              Transform
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={toolBtn}
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                <RotateCw size={16} />
                Rotate {rotate ? `· ${rotate}°` : ''}
              </button>
              <button
                type="button"
                className={`${toolBtn} ${flipH ? theme.colorPrimary : ''}`}
                aria-pressed={flipH}
                onClick={() => setFlipH((v) => !v)}
              >
                <FlipHorizontal2 size={16} />
                Flip H
              </button>
              <button
                type="button"
                className={`${toolBtn} ${flipV ? theme.colorPrimary : ''}`}
                aria-pressed={flipV}
                onClick={() => setFlipV((v) => !v)}
              >
                <FlipVertical2 size={16} />
                Flip V
              </button>
            </div>
          </div>

          <div>
            <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
              Center crop
            </h2>
            <div className="mt-3 overflow-x-auto">
              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={cropAspectId}
                onChange={setCropAspectId}
                options={CROP_ASPECT_OPTIONS.map((o) => ({
                  id: o.id,
                  label: o.label,
                }))}
              />
            </div>
          </div>

          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Leave max size blank to keep original dimensions. Images never upscale.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-50`}
              disabled={!items.length || busy}
              onClick={onDownloadAll}
            >
              <Download size={16} />
              {busy
                ? 'Working…'
                : items.length > 1
                  ? 'Download ZIP'
                  : 'Download'}
            </button>
            {items.length ? (
              <button
                type="button"
                className={toolBtn}
                disabled={busy}
                onClick={clearAll}
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
