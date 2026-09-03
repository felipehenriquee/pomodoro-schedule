import type { DB } from "../../index";
import type { BlockSlotRepo, SlotRow } from "../types";

export class SqliteBlockSlotRepo implements BlockSlotRepo {
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
