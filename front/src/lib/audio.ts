// Web Audio precisa de 1 gesto do usuario pra "destravar".
// Chame unlockAudio() no primeiro clique (botao "Ativar som").

import type { Boundary } from "./types";

let ctx: AudioContext | null = null;
const buffers = new Map<Boundary, AudioBuffer>();

const FILES: Record<Boundary, string> = {
  work_end: "/alarm-end.wav", // toca no :50 (fim do foco)
  work_start: "/alarm-start.wav", // toca no :00 (volta ao foco)
};

export async function unlockAudio(): Promise<void> {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  await Promise.all(
    (Object.keys(FILES) as Boundary[]).map(async (key) => {
      if (buffers.has(key)) return;
      const res = await fetch(FILES[key]);
      const arr = await res.arrayBuffer();
      buffers.set(key, await ctx!.decodeAudioData(arr));
    })
  );
}

export function audioReady(): boolean {
  return ctx !== null && buffers.size === Object.keys(FILES).length;
}

export function playAlarm(kind: Boundary, volume = 1): void {
  if (!ctx) return;
  const buf = buffers.get(kind);
  if (!buf) return;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(ctx.destination);
  src.start();
}
