import { useCallback, useMemo, useState } from 'react';
import {
  getAlertThreshold,
  loadCalibrations,
  resizeProfiles,
  saveCalibrations,
} from './calibrationStorage';

export function useNoiseMeterCalibrations() {
  const [state, setState] = useState(() => loadCalibrations());

  const activeProfile = useMemo(
    () =>
      state.profiles.find((profile) => profile.id === state.activeProfileId) ??
      state.profiles[0],
    [state.activeProfileId, state.profiles],
  );

  const alertThreshold = useMemo(
    () => getAlertThreshold(activeProfile),
    [activeProfile],
  );

  const setActiveProfileId = useCallback((profileId) => {
    setState((prev) => {
      if (!prev.profiles.some((profile) => profile.id === profileId)) {
        return prev;
      }
      return saveCalibrations({ ...prev, activeProfileId: profileId });
    });
  }, []);

  const applySettings = useCallback(
    ({ profileCount, profiles, activeProfileId, alertSound, alertCrossings }) => {
      const trimmed = resizeProfiles(profiles, profileCount);
      const nextActive = trimmed.some((profile) => profile.id === activeProfileId)
        ? activeProfileId
        : trimmed[0].id;
      const saved = saveCalibrations({
        profileCount: trimmed.length,
        activeProfileId: nextActive,
        profiles: trimmed,
        alertSound: alertSound ?? state.alertSound,
        alertCrossings:
          typeof alertCrossings === 'number'
            ? alertCrossings
            : state.alertCrossings,
      });
      setState(saved);
      return saved;
    },
    [state.alertSound, state.alertCrossings],
  );

  const recordAlertCrossing = useCallback(() => {
    setState((prev) =>
      saveCalibrations({
        ...prev,
        alertCrossings: (prev.alertCrossings ?? 0) + 1,
      }),
    );
  }, []);

  const resetAlertCrossings = useCallback(() => {
    setState((prev) =>
      saveCalibrations({
        ...prev,
        alertCrossings: 0,
      }),
    );
  }, []);

  const saveProfileCalibration = useCallback((profileId, targetLevel) => {
    setState((prev) => {
      const profiles = prev.profiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              targetLevel: Math.round(Math.min(100, Math.max(0, targetLevel))),
              calibratedAt: Date.now(),
            }
          : profile,
      );
      return saveCalibrations({ ...prev, profiles });
    });
  }, []);

  const getAlertThresholdForProfile = useCallback(
    (profile) => getAlertThreshold(profile),
    [],
  );

  return {
    state,
    activeProfile,
    alertThreshold,
    setActiveProfileId,
    applySettings,
    saveProfileCalibration,
    getAlertThresholdForProfile,
    recordAlertCrossing,
    resetAlertCrossings,
  };
}
