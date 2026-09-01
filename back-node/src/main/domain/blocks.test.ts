import { describe, expect, it } from "vitest";
import { generate, type DayConfig } from "./blocks";

const cfg: DayConfig = {
  start: "09:00",
  end: "18:00",
  workMin: 50,
  shortBreakMin: 10,
  longBreaks: [{ start: "12:00", end: "14:00", label: "Lunch" }],
};

const hm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

describe("generate", () => {
  it("first cycle lands on :50 and :00 and numbers the slots", () => {
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

  it("applies a slot override (name + duration) to focus 1", () => {
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

  it("an offset on focus 1 pushes the whole day", () => {
    const b = generate("2026-08-31", {
      ...cfg,
      slots: [
        { kind: "work", seq: 1, label: null, durationMin: null, offsetMin: 30 },
      ],
    });
    expect(hm(b[0].start)).toBe("09:30");
    expect(hm(b[0].end)).toBe("10:20");
    expect(hm(b[1].start)).toBe("10:20"); // break 1 shifts too
  });

  it("respects the long break and the end of the day, with no gaps", () => {
    const b = generate("2026-08-31", cfg);
    const lunch = b.find((x) => x.kind === "long_break")!;
    expect(hm(lunch.start)).toBe("12:00");
    expect(hm(lunch.end)).toBe("14:00");

    // nothing before 12:00 crosses 12:00
    for (const x of b.filter((x) => x.start.getHours() < 12)) {
      expect(x.end.getTime()).toBeLessThanOrEqual(lunch.start.getTime());
    }
    // ends exactly at 18:00
    expect(hm(b[b.length - 1].end)).toBe("18:00");
    // contiguous
    for (let i = 1; i < b.length; i++) {
      expect(b[i].start.getTime()).toBe(b[i - 1].end.getTime());
    }
  });
});
