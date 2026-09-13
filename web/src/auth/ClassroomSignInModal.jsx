import { useEffect, useState } from 'react';
import { renderSVG } from 'uqr';
import { buildLoginQrPayload, isValidPin } from '../data/auth/codes';
import { addClassroomStudent, loadClassroomRoster, mintClassroomQr } from '../data/auth/classroom';
import { Modal } from '../shared/Modal';
import { TYPE } from '../shared/typography';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';

function QrPlate({ token, name }) {
  const payload = buildLoginQrPayload(token);
  let svg = '';
  try {
    svg = renderSVG(payload, { ecc: 'M', border: 1 });
  } catch {
    svg = '';
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white p-2">
        {svg ? (
          <div
            role="img"
            aria-label={`Login QR for ${name}`}
            className="h-40 w-40 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : null}
      </div>
      <p className={`${TYPE.bodySm} text-slate-500`}>
        A lost card reprints this same code. New code replaces it.
      </p>
    </div>
  );
}

export function ClassroomSignInModal({ theme, isDarkMode, onClose }) {
  const [roster, setRoster] = useState(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(null);

  useEffect(() => {
    let active = true;
    loadClassroomRoster()
      .then((next) => {
        if (active) setRoster(next);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Could not load classroom sign-in.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function onAdd(event) {
    event.preventDefault();
    if (!name.trim() || !isValidPin(pin)) {
      setError('Add a name and a 4 to 6 digit PIN.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const next = await addClassroomStudent({ displayName: name, pin });
      setRoster(next);
      setName('');
      setPin('');
    } catch (err) {
      setError(err?.message || 'Could not add that student.');
    } finally {
      setBusy(false);
    }
  }

  async function onShow(member) {
    setBusy(true);
    setError('');
    try {
      const next = await mintClassroomQr(member.id);
      if (next?.needsNewCode) {
        setError(next.error || 'New code makes one you can print again.');
        return;
      }
      setRoster(next);
      setQr({ token: next.qrToken, name: member.displayName });
    } catch (err) {
      setError(err?.message || 'Could not open that card.');
    } finally {
      setBusy(false);
    }
  }

  async function onReplace(member) {
    setBusy(true);
    setError('');
    try {
      const next = await mintClassroomQr(member.id, { rotate: true });
      setRoster(next);
      setQr({ token: next.qrToken, name: member.displayName });
    } catch (err) {
      setError(err?.message || 'Could not make a new code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen
      title="Classroom sign-in"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 px-6 py-5">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Students sign in with this class code and their PIN, or by scanning a QR code.
        </p>

        <div className={`rounded-2xl border-[1.5px] px-4 py-4 ${theme.colorOutline} ${theme.colorSurfaceVariant}`}>
          <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>Class code</p>
          <p className={`mt-1 tracking-[0.2em] ${TYPE.titleLg} ${theme.colorOnSurface}`}>
            {roster?.class?.joinCode || '…'}
          </p>
        </div>

        <form className="space-y-3" onSubmit={onAdd}>
          <AuthField
            id="classroom-student-name"
            label="Student name"
            theme={theme}
            isDarkMode={isDarkMode}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
          <AuthField
            id="classroom-student-pin"
            label="PIN"
            theme={theme}
            isDarkMode={isDarkMode}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
          />
          <button type="submit" disabled={busy} className={primaryButtonClass(theme)}>
            {busy ? 'Saving…' : 'Add student'}
          </button>
        </form>

        <ul className="space-y-2">
          {(roster?.members || []).map((member) => (
            <li
              key={member.id}
              className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutline}`}
            >
              <span className={TYPE.bodyMd}>{member.displayName}</span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onShow(member)}
                  className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-60`}
                >
                  QR code
                </button>
                {member.hasQr ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReplace(member)}
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface} disabled:opacity-60`}
                  >
                    New code
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {qr?.token ? <QrPlate token={qr.token} name={qr.name} /> : null}
        <AuthError message={error} />
      </div>
    </Modal>
  );
}
