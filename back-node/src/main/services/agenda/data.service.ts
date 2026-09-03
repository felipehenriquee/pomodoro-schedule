import type { TemplateInput } from "../../types";
import type { AgendaContext } from "../context";

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
