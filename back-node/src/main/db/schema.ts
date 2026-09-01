/** Full schema (SQLite). Applied when user_version = 0. */
export const SCHEMA_SQL = `
CREATE TABLE schedule_template (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  days_of_week    TEXT    NOT NULL,               -- "MO,TU,WE,TH,FR"
  start_time      TEXT    NOT NULL,               -- "HH:MM"
  end_time        TEXT    NOT NULL,
  work_min        INTEGER NOT NULL,
  short_break_min INTEGER NOT NULL,
  active          INTEGER NOT NULL DEFAULT 1,
  freq            TEXT    NOT NULL DEFAULT 'weekly', -- once|daily|weekly|interval
  anchor_date     TEXT,                             -- YYYY-MM-DD (once / interval)
  interval_days   INTEGER,
  valid_from      TEXT,                             -- YYYY-MM-DD: only generate events from this date on
  valid_until     TEXT,                             -- YYYY-MM-DD: only generate events up to this date
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE long_break (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES schedule_template(id) ON DELETE CASCADE,
  start_time  TEXT    NOT NULL,
  end_time    TEXT    NOT NULL,
  label       TEXT    NOT NULL
);
CREATE INDEX idx_long_break_tpl ON long_break(template_id);

CREATE TABLE day_agenda (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT    NOT NULL,                  -- "YYYY-MM-DD"
  template_id  INTEGER NOT NULL REFERENCES schedule_template(id) ON DELETE CASCADE,
  generated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  locked       INTEGER NOT NULL DEFAULT 0,        -- 1 = hand-edited, materialize won't regenerate
  UNIQUE(date, template_id)
);

CREATE TABLE block (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day_agenda_id INTEGER NOT NULL REFERENCES day_agenda(id) ON DELETE CASCADE,
  kind          TEXT    NOT NULL,                 -- work | short_break | long_break
  seq           INTEGER NOT NULL DEFAULT 0,       -- 1-based position among the SAME kind that day (foco1, foco2, pausa1...)
  start_ts      TEXT    NOT NULL,                 -- RFC3339 with local offset
  end_ts        TEXT    NOT NULL,
  label         TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending', -- pending | done | skipped
  manual        INTEGER NOT NULL DEFAULT 0,       -- 1 = ad-hoc event (calendar click)
  UNIQUE(day_agenda_id, start_ts)
);
CREATE INDEX idx_block_start ON block(start_ts);
CREATE INDEX idx_block_end   ON block(end_ts);
CREATE INDEX idx_block_slot  ON block(day_agenda_id, kind, seq);

-- Per-"slot" override for the schedule: e.g. "the 1st focus is named Study and lasts 45min".
-- Applied to every day of the schedule when the user edits an event with scope "all".
CREATE TABLE block_slot (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id  INTEGER NOT NULL REFERENCES schedule_template(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL,
  seq          INTEGER NOT NULL,
  label        TEXT,
  duration_min INTEGER,
  offset_min   INTEGER,  -- delay in minutes to apply before this slot (time change with scope "all")
  UNIQUE(template_id, kind, seq)
);

CREATE TABLE session_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES block(id) ON DELETE CASCADE,
  started_at TEXT    NOT NULL,
  ended_at   TEXT,
  completed  INTEGER NOT NULL DEFAULT 0
);

-- Tasks for a specific focus event (day + position). Each focus has its own.
CREATE TABLE task (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day_agenda_id INTEGER REFERENCES day_agenda(id) ON DELETE CASCADE,
  seq           INTEGER,
  text          TEXT    NOT NULL,
  done          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_task_scope ON task(day_agenda_id, seq);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
