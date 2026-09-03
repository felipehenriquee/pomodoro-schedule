import type { DB } from "../../index";
import type { Task } from "../../../types";
import type { TaskRepo } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export class SqliteTaskRepo implements TaskRepo {
  constructor(private db: DB) {}

  list(dayAgendaId: number, seq: number): Task[] {
    return (
      this.db
        .prepare(
          `SELECT id, text, done, created_at FROM task
           WHERE day_agenda_id = ? AND seq = ? ORDER BY done ASC, id DESC`
        )
        .all(dayAgendaId, seq) as any[]
    ).map((r) => ({ ...r, done: r.done !== 0 }));
  }

  add(dayAgendaId: number, seq: number, text: string): number {
    return Number(
      this.db
        .prepare("INSERT INTO task (day_agenda_id, seq, text) VALUES (?,?,?)")
        .run(dayAgendaId, seq, text).lastInsertRowid
    );
  }

  addForTemplate(
    templateId: number,
    seq: number,
    text: string,
    fromDate: string
  ): number {
    return this.db
      .prepare(
        `INSERT INTO task (day_agenda_id, seq, text)
         SELECT da.id, @seq, @text
         FROM day_agenda da
         WHERE da.template_id = @tpl
           AND da.date >= @from
           AND EXISTS (
             SELECT 1 FROM block b
             WHERE b.day_agenda_id = da.id
               AND b.kind = 'work' AND b.seq = @seq
               AND b.status <> 'skipped'
           )
           AND NOT EXISTS (
             SELECT 1 FROM task t
             WHERE t.day_agenda_id = da.id AND t.seq = @seq AND t.text = @text
           )`
      )
      .run({ seq, text, tpl: templateId, from: fromDate }).changes;
  }

  removeForTemplate(templateId: number): void {
    this.db
      .prepare(
        `DELETE FROM task WHERE day_agenda_id IN
         (SELECT id FROM day_agenda WHERE template_id = ?)`
      )
      .run(templateId);
  }

  update(id: number, text: string): void {
    this.db.prepare("UPDATE task SET text = ? WHERE id = ?").run(text, id);
  }

  setDone(id: number, done: boolean): void {
    this.db.prepare("UPDATE task SET done = ? WHERE id = ?").run(done ? 1 : 0, id);
  }

  remove(id: number): void {
    this.db.prepare("DELETE FROM task WHERE id = ?").run(id);
  }
}
