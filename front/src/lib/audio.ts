// Alarme via elemento <audio> (funciona sob file:// no app empacotado,
// diferente de fetch()+AudioContext). No Electron o autoplay ja esta
// liberado (webPreferences.autoplayPolicy), entao nao precisa de gesto.

import type { Boundary } from "./types";

// caminho relativo ao index.html: dev -> http://localhost:1420/xxx.wav
//                                 prod -> file://.../out/renderer/xxx.wav
const FILES: Record<Boundary, string> = {
  work_end: "alarm-end.wav", // toca no :50 (fim do foco)
  work_start: "alarm-start.wav", // toca no :00 (volta ao foco)
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

  // "aquece": toca mudo e para, pra o 1o play real ser instantaneo
  await Promise.all(
    [...els.values()].map(async (a) => {
      try {
        a.muted = true;
        await a.play();
        a.pause();
        a.currentTime = 0;
      } catch {
        /* autoplayPolicy cobre; ignora se falhar */
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
