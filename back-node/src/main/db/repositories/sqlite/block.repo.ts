import type { DB } from "../../index";
import type { Block } from "../../../types";
import type { BlockRepo, RowRef } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export class SqliteBlockRepo implements BlockRepo {
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
