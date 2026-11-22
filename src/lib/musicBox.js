/**
 * Tichá vánoční hrací skříňka (Web Audio API) pro jemný klavírní doprovod koledy Tichá noc
 * Funguje 100% offline bez externích MP3 souborů a s minimální zátěží procesoru.
 */

const MELODY_NOTES = [
  // Tichá noc, svatá noc (v C dur / G dur, klidné tempo hrací skříňky)
  { freq: 392.0, dur: 0.9, harm: 261.63 }, // G4 + C4
  { freq: 440.0, dur: 0.35 },              // A4
  { freq: 392.0, dur: 0.65 },              // G4
  { freq: 329.63, dur: 1.4, harm: 196.0 }, // E4 + G3

  { freq: 392.0, dur: 0.9, harm: 261.63 }, // G4 + C4
  { freq: 440.0, dur: 0.35 },              // A4
  { freq: 392.0, dur: 0.65 },              // G4
  { freq: 329.63, dur: 1.4, harm: 196.0 }, // E4 + G3

  { freq: 587.33, dur: 1.1, harm: 293.66 }, // D5 + D4
  { freq: 587.33, dur: 0.65 },              // D5
  { freq: 493.88, dur: 1.4, harm: 246.94 }, // B4 + B3

  { freq: 523.25, dur: 1.1, harm: 261.63 }, // C5 + C4
  { freq: 523.25, dur: 0.65 },              // C5
  { freq: 392.0, dur: 1.4, harm: 196.0 },   // G4 + G3

  { freq: 440.0, dur: 1.0, harm: 261.63 },  // A4 + C4
  { freq: 440.0, dur: 0.6 },                // A4
  { freq: 523.25, dur: 0.85 },              // C5
  { freq: 493.88, dur: 0.35 },              // B4
  { freq: 440.0, dur: 0.65 },               // A4
  { freq: 392.0, dur: 0.9, harm: 261.63 },  // G4 + C4
  { freq: 440.0, dur: 0.35 },               // A4
  { freq: 392.0, dur: 0.65 },               // G4
  { freq: 329.63, dur: 1.4, harm: 196.0 },  // E4 + G3

  { freq: 440.0, dur: 1.0, harm: 261.63 },  // A4 + C4
  { freq: 440.0, dur: 0.6 },                // A4
  { freq: 523.25, dur: 0.85 },              // C5
  { freq: 493.88, dur: 0.35 },              // B4
  { freq: 440.0, dur: 0.65 },               // A4
  { freq: 392.0, dur: 0.9, harm: 261.63 },  // G4 + C4
  { freq: 440.0, dur: 0.35 },               // A4
  { freq: 392.0, dur: 0.65 },               // G4
  { freq: 329.63, dur: 1.4, harm: 196.0 },  // E4 + G3

  { freq: 587.33, dur: 1.1, harm: 293.66 }, // D5
  { freq: 587.33, dur: 0.65 },              // D5
  { freq: 659.25, dur: 0.9 },               // E5
  { freq: 587.33, dur: 0.35 },              // D5
  { freq: 493.88, dur: 0.65 },              // B4
  { freq: 523.25, dur: 1.5, harm: 261.63 }, // C5
  { freq: 659.25, dur: 1.4, harm: 329.63 }, // E5

  { freq: 523.25, dur: 0.85, harm: 261.63 }, // C5
  { freq: 392.0, dur: 0.45 },                // G4
  { freq: 329.63, dur: 0.65 },               // E4
  { freq: 392.0, dur: 0.85, harm: 246.94 },  // G4
  { freq: 349.23, dur: 0.4 },                // F4
  { freq: 293.66, dur: 0.65 },               // D4
  { freq: 261.63, dur: 2.2, harm: 130.81 },  // C4 + C3
];

let audioCtx = null;
let isPlaying = false;
let stepIndex = 0;
let timerId = null;

function playBellTone(ctx, freq, durationSec, volume = 0.045) {
  if (!ctx || !freq) return;
  const now = ctx.currentTime;

  const oscMain = ctx.createOscillator();
  const oscOvertone = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscMain.type = 'sine';
  oscMain.frequency.setValueAtTime(freq, now);

  oscOvertone.type = 'triangle';
  oscOvertone.frequency.setValueAtTime(freq * 2, now);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(0.12, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(durationSec * 0.6, 0.5));

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0005, now + durationSec * 1.45);

  oscMain.connect(gainNode);
  oscOvertone.connect(overtoneGain);
  overtoneGain.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscMain.start(now);
  oscOvertone.start(now);

  const stopAt = now + durationSec * 1.5;
  oscMain.stop(stopAt);
  oscOvertone.stop(stopAt);
}

function scheduleNextNote() {
  if (!isPlaying || !audioCtx) return;
  const note = MELODY_NOTES[stepIndex % MELODY_NOTES.length];
  stepIndex = (stepIndex + 1) % MELODY_NOTES.length;

  playBellTone(audioCtx, note.freq, note.dur, 0.042);
  if (note.harm) {
    playBellTone(audioCtx, note.harm, note.dur * 1.3, 0.022);
  }

  timerId = setTimeout(scheduleNextNote, Math.round(note.dur * 920));
}

export function toggleChristmasMusicBox() {
  if (isPlaying) {
    stopChristmasMusicBox();
    return false;
  }
  startChristmasMusicBox();
  return true;
}

export function startChristmasMusicBox() {
  if (typeof window === 'undefined') return false;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!isPlaying) {
    isPlaying = true;
    scheduleNextNote();
  }
  return true;
}

export function stopChristmasMusicBox() {
  isPlaying = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

export function isChristmasMusicBoxPlaying() {
  return isPlaying;
}
