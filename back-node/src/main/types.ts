// Types exchanged with the renderer (same shape as front/src/lib/types.ts)

export type BlockKind = "work" | "short_break" | "long_break";
export type BlockStatus = "pending" | "done" | "skipped";
export type Freq = "once" | "daily" | "weekly" | "interval";
export type Boundary = "work_end" | "work_start";

export interface LongBreakInput {
  start_time: string;
  end_time: string;
  label: string;
}

export interface LongBreakRow extends LongBreakInput {
  id: number;
  template_id: number;
}

export interface TemplateInput {
  id?: number;
  name: string;
  days_of_week: string[];
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
  long_breaks: LongBreakInput[];
}

export interface Template {
  id: number;
  name: string;
  days_of_week: string[];
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
  seq: number; // 1-based position among same-kind blocks that day (foco1, foco2, pausa1...)
  start_ts: string;
  end_ts: string;
  label: string | null;
  status: BlockStatus;
  manual: boolean;
  template_id: number;
  freq: Freq;
  days_of_week: string;
  interval_days: number | null;
}

export interface BlockEdit {
  id: number;
  label: string | null;
  start_ts: string;
  end_ts: string;
  scope: "one" | "all";
}

export interface BlockCreate {
  date: string;
  kind: BlockKind;
  label: string | null;
  start_ts: string;
  end_ts: string;
}

export interface CurrentBlock {
  current: Block | null;
  next: Block | null;
  server_now: string;
}

export interface Task {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
}
