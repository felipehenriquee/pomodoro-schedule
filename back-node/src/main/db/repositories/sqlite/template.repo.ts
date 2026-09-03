import type { DB } from "../../index";
import type { LongBreakRow, Template, TemplateInput } from "../../../types";
import type { TemplateRepo } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class SqliteTemplateRepo implements TemplateRepo {
  constructor(private db: DB) {}

  list(): Template[] {
    const rows = this.db
      .prepare("SELECT * FROM schedule_template ORDER BY id")
      .all() as any[];
    return rows.map((r) => this.hydrate(r));
  }

  get(id: number): Template | undefined {
    const r = this.db
      .prepare("SELECT * FROM schedule_template WHERE id = ?")
      .get(id) as any;
    return r ? this.hydrate(r) : undefined;
  }

  create(input: TemplateInput): number {
    const info = this.db
      .prepare(
        `INSERT INTO schedule_template
         (name, days_of_week, start_time, end_time, work_min, short_break_min,
          active, freq, anchor_date, interval_days, valid_from, valid_until)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        input.name,
        input.days_of_week.join(","),
        input.start_time,
        input.end_time,
        input.work_min,
        input.short_break_min,
        input.active ? 1 : 0,
        input.freq,
        input.anchor_date,
        input.interval_days,
        input.valid_from,
        input.valid_until
      );
    const id = Number(info.lastInsertRowid);
    this.writeLongBreaks(id, input.long_breaks);
    return id;
  }

  update(id: number, input: TemplateInput): void {
    this.db
      .prepare(
        `UPDATE schedule_template SET
           name=?, days_of_week=?, start_time=?, end_time=?, work_min=?,
           short_break_min=?, active=?, freq=?, anchor_date=?, interval_days=?,
           valid_from=?, valid_until=?
         WHERE id=?`
      )
      .run(
        input.name,
        input.days_of_week.join(","),
        input.start_time,
        input.end_time,
        input.work_min,
        input.short_break_min,
        input.active ? 1 : 0,
        input.freq,
        input.anchor_date,
        input.interval_days,
        input.valid_from,
        input.valid_until,
        id
      );
    this.db.prepare("DELETE FROM long_break WHERE template_id = ?").run(id);
    this.writeLongBreaks(id, input.long_breaks);
  }

  updateFields(
    id: number,
    fields: Partial<Pick<Template, "name" | "work_min" | "short_break_min">>
  ): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (fields.name !== undefined) {
      sets.push("name=?");
      vals.push(fields.name);
    }
    if (fields.work_min !== undefined) {
      sets.push("work_min=?");
      vals.push(fields.work_min);
    }
    if (fields.short_break_min !== undefined) {
      sets.push("short_break_min=?");
      vals.push(fields.short_break_min);
    }
    if (!sets.length) return;
    vals.push(id);
    this.db
      .prepare(`UPDATE schedule_template SET ${sets.join(", ")} WHERE id=?`)
      .run(...vals);
  }

  setLongBreak(
    id: number,
    startTime: string,
    endTime: string,
    label: string
  ): void {
    this.db
      .prepare(
        "UPDATE long_break SET start_time = ?, end_time = ?, label = ? WHERE id = ?"
      )
      .run(startTime, endTime, label, id);
  }

  remove(id: number): void {
    this.db.prepare("DELETE FROM schedule_template WHERE id = ?").run(id);
  }

  private writeLongBreaks(templateId: number, breaks: TemplateInput["long_breaks"]): void {
    const stmt = this.db.prepare(
      "INSERT INTO long_break (template_id, start_time, end_time, label) VALUES (?,?,?,?)"
    );
    for (const b of breaks) stmt.run(templateId, b.start_time, b.end_time, b.label);
  }

  private hydrate(r: any): Template {
    const long_breaks = this.db
      .prepare(
        `SELECT id, template_id, start_time, end_time, label FROM long_break
         WHERE template_id = ? ORDER BY start_time`
      )
      .all(r.id) as LongBreakRow[];
    return {
      id: r.id,
      name: r.name,
      days_of_week: String(r.days_of_week).split(",").filter(Boolean),
      start_time: r.start_time,
      end_time: r.end_time,
      work_min: r.work_min,
      short_break_min: r.short_break_min,
      active: r.active !== 0,
      freq: r.freq,
      anchor_date: r.anchor_date ?? null,
      interval_days: r.interval_days ?? null,
      valid_from: r.valid_from ?? null,
      valid_until: r.valid_until ?? null,
      created_at: r.created_at,
      long_breaks,
    };
  }
}
