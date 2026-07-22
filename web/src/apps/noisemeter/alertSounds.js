/** Built-in classroom alert tones (synthesized via Web Audio). */
export const ALERT_SOUND_PRESETS = [
  { id: 'pop', label: 'Pop', description: 'Quick soft pop' },
  { id: 'chime', label: 'Chime', description: 'Two-note chime' },
  { id: 'bell', label: 'Bell', description: 'Gentle bell' },
  { id: 'buzz', label: 'Buzz', description: 'Short attention buzz' },
  { id: 'soft', label: 'Soft Ping', description: 'Quiet reminder' },
  { id: 'mute', label: 'Silent', description: 'No alert sound' },
];

export const DEFAULT_ALERT_SOUND_ID = 'pop';

/** Keep uploads small so they fit safely in localStorage. */
export const MAX_CUSTOM_SOUND_BYTES = 400 * 1024;

export const CUSTOM_SOUND_ACCEPT =
  'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,.mp3,.wav,.ogg,.m4a,.webm';

export function createDefaultAlertSound() {
  return {
    id: DEFAULT_ALERT_SOUND_ID,
    customName: null,
    customDataUrl: null,
  };
}

export function normalizeAlertSound(raw) {
  const defaults = createDefaultAlertSound();
  if (!raw || typeof raw !== 'object') return defaults;

  const presetIds = new Set(ALERT_SOUND_PRESETS.map((p) => p.id));
  const id =
    raw.id === 'custom' || presetIds.has(raw.id) ? raw.id : defaults.id;

  return {
    id,
    customName:
      typeof raw.customName === 'string' && raw.customName.trim()
        ? raw.customName.trim().slice(0, 80)
        : null,
    customDataUrl:
      typeof raw.customDataUrl === 'string' &&
      raw.customDataUrl.startsWith('data:audio')
        ? raw.customDataUrl
        : null,
  };
}

function tone(ctx, { type = 'sine', freq, endFreq, start, duration, gain = 0.35 }) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (typeof endFreq === 'number') {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFreq),
      ctx.currentTime + start + duration,
    );
  }
  gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + start + duration,
  );
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

function playPreset(ctx, id) {
  switch (id) {
    case 'chime':
      tone(ctx, { freq: 880, start: 0, duration: 0.18, gain: 0.28 });
      tone(ctx, { freq: 1175, start: 0.14, duration: 0.28, gain: 0.24 });
      break;
    case 'bell':
      tone(ctx, {
        type: 'triangle',
        freq: 660,
        endFreq: 520,
        start: 0,
        duration: 0.45,
        gain: 0.3,
      });
      tone(ctx, {
        type: 'sine',
        freq: 990,
        start: 0.02,
        duration: 0.35,
        gain: 0.12,
      });
      break;
    case 'buzz':
      tone(ctx, {
        type: 'square',
        freq: 220,
        start: 0,
        duration: 0.12,
        gain: 0.14,
      });
      tone(ctx, {
        type: 'square',
        freq: 180,
        start: 0.14,
        duration: 0.14,
        gain: 0.12,
      });
      break;
    case 'soft':
      tone(ctx, {
        type: 'sine',
        freq: 740,
        endFreq: 520,
        start: 0,
        duration: 0.35,
        gain: 0.16,
      });
      break;
    case 'mute':
      break;
    case 'pop':
    default:
      tone(ctx, {
        type: 'sine',
        freq: 800,
        endFreq: 100,
        start: 0,
        duration: 0.1,
        gain: 0.45,
      });
      break;
  }
}

const customAudioCache = new Map();

async function playCustom(ctx, dataUrl) {
  if (!dataUrl) return;
  let buffer = customAudioCache.get(dataUrl);
  if (!buffer) {
    const response = await fetch(dataUrl);
    const arrayBuffer = await response.arrayBuffer();
    buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    customAudioCache.set(dataUrl, buffer);
  }
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  source.buffer = buffer;
  gainNode.gain.value = 0.7;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
}

/**
 * Play the configured alert sound.
 * @param {AudioContext} ctx
 * @param {{ id: string, customDataUrl?: string | null }} sound
 */
export async function playAlertSound(ctx, sound) {
  if (!ctx) return;
  const config = normalizeAlertSound(sound);
  if (config.id === 'mute') return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  if (config.id === 'custom') {
    if (!config.customDataUrl) {
      playPreset(ctx, DEFAULT_ALERT_SOUND_ID);
      return;
    }
    try {
      await playCustom(ctx, config.customDataUrl);
    } catch {
      playPreset(ctx, DEFAULT_ALERT_SOUND_ID);
    }
    return;
  }

  playPreset(ctx, config.id);
}

/**
 * Preview without a shared AudioContext (settings modal).
 */
export async function previewAlertSound(sound) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  try {
    await playAlertSound(ctx, sound);
    await new Promise((resolve) => setTimeout(resolve, 700));
  } finally {
    if (ctx.state !== 'closed') {
      await ctx.close().catch(() => {});
    }
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
