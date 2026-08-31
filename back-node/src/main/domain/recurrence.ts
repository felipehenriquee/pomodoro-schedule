/**
 * Recorrencia de um template. Porta de back/src/domain/recurrence.rs.
 * freq: "once" | "daily" | "weekly" | "interval"
 */

export type Freq = "once" | "daily" | "weekly" | "interval";

const DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export function parseDays(spec: string): string[] {
  return spec
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => (DOW as readonly string[]).includes(s));
}

/** dateStr "YYYY-MM-DD", anchor idem (ou null) */
export function occursOn(
  dateStr: string,
  freq: string,
  daysSpec: string,
  anchor: string | null,
  intervalDays: number | null
): boolean {
  switch (freq) {
    case "once":
      return anchor === dateStr;
    case "daily":
      return true;
    case "interval": {
      if (!anchor || !intervalDays || intervalDays <= 0) return false;
      if (dateStr < anchor) return false;
      const a = Date.parse(anchor + "T00:00:00");
      const d = Date.parse(dateStr + "T00:00:00");
      const days = Math.round((d - a) / 86_400_000);
      return days % intervalDays === 0;
    }
    default: {
      // "weekly"
      const wd = DOW[new Date(dateStr + "T00:00:00").getDay()];
      return parseDays(daysSpec).includes(wd);
    }
  }
}
