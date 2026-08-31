// Gera dois alarmes .wav em front/public/.
// Troque livremente por arquivos seus (mantendo os nomes).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(outDir, { recursive: true });

const RATE = 44100;

/** @param {Array<{freqs:number[], dur:number, gap:number}>} beeps */
function renderWav(beeps, name) {
  // conta de amostras por segmento (inteiros) e total exato
  const segs = beeps.map((b) => ({
    ...b,
    tone: Math.floor(RATE * b.dur),
    silence: Math.floor(RATE * b.gap),
  }));
  const n = segs.reduce((s, g) => s + g.tone + g.silence, 0);

  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);

  let pos = 0;
  for (const g of segs) {
    for (let i = 0; i < g.tone && pos < n; i++, pos++) {
      const t = i / RATE;
      const env = Math.min(1, t / 0.008) * Math.exp(-4 * t);
      let s = 0;
      for (const f of g.freqs) s += Math.sin(2 * Math.PI * f * t);
      s = (s / g.freqs.length) * env * 0.55;
      const v = Math.max(-1, Math.min(1, s));
      buf.writeInt16LE((v * 32767) | 0, 44 + pos * 2);
    }
    pos += g.silence; // silencio ja esta zerado pelo Buffer.alloc
  }

  writeFileSync(join(outDir, name), buf);
  console.log("wrote public/" + name);
}

// :50 -> fim do foco (bips descendentes, "pode parar")
renderWav(
  [
    { freqs: [880, 660], dur: 0.18, gap: 0.09 },
    { freqs: [740, 550], dur: 0.18, gap: 0.09 },
    { freqs: [620, 460], dur: 0.4, gap: 0.0 },
  ],
  "alarm-end.wav"
);

// :00 -> volta ao foco (acorde ascendente, "bora")
renderWav(
  [
    { freqs: [523], dur: 0.15, gap: 0.06 },
    { freqs: [659], dur: 0.15, gap: 0.06 },
    { freqs: [784], dur: 0.15, gap: 0.06 },
    { freqs: [1047], dur: 0.45, gap: 0.0 },
  ],
  "alarm-start.wav"
);
