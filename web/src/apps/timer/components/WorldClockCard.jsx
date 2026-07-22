import { useEffect, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/** Single city card for the world clock board. */
export function WorldClockCard({ city, tz, isDarkMode, theme, onClose }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let formattedTime = '';
  let formattedDate = '';
  try {
    formattedTime = time.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    });
    formattedDate = time.toLocaleDateString('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    formattedTime = 'Invalid TZ';
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 ${APP_GRID_CARD} transition-all hover:scale-[1.02] active:scale-[0.98] group ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${theme.colorOnSurfaceVariant} hover:text-rose-500`}
        aria-label={`Remove ${city}`}
      >
        <X size={16} />
      </button>
      <Globe className={`mb-3 ${theme.text}`} size={24} />
      <h3 className={`${TYPE.titleMd} mb-1 truncate w-full text-center ${theme.colorOnSurface}`}>
        {city}
      </h3>
      <p
        className={`font-mono ${TYPE.displayMd} ${
          isDarkMode ? 'text-slate-100' : 'text-slate-800'
        }`}
      >
        {formattedTime}
      </p>
      <p className={`${TYPE.labelMicro} mt-2 ${theme.colorOnSurfaceVariant}`}>
        {formattedDate}
      </p>
    </div>
  );
}
