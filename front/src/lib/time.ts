export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Monday to Sunday of `base`'s week. */
export function weekRange(base = new Date()): { from: string; to: string } {
  const offset = (base.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(base);
  monday.setDate(base.getDate() - offset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: isoDate(monday), to: isoDate(sunday) };
}

/** ms -> "MM:SS" */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

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

/** RFC3339 -> "HH:MM" (local time) */
export function fmtHM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;
}

/** RFC3339 -> "hoje 14:00" or "ter 02/09 09:00" */
export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const time = fmtHM(iso);
  if (isoDate(d) === isoDate(new Date())) return `hoje ${time}`;
  const day = d
    .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
    .replace(".", "");
  return `${day} ${time}`;
}

/** RFC3339 -> "segunda-feira, 31 de agosto de 2026" (pt-BR long date) */
export function fmtFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const DAY_PT: Record<string, string> = {
  MO: "seg",
  TU: "ter",
  WE: "qua",
  TH: "qui",
  FR: "sex",
  SA: "sab",
  SU: "dom",
};

export function freqLabel(
  freq: string,
  daysOfWeek?: string,
  intervalDays?: number | null
): string {
  switch (freq) {
    case "once":
      return "Nao repete";
    case "daily":
      return "Todos os dias";
    case "interval":
      return intervalDays ? `A cada ${intervalDays} dias` : "Intervalo de dias";
    default: {
      const ds = (daysOfWeek ?? "")
        .split(",")
        .filter(Boolean)
        .map((d) => DAY_PT[d] ?? d);
      return ds.length ? ds.join(", ") : "Dias da semana";
    }
  }
}
