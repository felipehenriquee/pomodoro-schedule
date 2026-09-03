import { occursOn } from "../../domain/recurrence";
import type { Template, TemplateInput } from "../../types";
import { addDays, dateStr, localRfc3339 } from "../../util/time";
import type { AgendaContext } from "../context";
import { materialize, MATERIALIZE_AHEAD_DAYS } from "./block.service";

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

export function deleteTemplate(ctx: AgendaContext, id: number): void {
  ctx.db.transaction(() => {
    ctx.repos.tasks.removeForTemplate(id);
    ctx.repos.templates.remove(id);
  })();
}
