import { generate, type DayConfig } from "../domain/blocks";
import { occursOn } from "../domain/recurrence";
import type {
  Block,
  BlockCreate,
  BlockEdit,
  CurrentBlock,
  Template,
  TemplateInput,
} from "../types";
import { addDays, dateStr, hhmm, localRfc3339 } from "../util/time";
import type { AgendaContext } from "./context";

const KINDS = new Set(["work", "short_break", "long_break"]);

/** How many days ahead to always keep materialized. */
export const MATERIALIZE_AHEAD_DAYS = 120;

export function listTemplates(ctx: AgendaContext): Template[] {
  return ctx.repos.templates.list();
}

export function saveTemplate(ctx: AgendaContext, input: TemplateInput): number {
  const today = dateStr();
  const nowIso = localRfc3339(new Date());

  const id = ctx.db.transaction(() => {
    if (input.id == null) return ctx.repos.templates.create(input);

    ctx.repos.templates.update(input.id, input);
    const tpl = ctx.repos.templates.get(input.id)!; // already with the new config

    // Every day of the schedule from TODAY on (skips hand-edited days):
    //  - still occurs and is a FUTURE day -> delete the blocks (regenerated)
    //  - still occurs and is TODAY -> leave it (partial history of the day)
    //  - stopped occurring -> cancel the blocks that haven't started yet
    //    (start_ts > now) and lock the day; what already passed stays intact
    for (const day of ctx.repos.dayAgendas.listForTemplateFrom(input.id, today)) {
      if (day.locked) continue;
      const inWindow =
        (!tpl.valid_from || day.date >= tpl.valid_from) &&
        (!tpl.valid_until || day.date <= tpl.valid_until);
      const occurs =
        inWindow &&
        occursOn(
          day.date,
          tpl.freq,
          tpl.days_of_week.join(","),
          tpl.anchor_date,
          tpl.interval_days
        );

      if (occurs) {
        if (day.date > today) ctx.repos.blocks.deleteForDayAgenda(day.id);
      } else {
        ctx.repos.blocks.markSkippedForDayAgendaAfter(day.id, nowIso);
        ctx.repos.dayAgendas.lock(day.id);
      }
    }
    return input.id;
  })();

  materialize(ctx, today, addDays(today, MATERIALIZE_AHEAD_DAYS));
  return id;
}

/** Ensures the next N days are materialized (idempotent). */
export function materializeAhead(ctx: AgendaContext): number {
  const today = dateStr();
  return materialize(ctx, today, addDays(today, MATERIALIZE_AHEAD_DAYS));
}

export function deleteTemplate(ctx: AgendaContext, id: number): void {
  ctx.db.transaction(() => {
    ctx.repos.tasks.removeForTemplate(id);
    ctx.repos.templates.remove(id);
  })();
}

/** Generates (idempotent) the blocks of active templates in the range [from, to]. */
export function materialize(ctx: AgendaContext, from: string, to: string): number {
  const templates = ctx.repos.templates.list().filter((t) => t.active);
  const today = dateStr();
  let created = 0;

  for (let d = from; d <= to; d = addDays(d, 1)) {
    // slot overrides (name/duration/offset) only apply from today on;
    // past days always come out in the template's "plain" form
    const useSlots = d >= today;
    for (const tpl of templates) {
      // schedule validity window
      if (tpl.valid_from && d < tpl.valid_from) continue;
      if (tpl.valid_until && d > tpl.valid_until) continue;

      if (
        !occursOn(
          d,
          tpl.freq,
          tpl.days_of_week.join(","),
          tpl.anchor_date,
          tpl.interval_days
        )
      ) {
        continue;
      }

      const { id: agendaId, locked } = ctx.repos.dayAgendas.ensure(d, tpl.id);
      if (locked) continue;

      const cfg: DayConfig = {
        start: tpl.start_time,
        end: tpl.end_time,
        workMin: tpl.work_min,
        shortBreakMin: tpl.short_break_min,
        longBreaks: tpl.long_breaks.map((b) => ({
          start: b.start_time,
          end: b.end_time,
          label: b.label,
        })),
        slots: useSlots
          ? ctx.repos.blockSlots.forTemplate(tpl.id).map((s) => ({
              kind: s.kind,
              seq: s.seq,
              label: s.label,
              durationMin: s.duration_min,
              offsetMin: s.offset_min,
            }))
          : [],
      };

      for (const gb of generate(d, cfg)) {
        created += ctx.repos.blocks.insertIgnore(
          agendaId,
          gb.kind,
          gb.seq,
          localRfc3339(gb.start),
          localRfc3339(gb.end),
          gb.label
        );
      }
    }
  }

  return created;
}

export function getBlocks(ctx: AgendaContext, from: string, to: string): Block[] {
  return ctx.repos.blocks.range(from, to);
}

export function getCurrentBlock(ctx: AgendaContext): CurrentBlock {
  const now = localRfc3339(new Date());
  return {
    current: ctx.repos.blocks.current(now) ?? null,
    next: ctx.repos.blocks.next(now) ?? null,
    server_now: now,
  };
}

/** Next event of a specific kind (focus / short break / long break). */
export function getNextOfKind(ctx: AgendaContext, kind: string): Block | null {
  return ctx.repos.blocks.nextOfKind(localRfc3339(new Date()), kind) ?? null;
}

export function setBlockStatus(
  ctx: AgendaContext,
  id: number,
  status: string
): void {
  ctx.repos.blocks.setStatus(id, status);
}

/**
 * Edits an event.
 * - scope "one": changes just that block (name/time) + pushes the day's
 *   following blocks + locks the day. Doesn't touch the schedule or other days.
 * - scope "all": on top of the above, writes an override on the "slot"
 *   (template_id, kind, seq) and applies it to EVERY day of the schedule —
 *   renames every "focoN"; if the duration changed, regenerates the unlocked
 *   days with the new duration.
 * Never changes the schedule name (template.name).
 */
export function updateBlock(ctx: AgendaContext, edit: BlockEdit): void {
  const { repos } = ctx;
  const cur = repos.blocks.get(edit.id);
  if (!cur) throw new Error("bloco nao encontrado");

  const oldStart = new Date(cur.start_ts).getTime();
  const oldEnd = new Date(cur.end_ts).getTime();
  const newStart = new Date(edit.start_ts).getTime();
  const newEnd = new Date(edit.end_ts).getTime();
  const deltaEndMs = newEnd - oldEnd;
  const oldDurMin = Math.round((oldEnd - oldStart) / 60_000);
  const newDurMin = Math.round((newEnd - newStart) / 60_000);
  const durChanged = newDurMin > 0 && newDurMin !== oldDurMin;
  const startShiftMin = Math.round((newStart - oldStart) / 60_000);
  const seq = cur.seq || 1;

  // Applies a batch of repositions without violating UNIQUE(day_agenda_id,start_ts):
  // pass 1 parks everyone ~1000 days in the future; pass 2 puts them in their final spot.
  const PARK_MS = 1000 * 86_400_000;
  const bump = (iso: string) =>
    localRfc3339(new Date(new Date(iso).getTime() + PARK_MS));

  ctx.db.transaction(() => {
    const moves: {
      id: number;
      curStart: string;
      curEnd: string;
      newStart: string;
      newEnd: string;
    }[] = [
      {
        id: edit.id,
        curStart: cur.start_ts,
        curEnd: cur.end_ts,
        newStart: edit.start_ts,
        newEnd: edit.end_ts,
      },
    ];

    if (deltaEndMs !== 0) {
      for (const b of repos.blocks.after(cur.day_agenda_id, edit.id, cur.end_ts)) {
        moves.push({
          id: b.id,
          curStart: b.start_ts,
          curEnd: b.end_ts,
          newStart: localRfc3339(new Date(new Date(b.start_ts).getTime() + deltaEndMs)),
          newEnd: localRfc3339(new Date(new Date(b.end_ts).getTime() + deltaEndMs)),
        });
      }
    }

    for (const m of moves) repos.blocks.shift(m.id, bump(m.curStart), bump(m.curEnd));
    for (const m of moves) {
      if (m.id === edit.id) {
        repos.blocks.setTime(m.id, m.newStart, m.newEnd, edit.label);
      } else {
        repos.blocks.shift(m.id, m.newStart, m.newEnd);
      }
    }

    repos.dayAgendas.lock(cur.day_agenda_id);

    // 3. "every day" of the schedule -- only from TOMORROW on; today and the
    //    past stay as they are (today's event may already have happened).
    if (edit.scope === "all") {
      const from = addDays(dateStr(), 1);
      if (cur.kind === "long_break") {
        // a long break is defined by time on the schedule -> edit the long_break row
        const tpl = repos.templates.get(cur.template_id);
        const lb = tpl?.long_breaks[seq - 1];
        if (lb) {
          repos.templates.setLongBreak(
            lb.id,
            hhmm(new Date(edit.start_ts)),
            hhmm(new Date(edit.end_ts)),
            (edit.label && edit.label.trim()) || lb.label
          );
        }
        repos.blocks.setLabelForSlot(cur.template_id, cur.kind, seq, edit.label, from);
        repos.dayAgendas.clearFutureUnlockedBlocks(cur.template_id, from);
      } else {
        // focus / short break -> override in block_slot (duration + offset)
        const prev = repos.blockSlots
          .forTemplate(cur.template_id)
          .find((s) => s.kind === cur.kind && s.seq === seq);
        const offset = (prev?.offset_min ?? 0) + startShiftMin;

        repos.blockSlots.upsert(
          cur.template_id,
          cur.kind,
          seq,
          edit.label,
          durChanged ? newDurMin : (prev?.duration_min ?? null),
          offset || null
        );
        repos.blocks.setLabelForSlot(cur.template_id, cur.kind, seq, edit.label, from);
        if (durChanged || startShiftMin !== 0) {
          repos.dayAgendas.clearFutureUnlockedBlocks(cur.template_id, from);
        }
      }
    }
  })();

  // regenerate the next ~90 days now (the front only asks for the visible week)
  if (edit.scope === "all") {
    const from = addDays(dateStr(), 1);
    materialize(ctx, from, addDays(from, 90));
  }
}

/**
 * Creates an ad-hoc event (calendar click). Chain-pushes the colliding blocks
 * to after the new one ends (2 passes so the UNIQUE isn't hit) and returns
 * `true` if anything was pushed.
 */
export function createBlock(ctx: AgendaContext, input: BlockCreate): boolean {
  const { repos } = ctx;
  if (!KINDS.has(input.kind)) throw new Error(`tipo invalido: ${input.kind}`);

  const ns = new Date(input.start_ts).getTime();
  const ne = new Date(input.end_ts).getTime();
  if (ne <= ns) throw new Error("o fim precisa ser depois do inicio");

  // make sure the day's automatic blocks exist before locking it
  materialize(ctx, input.date, input.date);

  return ctx.db.transaction(() => {
    let agendaId = repos.dayAgendas.firstForDate(input.date);
    if (agendaId === undefined) {
      const tpl = repos.templates.list().find((t) => t.active);
      if (!tpl) throw new Error("crie uma agenda antes de adicionar eventos");
      agendaId = repos.dayAgendas.createForDate(input.date, tpl.id, true);
    }

    const newId = repos.blocks.insertManual(
      agendaId,
      input.kind,
      input.start_ts,
      input.end_ts,
      input.label
    );

    // pass 1: compute new positions (cursor walks forward)
    const others = repos.blocks.notBefore(agendaId, newId, input.start_ts);
    const planned: { id: number; start: string; end: string }[] = [];
    let cursor = ne;
    for (const o of others) {
      const os = new Date(o.start_ts).getTime();
      const oe = new Date(o.end_ts).getTime();
      if (os < cursor) {
        const shift = cursor - os;
        const nEnd = oe + shift;
        planned.push({
          id: o.id,
          start: localRfc3339(new Date(cursor)),
          end: localRfc3339(new Date(nEnd)),
        });
        cursor = nEnd;
      } else {
        cursor = oe;
      }
    }
    // write from last to first: the target slot is already free
    for (const p of [...planned].reverse()) repos.blocks.shift(p.id, p.start, p.end);

    repos.dayAgendas.lock(agendaId);
    return planned.length > 0;
  })();
}

/**
 * The event's "delete" button:
 *  - ad-hoc event (manual) -> deleted for good;
 *  - schedule event -> cancelled (status 'skipped'), so it can be "restored".
 * Either way it locks the day so materialize won't regenerate it.
 */
/** Permanently deletes every cancelled event. Returns how many were removed. */
export function deleteCancelledBlocks(ctx: AgendaContext): number {
  return ctx.repos.blocks.deleteAllSkipped();
}

export function deleteBlock(ctx: AgendaContext, id: number): void {
  const b = ctx.repos.blocks.get(id);
  if (!b) return;
  // ad-hoc OR already cancelled -> delete for good; otherwise -> cancel (so it can be restored)
  if (b.manual || b.status === "skipped") ctx.repos.blocks.remove(id);
  else ctx.repos.blocks.setStatus(id, "skipped");
  ctx.repos.dayAgendas.lock(b.day_agenda_id);
}

// ---- export / import (JSON) ----

export function exportData(ctx: AgendaContext): string {
  const templates = ctx.repos.templates.list().map((t) => ({
    name: t.name,
    days_of_week: t.days_of_week,
    start_time: t.start_time,
    end_time: t.end_time,
    work_min: t.work_min,
    short_break_min: t.short_break_min,
    active: t.active,
    freq: t.freq,
    anchor_date: t.anchor_date,
    interval_days: t.interval_days,
    valid_from: t.valid_from,
    valid_until: t.valid_until,
    long_breaks: t.long_breaks.map((b) => ({
      start_time: b.start_time,
      end_time: b.end_time,
      label: b.label,
    })),
  }));
  return JSON.stringify({ templates }, null, 2);
}

export function importData(ctx: AgendaContext, json: string): void {
  const bundle = JSON.parse(json) as { templates: TemplateInput[] };
  ctx.db.transaction(() => {
    for (const t of bundle.templates ?? []) {
      ctx.repos.templates.create({
        name: t.name,
        days_of_week: t.days_of_week ?? [],
        start_time: t.start_time,
        end_time: t.end_time,
        work_min: t.work_min,
        short_break_min: t.short_break_min,
        active: t.active ?? true,
        freq: t.freq ?? "weekly",
        anchor_date: t.anchor_date ?? null,
        interval_days: t.interval_days ?? null,
        valid_from: t.valid_from ?? null,
        valid_until: t.valid_until ?? null,
        long_breaks: t.long_breaks ?? [],
      });
    }
  })();
}
