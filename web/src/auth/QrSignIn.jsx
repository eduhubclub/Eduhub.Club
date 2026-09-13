import { useEffect, useRef, useState } from 'react';
import { parseLoginQr } from '../data/auth/codes';
import { TYPE } from '../shared/typography';

/**
 * Scan a classroom login QR. Falls back to pasting the code when the
 * browser has no BarcodeDetector.
 */
export function QrSignIn({ theme, isDarkMode, disabled, onToken, fill = false }) {
  const videoRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [cameraError, setCameraError] = useState('');
  const [paste, setPaste] = useState('');

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let stream;
    let stopped = false;
    let timer;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || !('BarcodeDetector' in window)) {
        setCameraError('This browser cannot scan a QR code. Paste the code instead.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (stopped || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const token = codes.map((code) => parseLoginQr(code.rawValue)).find(Boolean);
            if (token) {
              stopped = true;
              onTokenRef.current(token);
              return;
            }
          } catch {
            /* frame not ready */
          }
          timer = window.setTimeout(tick, 350);
        };
        timer = window.setTimeout(tick, 350);
      } catch {
        setCameraError('Camera is unavailable. Paste the code instead.');
      }
    }

    start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (fill) {
    return (
      <div className={`relative h-full w-full overflow-hidden rounded-2xl border-[1.5px] bg-slate-950 ${theme.colorOutline}`}>
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-slate-950/80 p-3">
          <p className={`${TYPE.bodySm} text-white`}>
            {cameraError || 'Point the camera at the QR code from your teacher.'}
          </p>
          {cameraError ? (
            <div className="flex items-center gap-2">
              <input
                value={paste}
                onChange={(event) => setPaste(event.target.value)}
                placeholder="Paste the code"
                aria-label="Paste the code"
                className={`edu-control min-w-0 flex-1 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                autoComplete="off"
                disabled={disabled}
              />
              <button
                type="button"
                disabled={disabled || paste.trim().length < 16}
                onClick={() => {
                  const token = parseLoginQr(paste) || paste.trim();
                  if (token.length >= 16) onToken(token);
                }}
                className={`edu-control shrink-0 rounded-xl px-3 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-60`}
              >
                Use this code
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`overflow-hidden rounded-2xl border-[1.5px] bg-slate-950 ${theme.colorOutline}`}
      >
        <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      </div>
      {cameraError ? (
        <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {cameraError}
        </p>
      ) : (
        <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Point the camera at the QR code from your teacher.
        </p>
      )}
      <div className="space-y-2">
        <label className="block">
          <span className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Or paste the code
          </span>
          <input
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            className={`edu-control mt-1.5 w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            autoComplete="off"
            disabled={disabled}
          />
        </label>
        <button
          type="button"
          disabled={disabled || paste.trim().length < 16}
          onClick={() => {
            const token = parseLoginQr(paste) || paste.trim();
            if (token.length >= 16) onToken(token);
          }}
          className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-60`}
        >
          Use this code
        </button>
      </div>
    </div>
  );
}
