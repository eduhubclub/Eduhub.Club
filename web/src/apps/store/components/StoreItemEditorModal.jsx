import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Link2 } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import {
  newStoreItemId,
  normalizeStoreItem,
} from '../../../data/store/storeModel';
import { resolveStoreItemImageSrc } from '../../../data/store/demoStoreImages';
import {
  StoreImageEditButton,
  StoreImageFrameEditor,
} from './StoreImageFrameEditor';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isExternalImageUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

/** Reject search-result pages and other non-image destinations. */
function validateImageLink(url) {
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

export function StoreItemEditorModal({
  isOpen,
  item,
  theme,
  isDarkMode,
  onClose,
  onSave,
  onDelete,
  showCurrency = true,
}) {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [draft, setDraft] = useState(() => emptyDraft(item));
  const [showLink, setShowLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkError, setLinkError] = useState('');
  const [previewBroken, setPreviewBroken] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [framing, setFraming] = useState(false);

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    const next = emptyDraft(item);
    setDraft(next);
    const external = isExternalImageUrl(next.imageUrl) && !next.imageDataUrl;
    setShowLink(external);
    setLinkDraft(external ? next.imageUrl : '');
    setLinkError('');
    setPreviewBroken(false);
    setCameraError('');
    setFraming(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stop only on close/item change
  }, [isOpen, item]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    stopCamera();
    const dataUrl = await readFileAsDataUrl(file);
    setDraft((d) => ({
      ...d,
      imageDataUrl: dataUrl,
      imageUrl: '',
    }));
    setShowLink(false);
    setLinkDraft('');
    setLinkError('');
    setPreviewBroken(false);
    setCameraError('');
    setDragOver(false);
    setFraming(false);
  };

  const onPreviewDragEnter = (e) => {
    if (cameraOpen || framing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onPreviewDragOver = (e) => {
    if (cameraOpen || framing) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const onPreviewDragLeave = (e) => {
    if (cameraOpen || framing) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  };

  const onPreviewDrop = (e) => {
    if (cameraOpen || framing) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = [...(e.dataTransfer.files || [])].find((f) =>
      f.type.startsWith('image/'),
    );
    if (file) handleFile(file);
    else setCameraError('Drop an image file (JPG, PNG, etc.).');
  };

  const startCamera = async () => {
    setShowLink(false);
    setFraming(false);
    setLinkError('');
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera isn’t available in this browser. Use Upload instead.',
      );
      return;
    }
    try {
      // Stop any prior stream without flipping UI yet
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraOpen(false);
      setCameraError(
        'Couldn’t open the camera. Check permissions, or use Upload instead.',
      );
    }
  };

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [cameraOpen]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    setDraft((d) => ({
      ...d,
      imageDataUrl: dataUrl,
      imageUrl: '',
    }));
    setPreviewBroken(false);
    setCameraError('');
  };

  const applyLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    const check = validateImageLink(url);
    if (!check.ok) {
      setLinkError(check.error);
      return;
    }
    setLinkError('');
    setPreviewBroken(false);
    setDraft((d) => ({
      ...d,
      imageUrl: url,
      imageDataUrl: '',
    }));
  };

  const linkCheck = showLink ? validateImageLink(linkDraft) : null;
  const previewItem = (() => {
    if (showLink) {
      if (linkCheck?.ok) {
        return { ...draft, imageDataUrl: '', imageUrl: linkDraft.trim() };
      }
      if (draft.imageDataUrl) return draft;
      return { ...draft, imageUrl: '', imageDataUrl: '' };
    }
    return draft;
  })();
  const previewSrc = resolveStoreItemImageSrc(previewItem);

  const save = () => {
    let linked = draft.imageUrl;
    if (showLink) {
      const check = validateImageLink(linkDraft);
      if (linkDraft.trim() && !check.ok) {
        setLinkError(check.error || 'Fix the image link before saving.');
        return;
      }
      if (check.ok) linked = linkDraft.trim();
    }
    if (previewBroken && linked && !draft.imageDataUrl) {
      setLinkError(
        'That link didn’t load as an image. Use Copy image address, or Upload instead.',
      );
      return;
    }
    const next = normalizeStoreItem({
      ...draft,
      imageUrl: draft.imageDataUrl ? '' : linked,
      id: draft.id || newStoreItemId(),
      createdAt: item?.createdAt || Date.now(),
      updatedAt: Date.now(),
      stock:
        draft.inventoryMode === 'oneOff'
          ? 1
          : draft.inventoryMode === 'limited'
            ? Math.max(1, Number(draft.stock) || 1)
            : 0,
    });
    if (!next?.name) return;
    onSave(next);
    onClose();
  };

  const handleDelete = () => {
    if (!item?.id || !onDelete) return;
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    onDelete(item.id);
    onClose();
  };

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const mediaBtnClass = `edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`;

  return (
    <Modal
      isOpen={isOpen}
      title={item ? 'Edit item' : 'New store item'}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {item && onDelete ? (
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} text-rose-500`}
              onClick={handleDelete}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <ModalPrimaryButton theme={theme} onClick={save}>
            Save item
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <div
          className={`overflow-hidden rounded-xl border-[1.5px] ${theme.colorOutline}`}
        >
          {framing && previewSrc && !previewBroken ? (
            <StoreImageFrameEditor
              src={previewSrc}
              theme={theme}
              isDarkMode={isDarkMode}
              onCancel={() => setFraming(false)}
              onApply={(dataUrl) => {
                setDraft((d) => ({
                  ...d,
                  imageDataUrl: dataUrl,
                  imageUrl: '',
                }));
                setShowLink(false);
                setLinkDraft('');
                setPreviewBroken(false);
                setFraming(false);
              }}
            />
          ) : (
            <>
              <div
                role={cameraOpen ? undefined : 'button'}
                tabIndex={cameraOpen ? undefined : 0}
                onClick={
                  cameraOpen
                    ? undefined
                    : () => {
                        if (!previewSrc || previewBroken)
                          fileRef.current?.click();
                      }
                }
                onKeyDown={
                  cameraOpen
                    ? undefined
                    : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!previewSrc || previewBroken)
                            fileRef.current?.click();
                        }
                      }
                }
                onDragEnter={onPreviewDragEnter}
                onDragOver={onPreviewDragOver}
                onDragLeave={onPreviewDragLeave}
                onDrop={onPreviewDrop}
                className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden transition-colors ${
                  dragOver
                    ? `${theme.colorPrimaryContainer} ring-2 ring-inset ${theme.colorOutline}`
                    : isDarkMode
                      ? 'bg-slate-800'
                      : 'bg-slate-100'
                } ${cameraOpen ? '' : 'cursor-pointer'}`}
              >
                {cameraOpen ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="pointer-events-none h-full w-full object-cover"
                  />
                ) : previewSrc && !previewBroken ? (
                  <img
                    key={previewSrc}
                    src={previewSrc}
                    alt=""
                    className="pointer-events-none h-full w-full object-cover"
                    onLoad={() => setPreviewBroken(false)}
                    onError={() => {
                      setPreviewBroken(true);
                      setLinkError(
                        'Couldn’t load that link as an image. Right‑click the photo → Copy image address (not the page URL).',
                      );
                    }}
                  />
                ) : (
                  <p
                    className={`pointer-events-none px-4 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                  >
                    {dragOver
                      ? 'Drop image to upload'
                      : linkError && showLink
                        ? 'Image preview unavailable'
                        : 'Drag & drop a photo, or use Upload'}
                  </p>
                )}
                {dragOver && previewSrc && !previewBroken ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
                    <p className={`${TYPE.labelLg} text-white`}>
                      Drop to replace
                    </p>
                  </div>
                ) : null}
                {previewSrc && !previewBroken && !cameraOpen ? (
                  <StoreImageEditButton
                    theme={theme}
                    onClick={() => {
                      stopCamera();
                      setShowLink(false);
                      setFraming(true);
                    }}
                  />
                ) : null}
              </div>
              <div className="flex gap-2 p-2">
                {cameraOpen ? (
                  <>
                    <button
                      type="button"
                      className={`edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                      onClick={snapPhoto}
                    >
                      <Camera size={16} />
                      Snap photo
                    </button>
                    <button
                      type="button"
                      className={mediaBtnClass}
                      onClick={stopCamera}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={mediaBtnClass}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImagePlus size={16} />
                      Upload
                    </button>
                    <button
                      type="button"
                      className={mediaBtnClass}
                      onClick={startCamera}
                    >
                      <Camera size={16} />
                      Camera
                    </button>
                    <button
                      type="button"
                      className={`${mediaBtnClass} ${
                        showLink
                          ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                          : ''
                      }`}
                      onClick={() => {
                        stopCamera();
                        setFraming(false);
                        setShowLink((open) => {
                          if (!open) {
                            setLinkDraft(
                              isExternalImageUrl(draft.imageUrl)
                                ? draft.imageUrl
                                : '',
                            );
                            setLinkError('');
                            setPreviewBroken(false);
                          }
                          return !open;
                        });
                      }}
                    >
                      <Link2 size={16} />
                      Link
                    </button>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
              {cameraError ? (
                <p className={`px-2 pb-2 ${TYPE.bodySm} text-rose-500`}>
                  {cameraError}
                </p>
              ) : null}
              {showLink ? (
                <div
                  className={`space-y-2 border-t p-2 ${
                    isDarkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <input
                    className={fieldClass}
                    type="url"
                    inputMode="url"
                    placeholder="https://… (direct image URL)"
                    value={linkDraft}
                    onChange={(e) => {
                      setLinkDraft(e.target.value);
                      setLinkError('');
                      setPreviewBroken(false);
                    }}
                    onBlur={applyLink}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLink();
                      }
                    }}
                    aria-label="Image link"
                  />
                  {linkError ? (
                    <p className={`${TYPE.bodySm} text-rose-500`}>{linkError}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        <label className="block space-y-1">
          <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Name
          </span>
          <input
            className={fieldClass}
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Treasure box prize"
          />
        </label>

        <label className="block space-y-1">
          <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Description
          </span>
          <textarea
            className={`${fieldClass} min-h-[4rem] resize-y`}
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Optional details"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              Price
            </span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={draft.price}
              onChange={(e) => setField('price', e.target.value)}
            />
          </label>
          {showCurrency ? (
            <label className="block space-y-1">
              <span
                className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
              >
                Currency
              </span>
              <select
                className={fieldClass}
                value={draft.currency}
                onChange={(e) => setField('currency', e.target.value)}
              >
                <option value="bank">Bank $</option>
                <option value="points">Behavior points</option>
                <option value="both">Both (pick at redeem)</option>
              </select>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {draft.currency === 'both'
                  ? 'Redeem chooses Bank or points — never both at once. If Behavior Sync to Bank is on, Store charges Bank only.'
                  : draft.currency === 'points'
                    ? 'Charges Behavior points (or Bank if Sync to Bank is on).'
                    : 'Charges Bank balance.'}
              </p>
            </label>
          ) : null}
        </div>

        <label className="block space-y-1">
          <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Inventory
          </span>
          <select
            className={fieldClass}
            value={draft.inventoryMode}
            onChange={(e) => setField('inventoryMode', e.target.value)}
          >
            <option value="unlimited">Unlimited (treasure box)</option>
            <option value="limited">Limited stock</option>
            <option value="oneOff">One-off (single)</option>
          </select>
        </label>

        {draft.inventoryMode === 'limited' ? (
          <label className="block space-y-1">
            <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
              Stock quantity
            </span>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={draft.stock}
              onChange={(e) => setField('stock', e.target.value)}
            />
          </label>
        ) : null}

        <label className="flex items-center justify-between gap-3">
          <span className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
            Allow same student to buy again
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={draft.allowRepurchase}
            onClick={() => setField('allowRepurchase', !draft.allowRepurchase)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              draft.allowRepurchase
                ? theme.colorPrimary
                : isDarkMode
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                draft.allowRepurchase ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>

        <label className="block space-y-1">
          <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Visibility
          </span>
          <select
            className={fieldClass}
            value={draft.visibility}
            onChange={(e) => setField('visibility', e.target.value)}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}

function emptyDraft(item) {
  return {
    id: item?.id || '',
    name: item?.name || '',
    description: item?.description || '',
    imageDataUrl: item?.imageDataUrl || '',
    imageUrl: item?.imageUrl || '',
    price: item?.price ?? 5,
    currency: item?.currency || 'bank',
    inventoryMode: item?.inventoryMode || 'unlimited',
    stock: item?.stock ?? 1,
    allowRepurchase: item?.allowRepurchase ?? true,
    visibility: item?.visibility || 'private',
  };
}
