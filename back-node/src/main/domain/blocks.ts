/**
 * Block engine: given a day and the config (focus/break/long breaks), it
 * produces the day's list of pomodoro mini-events.
 *
 * Faithful port of back/src/domain/blocks.rs + `seq` (position within the kind)
 * and `slots` (per-position override: name/duration from block_slot).
 */

export type BlockKind = "work" | "short_break" | "long_break";

export interface LongBreak {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  label: string;
}

/** Per-"slot" override (e.g. the 1st focus is named X, lasts Y min, starts Z min later). */
export interface SlotOverride {
  kind: BlockKind;
  seq: number;
  label: string | null;
  durationMin: number | null;
  offsetMin: number | null; // delay (min) applied before this slot
}

export interface DayConfig {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  workMin: number;
  shortBreakMin: number;
  longBreaks: LongBreak[];
  slots?: SlotOverride[];
}

export interface GeneratedBlock {
  kind: BlockKind;
  seq: number;
  start: Date;
  end: Date;
  label: string | null;
}

function at(dateStr: string, hm: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = hm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function addMinutes(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 60_000);
}

function minDate(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

export function generate(dateStr: string, cfg: DayConfig): GeneratedBlock[] {
  const out: GeneratedBlock[] = [];
  const dayEnd = at(dateStr, cfg.end);
  let cursor = at(dateStr, cfg.start);

  const breaks = [...cfg.longBreaks].sort((x, y) => x.start.localeCompare(y.start));
  const slots = cfg.slots ?? [];
  const seqOf: Record<BlockKind, number> = {
    work: 0,
    short_break: 0,
    long_break: 0,
  };
  const slotFor = (kind: BlockKind, seq: number) =>
    slots.find((s) => s.kind === kind && s.seq === seq);

  const longBreakAt = (t: Date): { lb: LongBreak; idx: number } | undefined => {
    for (let i = 0; i < breaks.length; i++) {
      const bs = at(dateStr, breaks[i].start).getTime();
      const be = at(dateStr, breaks[i].end).getTime();
      if (bs <= t.getTime() && t.getTime() < be) return { lb: breaks[i], idx: i };
    }
    return undefined;
  };

  let guard = 0;
  while (cursor.getTime() < dayEnd.getTime()) {
    if (++guard > 1000) break;

    const inLong = longBreakAt(cursor);
    if (inLong) {
      const seq = ++seqOf.long_break;
      const ov = slotFor("long_break", seq);
      const be = minDate(at(dateStr, inLong.lb.end), dayEnd);
      out.push({
        kind: "long_break",
        seq,
        start: cursor,
        end: be,
        label: ov?.label ?? inLong.lb.label,
      });
      cursor = be;
      continue;
    }

    // ---- focus ----
    const workSeq = seqOf.work + 1;
    const workOv = slotFor("work", workSeq);
    if (workOv?.offsetMin) cursor = addMinutes(cursor, workOv.offsetMin);
    if (cursor.getTime() >= dayEnd.getTime()) break;

    let nextBreakStart = breaks
      .map((b) => at(dateStr, b.start))
      .filter((t) => t.getTime() > cursor.getTime())
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const workDur = workOv?.durationMin ?? cfg.workMin;
    let workEnd = minDate(addMinutes(cursor, workDur), dayEnd);
    if (nextBreakStart) workEnd = minDate(workEnd, nextBreakStart);
    if (workEnd.getTime() <= cursor.getTime()) break;

    seqOf.work = workSeq;
    out.push({
      kind: "work",
      seq: workSeq,
      start: cursor,
      end: workEnd,
      label: workOv?.label ?? null,
    });
    cursor = workEnd;
    if (cursor.getTime() >= dayEnd.getTime()) break;

    // ---- short break ----
    if (!longBreakAt(cursor)) {
      const sbSeq = seqOf.short_break + 1;
      const sbOv = slotFor("short_break", sbSeq);
      if (sbOv?.offsetMin) cursor = addMinutes(cursor, sbOv.offsetMin);
      if (cursor.getTime() >= dayEnd.getTime()) break;

      nextBreakStart = breaks
        .map((b) => at(dateStr, b.start))
        .filter((t) => t.getTime() > cursor.getTime())
        .sort((a, b) => a.getTime() - b.getTime())[0];

      const sbDur = sbOv?.durationMin ?? cfg.shortBreakMin;
      if (sbDur > 0) {
        const sbNaturalEnd = addMinutes(cursor, sbDur);
        const boundary = minDate(nextBreakStart ?? dayEnd, dayEnd);

        // If the short break would reach (or overrun) the next long break or the
        // end of the day, drop it and hand those minutes to the focus instead --
        // so the focus ends exactly on the boundary, with no gap.
        if (sbNaturalEnd.getTime() >= boundary.getTime()) {
          const lastFocus = out[out.length - 1];
          if (lastFocus && lastFocus.kind === "work") lastFocus.end = boundary;
          cursor = boundary;
          if (boundary.getTime() >= dayEnd.getTime()) break;
          continue; // fall through to the long break on the next iteration
        }

        seqOf.short_break = sbSeq;
        out.push({
          kind: "short_break",
          seq: sbSeq,
          start: cursor,
          end: sbNaturalEnd,
          label: sbOv?.label ?? null,
        });
        cursor = sbNaturalEnd;
      }
    }
  }

  return out;
}
