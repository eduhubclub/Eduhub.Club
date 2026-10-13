import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  listCloudEdudocs,
  openDocFromCloud,
} from '../../../data/docs/docsCloud';

/**
 * Pick a .edudoc from Edu.Hub/Docs on Drive or OneDrive.
 */
export function CloudOpenModal({
  isOpen,
  provider,
  theme,
  isDarkMode,
  onClose,
  onOpened,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !provider) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError('');
      try {
        const list = await listCloudEdudocs(provider);
        if (!cancelled) setFiles(list);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not list cloud docs.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const label = provider === 'google' ? 'Google Drive' : 'OneDrive';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Open from ${label}`}
      isDarkMode={isDarkMode}
      theme={theme}
    >
      <div className="space-y-3">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Showing .edudoc files in Edu.Hub/Docs. These stay in Edu.Hub format so Word
          won’t rewrite them.
        </p>
        {error ? <p className={`${TYPE.bodySm} text-red-600`}>{error}</p> : null}
        {busy ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>Loading…</p>
        ) : !files.length ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No .edudoc files in Edu.Hub/Docs yet.
          </p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2">
                <span className={`${TYPE.bodyMd} ${theme.colorOnSurface} truncate`}>
                  {f.name}
                </span>
                <button
                  type="button"
                  className={`edu-control ${toolBtn} shrink-0`}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      const doc = await openDocFromCloud(provider, f.id);
                      onOpened?.(doc);
                      onClose?.();
                    } catch (e) {
                      setError(e?.message || 'Could not open.');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
