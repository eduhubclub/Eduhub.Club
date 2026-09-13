import { useCallback, useEffect, useRef, useState } from 'react';

const SCAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'];

const VIDEO_IDEAL = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30 },
};

function prefersRearCamera() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
}

/**
 * Built-in iMac / laptop cameras are user-facing and can't macro-focus.
 * Phones prefer the rear camera.
 */
async function openBarcodeStream() {
  const order = prefersRearCamera()
    ? ['environment', 'user']
    : ['user', 'environment'];
  let lastError;
  for (const facing of order) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO_IDEAL, facingMode: { ideal: facing } },
      });
    } catch (err) {
      lastError = err;
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: VIDEO_IDEAL,
    });
  } catch (err) {
    lastError = err;
  }
  throw lastError;
}

async function tuneFocus(stream) {
  const track = stream.getVideoTracks?.()[0];
  if (!track?.getCapabilities || !track.applyConstraints) return;
  try {
    const caps = track.getCapabilities();
    const focusModes = caps.focusMode || [];
    if (focusModes.includes('continuous')) {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } else if (focusModes.includes('single-shot')) {
      await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] });
    }
  } catch {
    /* FaceTime cameras often ignore focus constraints */
  }
}
const DEBOUNCE_MS = 1600;
const HOLD_MS = 280;
const STROKE = '#34d399';
const FILL = 'rgba(52, 211, 153, 0.18)';

/**
 * Map a point in video source pixels onto the object-cover display box.
 * @param {HTMLVideoElement} video
 * @param {number} x
 * @param {number} y
 */
function mapVideoPoint(video, x, y) {
  const displayW = video.clientWidth || 1;
  const displayH = video.clientHeight || 1;
  const sourceW = video.videoWidth || 1;
  const sourceH = video.videoHeight || 1;
  const scale = Math.min(displayW / sourceW, displayH / sourceH);
  const offsetX = (displayW - sourceW * scale) / 2;
  const offsetY = (displayH - sourceH * scale) / 2;
  return { x: x * scale + offsetX, y: y * scale + offsetY };
}

function drawCornerBrackets(ctx, points) {
  const bracket = 16;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i + points.length - 1) % points.length];
    const cur = points[i];
    const next = points[(i + 1) % points.length];
    const toPrev = { x: prev.x - cur.x, y: prev.y - cur.y };
    const toNext = { x: next.x - cur.x, y: next.y - cur.y };
    const lenPrev = Math.hypot(toPrev.x, toPrev.y) || 1;
    const lenNext = Math.hypot(toNext.x, toNext.y) || 1;
    ctx.beginPath();
    ctx.moveTo(
      cur.x + (toPrev.x / lenPrev) * bracket,
      cur.y + (toPrev.y / lenPrev) * bracket,
    );
    ctx.lineTo(cur.x, cur.y);
    ctx.lineTo(
      cur.x + (toNext.x / lenNext) * bracket,
      cur.y + (toNext.y / lenNext) * bracket,
    );
    ctx.stroke();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLVideoElement} video
 * @param {object[]} codes
 */
function drawDetections(ctx, video, codes) {
  const w = video.clientWidth;
  const h = video.clientHeight;
  if (!w || !h) return;
  if (ctx.canvas.width !== w) ctx.canvas.width = w;
  if (ctx.canvas.height !== h) ctx.canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  if (!codes.length) return;

  for (const code of codes) {
    const corners = Array.isArray(code.cornerPoints) ? code.cornerPoints : [];
    const mapped = corners.map((p) => mapVideoPoint(video, p.x, p.y));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (mapped.length >= 3) {
      ctx.beginPath();
      mapped.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = FILL;
      ctx.fill();
      ctx.strokeStyle = STROKE;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawCornerBrackets(ctx, mapped);
    } else if (code.boundingBox) {
      const { x, y, width, height } = code.boundingBox;
      const a = mapVideoPoint(video, x, y);
      const b = mapVideoPoint(video, x + width, y + height);
      const rx = a.x;
      const ry = a.y;
      const rw = b.x - a.x;
      const rh = b.y - a.y;
      ctx.fillStyle = FILL;
      ctx.strokeStyle = STROKE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(rx, ry, rw, rh, 6);
      else ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * Camera barcode / QR reader (BarcodeDetector). USB/Bluetooth wedges still type into a focused field.
 *
 * @param {{
 *   onScan: (value: string) => void | Promise<void>,
 *   keepScanning?: boolean,
 *   onError?: (message: string) => void,
 * }} args
 */
export function useBarcodeCamera({ onScan, keepScanning = false, onError }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanRef = useRef({ value: '', at: 0 });
  const lastCodesRef = useRef({ codes: [], at: 0 });
  const onScanRef = useRef(onScan);
  const keepScanningRef = useRef(keepScanning);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  keepScanningRef.current = keepScanning;
  onErrorRef.current = onError;
  const [cameraOn, setCameraOn] = useState(false);
  const [lockLabel, setLockLabel] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = overlayRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    lastCodesRef.current = { codes: [], at: 0 };
    lastScanRef.current = { value: '', at: 0 };
    setLockLabel('');
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!('BarcodeDetector' in window)) {
      onErrorRef.current?.(
        'Camera barcode scanning is not supported in this browser. Type the ISBN or use a USB scanner.',
      );
      return;
    }
    try {
      const stream = await openBarcodeStream();
      await tuneFocus(stream);
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
      streamRef.current = stream;
      lastScanRef.current = { value: '', at: 0 };
      setLockLabel('');
      setCameraOn(true);
    } catch {
      onErrorRef.current?.(
        'Could not open the camera. Check permissions, or type the code instead.',
      );
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraOn) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    let cancelled = false;
    const run = async () => {
      try {
        await video.play();
      } catch {
        return;
      }
      if (cancelled || !('BarcodeDetector' in window)) return;
      const detector = new window.BarcodeDetector({ formats: SCAN_FORMATS });
      const tick = async () => {
        if (cancelled || !streamRef.current || !videoRef.current) return;
        const canvas = overlayRef.current;
        const ctx = canvas?.getContext('2d');
        try {
          const codes = await detector.detect(videoRef.current);
          const now = Date.now();
          if (codes.length) {
            lastCodesRef.current = { codes, at: now };
            if (ctx) drawDetections(ctx, videoRef.current, codes);
            const value = String(codes[0]?.rawValue || '').trim();
            if (value) {
              setLockLabel((prev) => (prev === value ? prev : value));
              const isNewValue = lastScanRef.current.value !== value;
              const debounceOk = now - lastScanRef.current.at >= DEBOUNCE_MS;
              const emit = keepScanningRef.current
                ? isNewValue || debounceOk
                : isNewValue;
              if (emit) {
                lastScanRef.current = { value, at: now };
                await onScanRef.current(value);
              }
            }
          } else if (now - lastCodesRef.current.at < HOLD_MS) {
            if (ctx) drawDetections(ctx, videoRef.current, lastCodesRef.current.codes);
          } else {
            if (ctx) {
              const w = videoRef.current.clientWidth;
              const h = videoRef.current.clientHeight;
              if (w && h) {
                if (ctx.canvas.width !== w) ctx.canvas.width = w;
                if (ctx.canvas.height !== h) ctx.canvas.height = h;
                ctx.clearRect(0, 0, w, h);
              }
            }
            setLockLabel((prev) => (prev ? '' : prev));
          }
        } catch {
          /* keep polling */
        }
        if (!cancelled && streamRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [cameraOn]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    videoRef,
    overlayRef,
    cameraOn,
    lockLabel,
    startCamera,
    stopCamera,
  };
}
