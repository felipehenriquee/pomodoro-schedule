export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export type BlockKind = "work" | "short_break" | "long_break";
export type BlockStatus = "pending" | "done" | "skipped";
export type Freq = "once" | "daily" | "weekly" | "interval";

export interface LongBreakInput {
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  label: string;
}

export interface TemplateInput {
  id?: number;
  name: string;
  days_of_week: Weekday[];
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  work_min: number;
  short_break_min: number;
  active: boolean;
  freq: Freq;
  anchor_date: string | null; // "YYYY-MM-DD"
  interval_days: number | null;
  valid_from: string | null; // "YYYY-MM-DD" - only generates from this date on
  valid_until: string | null; // "YYYY-MM-DD" - only generates up to this date
  long_breaks: LongBreakInput[];
}

export interface LongBreakRow extends LongBreakInput {
  id: number;
  template_id: number;
}

export interface Template {
  id: number;
  name: string;
  days_of_week: Weekday[];
  start_time: string;
  end_time: string;
  work_min: number;
  short_break_min: number;
  active: boolean;
  freq: Freq;
  anchor_date: string | null;
  interval_days: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  long_breaks: LongBreakRow[];
}

export interface Block {
  id: number;
  day_agenda_id: number;
  kind: BlockKind;
  seq?: number; // position among same-kind blocks that day (foco1, foco2...) - Electron back only
  start_ts: string; // RFC3339
  end_ts: string;
  label: string | null;
  status: BlockStatus;
  manual: boolean;
  template_id: number;
  freq: Freq;
  days_of_week: string; // "MO,TU,..."
  interval_days: number | null;
}

export interface BlockCreate {
  date: string; // "YYYY-MM-DD"
  kind: BlockKind;
  label: string | null;
  start_ts: string; // RFC3339
  end_ts: string;
}

export interface BlockEdit {
  id: number;
  label: string | null;
  start_ts: string; // RFC3339
  end_ts: string;
  scope: "one" | "all";
}

export interface CurrentBlock {
  current: Block | null;
  next: Block | null;
  server_now: string;
}

export type Boundary = "work_end" | "work_start";

export interface Task {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
}
