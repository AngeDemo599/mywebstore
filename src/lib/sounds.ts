/**
 * Lightweight sound effects using Web Audio API.
 * No external files — all sounds are synthesized programmatically.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Short click/tap — subtle UI feedback */
export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

/** Success — ascending two-tone chime */
export function playSuccess() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  [600, 900].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = now + i * 0.1;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Error — low descending buzz */
export function playError() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.15);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Notification — gentle bell ping */
export function playNotification() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 1200;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.start(now);
  osc.stop(now + 0.35);
}

/** Sale / new order — celebratory cha-ching */
export function playSale() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  [880, 1100, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = now + i * 0.07;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

/** Delete / remove — short low thud */
export function playDelete() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(250, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.start(now);
  osc.stop(now + 0.12);
}
