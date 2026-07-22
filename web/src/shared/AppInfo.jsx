import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { ModalPrimaryButton } from './ModalPrimaryButton';
import { TYPE } from './typography';

const AppInfoContext = createContext(null);

/**
 * Shell-level “About this app” overlay.
 * Apps declare `about: { description, features }` on their config.
 */
export function AppInfoProvider({ app, theme, isDarkMode, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAppInfo = useCallback(() => setIsOpen(true), []);
  const closeAppInfo = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      openAppInfo,
      closeAppInfo,
      isOpen,
      hasAbout: Boolean(app?.about?.description || app?.about?.features?.length),
    }),
    [openAppInfo, closeAppInfo, isOpen, app],
  );

  return (
    <AppInfoContext.Provider value={value}>
      {children}
      <AppInfoOverlay
        isOpen={isOpen}
        onClose={closeAppInfo}
        app={app}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </AppInfoContext.Provider>
  );
}

export function useAppInfo() {
  return useContext(AppInfoContext);
}

function AppInfoOverlay({ isOpen, onClose, app, theme, isDarkMode }) {
  const about = app?.about;
  const description =
    about?.description ||
    'More about this app will appear here as help content is added.';
  const features = about?.features || [];

  return (
    <Modal
      isOpen={isOpen}
      title={`About ${app?.name || 'this app'}`}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-md"
      zIndex="z-[220]"
      footer={
        <ModalPrimaryButton theme={theme} onClick={onClose}>
          Got it
        </ModalPrimaryButton>
      }
    >
      <div className="p-6 space-y-5">
        <p
          className={`${TYPE.bodyMd} ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>

        {features.length > 0 ? (
          <div>
            <p
              className={`${TYPE.labelMicro} mb-3 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Key features
            </p>
            <ul className="space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${theme.colorPrimaryContainer}`}
                  >
                    <Check
                      size={12}
                      strokeWidth={2.5}
                      className={theme.colorOnPrimaryContainer}
                    />
                  </span>
                  <span
                    className={`${TYPE.bodyMd} leading-snug ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
