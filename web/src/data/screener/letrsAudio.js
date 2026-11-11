/** Public dictation packs published with the Letrs Screener. */
export const AUDIO_BASE =
  'https://cdn.jsdelivr.net/gh/thomaseccles67/letrs-screener-audio@v1';

export const DEFAULT_RECORDED_VOICE = 'en-us-female';

export const RECORDED_VOICES = [
  { n: 1, id: 'en-us-female', label: 'American · Female' },
  { n: 2, id: 'en-gb-female', label: 'British · Female' },
  { n: 3, id: 'en-us-male', label: 'American · Male' },
  { n: 4, id: 'en-gb-male', label: 'British · Male' },
];

const VOICE_KEY = 'eduHub.screener.letrsVoice';

export function normalizeRecordedVoice(id) {
  const key = String(id || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  if (RECORDED_VOICES.some((voice) => voice.id === key)) return key;
  return DEFAULT_RECORDED_VOICE;
}

export function readRecordedVoice() {
  try {
    return normalizeRecordedVoice(localStorage.getItem(VOICE_KEY));
  } catch {
    return DEFAULT_RECORDED_VOICE;
  }
}

export function writeRecordedVoice(id) {
  const next = normalizeRecordedVoice(id);
  try {
    localStorage.setItem(VOICE_KEY, next);
  } catch {
    /* private mode */
  }
  return next;
}

export function clipRelPath(level, index, word, voiceId) {
  const voice = normalizeRecordedVoice(voiceId);
  const type = level === 'advanced' ? 'advanced' : 'basic';
  const n = Number(index) + 1;
  const pad = n < 10 ? `0${n}` : String(n);
  const slug = String(word || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${voice}/${type}/${pad}-${slug}.mp3`;
}

export function clipUrl(level, index, word, voiceId) {
  return `${AUDIO_BASE}/${clipRelPath(level, index, word, voiceId)}`;
}

export function helloUrl(voiceId) {
  return `${AUDIO_BASE}/${normalizeRecordedVoice(voiceId)}/hello.mp3`;
}

/**
 * Silent fallback when a pack clip will not play.
 * Word, short pause, then the sentence — same pace as the Letrs Screener.
 */
export function speakDictation(word, sentence, onDone) {
  const synth = window.speechSynthesis;
  if (!synth) {
    onDone?.('unavailable');
    return () => {};
  }
  synth.cancel();
  let timer = 0;
  let stopped = false;
  const finish = (status) => {
    if (stopped) return;
    stopped = true;
    onDone?.(status);
  };
  const first = new SpeechSynthesisUtterance(word);
  first.rate = 0.8;
  first.onerror = () => finish('error');
  first.onend = () => {
    timer = window.setTimeout(() => {
      if (stopped) return;
      const second = new SpeechSynthesisUtterance(sentence);
      second.rate = 0.8;
      second.onerror = () => finish('error');
      second.onend = () => finish();
      synth.speak(second);
    }, 420);
  };
  synth.speak(first);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    synth.cancel();
  };
}
