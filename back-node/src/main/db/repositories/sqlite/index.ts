import type { DB } from "../../index";
import type {
  Block,
  LongBreakRow,
  Task,
  Template,
  TemplateInput,
} from "../../../types";
import type {
  BlockRepo,
  BlockSlotRepo,
  DayAgendaRepo,
  Repositories,
  RowRef,
  SlotRow,
  TaskRepo,
  TemplateRepo,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

class SqliteTemplateRepo implements TemplateRepo {
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

class SqliteDayAgendaRepo implements DayAgendaRepo {
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

const BLOCK_SELECT = `
SELECT b.id, b.day_agenda_id, b.kind, b.seq, b.start_ts, b.end_ts, b.label, b.status,
       b.manual, da.template_id, t.freq, t.days_of_week, t.interval_days
FROM block b
JOIN day_agenda da ON da.id = b.day_agenda_id
JOIN schedule_template t ON t.id = da.template_id`;

function hydrateBlock(r: any): Block {
  return {
    id: r.id,
    day_agenda_id: r.day_agenda_id,
    kind: r.kind,
    seq: r.seq ?? 0,
    start_ts: r.start_ts,
    end_ts: r.end_ts,
    label: r.label ?? null,
    status: r.status,
    manual: r.manual !== 0,
    template_id: r.template_id,
    freq: r.freq,
    days_of_week: r.days_of_week,
    interval_days: r.interval_days ?? null,
  };
}

class SqliteBlockRepo implements BlockRepo {
  constructor(private db: DB) {}

  range(from: string, to: string): Block[] {
    return (
      this.db
        .prepare(
          `${BLOCK_SELECT} WHERE substr(b.start_ts,1,10) BETWEEN ? AND ? ORDER BY b.start_ts`
        )
        .all(from, to) as any[]
    ).map(hydrateBlock);
  }

  get(id: number): Block | undefined {
    const r = this.db.prepare(`${BLOCK_SELECT} WHERE b.id = ?`).get(id) as any;
    return r ? hydrateBlock(r) : undefined;
  }

  current(nowIso: string): Block | undefined {
    const r = this.db
      .prepare(
        `${BLOCK_SELECT} WHERE b.status <> 'skipped' AND b.start_ts <= ? AND b.end_ts > ? ORDER BY b.start_ts LIMIT 1`
      )
      .get(nowIso, nowIso) as any;
    return r ? hydrateBlock(r) : undefined;
  }

  next(nowIso: string): Block | undefined {
    const r = this.db
      .prepare(
        `${BLOCK_SELECT} WHERE b.status <> 'skipped' AND b.start_ts > ? ORDER BY b.start_ts LIMIT 1`
      )
      .get(nowIso) as any;
    return r ? hydrateBlock(r) : undefined;
  }

  nextOfKind(nowIso: string, kind: string): Block | undefined {
    const r = this.db
      .prepare(
        `${BLOCK_SELECT} WHERE b.status <> 'skipped' AND b.start_ts > ? AND b.kind = ? ORDER BY b.start_ts LIMIT 1`
      )
      .get(nowIso, kind) as any;
    return r ? hydrateBlock(r) : undefined;
  }

  nextEndingAfter(nowIso: string): { end_ts: string; kind: string } | undefined {
    return this.db
      .prepare(
        "SELECT end_ts, kind FROM block WHERE status <> 'skipped' AND end_ts > ? ORDER BY end_ts ASC LIMIT 1"
      )
      .get(nowIso) as { end_ts: string; kind: string } | undefined;
  }

  insertIgnore(
    dayAgendaId: number,
    kind: string,
    seq: number,
    startTs: string,
    endTs: string,
    label: string | null
  ): number {
    const info = this.db
      .prepare(
        `INSERT OR IGNORE INTO block (day_agenda_id, kind, seq, start_ts, end_ts, label, status)
         VALUES (?,?,?,?,?,?,'pending')`
      )
      .run(dayAgendaId, kind, seq, startTs, endTs, label);
    return info.changes;
  }

  setLabelForSlot(
    templateId: number,
    kind: string,
    seq: number,
    label: string | null,
    fromDate: string
  ): void {
    this.db
      .prepare(
        `UPDATE block SET label = ?
         WHERE kind = ? AND seq = ? AND day_agenda_id IN
           (SELECT id FROM day_agenda WHERE template_id = ? AND date >= ?)`
      )
      .run(label, kind, seq, templateId, fromDate);
  }

  insertManual(
    dayAgendaId: number,
    kind: string,
    startTs: string,
    endTs: string,
    label: string | null
  ): number {
    const nextSeq =
      (this.db
        .prepare(
          "SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM block WHERE day_agenda_id = ? AND kind = ?"
        )
        .get(dayAgendaId, kind) as { n: number }).n;
    const info = this.db
      .prepare(
        `INSERT INTO block (day_agenda_id, kind, seq, start_ts, end_ts, label, status, manual)
         VALUES (?,?,?,?,?,?,'pending',1)`
      )
      .run(dayAgendaId, kind, nextSeq, startTs, endTs, label);
    return Number(info.lastInsertRowid);
  }

  setTime(id: number, startTs: string, endTs: string, label: string | null): void {
    this.db
      .prepare("UPDATE block SET label = ?, start_ts = ?, end_ts = ? WHERE id = ?")
      .run(label, startTs, endTs, id);
  }

  shift(id: number, startTs: string, endTs: string): void {
    this.db
      .prepare("UPDATE block SET start_ts = ?, end_ts = ? WHERE id = ?")
      .run(startTs, endTs, id);
  }

  setStatus(id: number, status: string): void {
    this.db.prepare("UPDATE block SET status = ? WHERE id = ?").run(status, id);
  }

  markDoneBefore(nowIso: string): void {
    this.db
      .prepare(
        "UPDATE block SET status = 'done' WHERE end_ts <= ? AND status = 'pending'"
      )
      .run(nowIso);
  }

  deleteForDayAgenda(dayAgendaId: number): void {
    this.db.prepare("DELETE FROM block WHERE day_agenda_id = ?").run(dayAgendaId);
  }

  markSkippedForDayAgendaAfter(dayAgendaId: number, afterIso: string): void {
    this.db
      .prepare(
        `UPDATE block SET status = 'skipped'
         WHERE day_agenda_id = ? AND start_ts > ? AND status <> 'done'`
      )
      .run(dayAgendaId, afterIso);
  }

  remove(id: number): void {
    this.db.prepare("DELETE FROM block WHERE id = ?").run(id);
  }

  deleteAllSkipped(): number {
    return this.db.prepare("DELETE FROM block WHERE status = 'skipped'").run()
      .changes;
  }

  after(dayAgendaId: number, excludeId: number, tsIso: string): RowRef[] {
    return this.db
      .prepare(
        `SELECT id, start_ts, end_ts FROM block
         WHERE day_agenda_id = ? AND id <> ? AND start_ts >= ? ORDER BY start_ts`
      )
      .all(dayAgendaId, excludeId, tsIso) as RowRef[];
  }

  notBefore(dayAgendaId: number, excludeId: number, tsIso: string): RowRef[] {
    return this.db
      .prepare(
        `SELECT id, start_ts, end_ts FROM block
         WHERE day_agenda_id = ? AND id <> ? AND end_ts > ? ORDER BY start_ts`
      )
      .all(dayAgendaId, excludeId, tsIso) as RowRef[];
  }
}

class SqliteBlockSlotRepo implements BlockSlotRepo {
  constructor(private db: DB) {}

  forTemplate(templateId: number): SlotRow[] {
    return this.db
      .prepare(
        "SELECT kind, seq, label, duration_min, offset_min FROM block_slot WHERE template_id = ?"
      )
      .all(templateId) as SlotRow[];
  }

  upsert(
    templateId: number,
    kind: string,
    seq: number,
    label: string | null,
    durationMin: number | null,
    offsetMin: number | null
  ): void {
    this.db
      .prepare(
        `INSERT INTO block_slot (template_id, kind, seq, label, duration_min, offset_min)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(template_id, kind, seq) DO UPDATE SET
           label = excluded.label,
           duration_min = excluded.duration_min,
           offset_min = excluded.offset_min`
      )
      .run(templateId, kind, seq, label, durationMin, offsetMin);
  }
}

class SqliteTaskRepo implements TaskRepo {
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

export function createSqliteRepositories(db: DB): Repositories {
  return {
    templates: new SqliteTemplateRepo(db),
    dayAgendas: new SqliteDayAgendaRepo(db),
    blocks: new SqliteBlockRepo(db),
    blockSlots: new SqliteBlockSlotRepo(db),
    tasks: new SqliteTaskRepo(db),
  };
}
