/** Date -> RFC3339 with local offset (e.g. 2026-08-31T09:00:00-03:00) */
export function localRfc3339(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const oh = p(Math.floor(Math.abs(off) / 60));
  const om = p(Math.abs(off) % 60);
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${oh}:${om}`
  );
}

/** local "YYYY-MM-DD" of a Date (default: now) */
export function dateStr(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** local "HH:MM" of a Date */
export function hhmm(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** adds days to a "YYYY-MM-DD" date */
export function addDays(ds: string, n: number): string {
  const d = new Date(ds + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateStr(d);
}
