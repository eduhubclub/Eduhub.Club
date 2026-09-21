/**
 * Short Web Audio cues for Math Train. No-ops when sound is off.
 */

const TONES = {
  tick: { freq: 620, dur: 0.045, type: 'sine', gain: 0.045 },
  clear: { freq: 784, dur: 0.16, type: 'sine', gain: 0.06 },
  miss: { freq: 196, dur: 0.12, type: 'triangle', gain: 0.05 },
  collect: { freq: 988, dur: 0.08, type: 'sine', gain: 0.05 },
  power: { freq: 523, dur: 0.11, type: 'sine', gain: 0.055 },
  over: { freq: 146, dur: 0.28, type: 'triangle', gain: 0.06 },
};

let audioCtx = null;

function context() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playMathTrainSound(kind, enabled) {
  if (!enabled) return;
  const tone = TONES[kind];
  if (!tone) return;
  try {
    const ctx = context();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.value = tone.freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(tone.gain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur);
    osc.start(now);
    osc.stop(now + tone.dur + 0.02);
  } catch {
    /* autoplay blocked or API missing */
  }
}
