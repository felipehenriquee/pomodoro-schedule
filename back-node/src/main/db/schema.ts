/** Esquema completo (SQLite). Aplicado quando user_version = 0. */
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
  valid_from      TEXT,                             -- YYYY-MM-DD: so gera eventos a partir dessa data
  valid_until     TEXT,                             -- YYYY-MM-DD: so gera eventos ate essa data
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
  locked       INTEGER NOT NULL DEFAULT 0,        -- 1 = editado a mao, materialize nao regenera
  UNIQUE(date, template_id)
);

CREATE TABLE block (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  day_agenda_id INTEGER NOT NULL REFERENCES day_agenda(id) ON DELETE CASCADE,
  kind          TEXT    NOT NULL,                 -- work | short_break | long_break
  seq           INTEGER NOT NULL DEFAULT 0,       -- posicao 1-based dentro do MESMO kind no dia (foco1, foco2, pausa1...)
  start_ts      TEXT    NOT NULL,                 -- RFC3339 com offset local
  end_ts        TEXT    NOT NULL,
  label         TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending', -- pending | done | skipped
  manual        INTEGER NOT NULL DEFAULT 0,       -- 1 = evento avulso (clique na agenda)
  UNIQUE(day_agenda_id, start_ts)
);
CREATE INDEX idx_block_start ON block(start_ts);
CREATE INDEX idx_block_end   ON block(end_ts);
CREATE INDEX idx_block_slot  ON block(day_agenda_id, kind, seq);

-- Override por "slot" da agenda: ex. "o 1o foco chama Estudar e dura 45min".
-- Aplicado a todos os dias da agenda quando o usuario edita um evento com escopo "all".
CREATE TABLE block_slot (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id  INTEGER NOT NULL REFERENCES schedule_template(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL,
  seq          INTEGER NOT NULL,
  label        TEXT,
  duration_min INTEGER,
  offset_min   INTEGER,  -- minutos de atraso a aplicar antes desse slot (mudanca de horario "todos")
  UNIQUE(template_id, kind, seq)
);

CREATE TABLE session_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id   INTEGER NOT NULL REFERENCES block(id) ON DELETE CASCADE,
  started_at TEXT    NOT NULL,
  ended_at   TEXT,
  completed  INTEGER NOT NULL DEFAULT 0
);

-- Tarefas de um evento de foco especifico (dia + posicao). Cada foco tem as suas.
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
