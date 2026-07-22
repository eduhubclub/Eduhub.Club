import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, Settings2, Shuffle } from 'lucide-react';
import { ButtonRow } from '../../../shared/ButtonRow';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { MethodPreview, TIEBREAKER_METHODS } from '../methods.jsx';
import { appFabClass, APP_BOARD_PAD, APP_STATIC_BOARD_MD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

const ALL_METHOD_IDS = TIEBREAKER_METHODS.map((m) => m.id);

/**
 * Shuffle to a random classic classroom tiebreaker method.
 */
export function RandomMethodView({ isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedId, setSelectedId] = useState(TIEBREAKER_METHODS[0].id);
  const [enabledIds, setEnabledIds] = useState(ALL_METHOD_IDS);
  const [tempEnabledIds, setTempEnabledIds] = useState(ALL_METHOD_IDS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const shuffleIntervalRef = useRef(null);

  const enabledMethods = useMemo(
    () => TIEBREAKER_METHODS.filter((m) => enabledIds.includes(m.id)),
    [enabledIds],
  );

  const method =
    TIEBREAKER_METHODS.find((m) => m.id === selectedId) ?? enabledMethods[0] ?? TIEBREAKER_METHODS[0];

  const clearShuffleInterval = () => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearShuffleInterval(), []);

  const handleShuffle = () => {
    if (isShuffling || enabledMethods.length === 0) return;
    clearShuffleInterval();
    setIsShuffling(true);
    const pool = enabledMethods;
    let count = 0;
    shuffleIntervalRef.current = setInterval(() => {
      setSelectedId((prev) => {
        const idx = pool.findIndex((m) => m.id === prev);
        const next = pool[(idx + 1 + pool.length) % pool.length];
        return next.id;
      });
      count += 1;
      if (count > 20) {
        clearShuffleInterval();
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setSelectedId(pick.id);
        setIsShuffling(false);
        if (pick?.title) announce(`Method: ${pick.title}`);
      }
    }, 100);
  };

  const openSettings = () => {
    setTempEnabledIds(enabledIds);
    setIsSettingsOpen(true);
  };

  const toggleTempMethod = (id) => {
    setTempEnabledIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const saveSettings = () => {
    if (tempEnabledIds.length === 0) return;
    setEnabledIds(tempEnabledIds);
    if (!tempEnabledIds.includes(selectedId)) {
      setSelectedId(tempEnabledIds[0]);
    }
    setIsSettingsOpen(false);
  };

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <>
      <div className="w-full h-full min-h-0 max-h-full flex flex-col overflow-hidden">
        <ButtonRow>
          <button type="button" onClick={openSettings} className={toolBtn}>
            <Settings2 size={16} strokeWidth={2.5} />
            Settings
          </button>
        </ButtonRow>

        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <div
            className={`${APP_STATIC_BOARD_MD} ${APP_BOARD_PAD} items-center relative ${surface}`}
          >
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${theme.text} ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
              }`}
              title="How to play"
            >
              <HelpCircle size={20} strokeWidth={2.5} />
            </button>

            <div className="text-center mb-3 sm:mb-4 shrink-0 pr-8">
              <h2
                className={`${TYPE.titleLg} ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {method.title}
              </h2>
              <p className={`text-slate-400 ${TYPE.bodyMd} mt-1`}>{method.desc}</p>
            </div>

            <div
              className={`w-full flex-1 min-h-0 flex items-center justify-center transition-all duration-150 ${
                isShuffling ? 'blur-sm scale-95 opacity-50' : 'opacity-100 scale-100'
              }`}
            >
              <MethodPreview
                methodId={method.id}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShuffle}
        disabled={isShuffling || enabledMethods.length === 0}
        aria-label={isShuffling ? 'Choosing method' : 'Pick tiebreaker method'}
        title="Pick Tiebreaker Method"
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      >
        <Shuffle size={24} />
      </button>

      <Modal
        isOpen={isSettingsOpen}
        title="Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              onClick={saveSettings}
              disabled={tempEnabledIds.length === 0}
            >
              Apply Changes
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6">
          <p
            className={`${TYPE.titleSm} mb-1 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            Methods in shuffle
          </p>
          <p
            className={`${TYPE.bodySm} mb-4 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Choose which tiebreakers can appear when you shuffle. Keep at least one on.
          </p>
          <ul className="space-y-1">
            {TIEBREAKER_METHODS.map((item) => {
              const on = tempEnabledIds.includes(item.id);
              const isLastOn = on && tempEnabledIds.length === 1;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleTempMethod(item.id)}
                    disabled={isLastOn}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-60 ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`${TYPE.titleSm} min-w-0 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      role="switch"
                      aria-checked={on}
                      aria-label={`${item.title} ${on ? 'on' : 'off'}`}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                        on
                          ? theme.colorPrimary
                          : isDarkMode
                            ? 'bg-slate-700'
                            : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          on ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={isHelpOpen}
        title="How to Play"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setIsHelpOpen(false)}
        maxWidth="max-w-md"
        footer={
          <ModalPrimaryButton theme={theme} onClick={() => setIsHelpOpen(false)}>
            Got it
          </ModalPrimaryButton>
        }
      >
        <div className="p-6 space-y-3">
          <div>
            <p
              className={`${TYPE.titleSm} mb-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {method.title}
            </p>
            <p
              className={`${TYPE.bodyMd} ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {method.rules}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
