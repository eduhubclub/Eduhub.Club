import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Maximize, Minimize } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

const FULLSCREEN_Z = 'z-[240]';

/** Large local clock for classroom display. */
export function LocalClockCard({ isDarkMode, theme, isFullscreen, setIsFullscreen }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, setIsFullscreen]);

  const surface = isFullscreen
    ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 ${theme.colorBackground}`
    : `relative ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-8 sm:p-12`;

  const shell = (
    <div
      className={`${surface} flex flex-col items-center justify-center text-center transition-all duration-300`}
    >
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className={`absolute ${isFullscreen ? 'top-8 right-8 p-3' : 'top-4 right-4 p-2'} rounded-xl transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-80`}
        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {isFullscreen ? <Minimize size={32} /> : <Maximize size={24} />}
      </button>

      <Clock className={`mb-4 ${theme.text}`} size={isFullscreen ? 80 : 48} />
      <h3
        className={`${isFullscreen ? 'text-4xl font-bold mb-2' : TYPE.titleLg} ${theme.colorOnSurface}`}
      >
        Local Time
      </h3>
      <p
        className={`font-mono ${TYPE.displayLg} whitespace-nowrap ${
          isFullscreen
            ? 'text-[15vw] leading-none my-6'
            : 'mt-4 mb-2'
        } ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
      >
        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </p>
      <p
        className={`${
          isFullscreen
            ? 'text-2xl md:text-4xl font-bold uppercase tracking-wider mt-4'
            : `${TYPE.labelMicro} mt-2`
        } ${theme.colorOnSurfaceVariant}`}
      >
        {time.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(shell, document.body);
  }
  return shell;
}
