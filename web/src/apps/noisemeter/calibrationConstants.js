export const STORAGE_KEY = 'eduHub.noiseMeter.calibrations';

/** Fallback when a profile has not been calibrated yet. */
export const DEFAULT_ALERT_LEVEL = 65;

/** Alert fires when live level exceeds calibrated target by this margin. */
export const ALERT_MARGIN = 20;

/** Default mic sensitivity — lower than 100% for typical laptop mics. */
export const DEFAULT_SENSITIVITY = 50;

/** Level must stay above threshold this long before "Too Loud" triggers. */
export const ALERT_SUSTAIN_MS = 1750;

export const CALIBRATION_SAMPLE_MS = 5000;
export const CALIBRATION_COUNTDOWN_SEC = 3;

export const DEFAULT_PROFILE_NAMES = [
  'Choice Time',
  'Work Time',
  'Testing',
  'Quiet Reading',
];

export const MIN_PROFILE_COUNT = 1;
export const MAX_PROFILE_COUNT = 4;
