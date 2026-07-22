import { Mic, MicOff } from 'lucide-react';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

/** Permission gate shown inside Noise Meter stage cards. */
export function MicPrompt({ isDarkMode, theme, onStart, error = null }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 opacity-100 py-10 min-h-[180px] text-center px-6">
      <div
        className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center shadow-sm border-2 ${
          isDarkMode
            ? 'bg-slate-800 border-slate-600'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <MicOff size={32} className="text-slate-400" />
      </div>
      <p
        className={`${TYPE.titleSm} max-w-sm ${error ? 'mb-2' : 'mb-6'} ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        To use the Noise Meter, please allow permission for the microphone.
      </p>
      {error ? (
        <p className={`mb-6 ${TYPE.bodySm} text-rose-500 max-w-sm`}>{error}</p>
      ) : null}
      <ModalPrimaryButton theme={theme} onClick={onStart}>
        <span className="inline-flex items-center gap-2">
          <Mic size={18} />
          Allow Microphone
        </span>
      </ModalPrimaryButton>
    </div>
  );
}
