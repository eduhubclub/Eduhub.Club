import { TYPE } from '../../shared/typography';

/**
 * Live camera preview with a tracking overlay for detected barcodes / QR.
 */
export function BarcodeCameraPreview({
  videoRef,
  overlayRef,
  cameraOn,
  lockLabel = '',
}) {
  if (!cameraOn) return null;

  const hint = lockLabel
    ? lockLabel.length > 42
      ? `${lockLabel.slice(0, 40)}…`
      : lockLabel
    : 'Hold the book 12–18 inches away — iMac cameras can’t focus up close';

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="w-full max-h-80 object-contain sm:max-h-96"
        muted
        playsInline
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <p
        className={`pointer-events-none absolute bottom-2 left-2 right-2 truncate rounded-lg px-2 py-1 ${TYPE.labelSm} ${
          lockLabel ? 'bg-emerald-500/90 text-white' : 'bg-black/55 text-white'
        }`}
      >
        {lockLabel ? `Tracking · ${hint}` : hint}
      </p>
    </div>
  );
}
