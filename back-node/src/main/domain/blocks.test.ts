import { describe, expect, it } from "vitest";
import { generate, type DayConfig } from "./blocks";

const cfg: DayConfig = {
  start: "09:00",
  end: "18:00",
  workMin: 50,
  shortBreakMin: 10,
  longBreaks: [{ start: "12:00", end: "14:00", label: "Almoco" }],
};

const hm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

describe("generate", () => {
  it("primeiro ciclo bate em :50 e :00 e numera os slots", () => {
    const b = generate("2026-08-31", cfg);
    expect(b[0].kind).toBe("work");
    expect(b[0].seq).toBe(1);
    expect(hm(b[0].start)).toBe("09:00");
    expect(hm(b[0].end)).toBe("09:50");
    expect(b[1].kind).toBe("short_break");
    expect(b[1].seq).toBe(1);
    expect(hm(b[1].end)).toBe("10:00");
    expect(b[2].kind).toBe("work");
    expect(b[2].seq).toBe(2);
  });

  it("aplica override de slot (nome + duracao) no foco 1", () => {
    const b = generate("2026-08-31", {
      ...cfg,
      slots: [
        { kind: "work", seq: 1, label: "Estudar", durationMin: 30, offsetMin: null },
      ],
    });
    expect(b[0].label).toBe("Estudar");
    expect(hm(b[0].end)).toBe("09:30");
    expect(b[2].label).toBeNull();
  });

  it("offset no foco 1 atrasa o dia todo", () => {
    const b = generate("2026-08-31", {
      ...cfg,
      slots: [
        { kind: "work", seq: 1, label: null, durationMin: null, offsetMin: 30 },
      ],
    });
    expect(hm(b[0].start)).toBe("09:30");
    expect(hm(b[0].end)).toBe("10:20");
    expect(hm(b[1].start)).toBe("10:20"); // pausa 1 tambem desloca
  });

  it("respeita a pausa longa e o fim do dia, sem buracos", () => {
    const b = generate("2026-08-31", cfg);
    const lunch = b.find((x) => x.kind === "long_break")!;
    expect(hm(lunch.start)).toBe("12:00");
    expect(hm(lunch.end)).toBe("14:00");

    // nada antes das 12:00 ultrapassa 12:00
    for (const x of b.filter((x) => x.start.getHours() < 12)) {
      expect(x.end.getTime()).toBeLessThanOrEqual(lunch.start.getTime());
    }
    // termina exatamente as 18:00
    expect(hm(b[b.length - 1].end)).toBe("18:00");
    // contiguo
    for (let i = 1; i < b.length; i++) {
      expect(b[i].start.getTime()).toBe(b[i - 1].end.getTime());
    }
  });
});
