import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDefaultAlertSound,
  playAlertSound,
} from './alertSounds';
import {
  ALERT_SUSTAIN_MS,
  DEFAULT_ALERT_LEVEL,
  DEFAULT_SENSITIVITY,
} from './calibrationConstants';

/** @deprecated Use active profile alert threshold from calibrations. */
export const ALERT_DB = DEFAULT_ALERT_LEVEL;

/**
 * Shared mic capture + dBA-ish level for Noise Meter views.
 * @param {{
 *   getAlertThreshold?: () => number,
 *   getAlertSound?: () => object,
 *   onAlertCrossing?: () => void,
 * }} [options]
 */
export function useNoiseMeter({
  getAlertThreshold,
  getAlertSound,
  onAlertCrossing,
} = {}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [dbLevel, setDbLevel] = useState(0);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const [isPaused, setIsPaused] = useState(false);
  const [isSustainedLoud, setIsSustainedLoud] = useState(false);
  /** 0–1 while level is above alert; reaches 1 when sustain completes. */
  const [sustainProgress, setSustainProgress] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const lastDingTime = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const currentDbRef = useRef(0);
  const loudSinceRef = useRef(null);
  const isSustainedLoudRef = useRef(false);
  const wasSustainedLoudRef = useRef(false);
  const sensitivityRef = useRef(sensitivity);
  const isPausedRef = useRef(isPaused);
  const getAlertThresholdRef = useRef(
    getAlertThreshold ?? (() => DEFAULT_ALERT_LEVEL),
  );
  const getAlertSoundRef = useRef(
    getAlertSound ?? (() => createDefaultAlertSound()),
  );
  const onAlertCrossingRef = useRef(onAlertCrossing);

  useEffect(() => {
    getAlertThresholdRef.current =
      getAlertThreshold ?? (() => DEFAULT_ALERT_LEVEL);
  }, [getAlertThreshold]);

  useEffect(() => {
    getAlertSoundRef.current =
      getAlertSound ?? (() => createDefaultAlertSound());
  }, [getAlertSound]);

  useEffect(() => {
    onAlertCrossingRef.current = onAlertCrossing;
  }, [onAlertCrossing]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      loudSinceRef.current = null;
      isSustainedLoudRef.current = false;
      wasSustainedLoudRef.current = false;
      setIsSustainedLoud(false);
      setSustainProgress(0);
    }
  }, [isPaused]);

  const teardownAudio = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    loudSinceRef.current = null;
    isSustainedLoudRef.current = false;
    wasSustainedLoudRef.current = false;
  }, []);

  const playAlert = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    void playAlertSound(ctx, getAlertSoundRef.current());
  }, []);

  const startMonitoring = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError('Microphone access needs a secure context (HTTPS or localhost).');
      setHasPermission(false);
      return;
    }

    teardownAudio();
    setPermissionError(null);
    setIsSustainedLoud(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      setHasPermission(true);
      setIsPaused(false);

      const updateMeter = () => {
        if (!isPausedRef.current && analyserRef.current) {
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = dataArray[i] / 128.0 - 1.0;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const volume = rms * 350 * (sensitivityRef.current / 100);
          const finalDb = Math.min(100, Math.max(0, volume));

          currentDbRef.current = finalDb;

          const now = Date.now();
          const alertAt = getAlertThresholdRef.current();
          let progress = 0;

          if (finalDb >= alertAt) {
            if (loudSinceRef.current == null) {
              loudSinceRef.current = now;
            }
            progress = Math.min(
              1,
              (now - loudSinceRef.current) / ALERT_SUSTAIN_MS,
            );
            isSustainedLoudRef.current = progress >= 1;
          } else {
            loudSinceRef.current = null;
            isSustainedLoudRef.current = false;
            progress = 0;
          }

          if (isSustainedLoudRef.current && !wasSustainedLoudRef.current) {
            onAlertCrossingRef.current?.();
          }
          wasSustainedLoudRef.current = isSustainedLoudRef.current;

          if (now - lastUiUpdateRef.current > 50) {
            setDbLevel(finalDb);
            setIsSustainedLoud(isSustainedLoudRef.current);
            setSustainProgress(progress);
            lastUiUpdateRef.current = now;
          }

          if (
            isSustainedLoudRef.current &&
            now - lastDingTime.current > 2000
          ) {
            playAlert();
            lastDingTime.current = now;
          }
        }
        animationRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch {
      teardownAudio();
      setHasPermission(false);
      setPermissionError('Microphone permission was denied or unavailable.');
    }
  }, [playAlert, teardownAudio]);

  useEffect(() => () => teardownAudio(), [teardownAudio]);

  return {
    hasPermission,
    permissionError,
    dbLevel,
    currentDbRef,
    isSustainedLoud,
    isSustainedLoudRef,
    sustainProgress,
    sensitivity,
    setSensitivity,
    isPaused,
    setIsPaused,
    startMonitoring,
  };
}
