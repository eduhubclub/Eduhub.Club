import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { TYPE } from './typography';

const SCROLLBAR =
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent';

/** Lets nested controls (e.g. icon More panel) cover the modal body under the header. */
export const ModalBodyContext = createContext(null);

export function useModalBodyEl() {
  return useContext(ModalBodyContext);
}

/**
 * Standard Edu.Hub modal shell.
 * Header: app theme color + white title/close (same as navbar resource modal).
 * Body scrolls inside max-h-[90vh] when content is tall.
 * Portaled to document.body so it covers shell chrome (header, sidebars).
 */
export function Modal({
  isOpen,
  title,
  theme,
  isDarkMode,
  onClose,
  children,
  footer,
  headerStart = null,
  maxWidth = 'max-w-lg',
  zIndex = 'z-[200]',
}) {
  const [bodyEl, setBodyEl] = useState(null);

  if (!isOpen) return null;

  const modal = (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm transition-opacity`}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className={`relative w-full ${maxWidth} flex flex-col max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${theme.colorSurface} ${
          isDarkMode ? `border ${theme.colorOutline}` : ''
        }`}
      >
        <div className={`flex items-center justify-between px-6 py-4 shrink-0 ${theme.colorPrimary}`}>
          <div className="flex items-center min-w-0 gap-2">
            {headerStart}
            <h3 className={`${TYPE.titleMd} truncate ${theme.colorOnPrimary}`}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${theme.colorOnPrimary} opacity-80 hover:opacity-100 hover:bg-white/20`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={setBodyEl}
          className={`relative flex-1 min-h-0 overflow-y-auto ${SCROLLBAR}`}
        >
          <ModalBodyContext.Provider value={bodyEl}>{children}</ModalBodyContext.Provider>
        </div>

        {footer ? (
          <div
            className={`px-6 py-4 border-t flex justify-end gap-3 shrink-0 ${
              isDarkMode
                ? `${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`
                : `${theme.colorOutlineVariant} ${theme.colorSurfaceVariant}`
            }`}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
