import { useEffect, useState } from 'react';
import { renderSVG } from 'uqr';
import { TYPE } from './typography';
import { buildStudentBankQrPayload } from './bankQrPayload';
import { studentDisplayName } from '../data/students/displayName';
import {
  ensureCardToken,
  rotateCardToken,
} from '../data/students/cardToken';
import { reconcileStudentCard } from '../data/auth/classroom';

/**
 * One printed student card. The same code reprints until a teacher or
 * admin chooses New code.
 */
export function StudentBankQr({
  student,
  size = 160,
  theme,
  isDarkMode,
  caption = 'Scan to sign in. A lost card reprints this same code.',
  showCaption = true,
  allowReplace = true,
  className = '',
}) {
  const [token, setToken] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);

  useEffect(() => {
    if (!student?.id) return undefined;
    const local = ensureCardToken(student.id);
    setToken(local?.token || '');
    let active = true;
    reconcileStudentCard({
      rosterStudentId: student.id,
      displayName: studentDisplayName(student, ''),
      local,
    })
      .then((next) => {
        if (active && next?.token && next.token !== local?.token) setToken(next.token);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [student?.id]);

  async function replaceCard() {
    if (!student?.id) return;
    const next = rotateCardToken(student.id);
    setToken(next?.token || '');
    setConfirmReplace(false);
    try {
      const saved = await reconcileStudentCard({
        rosterStudentId: student.id,
        displayName: studentDisplayName(student, ''),
        local: next,
        rotate: true,
      });
      if (saved?.token) setToken(saved.token);
    } catch {
      /* the local card is what reprints until the server is reachable */
    }
  }

  let svg = '';
  let error = '';
  const payload = token ? buildStudentBankQrPayload(student, token) : '';
  if (!student?.id) {
    error = 'Missing student id';
  } else if (!payload) {
    error = 'Could not prepare the card';
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
            aria-label={`Student card for ${student?.name || 'student'}`}
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
      {allowReplace && student?.id ? (
        confirmReplace ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme?.colorPrimary || 'bg-slate-900'} ${theme?.colorOnPrimary || 'text-white'}`}
              onClick={replaceCard}
            >
              Replace this card
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme?.colorOutline || 'border-slate-300'} ${theme?.colorOnSurface || ''}`}
              onClick={() => setConfirmReplace(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`edu-control mt-3 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme?.colorOutline || 'border-slate-300'} ${theme?.colorOnSurface || ''}`}
            onClick={() => setConfirmReplace(true)}
          >
            New code
          </button>
        )
      ) : null}
    </div>
  );
}