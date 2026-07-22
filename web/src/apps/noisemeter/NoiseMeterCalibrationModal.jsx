import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';
import {
  ALERT_MARGIN,
  CALIBRATION_COUNTDOWN_SEC,
  CALIBRATION_SAMPLE_MS,
} from './calibrationConstants';
import { getAlertThreshold } from './calibrationStorage';

/**
 * Listen for a few seconds and average the mic level for one activity profile.
 */
export function NoiseMeterCalibrationModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  profileName,
  hasPermission,
  currentDbRef,
  onComplete,
}) {
  const [phase, setPhase] = useState('intro');
  const [countdown, setCountdown] = useState(CALIBRATION_COUNTDOWN_SEC);
  const [progress, setProgress] = useState(0);
  const [liveLevel, setLiveLevel] = useState(0);
  const [resultLevel, setResultLevel] = useState(null);
  const samplesRef = useRef([]);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    timersRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      setPhase('intro');
      setCountdown(CALIBRATION_COUNTDOWN_SEC);
      setProgress(0);
      setLiveLevel(0);
      setResultLevel(null);
      samplesRef.current = [];
      return undefined;
    }

    return () => clearTimers();
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'sampling') return undefined;

    const startedAt = Date.now();
    const sampleTimer = window.setInterval(() => {
      const level = currentDbRef?.current ?? 0;
      samplesRef.current.push(level);
      setLiveLevel(level);

      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(100, (elapsed / CALIBRATION_SAMPLE_MS) * 100));

      if (elapsed >= CALIBRATION_SAMPLE_MS) {
        clearInterval(sampleTimer);
        const samples = samplesRef.current;
        const average =
          samples.length > 0
            ? samples.reduce((sum, value) => sum + value, 0) / samples.length
            : 0;
        setResultLevel(Math.round(average));
        setPhase('result');
      }
    }, 100);

    timersRef.current.push(sampleTimer);
    return () => clearInterval(sampleTimer);
  }, [phase, currentDbRef]);

  const startCountdown = () => {
    clearTimers();
    samplesRef.current = [];
    setProgress(0);
    setResultLevel(null);
    setPhase('countdown');
    setCountdown(CALIBRATION_COUNTDOWN_SEC);

    let remaining = CALIBRATION_COUNTDOWN_SEC;
    const tick = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(tick);
        setPhase('sampling');
        return;
      }
      setCountdown(remaining);
    }, 1000);
    timersRef.current.push(tick);
  };

  const handleConfirm = () => {
    if (resultLevel == null) return;
    onComplete(resultLevel);
    onClose();
  };

  const previewAlert = resultLevel == null ? null : getAlertThreshold({ targetLevel: resultLevel });

  const bodyText = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const card = isDarkMode
    ? 'bg-slate-800 border-slate-600'
    : 'bg-slate-50 border-slate-300';

  return (
    <Modal
      isOpen={isOpen}
      title={`Calibrate ${profileName}`}
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-md"
      zIndex="z-[260]"
      footer={
        <div className="w-full flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          {phase === 'result' ? (
            <>
              <button
                type="button"
                onClick={startCountdown}
                className={`px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Try Again
              </button>
              <ModalPrimaryButton theme={theme} onClick={handleConfirm}>
                Save Calibration
              </ModalPrimaryButton>
            </>
          ) : (
            <ModalPrimaryButton
              theme={theme}
              disabled={!hasPermission || phase === 'countdown' || phase === 'sampling'}
              onClick={phase === 'intro' ? startCountdown : undefined}
            >
              {phase === 'countdown'
                ? `Starting in ${countdown}…`
                : phase === 'sampling'
                  ? 'Listening…'
                  : 'Start Listening'}
            </ModalPrimaryButton>
          )}
        </div>
      }
    >
      <div className="px-6 py-5 sm:px-7 sm:py-6 space-y-4">
        <p className={`${TYPE.bodyMd} ${bodyText}`}>
          Set the classroom to the volume you want for{' '}
          <span className="font-bold">{profileName}</span>. We&apos;ll listen for{' '}
          {CALIBRATION_SAMPLE_MS / 1000} seconds and use the average as your target.
        </p>

        {!hasPermission ? (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${card}`}
          >
            <Mic size={20} className="shrink-0 mt-0.5 text-amber-500" />
            <p className={`${TYPE.bodyMd} ${bodyText}`}>
              Turn on the microphone on the meter first, then come back to calibrate.
            </p>
          </div>
        ) : null}

        {phase === 'countdown' ? (
          <div className={`rounded-xl border p-6 text-center ${card}`}>
            <p className="text-5xl font-black tabular-nums text-amber-500">
              {countdown}
            </p>
            <p className={`mt-2 ${TYPE.labelMicro} ${bodyText}`}>
              Get the room ready
            </p>
          </div>
        ) : null}

        {phase === 'sampling' ? (
          <div className={`rounded-xl border p-5 ${card}`}>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className={`${TYPE.labelMicro} ${bodyText}`}>
                  Live level
                </p>
                <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                  {Math.round(liveLevel)}
                </p>
              </div>
              <p className={`${TYPE.labelMd} ${bodyText}`}>
                {Math.round(progress)}%
              </p>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            >
              <div
                className={`h-full transition-all duration-100 ${theme.colorPrimary}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {phase === 'result' && resultLevel != null ? (
          <div className={`rounded-xl border p-5 space-y-3 ${card}`}>
            <div>
              <p className={`${TYPE.labelMicro} ${bodyText}`}>
                Target level
              </p>
              <p className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">
                {resultLevel}
              </p>
            </div>
            <p className={`${TYPE.bodyMd} ${bodyText}`}>
              Students will hear an alert above{' '}
              <span className="font-bold text-rose-500">{previewAlert}</span> (target +{' '}
              {ALERT_MARGIN}).
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
