export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export type BlockKind = "work" | "short_break" | "long_break";
export type BlockStatus = "pending" | "done" | "skipped";
export type Freq = "once" | "daily" | "weekly" | "interval";

/** Alarm boundary emitted by the backend at each block edge. */
export type Boundary = "work_end" | "work_start";
