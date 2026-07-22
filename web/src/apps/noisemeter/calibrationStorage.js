import {
  createDefaultAlertSound,
  normalizeAlertSound,
} from './alertSounds';
import {
  ALERT_MARGIN,
  DEFAULT_ALERT_LEVEL,
  DEFAULT_PROFILE_NAMES,
  MAX_PROFILE_COUNT,
  MIN_PROFILE_COUNT,
  STORAGE_KEY,
} from './calibrationConstants';

function clampProfileCount(count) {
  return Math.min(MAX_PROFILE_COUNT, Math.max(MIN_PROFILE_COUNT, count));
}

function makeProfile(index, existing) {
  return {
    id: existing?.id ?? `profile-${index}`,
    name:
      existing?.name ??
      DEFAULT_PROFILE_NAMES[index] ??
      `Activity ${index + 1}`,
    targetLevel:
      typeof existing?.targetLevel === 'number' ? existing.targetLevel : null,
    calibratedAt: existing?.calibratedAt ?? null,
  };
}

export function createDefaultState(profileCount = 3) {
  const count = clampProfileCount(profileCount);
  const profiles = Array.from({ length: count }, (_, index) => makeProfile(index));
  return {
    profileCount: count,
    activeProfileId: profiles[0].id,
    profiles,
    alertSound: createDefaultAlertSound(),
    alertCrossings: 0,
  };
}

export function resizeProfiles(profiles, nextCount) {
  const count = clampProfileCount(nextCount);
  return Array.from({ length: count }, (_, index) =>
    makeProfile(index, profiles[index]),
  );
}

export function getAlertThreshold(profile) {
  if (typeof profile?.targetLevel === 'number') {
    return Math.min(100, Math.round(profile.targetLevel + ALERT_MARGIN));
  }
  return DEFAULT_ALERT_LEVEL;
}

function normalizeState(raw) {
  const profileCount = clampProfileCount(
    typeof raw?.profileCount === 'number' ? raw.profileCount : 3,
  );
  const profiles = resizeProfiles(
    Array.isArray(raw?.profiles) ? raw.profiles : [],
    profileCount,
  );
  const activeProfileId = profiles.some((p) => p.id === raw?.activeProfileId)
    ? raw.activeProfileId
    : profiles[0].id;

  return {
    profileCount,
    activeProfileId,
    profiles,
    alertSound: normalizeAlertSound(raw?.alertSound),
    alertCrossings:
      typeof raw?.alertCrossings === 'number' && raw.alertCrossings >= 0
        ? Math.floor(raw.alertCrossings)
        : 0,
  };
}

export function loadCalibrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState(3);
    return normalizeState(JSON.parse(raw));
  } catch {
    return createDefaultState(3);
  }
}

export function saveCalibrations(state) {
  const normalized = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
