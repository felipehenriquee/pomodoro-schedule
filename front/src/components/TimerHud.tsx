import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BlockKind, CurrentBlock } from "../models";

export function TimerHud({ data }: { data: CurrentBlock | null }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  const label: Record<BlockKind, string> = {
    work: t("timerHud.kind.work"),
    short_break: t("timerHud.kind.shortBreak"),
    long_break: t("timerHud.kind.longBreak"),
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (!data?.current) return 0;
    return Math.max(0, new Date(data.current.end_ts).getTime() - now);
  }, [data, now]);

  if (!data?.current) {
    return <div className="hud idle">{t("timerHud.idle")}</div>;
  }

  const b = data.current;
  return (
    <div className={`hud ${b.kind}`}>
      <span className="hud-kind">{b.label ?? label[b.kind]}</span>
      <span className="hud-time">{fmt(remaining)}</span>
      {data.next && (
        <span className="hud-next">
          {t("timerHud.next", { kind: label[data.next.kind] })}
        </span>
      )}
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
