import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, RefreshCw, Settings2 } from 'lucide-react';
import { ButtonRow } from '../../shared/ButtonRow';
import { appFabClass } from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { useAnnounce } from '../../shared/LiveAnnouncer';
import { CalibrationProfilePicker } from './CalibrationProfilePicker';
import { NoiseMeterSettingsModal } from './NoiseMeterSettingsModal';
import { useNoiseMeter } from './useNoiseMeter';
import { useNoiseMeterCalibrations } from './useNoiseMeterCalibrations';
import { MeterView } from './views/MeterView';
import { ColorMeterView, ColorMeterFab } from './views/ColorMeterView';
import { DotMeterView, DotMeterFab } from './views/DotMeterView';
import { BubbleView } from './views/BubbleView';
import { TowerView } from './views/TowerView';

/** @typedef {'meter' | 'color' | 'dot' | 'bubble' | 'tower'} NoiseMeterMode */

/**
 * Shared NoiseMeter stage for the app and Dashboard teaching widgets.
 * @param {{ mode: NoiseMeterMode, isDarkMode: boolean, theme: object }} props
 */
export function NoiseMeterStage({ mode, isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const calibrations = useNoiseMeterCalibrations();

  const getAlertThreshold = useCallback(
    () => calibrations.alertThreshold,
    [calibrations.alertThreshold],
  );

  const getAlertSound = useCallback(() => {
    // Color & Dot meters are silent by design.
    if (mode === 'color' || mode === 'dot') {
      return { id: 'mute', customName: null, customDataUrl: null };
    }
    return calibrations.state.alertSound;
  }, [mode, calibrations.state.alertSound]);

  const onAlertCrossing = useCallback(() => {
    calibrations.recordAlertCrossing();
    // Mode-specific views announce richer outcomes (dots, tower, bubbles, color zones).
    if (mode === 'meter') announce('Noise alert');
  }, [calibrations.recordAlertCrossing, mode, announce]);

  const meter = useNoiseMeter({
    getAlertThreshold,
    getAlertSound,
    onAlertCrossing,
  });

  const [addBubbleTrigger, setAddBubbleTrigger] = useState(0);
  const [rebuildTowerTrigger, setRebuildTowerTrigger] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setIsFullScreen(false);
  }, [mode]);

  // Bubble / Color / Dot start paused. Meter & Tower stay live.
  useEffect(() => {
    if (mode === 'bubble' || mode === 'color' || mode === 'dot') {
      meter.setIsPaused(true);
    } else {
      meter.setIsPaused(false);
    }
  }, [mode, meter.setIsPaused]);

  const fabClass = `${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`;

  const toolBtn = toolBtnClass(isDarkMode);

  const fab =
    mode === 'color' ? (
      <ColorMeterFab
        hasPermission={meter.hasPermission}
        isPaused={meter.isPaused}
        startMonitoring={meter.startMonitoring}
        setIsPaused={meter.setIsPaused}
        className={fabClass}
      />
    ) : mode === 'dot' ? (
      <DotMeterFab
        hasPermission={meter.hasPermission}
        isPaused={meter.isPaused}
        startMonitoring={meter.startMonitoring}
        setIsPaused={meter.setIsPaused}
        className={fabClass}
      />
    ) : mode === 'bubble' && meter.hasPermission ? (
      <button
        type="button"
        onClick={() => setAddBubbleTrigger((prev) => prev + 1)}
        className={fabClass}
        title="Add Bubble"
        aria-label="Add bubble"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    ) : mode === 'tower' && meter.hasPermission ? (
      <button
        type="button"
        onClick={() => {
          setRebuildTowerTrigger((prev) => prev + 1);
          announce('Tower rebuilt');
        }}
        className={fabClass}
        title="Rebuild Tower"
        aria-label="Rebuild tower"
      >
        <RefreshCw size={24} strokeWidth={2.5} />
      </button>
    ) : null;

  return (
    <>
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        <ButtonRow className="mb-3">
          <CalibrationProfilePicker
            profiles={calibrations.state.profiles}
            activeProfileId={calibrations.state.activeProfileId}
            onSelect={calibrations.setActiveProfileId}
            isDarkMode={isDarkMode}
            theme={theme}
          />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={toolBtn}
          >
            <Settings2 size={16} strokeWidth={2.5} />
            Settings
          </button>
        </ButtonRow>

        {mode === 'meter' ? (
          <MeterView
            theme={theme}
            isDarkMode={isDarkMode}
            hasPermission={meter.hasPermission}
            permissionError={meter.permissionError}
            dbLevel={meter.dbLevel}
            sensitivity={meter.sensitivity}
            setSensitivity={meter.setSensitivity}
            isPaused={meter.isPaused}
            setIsPaused={meter.setIsPaused}
            startMonitoring={meter.startMonitoring}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            activeProfile={calibrations.activeProfile}
            alertThreshold={calibrations.alertThreshold}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : null}

        {mode === 'color' ? (
          <ColorMeterView
            isDarkMode={isDarkMode}
            dbLevel={meter.dbLevel}
            isPaused={meter.isPaused || !meter.hasPermission}
            activeProfile={calibrations.activeProfile}
            alertThreshold={calibrations.alertThreshold}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
        ) : null}

        {mode === 'dot' ? (
          <DotMeterView
            isDarkMode={isDarkMode}
            isPaused={meter.isPaused || !meter.hasPermission}
            isSustainedLoud={meter.isSustainedLoud}
            sustainProgress={meter.sustainProgress}
            activeProfileId={calibrations.state.activeProfileId}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
          />
        ) : null}

        {mode === 'bubble' ? (
          <BubbleView
            theme={theme}
            isDarkMode={isDarkMode}
            hasPermission={meter.hasPermission}
            permissionError={meter.permissionError}
            startMonitoring={meter.startMonitoring}
            dbLevel={meter.dbLevel}
            currentDbRef={meter.currentDbRef}
            addBubbleTrigger={addBubbleTrigger}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            sensitivity={meter.sensitivity}
            setSensitivity={meter.setSensitivity}
            alertThreshold={calibrations.alertThreshold}
            activeProfileName={calibrations.activeProfile?.name}
            isSustainedLoud={meter.isSustainedLoud}
            isSustainedLoudRef={meter.isSustainedLoudRef}
            isPaused={meter.isPaused}
            setIsPaused={meter.setIsPaused}
          />
        ) : null}

        {mode === 'tower' ? (
          <TowerView
            theme={theme}
            isDarkMode={isDarkMode}
            hasPermission={meter.hasPermission}
            permissionError={meter.permissionError}
            startMonitoring={meter.startMonitoring}
            dbLevel={meter.dbLevel}
            currentDbRef={meter.currentDbRef}
            rebuildTowerTrigger={rebuildTowerTrigger}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            sensitivity={meter.sensitivity}
            setSensitivity={meter.setSensitivity}
            alertThreshold={calibrations.alertThreshold}
            activeProfileName={calibrations.activeProfile?.name}
            isSustainedLoud={meter.isSustainedLoud}
            isSustainedLoudRef={meter.isSustainedLoudRef}
          />
        ) : null}
      </div>

      <NoiseMeterSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        state={calibrations.state}
        onApply={calibrations.applySettings}
        hasPermission={meter.hasPermission}
        currentDbRef={meter.currentDbRef}
        onSaveCalibration={calibrations.saveProfileCalibration}
        onResetAlertCrossings={calibrations.resetAlertCrossings}
      />

      {fab && isFullScreen && typeof document !== 'undefined'
        ? createPortal(fab, document.body)
        : fab}
    </>
  );
}

export function tabToNoiseMeterMode(activeTab) {
  if (activeTab === 'Color Meter') return 'color';
  if (activeTab === 'Dot Meter') return 'dot';
  if (activeTab === 'Bubble') return 'bubble';
  if (activeTab === 'Tower') return 'tower';
  return 'meter';
}
