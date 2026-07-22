import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { StageChrome } from '../StageChrome';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

const FILLED =
  'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.25)] dark:bg-amber-400';
const EMPTY_RING =
  'border-2 border-slate-300 dark:border-slate-600 bg-transparent';
const PENDING_RING =
  'border-2 border-amber-300/80 dark:border-amber-500/50 bg-transparent';

/**
 * Soft dot row — each filled dot is one sustained alert in this session.
 * Pending dot fades in during sustain buildup; drops away if volume quiets.
 */
export function DotMeterView({
  isDarkMode,
  isPaused,
  isSustainedLoud,
  sustainProgress,
  activeProfileId,
  isFullScreen,
  setIsFullScreen,
}) {
  const announce = useAnnounce();
  const [filledCount, setFilledCount] = useState(0);
  const [pendingProgress, setPendingProgress] = useState(0);
  const wasSustainedRef = useRef(false);
  const lastAnnouncedCountRef = useRef(0);

  // New session when entering Dot Meter or switching calibration profile.
  useEffect(() => {
    setFilledCount(0);
    setPendingProgress(0);
    wasSustainedRef.current = false;
    lastAnnouncedCountRef.current = 0;
  }, [activeProfileId]);

  // Commit a dot when sustain completes (same moment as alert crossing).
  useEffect(() => {
    if (isPaused) return;
    if (isSustainedLoud && !wasSustainedRef.current) {
      setFilledCount((c) => c + 1);
      setPendingProgress(0);
    }
    wasSustainedRef.current = isSustainedLoud;
  }, [isSustainedLoud, isPaused]);

  useEffect(() => {
    if (filledCount <= 0) {
      lastAnnouncedCountRef.current = 0;
      return;
    }
    if (lastAnnouncedCountRef.current === filledCount) return;
    lastAnnouncedCountRef.current = filledCount;
    announce(`Alert ${filledCount}`);
  }, [filledCount, announce]);

  // Show pending dot while building toward sustain; clear if they quiet down.
  useEffect(() => {
    if (isPaused || isSustainedLoud) {
      if (isSustainedLoud) setPendingProgress(0);
      return;
    }
    if (sustainProgress > 0) {
      setPendingProgress(sustainProgress);
    } else {
      setPendingProgress(0);
    }
  }, [sustainProgress, isSustainedLoud, isPaused]);

  const dots = [];
  for (let i = 0; i < filledCount; i++) {
    dots.push({ key: `filled-${i}`, kind: 'filled' });
  }
  if (pendingProgress > 0) {
    dots.push({ key: 'pending', kind: 'pending', progress: pendingProgress });
  }

  return (
    <StageChrome
      isDarkMode={isDarkMode}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
      fullscreenVariant="ghost"
      surfaceClass={
        isDarkMode
          ? 'bg-slate-900 border-slate-700'
          : 'bg-slate-50 border-slate-200'
      }
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-8">
        {dots.length === 0 ? (
          <p
            className={`${TYPE.bodyMd} ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {isPaused ? 'Tap play to start a session' : 'No alerts yet'}
          </p>
        ) : (
          <ul
            className="flex flex-wrap items-center justify-center gap-3 max-w-lg"
            aria-label={`${filledCount} alert${filledCount === 1 ? '' : 's'} this session`}
          >
            {dots.map((dot) => (
              <li key={dot.key} className="relative w-5 h-5 shrink-0">
                {dot.kind === 'filled' ? (
                  <span
                    className={`block w-full h-full rounded-full ${FILLED}`}
                    aria-hidden
                  />
                ) : (
                  <span
                    className={`block w-full h-full rounded-full ${PENDING_RING} overflow-hidden`}
                    aria-hidden
                  >
                    <span
                      className="absolute inset-0 rounded-full bg-amber-400/90 dark:bg-amber-400/80 origin-center transition-[opacity,transform] duration-150 ease-out"
                      style={{
                        opacity: dot.progress,
                        transform: `scale(${0.35 + dot.progress * 0.65})`,
                      }}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {filledCount > 0 ? (
          <p
            className={`mt-6 ${TYPE.labelMd} tabular-nums ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {filledCount} this session
          </p>
        ) : null}
      </div>
    </StageChrome>
  );
}

/** Start / pause FAB — same pattern as Color Meter. */
export function DotMeterFab({
  hasPermission,
  isPaused,
  startMonitoring,
  setIsPaused,
  className,
}) {
  const handleClick = () => {
    if (!hasPermission) {
      void startMonitoring();
      return;
    }
    setIsPaused(!isPaused);
  };

  const showPlay = !hasPermission || isPaused;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={showPlay ? 'Start' : 'Pause'}
      aria-label={showPlay ? 'Start dot meter' : 'Pause dot meter'}
    >
      {showPlay ? (
        <Play size={24} fill="currentColor" strokeWidth={0} className="ml-0.5" />
      ) : (
        <Pause size={24} fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );
}
