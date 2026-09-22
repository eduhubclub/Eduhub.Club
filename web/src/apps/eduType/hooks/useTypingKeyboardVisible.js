import { useEffect, useState } from 'react';
import {
  EDU_TYPE_SETTINGS_EVENT,
  readEduTypeSettings,
  writeEduTypeSettings,
} from '../../../data/eduType/settings';

/** Toggle + persist on-screen typing keyboard visibility. */
export function useTypingKeyboardVisible() {
  const [showKeyboard, setShowKeyboard] = useState(
    () => readEduTypeSettings().showKeyboard !== false,
  );

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail && 'showKeyboard' in e.detail) {
        setShowKeyboard(e.detail.showKeyboard !== false);
      } else {
        setShowKeyboard(readEduTypeSettings().showKeyboard !== false);
      }
    };
    window.addEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
  }, []);

  function toggleKeyboard() {
    const next = !showKeyboard;
    setShowKeyboard(next);
    writeEduTypeSettings({ showKeyboard: next });
  }

  return { showKeyboard, toggleKeyboard };
}
