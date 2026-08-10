import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const STORAGE_KEY = 'eduHub.alarmSound';
/** Keep custom uploads small enough for localStorage. */
const MAX_CUSTOM_BYTES = 400_000;
const MAX_ADDED_SOUNDS = 8;
const CUSTOM_ID_PREFIX = 'custom-';

export const DEFAULT_ALARM_DURATION_SEC = 3;
export const MIN_ALARM_DURATION_SEC = 1;
export const MAX_ALARM_DURATION_SEC = 15;

export const DEFAULT_ALARM_VOLUME = 80;
export const MIN_ALARM_VOLUME = 0;
export const MAX_ALARM_VOLUME = 100;

/** Staged upload preview id (not persisted). */
export const PENDING_ALARM_ID = 'pending';

/**
 * Built-in timer alarms — Google Actions sound library.
 * @see https://developers.google.com/assistant/tools/sound-library/alarms
 */
export const CLASSIC_ALARM_SOUNDS = [
  {
    id: 'chime',
    label: 'Magic chime',
    url: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
  },
  {
    id: 'alarm-clock',
    label: 'Alarm clock',
    url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
  },
  {
    id: 'dinner-bell',
    label: 'Dinner bell',
    url: 'https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg',
  },
  {
    id: 'medium-bell',
    label: 'Bell',
    url: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg',
  },
  {
    id: 'digital-watch',
    label: 'Digital watch',
    url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  },
  {
    id: 'bugle',
    label: 'Bugle',
    url: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg',
  },
  {
    id: 'phone',
    label: 'Phone ring',
    url: 'https://actions.google.com/sounds/v1/household/telephone_ring.ogg',
  },
  {
    id: 'spaceship',
    label: 'Spaceship',
    url: 'https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg',
  },
  {
    id: 'wind-chimes',
    label: 'Wind chimes',
    url: 'https://actions.google.com/sounds/v1/cartoon/wind_chimes.ogg',
  },
  {
    id: 'dosimeter',
    label: 'Beep alert',
    url: 'https://actions.google.com/sounds/v1/alarms/dosimeter_alarm.ogg',
  },
];

/** @deprecated Legacy single-slot id — migrated into addedSounds. */
export const CUSTOM_ALARM_ID = 'custom';

export const CUSTOM_ALARM_ACCEPT =
  'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.wav,.ogg,.m4a,.webm';

const DEFAULT_SOUND_ID = 'chime';

const AlarmSoundContext = createContext(null);

function clampDuration(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_ALARM_DURATION_SEC;
  return Math.min(
    MAX_ALARM_DURATION_SEC,
    Math.max(MIN_ALARM_DURATION_SEC, Math.round(n)),
  );
}

function clampVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_ALARM_VOLUME;
  return Math.min(MAX_ALARM_VOLUME, Math.max(MIN_ALARM_VOLUME, Math.round(n)));
}

function labelFromFileName(name) {
  const base = (name || 'Custom sound').replace(/\.[^.]+$/, '').trim();
  return (base || 'Custom sound').slice(0, 48);
}

function normalizeAddedSounds(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        typeof s.dataUrl === 'string' &&
        s.dataUrl.startsWith('data:audio'),
    )
    .map((s) => ({
      id: s.id,
      label:
        typeof s.label === 'string' && s.label.trim()
          ? s.label.trim().slice(0, 48)
          : 'Custom sound',
      dataUrl: s.dataUrl,
    }))
    .slice(0, MAX_ADDED_SOUNDS);
}

function isKnownSoundId(id, addedSounds) {
  return (
    CLASSIC_ALARM_SOUNDS.some((s) => s.id === id) ||
    addedSounds.some((s) => s.id === id)
  );
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        soundId: DEFAULT_SOUND_ID,
        addedSounds: [],
        durationSec: DEFAULT_ALARM_DURATION_SEC,
        volume: DEFAULT_ALARM_VOLUME,
      };
    }
    const parsed = JSON.parse(raw);
    let addedSounds = normalizeAddedSounds(parsed?.addedSounds);

    // Migrate legacy single custom slot into the classic list.
    if (
      !addedSounds.length &&
      typeof parsed?.customDataUrl === 'string' &&
      parsed.customDataUrl.startsWith('data:audio')
    ) {
      addedSounds = [
        {
          id: `${CUSTOM_ID_PREFIX}legacy`,
          label: labelFromFileName(parsed.customName),
          dataUrl: parsed.customDataUrl,
        },
      ];
    }

    let soundId = parsed?.soundId;
    if (soundId === CUSTOM_ALARM_ID) {
      soundId = addedSounds[0]?.id || DEFAULT_SOUND_ID;
    }
    if (!isKnownSoundId(soundId, addedSounds)) {
      soundId = DEFAULT_SOUND_ID;
    }

    return {
      soundId,
      addedSounds,
      durationSec: clampDuration(parsed?.durationSec),
      volume: clampVolume(parsed?.volume),
    };
  } catch {
    return {
      soundId: DEFAULT_SOUND_ID,
      addedSounds: [],
      durationSec: DEFAULT_ALARM_DURATION_SEC,
      volume: DEFAULT_ALARM_VOLUME,
    };
  }
}

function resolveUrl(soundId, addedSounds, pending = null) {
  if (soundId === PENDING_ALARM_ID && pending?.dataUrl) return pending.dataUrl;
  const added = addedSounds.find((s) => s.id === soundId);
  if (added) return added.dataUrl;
  const classic = CLASSIC_ALARM_SOUNDS.find((s) => s.id === soundId);
  return classic?.url || CLASSIC_ALARM_SOUNDS[0].url;
}

/**
 * Play an alarm URL for `durationSec`, looping if the clip is shorter.
 * `volume` is 0–100. Returns a stop function.
 */
export function playAlarmForDuration(
  url,
  durationSec,
  { onEnd, volume = DEFAULT_ALARM_VOLUME } = {},
) {
  const audio = new Audio(url);
  audio.volume = clampVolume(volume) / 100;
  audio.loop = true;
  let finished = false;
  let timerId = null;

  const stop = () => {
    if (finished) return;
    finished = true;
    if (timerId != null) window.clearTimeout(timerId);
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    onEnd?.();
  };

  audio.play().catch(() => {
    stop();
  });

  timerId = window.setTimeout(stop, clampDuration(durationSec) * 1000);
  return stop;
}

export function AlarmSoundPreferencesProvider({ children }) {
  const stored = readStored();
  const [soundId, setSoundIdState] = useState(stored.soundId);
  const [addedSounds, setAddedSounds] = useState(stored.addedSounds);
  const [pendingCustom, setPendingCustom] = useState(null);
  const [durationSec, setDurationSecState] = useState(stored.durationSec);
  const [volume, setVolumeState] = useState(stored.volume);
  const [previewingId, setPreviewingId] = useState(null);

  const stopPreviewRef = useRef(null);
  const pendingRef = useRef(pendingCustom);
  pendingRef.current = pendingCustom;
  const addedRef = useRef(addedSounds);
  addedRef.current = addedSounds;

  const stopPreview = useCallback(() => {
    if (stopPreviewRef.current) {
      stopPreviewRef.current();
      stopPreviewRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  useEffect(() => () => stopPreview(), [stopPreview]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ soundId, addedSounds, durationSec, volume }),
      );
    } catch {
      /* quota / private mode */
    }
  }, [soundId, addedSounds, durationSec, volume]);

  const setSoundId = useCallback((id) => {
    if (isKnownSoundId(id, addedRef.current)) {
      setSoundIdState(id);
    }
  }, []);

  const setDurationSec = useCallback((value) => {
    setDurationSecState(clampDuration(value));
  }, []);

  const setVolume = useCallback((value) => {
    setVolumeState(clampVolume(value));
  }, []);

  /** Stage a file for preview / Add — does not join the classic list yet. */
  const stageCustomAlarm = useCallback(async (file) => {
    if (!file || !file.type?.startsWith('audio/')) {
      throw new Error('Choose an audio file (MP3, WAV, OGG, …).');
    }
    if (file.size > MAX_CUSTOM_BYTES) {
      throw new Error('Keep custom sounds under about 400 KB.');
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsDataURL(file);
    });
    setPendingCustom({
      name: file.name || 'Custom sound',
      label: labelFromFileName(file.name),
      dataUrl,
    });
  }, []);

  const clearPendingCustom = useCallback(() => {
    stopPreview();
    setPendingCustom(null);
  }, [stopPreview]);

  const addPendingToClassic = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending?.dataUrl) {
      throw new Error('Upload a sound first.');
    }
    if (addedRef.current.length >= MAX_ADDED_SOUNDS) {
      throw new Error(`You can add up to ${MAX_ADDED_SOUNDS} custom sounds.`);
    }
    const id = `${CUSTOM_ID_PREFIX}${Date.now()}`;
    const entry = {
      id,
      label: pending.label || 'Custom sound',
      dataUrl: pending.dataUrl,
    };
    setAddedSounds((prev) => [...prev, entry]);
    setSoundIdState(id);
    setPendingCustom(null);
    stopPreview();
    return entry;
  }, [stopPreview]);

  const removeAddedSound = useCallback(
    (id) => {
      if (!id?.startsWith(CUSTOM_ID_PREFIX)) return;
      stopPreview();
      setAddedSounds((prev) => prev.filter((s) => s.id !== id));
      setSoundIdState((current) =>
        current === id ? DEFAULT_SOUND_ID : current,
      );
    },
    [stopPreview],
  );

  const classicSounds = useMemo(
    () => [
      ...CLASSIC_ALARM_SOUNDS,
      ...addedSounds.map((s) => ({
        id: s.id,
        label: s.label,
        url: s.dataUrl,
        isCustom: true,
      })),
    ],
    [addedSounds],
  );

  const alarmUrl = useMemo(
    () => resolveUrl(soundId, addedSounds),
    [soundId, addedSounds],
  );

  const playPreview = useCallback(
    (id = soundId) => {
      stopPreview();
      const url = resolveUrl(id, addedRef.current, pendingRef.current);
      setPreviewingId(id);
      stopPreviewRef.current = playAlarmForDuration(url, durationSec, {
        volume,
        onEnd: () => {
          stopPreviewRef.current = null;
          setPreviewingId(null);
        },
      });
    },
    [soundId, durationSec, volume, stopPreview],
  );

  const value = useMemo(
    () => ({
      soundId,
      setSoundId,
      addedSounds,
      pendingCustom,
      hasPending: Boolean(pendingCustom),
      alarmUrl,
      durationSec,
      setDurationSec,
      volume,
      setVolume,
      stageCustomAlarm,
      clearPendingCustom,
      addPendingToClassic,
      removeAddedSound,
      playPreview,
      stopPreview,
      previewingId,
      classicSounds,
      maxAddedSounds: MAX_ADDED_SOUNDS,
    }),
    [
      soundId,
      setSoundId,
      addedSounds,
      pendingCustom,
      alarmUrl,
      durationSec,
      setDurationSec,
      volume,
      setVolume,
      stageCustomAlarm,
      clearPendingCustom,
      addPendingToClassic,
      removeAddedSound,
      playPreview,
      stopPreview,
      previewingId,
      classicSounds,
    ],
  );

  return (
    <AlarmSoundContext.Provider value={value}>{children}</AlarmSoundContext.Provider>
  );
}

export function useAlarmSoundPreferences() {
  const ctx = useContext(AlarmSoundContext);
  if (!ctx) {
    throw new Error(
      'useAlarmSoundPreferences must be used within AlarmSoundPreferencesProvider',
    );
  }
  return ctx;
}

/** Resolve a sound id to a playable URL (built-in or added custom). */
export function getAlarmSoundUrl(soundId, addedSounds = []) {
  return resolveUrl(soundId, addedSounds);
}
