import { renderSVG } from 'uqr';
import { TYPE } from './typography';
import { buildStudentBankQrPayload } from './bankQrPayload';

/**
 * Renders a scannable ClassBank QR for a student profile.
 * White plate kept for scan contrast in light and dark themes.
 */
export function StudentBankQr({
  student,
  size = 160,
  theme,
  isDarkMode,
  caption = 'Scan to log in to ClassBank',
  showCaption = true,
  className = '',
}) {
  let svg = '';
  let error = '';
  const payload = buildStudentBankQrPayload(student);
  if (!payload) {
    error = 'Missing student id';
  } else {
    try {
      svg = renderSVG(payload, { ecc: 'M', border: 1 });
    } catch {
      error = 'Could not generate QR';
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="inline-flex items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-white p-3 shadow-sm"
        style={{ width: size + 24, height: size + 24 }}
      >
        {svg ? (
          <div
            role="img"
            aria-label={`ClassBank QR for ${student?.name || 'student'}`}
            className="[&>svg]:h-full [&>svg]:w-full"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div
            className={`flex items-center justify-center ${TYPE.bodySm} text-slate-400`}
            style={{ width: size, height: size }}
          >
            {error || '…'}
          </div>
        )}
      </div>
      {showCaption ? (
        <p
          className={`mt-3 text-center ${TYPE.bodyMd} ${
            theme?.colorOnSurface || (isDarkMode ? 'text-white' : 'text-slate-900')
          }`}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
