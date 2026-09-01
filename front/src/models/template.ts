import type { Freq, Weekday } from "./common";

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
