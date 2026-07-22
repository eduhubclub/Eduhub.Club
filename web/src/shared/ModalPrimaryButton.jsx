import { TYPE } from './typography';

/** Shared footer primary action for modals — Type: TYPE.labelLg. */
export function ModalPrimaryButton({ theme, disabled, onClick, type = 'button', children }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl ${TYPE.labelLg} transition-all ${
        disabled
          ? `${theme.bgMuted} ${theme.colorOnPrimary} cursor-not-allowed opacity-70`
          : `${theme.colorPrimary} ${theme.colorOnPrimary} hover:opacity-90 active:scale-95 shadow-sm`
      }`}
    >
      {children}
    </button>
  );
}
