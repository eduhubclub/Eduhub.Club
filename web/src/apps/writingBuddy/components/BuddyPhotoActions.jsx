import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Link2 } from 'lucide-react';
import {
  CUSTOM_PORTRAIT_ID,
  readPortraitFileAsDataUrl,
} from '../../../data/writingBuddy/constants';
import { validateImageLink } from '../../morningMeeting/ImageField';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { BuddyPortrait } from './BuddyPortrait';

/** Circle diameter as a fraction of the square stage. */
const CROP_RATIO = 0.86;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function coverMetrics(stageSize, videoW, videoH) {
  const cover = Math.max(stageSize / videoW, stageSize / videoH);
  return {
    cover,
    dispW: videoW * cover,
    dispH: videoH * cover,
  };
}

function clampPan(pan, stageSize, videoW, videoH) {
  if (!stageSize || !videoW || !videoH) return { x: 0, y: 0 };
  const { dispW, dispH } = coverMetrics(stageSize, videoW, videoH);
  const r = (stageSize * CROP_RATIO) / 2;
  const maxX = Math.max(0, dispW / 2 - r);
  const maxY = Math.max(0, dispH / 2 - r);
  return {
    x: clamp(pan.x, -maxX, maxX),
    y: clamp(pan.y, -maxY, maxY),
  };
}

/**
 * Single custom-buddy chip that opens a modal for upload, live camera, or image link.
 */
export function BuddyPhotoActions({
  theme,
  isDarkMode = false,
  active,
  imageUrl,
  name,
  onApplyImage,
  onActivateExisting,
}) {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const streamRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // menu | camera | link
  const [linkDraft, setLinkDraft] = useState('');
  const [error, setError] = useState('');
  const [cameraBusy, setCameraBusy] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState(0);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });

  function setPanClamped(next) {
    const video = videoRef.current;
    const size = stageRef.current?.clientWidth || stageSize;
    const clamped = clampPan(
      next,
      size,
      video?.videoWidth || 0,
      video?.videoHeight || 0,
    );
    panRef.current = clamped;
    setPan(clamped);
  }

  function stopCamera() {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function openModal() {
    stopCamera();
    setMode('menu');
    setLinkDraft('');
    setError('');
    setCameraBusy(false);
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    setVideoSize({ w: 0, h: 0 });
    setOpen(true);
  }

  function closeModal() {
    stopCamera();
    setOpen(false);
    setMode('menu');
    setLinkDraft('');
    setError('');
    setCameraBusy(false);
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    setVideoSize({ w: 0, h: 0 });
  }

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!open || mode !== 'camera') {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    setCameraBusy(true);
    setError('');
    setPan({ x: 0, y: 0 });
    panRef.current = { x: 0, y: 0 };
    setVideoSize({ w: 0, h: 0 });

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This device doesn’t support the camera in the browser.');
        setCameraBusy(false);
        setMode('menu');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          if (video.videoWidth) {
            setVideoSize({ w: video.videoWidth, h: video.videoHeight });
          }
        }
        setCameraBusy(false);
      } catch {
        if (cancelled) return;
        setError(
          'Couldn’t open the camera. Check permissions, or use Upload / Link instead.',
        );
        setCameraBusy(false);
        setMode('menu');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, mode]);

  useEffect(() => {
    if (!open || mode !== 'camera') return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      const size = stage.clientWidth;
      setStageSize(size);
      setPanClamped(panRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [open, mode]);

  async function handleFile(file) {
    if (!file) return;
    try {
      const dataUrl = await readPortraitFileAsDataUrl(file);
      onApplyImage?.(dataUrl);
      closeModal();
    } catch (err) {
      setError(err?.message || 'Couldn’t use that image.');
    }
  }

  function onStagePointerDown(e) {
    if (cameraBusy) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...panRef.current },
    };
  }

  function onStagePointerMove(e) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    // Mirror drag on X so selfie framing feels natural.
    setPanClamped({
      x: drag.origin.x - (e.clientX - drag.startX),
      y: drag.origin.y + (e.clientY - drag.startY),
    });
  }

  function onStagePointerUp(e) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }

  function snapPhoto() {
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!video || !video.videoWidth || !stage) {
      setError('Camera isn’t ready yet — wait a moment and try again.');
      return;
    }
    const S = stage.clientWidth;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const { cover, dispW, dispH } = coverMetrics(S, vw, vh);
    const crop = clampPan(panRef.current, S, vw, vh);
    const cropSize = S * CROP_RATIO;
    const cx = S / 2 + crop.x;
    const cy = S / 2 + crop.y;

    // Stage → video (before mirror). Canvas flips to match the selfie preview.
    const stageToVideo = (sx, sy) => ({
      x: (sx - cx + dispW / 2) / cover,
      y: (sy - cy + dispH / 2) / cover,
    });
    const tl = stageToVideo(S / 2 - cropSize / 2, S / 2 - cropSize / 2);
    const br = stageToVideo(S / 2 + cropSize / 2, S / 2 + cropSize / 2);
    const sx = clamp(Math.min(tl.x, br.x), 0, vw);
    const sy = clamp(Math.min(tl.y, br.y), 0, vh);
    const sw = clamp(Math.abs(br.x - tl.x), 1, vw - sx);
    const sh = clamp(Math.abs(br.y - tl.y), 1, vh - sy);

    const out = Math.min(512, Math.round(Math.max(sw, sh)));
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Couldn’t capture that photo.');
      return;
    }
    ctx.translate(out, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, out, out);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onApplyImage?.(dataUrl);
      closeModal();
    } catch {
      setError('Couldn’t save that photo.');
    }
  }

  function applyLink() {
    const check = validateImageLink(linkDraft);
    if (!check.ok) {
      setError(check.error || 'Enter a valid image link.');
      return;
    }
    onApplyImage?.(String(linkDraft).trim());
    closeModal();
  }

  const actionBtn = `edu-control flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`;
  const videoDisp =
    stageSize && videoSize.w
      ? coverMetrics(stageSize, videoSize.w, videoSize.h)
      : null;

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        className={`edu-control rounded-2xl border-[1.5px] p-2.5 ${
          active
            ? `${theme.colorPrimary} ${theme.colorOutline}`
            : `${theme.colorSurface} ${theme.colorOutline}`
        }`}
        onClick={() => {
          if (active && imageUrl) {
            onActivateExisting?.();
            return;
          }
          openModal();
        }}
      >
        {active && imageUrl ? (
          <BuddyPortrait
            theme={theme}
            portraitId={CUSTOM_PORTRAIT_ID}
            imageUrl={imageUrl}
            name={name || 'Custom'}
            size="sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-dashed ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
            >
              <ImagePlus size={20} />
            </span>
            <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Custom</span>
          </div>
        )}
      </button>

      {active && imageUrl ? (
        <button
          type="button"
          className={`edu-control mb-1 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          onClick={openModal}
        >
          Change photo
        </button>
      ) : null}

      <Modal
        isOpen={open}
        title={mode === 'camera' ? 'Take a photo' : 'Add a buddy photo'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={closeModal}
        maxWidth="max-w-md"
      >
        <div className="space-y-3 p-5 sm:p-6">
          {mode === 'menu' ? (
            <>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Upload a file, take a photo, or paste an image link.
              </p>

              <button
                type="button"
                className={actionBtn}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={20} className="shrink-0" />
                <span>
                  <span className="block">Upload</span>
                  <span className={`mt-0.5 block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    Choose a picture from this device
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={actionBtn}
                onClick={() => {
                  setError('');
                  setMode('camera');
                }}
              >
                <Camera size={20} className="shrink-0" />
                <span>
                  <span className="block">Take a photo</span>
                  <span className={`mt-0.5 block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    Open the camera for a buddy portrait
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={actionBtn}
                onClick={() => {
                  setMode('link');
                  setError('');
                }}
              >
                <Link2 size={20} className="shrink-0" />
                <span>
                  <span className="block">Paste a link</span>
                  <span className={`mt-0.5 block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    Use an https image address
                  </span>
                </span>
              </button>
            </>
          ) : null}

          {mode === 'camera' ? (
            <div className="space-y-3">
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Drag to move your face into the circle — that’s what will be saved.
              </p>
              <div
                ref={stageRef}
                role="presentation"
                className={`relative aspect-square touch-none overflow-hidden rounded-2xl border-[1.5px] ${theme.colorOutline} bg-slate-900 ${
                  cameraBusy ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'
                }`}
                onPointerDown={onStagePointerDown}
                onPointerMove={onStagePointerMove}
                onPointerUp={onStagePointerUp}
                onPointerCancel={onStagePointerUp}
              >
                <video
                  ref={videoRef}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: videoDisp ? videoDisp.dispW : '100%',
                    height: videoDisp ? videoDisp.dispH : '100%',
                    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scaleX(-1)`,
                  }}
                  muted
                  playsInline
                  autoPlay
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    setVideoSize({ w: v.videoWidth, h: v.videoHeight });
                    setPanClamped(panRef.current);
                  }}
                />
                {/* Dim outside the portrait circle */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle closest-side at center, transparent ${
                      CROP_RATIO * 100 - 1
                    }%, rgba(15, 23, 42, 0.62) ${CROP_RATIO * 100}%)`,
                  }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.35)]"
                  style={{
                    width: `${CROP_RATIO * 100}%`,
                    height: `${CROP_RATIO * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  aria-hidden
                />
                {cameraBusy ? (
                  <p
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 px-4 text-center ${TYPE.bodyMd} text-white`}
                  >
                    Opening camera…
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                  onClick={() => {
                    stopCamera();
                    setMode('menu');
                    setError('');
                    setPan({ x: 0, y: 0 });
                    panRef.current = { x: 0, y: 0 };
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={cameraBusy}
                  className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-40`}
                  onClick={snapPhoto}
                >
                  Capture
                </button>
              </div>
            </div>
          ) : null}

          {mode === 'link' ? (
            <div className="space-y-3">
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Paste an https image address (not a search page).
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="url"
                  autoFocus
                  className={`edu-control min-w-0 flex-1 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
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
                  className={`edu-control shrink-0 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  onClick={applyLink}
                >
                  Use link
                </button>
              </div>
              <button
                type="button"
                className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                onClick={() => {
                  setMode('menu');
                  setError('');
                }}
              >
                Back
              </button>
            </div>
          ) : null}

          {error ? <p className={`${TYPE.bodySm} text-red-600`}>{error}</p> : null}
        </div>
      </Modal>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          handleFile(file);
        }}
      />
    </>
  );
}
