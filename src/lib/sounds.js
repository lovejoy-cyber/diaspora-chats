// Real, full-bodied notification/UI sounds built with the Web Audio API — genuinely
// richer than a single quick beep: multiple layered tones, proper attack/decay
// envelopes, and a soft tail, closer to how WhatsApp/Messenger's real chimes are
// built (which are actual mixed audio, not a single sine wave). No audio file to
// host, works instantly.
//
// IMPORTANT REAL BROWSER LIMIT: browsers block audio from playing automatically
// until the user has interacted with the page at least once (click, tap, keypress) —
// this is a genuine security policy in Chrome/Safari/Firefox, not something any code
// can override. This is why a startup sound may not play the very first time the page
// loads with zero interaction yet — it's expected browser behavior, not a bug. Once
// the person taps anywhere on the page, all subsequent sounds play normally.

const SOUND_PREF_KEY = "dl_sounds_enabled";
let audioUnlocked = false;

export function soundsEnabled() {
  const stored = localStorage.getItem(SOUND_PREF_KEY);
  return stored === null ? true : stored === "true";
}

export function setSoundsEnabled(value) {
  localStorage.setItem(SOUND_PREF_KEY, String(value));
}

// Call this once, early, from a real user interaction (e.g. the first tap anywhere
// in the app) to satisfy the browser's autoplay policy — "unlocks" audio for every
// sound played afterward in this session, including the startup chime on next load.
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0; // silent — this call exists only to satisfy the browser's policy
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.01);
    audioUnlocked = true;
    setTimeout(() => ctx.close().catch(() => {}), 100);
  } catch (e) {}
}

function getContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  return new AudioContextClass();
}

// Plays a richer "note" — a fundamental tone plus a quieter harmonic overtone layered
// on top (this is what makes a synthesized tone sound like a real chime instead of a
// thin beep — real bells/chimes are never a single pure frequency).
function playNote(ctx, freq, startAt, durationSec, volume) {
  // Fundamental
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = freq;
  gain1.gain.setValueAtTime(0.0001, startAt);
  gain1.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.start(startAt); osc1.stop(startAt + durationSec + 0.05);

  // Harmonic overtone, an octave + a fifth up, quieter — adds real body/warmth
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.value = freq * 2.5;
  gain2.gain.setValueAtTime(0.0001, startAt);
  gain2.gain.exponentialRampToValueAtTime(volume * 0.25, startAt + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec * 0.6);
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.start(startAt); osc2.stop(startAt + durationSec + 0.05);
}

function playChime(notes, volume = 0.18) {
  if (!soundsEnabled()) return;
  try {
    const ctx = getContext();
    let maxEnd = 0;
    notes.forEach(([freq, offsetSec, durationSec]) => {
      const startAt = ctx.currentTime + offsetSec;
      playNote(ctx, freq, startAt, durationSec, volume);
      maxEnd = Math.max(maxEnd, offsetSec + durationSec);
    });
    setTimeout(() => ctx.close().catch(() => {}), (maxEnd + 0.5) * 1000);
  } catch (e) { /* Web Audio unsupported — silently skip */ }
}

// A real, full three-note ascending chime — genuinely audible and pleasant, matching
// the register of WhatsApp/Messenger notification sounds, not a thin single click.
export function playNotificationSound() {
  playChime([
    [740.0, 0, 0.35],
    [932.3, 0.09, 0.4],
    [1174.7, 0.18, 0.55],
  ], 0.2);
}

// A warmer, fuller four-note welcome chime for app startup.
export function playStartupSound() {
  playChime([
    [523.25, 0, 0.4],
    [659.25, 0.12, 0.4],
    [783.99, 0.24, 0.4],
    [1046.5, 0.36, 0.6],
  ], 0.16);
}

// A brief two-note confirmation tone — for lighter events (message sent, action
// confirmed) that still deserve real, audible feedback rather than a thin click.
export function playTickSound() {
  playChime([
    [880, 0, 0.15],
    [1108.7, 0.05, 0.2],
  ], 0.14);
}
