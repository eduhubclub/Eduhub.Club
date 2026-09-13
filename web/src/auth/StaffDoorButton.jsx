import { useState } from 'react';
import { codeUnlocks } from './staffDoor';
import { AuthError, AuthField, primaryButtonClass } from './AuthFields';
import { Modal } from '../shared/Modal';

/**
 * Faint corner control. No label on the button. The code is asked only after a click.
 */
export function StaffDoor({ theme, isDarkMode, onUnlock }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!codeUnlocks(code)) {
      setError('That code did not work.');
      setCode('');
      return;
    }
    setError('');
    onUnlock();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Staff"
        onClick={() => {
          setError('');
          setCode('');
          setOpen(true);
        }}
        className="edu-control fixed bottom-4 left-4 z-30 h-11 w-11 border-0 bg-transparent p-0 shadow-none"
      />
      <Modal
        isOpen={open}
        title="Code"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setOpen(false)}
        maxWidth="max-w-sm"
      >
        <form className="space-y-3 px-6 py-5" onSubmit={submit}>
          <AuthField
            id="staff-code"
            label="Code"
            theme={theme}
            isDarkMode={isDarkMode}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
          />
          <AuthError message={error} />
          <button type="submit" className={primaryButtonClass(theme)}>
            Continue
          </button>
        </form>
      </Modal>
    </>
  );
}
