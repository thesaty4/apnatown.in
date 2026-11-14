'use client';

/**
 * Order/offer alert cues synthesized with the Web Audio API, so no media
 * asset has to be downloaded or cached by the service worker. Browsers only
 * start audio after a user gesture; `unlockAlertAudio` resumes the shared
 * context on the first interaction, and a blocked context stays silent while
 * the visual alert still shows.
 */

const TUDUN_GAP_S = 0.5;
const OFFER_LOOP_MS = 2400;
const PEAK_GAIN = 0.28;
/** "Tu" then "dun": two short notes make one recognizable chime. */
const NOTES = [
  { frequency: 987.77, delay: 0, duration: 0.1 },
  { frequency: 659.25, delay: 0.12, duration: 0.18 },
] as const;

type AudioContextConstructor = new () => AudioContext;

let context: AudioContext | null = null;
let offerLoop: number | undefined;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Constructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;
  if (!Constructor) return null;
  context ??= new Constructor();
  return context;
}

function scheduleTudun(ctx: AudioContext, at: number) {
  for (const note of NOTES) {
    const start = at + note.delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + note.duration + 0.05);
  }
}

function playTudun(times: number) {
  const ctx = audioContext();
  if (!ctx) return;
  const play = () => {
    const start = ctx.currentTime + 0.03;
    for (let index = 0; index < times; index += 1)
      scheduleTudun(ctx, start + index * TUDUN_GAP_S);
  };
  if (ctx.state === 'suspended') {
    void ctx.resume().then(play).catch(() => undefined);
    return;
  }
  play();
}

/** One "tudun" for a new vendor/provider order. */
export function playOrderChime() {
  playTudun(1);
}

/** "Tudun tudun tudun" repeated until the returned stop function runs. */
export function startOfferChime(): () => void {
  stopOfferChime();
  playTudun(3);
  offerLoop = window.setInterval(() => playTudun(3), OFFER_LOOP_MS);
  return stopOfferChime;
}

export function stopOfferChime() {
  if (offerLoop === undefined) return;
  window.clearInterval(offerLoop);
  offerLoop = undefined;
}

/** Resumes audio on the first pointer/key gesture so later alerts can sound. */
export function unlockAlertAudio(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const unlock = () => {
    void audioContext()?.resume();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
}
