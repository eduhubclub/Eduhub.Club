import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { TYPE } from '../../shared/typography';

export const MM_MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isExternalImageUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

/**
 * Reject search-result pages and other non-image destinations.
 * @param {string} url
 * @returns {{ ok: boolean, error: string }}
 */
export function validateImageLink(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return { ok: false, error: '' };
  if (!isExternalImageUrl(trimmed)) {
    return { ok: false, error: 'Link must start with https://' };
  }
  let host = '';
  let path = '';
  try {
    const u = new URL(trimmed);
    host = u.hostname.toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    return { ok: false, error: 'That doesn’t look like a valid URL.' };
  }

  const searchHosts = [
    'google.',
    'bing.com',
    'duckduckgo.com',
    'yahoo.com',
    'yandex.',
  ];
  if (
    searchHosts.some((h) => host.includes(h)) &&
    (path.includes('/search') ||
      path.includes('/imgres') ||
      trimmed.includes('udm=2') ||
      trimmed.includes('tbm=isch'))
  ) {
    return {
      ok: false,
      error:
        'That’s a search page, not an image. Open the photo, then right‑click → Copy image address.',
    };
  }

  return { ok: true, error: '' };
}

/**
 * Compact image picker: upload, drag/drop, or https link.
 *
 * @param {{
 *   value?: string,
 *   onChange: (next: string) => void,
 *   theme: Record<string, string>,
 *   isDarkMode?: boolean,
 *   label?: string,
 * }} props
 */
export function ImageField({
  value = '',
  onChange,
  theme,
  isDarkMode = false,
  label = 'Image',
}) {
  const fileRef = useRef(null);
  const [showLink, setShowLink] = useState(() => isExternalImageUrl(value));
  const [linkDraft, setLinkDraft] = useState(() =>
    isExternalImageUrl(value) ? String(value) : '',
  );
  const [error, setError] = useState('');
  const [previewBroken, setPreviewBroken] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const external = isExternalImageUrl(value);
    setShowLink(external);
    setLinkDraft(external ? String(value) : '');
    setPreviewBroken(false);
    setError('');
  }, [value]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > MM_MAX_IMAGE_BYTES) {
      setError('Image is too large — keep uploads under about 1.5 MB.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
      setShowLink(false);
      setLinkDraft('');
      setError('');
      setPreviewBroken(false);
      setDragOver(false);
    } catch {
      setError('Couldn’t read that file.');
    }
  };

  const applyLink = () => {
    const check = validateImageLink(linkDraft);
    if (!check.ok) {
      setError(check.error || 'Enter a valid image link.');
      return;
    }
    onChange(String(linkDraft).trim());
    setError('');
    setPreviewBroken(false);
  };

  const clear = () => {
    onChange('');
    setLinkDraft('');
    setShowLink(false);
    setError('');
    setPreviewBroken(false);
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = [...(e.dataTransfer.files || [])].find((f) =>
      f.type.startsWith('image/'),
    );
    if (file) handleFile(file);
    else setError('Drop an image file (JPG, PNG, etc.).');
  };

  const hasPreview = Boolean(value) && !previewBroken;
  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <div className="space-y-2">
      {label ? (
        <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!hasPreview) fileRef.current?.click();
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !hasPreview) {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border-[1.5px] transition-colors ${
          theme.colorOutline
        } ${
          dragOver
            ? `${theme.colorPrimaryContainer} ring-2 ring-inset ring-orange-400`
            : isDarkMode
              ? 'bg-slate-800'
              : 'bg-slate-100'
        } ${hasPreview ? '' : 'cursor-pointer'}`}
      >
        {hasPreview ? (
          <img
            key={value}
            src={value}
            alt=""
            className="pointer-events-none h-full w-full object-cover"
            onLoad={() => setPreviewBroken(false)}
            onError={() => {
              setPreviewBroken(true);
              setError(
                'Couldn’t load that link as an image. Right‑click the photo → Copy image address (not the page URL).',
              );
            }}
          />
        ) : (
          <div
            className={`pointer-events-none flex flex-col items-center gap-1.5 px-4 text-center ${theme.colorOnSurfaceVariant}`}
          >
            <ImagePlus size={22} />
            <p className={TYPE.bodySm}>
              {dragOver ? 'Drop image to upload' : 'Drop an image, or use Upload / Link'}
            </p>
          </div>
        )}
        {dragOver && hasPreview ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className={`${TYPE.labelLg} text-white`}>Drop to replace</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} />
          Upload
        </button>
        <button
          type="button"
          className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
            showLink
              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
              : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
          }`}
          onClick={() => {
            setShowLink((v) => !v);
            setError('');
          }}
        >
          <Link2 size={14} />
          Link
        </button>
        {value ? (
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
            onClick={clear}
          >
            <Trash2 size={14} />
            Clear
          </button>
        ) : null}
      </div>

      {showLink ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="url"
            className={`${inputClass} flex-1`}
            placeholder="https://…"
            value={linkDraft}
            onChange={(e) => {
              setLinkDraft(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <button
            type="button"
            className={`edu-control shrink-0 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`}
            onClick={applyLink}
          >
            Use link
          </button>
        </div>
      ) : null}

      {error ? (
        <p className={`${TYPE.bodySm} text-red-600 dark:text-red-400`}>{error}</p>
      ) : null}

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
  );
}
