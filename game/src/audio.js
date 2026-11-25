// Ember & Thyme: all sound is synthesized with WebAudio — no audio files, no network.
// Each effect is one short oscillator burst so the kitchen answers every action at once.

let audioCtx = null;
let muted = false;

export function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function blip(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noiseBurst(dur, vol, when = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

export const sfx = {
  pickup() { blip(520, 0.09, 'triangle', 0.18); },
  chop() { noiseBurst(0.07, 0.25); blip(180, 0.06, 'square', 0.08); },
  chopDone() { blip(660, 0.1, 'triangle', 0.2); blip(880, 0.12, 'triangle', 0.18, 0.09); },
  sizzle() { noiseBurst(0.35, 0.12); },
  grillDone() { blip(440, 0.1, 'sine', 0.22); blip(660, 0.14, 'sine', 0.2, 0.1); },
  place() { blip(340, 0.08, 'triangle', 0.2); },
  serve() { blip(784, 0.12, 'sine', 0.22); blip(1046, 0.18, 'sine', 0.22, 0.1); blip(1318, 0.22, 'sine', 0.18, 0.2); },
  error() { blip(160, 0.18, 'sawtooth', 0.12); },
  expire() { blip(220, 0.25, 'sawtooth', 0.14); blip(174, 0.3, 'sawtooth', 0.12, 0.18); },
  tick() { blip(980, 0.05, 'square', 0.06); },
  click() { blip(700, 0.05, 'triangle', 0.12); },
};
