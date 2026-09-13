import { renderSVG } from 'uqr';
import { TYPE } from '../../shared/typography';
import { buildSlidesJoinPayload } from '../../data/slides/types';

/**
 * Join QR for a live Slides session. White plate for scan contrast.
 */
export function SlidesJoinQr({ sessionId, joinCode, size = 132, theme }) {
  const payload = buildSlidesJoinPayload(sessionId, joinCode);
  let svg = '';
  try {
    if (payload) svg = renderSVG(payload, { ecc: 'M', border: 1 });
  } catch {
    svg = '';
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="inline-flex items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-white p-2 shadow-sm"
        style={{ width: size + 16, height: size + 16 }}
      >
        {svg ? (
          <div
            role="img"
            aria-label={`Join slides session ${joinCode || ''}`}
            className="[&>svg]:h-full [&>svg]:w-full"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div
            className={`flex items-center justify-center ${TYPE.bodySm} text-slate-400`}
            style={{ width: size, height: size }}
          >
            …
          </div>
        )}
      </div>
      <p className={`mt-2 text-center ${TYPE.labelLg} ${theme?.colorOnSurface || 'text-slate-900'}`}>
        {joinCode || '—'}
      </p>
    </div>
  );
}
