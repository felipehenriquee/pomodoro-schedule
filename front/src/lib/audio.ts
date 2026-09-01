// Alarm via <audio> element (works under file:// in the packaged app,
// unlike fetch()+AudioContext). In Electron autoplay is already
// unlocked (webPreferences.autoplayPolicy), so no user gesture is needed.

import type { Boundary } from "../models";

// path relative to index.html: dev  -> http://localhost:1420/xxx.wav
//                              prod -> file://.../out/renderer/xxx.wav
const FILES: Record<Boundary, string> = {
  work_end: "alarm-end.wav", // plays at :50 (end of focus)
  work_start: "alarm-start.wav", // plays at :00 (back to focus)
};

const els = new Map<Boundary, HTMLAudioElement>();
let ready = false;

export async function unlockAudio(): Promise<void> {
  if (ready) return;

  for (const key of Object.keys(FILES) as Boundary[]) {
    if (els.has(key)) continue;
    const a = new Audio(FILES[key]);
    a.preload = "auto";
    els.set(key, a);
  }

  // "warm up": play muted and stop, so the first real play is instant
  await Promise.all(
    [...els.values()].map(async (a) => {
      try {
        a.muted = true;
        await a.play();
        a.pause();
        a.currentTime = 0;
      } catch {
        /* autoplayPolicy covers it; ignore if it fails */
      } finally {
        a.muted = false;
      }
    })
  );

  ready = true;
}

export function audioReady(): boolean {
  return ready;
}

export function playAlarm(kind: Boundary, volume = 1): void {
  const a = els.get(kind);
  if (!a) return;
  a.currentTime = 0;
  a.volume = Math.max(0, Math.min(1, volume));
  void a.play().catch((e) => console.error("alarm play", e));
}
