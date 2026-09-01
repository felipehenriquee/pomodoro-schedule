import { useEffect, useMemo, useState } from "react";
import type { BlockKind, CurrentBlock } from "../models";

const LABELS: Record<BlockKind, string> = {
  work: "Foco",
  short_break: "Pausa",
  long_break: "Pausa longa",
};

export function TimerHud({ data }: { data: CurrentBlock | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const remaining = useMemo(() => {
    if (!data?.current) return 0;
    return Math.max(0, new Date(data.current.end_ts).getTime() - now);
  }, [data, now]);

  if (!data?.current) {
    return <div className="hud idle">Sem bloco ativo agora</div>;
  }

  const b = data.current;
  return (
    <div className={`hud ${b.kind}`}>
      <span className="hud-kind">{b.label ?? LABELS[b.kind]}</span>
      <span className="hud-time">{fmt(remaining)}</span>
      {data.next && <span className="hud-next">a seguir: {LABELS[data.next.kind]}</span>}
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.round(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
