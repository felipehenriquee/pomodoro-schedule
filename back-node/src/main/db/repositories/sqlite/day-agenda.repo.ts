import type { DB } from "../../index";
import type { DayAgendaRepo } from "../types";

export class SqliteDayAgendaRepo implements DayAgendaRepo {
  constructor(private db: DB) {}

  ensure(date: string, templateId: number): { id: number; locked: number } {
    this.db
      .prepare("INSERT OR IGNORE INTO day_agenda (date, template_id) VALUES (?, ?)")
      .run(date, templateId);
    return this.db
      .prepare("SELECT id, locked FROM day_agenda WHERE date = ? AND template_id = ?")
      .get(date, templateId) as { id: number; locked: number };
  }

  firstForDate(date: string): number | undefined {
    const r = this.db
      .prepare("SELECT id FROM day_agenda WHERE date = ? ORDER BY id LIMIT 1")
      .get(date) as { id: number } | undefined;
    return r?.id;
  }

  createForDate(date: string, templateId: number, locked: boolean): number {
    const info = this.db
      .prepare("INSERT INTO day_agenda (date, template_id, locked) VALUES (?, ?, ?)")
      .run(date, templateId, locked ? 1 : 0);
    return Number(info.lastInsertRowid);
  }

  lock(id: number): void {
    this.db.prepare("UPDATE day_agenda SET locked = 1 WHERE id = ?").run(id);
  }

  clearFutureUnlockedBlocks(templateId: number, fromDate: string): void {
    this.db
      .prepare(
        `DELETE FROM block WHERE day_agenda_id IN
         (SELECT id FROM day_agenda WHERE template_id = ? AND locked = 0 AND date >= ?)`
      )
      .run(templateId, fromDate);
  }

  listForTemplateFrom(
    templateId: number,
    fromDate: string
  ): { id: number; date: string; locked: number }[] {
    return this.db
      .prepare(
        `SELECT id, date, locked FROM day_agenda
         WHERE template_id = ? AND date >= ? ORDER BY date`
      )
      .all(templateId, fromDate) as {
      id: number;
      date: string;
      locked: number;
    }[];
  }
}
