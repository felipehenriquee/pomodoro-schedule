import { join } from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema";

// v1 -> v2: block.seq column + block_slot table, with seq backfill
const MIGRATION_2 = `
ALTER TABLE block ADD COLUMN seq INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_block_slot ON block(day_agenda_id, kind, seq);

CREATE TABLE block_slot (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id  INTEGER NOT NULL REFERENCES schedule_template(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL,
  seq          INTEGER NOT NULL,
  label        TEXT,
  duration_min INTEGER,
  UNIQUE(template_id, kind, seq)
);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY day_agenda_id, kind ORDER BY start_ts
  ) AS rn
  FROM block
)
UPDATE block SET seq = (SELECT rn FROM ranked WHERE ranked.id = block.id)
WHERE id IN (SELECT id FROM ranked);
`;

// v2 -> v3: block_slot.offset_min (time change propagated to every day)
const MIGRATION_3 = `ALTER TABLE block_slot ADD COLUMN offset_min INTEGER;`;

// v3 -> v4: task tied to a focus event (day_agenda_id + seq).
// The old global (unscoped) tasks are dropped.
const MIGRATION_4 = `
ALTER TABLE task ADD COLUMN day_agenda_id INTEGER;
ALTER TABLE task ADD COLUMN seq INTEGER;
DELETE FROM task WHERE day_agenda_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_scope ON task(day_agenda_id, seq);
`;

// v4 -> v5: template validity window (valid_from / valid_until)
const MIGRATION_5 = `
ALTER TABLE schedule_template ADD COLUMN valid_from TEXT;
ALTER TABLE schedule_template ADD COLUMN valid_until TEXT;
`;

export type DB = Database.Database;

let db: DB | undefined;

/** Opens (creating if needed) the database in userData and applies the schema. */
export function getDb(): DB {
  if (db) return db;

  const file = join(app.getPath("userData"), "pomodoro.sqlite");
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const version = (db.pragma("user_version", { simple: true }) as number) ?? 0;
  if (version < 1) {
    db.exec(SCHEMA_SQL); // current schema already includes every column
    db.pragma("user_version = 5");
  } else {
    if (version < 2) db.exec(MIGRATION_2);
    if (version < 3) db.exec(MIGRATION_3);
    if (version < 4) db.exec(MIGRATION_4);
    if (version < 5) db.exec(MIGRATION_5);
    db.pragma("user_version = 5");
  }

  return db;
}

export function closeDb(): void {
  db?.close();
  db = undefined;
}
