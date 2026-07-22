import { useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { StageChrome } from '../StageChrome';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

const GREEN = [34, 197, 94];
const AMBER = [245, 158, 11];
const RED = [239, 68, 68];
const PAUSED = [148, 163, 184]; // slate-400 — calm idle

function mix(a, b, t) {
  const clamped = Math.min(1, Math.max(0, t));
  return a.map((v, i) => Math.round(v + (b[i] - v) * clamped));
}

function toRgb(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Map live level to green → amber → red using calibrated target/alert.
 */
export function colorForNoiseLevel(dbLevel, targetLevel, alertThreshold, isPaused) {
  if (isPaused) return toRgb(PAUSED);

  const alertAt = Math.max(1, alertThreshold);
  const target =
    typeof targetLevel === 'number'
      ? Math.min(targetLevel, alertAt * 0.95)
      : alertAt * 0.45;

  if (dbLevel <= target) {
    // Soften from pale green toward full green as room approaches target.
    const t = target <= 0 ? 0 : dbLevel / target;
    return toRgb(mix([187, 247, 208], GREEN, t)); // emerald-200 → green
  }

  if (dbLevel >= alertAt) {
    return toRgb(RED);
  }

  // Target → alert: green → amber → red
  const span = Math.max(1, alertAt - target);
  const t = (dbLevel - target) / span;
  if (t < 0.5) {
    return toRgb(mix(GREEN, AMBER, t * 2));
  }
  return toRgb(mix(AMBER, RED, (t - 0.5) * 2));
}

function zoneForNoiseLevel(dbLevel, targetLevel, alertThreshold, isPaused) {
  if (isPaused) return 'paused';
  const alertAt = Math.max(1, alertThreshold);
  const target =
    typeof targetLevel === 'number'
      ? Math.min(targetLevel, alertAt * 0.95)
      : alertAt * 0.45;
  if (dbLevel >= alertAt) return 'high';
  if (dbLevel >= target) return 'rising';
  return 'acceptable';
}

const ZONE_LABEL = {
  paused: 'Color meter paused',
  high: 'Noise level high',
  rising: 'Noise level rising',
  acceptable: 'Noise level acceptable',
};

/**
 * Peripheral awareness meter — full-card color only, no alert sounds.
 */
export function ColorMeterView({
  isDarkMode,
  dbLevel,
  isPaused,
  activeProfile,
  alertThreshold,
  isFullScreen,
  setIsFullScreen,
}) {
  const announce = useAnnounce();
  const lastZoneRef = useRef(null);
  const color = colorForNoiseLevel(
    dbLevel,
    activeProfile?.targetLevel,
    alertThreshold,
    isPaused,
  );
  const zone = zoneForNoiseLevel(
    dbLevel,
    activeProfile?.targetLevel,
    alertThreshold,
    isPaused,
  );

  useEffect(() => {
    if (lastZoneRef.current === zone) return;
    const prev = lastZoneRef.current;
    lastZoneRef.current = zone;
    // Skip first paint; don't announce pause itself.
    if (!prev || zone === 'paused') return;
    announce(ZONE_LABEL[zone]);
  }, [zone, announce]);

  return (
    <StageChrome
      isDarkMode={isDarkMode}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
      fullscreenVariant="ghost"
      surfaceClass="border-white/20"
      shellStyle={{
        backgroundColor: color,
        transition: 'background-color 700ms ease',
      }}
    >
      <div className="flex-1 min-h-0" aria-hidden />
      <span className="sr-only">{ZONE_LABEL[zone]}</span>
    </StageChrome>
  );
}

/**
 * Start / pause FAB for Color Meter.
 */
export function ColorMeterFab({
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
      aria-label={showPlay ? 'Start color meter' : 'Pause color meter'}
    >
      {showPlay ? (
        <Play size={24} fill="currentColor" strokeWidth={0} className="ml-0.5" />
      ) : (
        <Pause size={24} fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );
}
