import type { BlockKind, BlockStatus, Freq } from "./common";

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
