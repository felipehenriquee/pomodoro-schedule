import { useEffect, useState } from "react";
import { blockService, isDesktop } from "../services";
import { fmtDuration, fmtWhen } from "../lib/time";
import type { Block, BlockKind, CurrentBlock } from "../models";
import { Icon } from "./Icon";
import { TaskList } from "./TaskList";

const KIND_LABEL: Record<BlockKind, string> = {
  work: "Pomodoro",
  short_break: "Descanso curto",
  long_break: "Descanso longo",
};

// used in "2o foco do dia", "3o descanso curto do dia"
const NTH_LABEL: Record<BlockKind, string> = {
  work: "foco",
  short_break: "descanso curto",
  long_break: "descanso longo",
};

const MODES: BlockKind[] = ["work", "short_break", "long_break"];

type Props = {
  current: CurrentBlock | null;
  soundOn: boolean;
  paused: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onOpenAgenda: () => void;
};

export function FocusView({
  current,
  soundOn,
  paused,
  onToggleSound,
  onTogglePause,
  onOpenAgenda,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [picked, setPicked] = useState<BlockKind | null>(null);
  const [upcoming, setUpcoming] = useState<Block | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const cur = current?.current ?? null;
  const remaining = cur ? new Date(cur.end_ts).getTime() - now : 0;

  // Background color: the picked button wins; otherwise follows the current event
  const bgKind: BlockKind | "idle" = picked ?? cur?.kind ?? "idle";

  // "switched tabs and the picked tab (that kind) is not running right now"
  const showUpcoming = picked !== null && cur?.kind !== picked;

  // Next event of the picked kind (any day) -- via API
  useEffect(() => {
    if (!showUpcoming || !isDesktop || picked === null) {
      setUpcoming(null);
      return;
    }
    let alive = true;
    blockService
      .nextOfKind(picked)
      .then((b) => alive && setUpcoming(b))
      .catch(() => alive && setUpcoming(null));
    return () => {
      alive = false;
    };
  }, [showUpcoming, picked, current?.current?.id]);

  // "Nº <kind> do dia" label for the current event (or the next one if none)
  const metaRef = cur ?? current?.next ?? null;
  const metaText = metaRef
    ? `${metaRef.seq ?? 1}º ${NTH_LABEL[metaRef.kind]} do dia${
        cur ? "" : " (a seguir)"
      }`
    : "sem evento agora";

  return (
    <div className="focus" data-kind={bgKind}>
      <header className="focus-header">
        <h1>Pomodoro</h1>
        <div className="focus-actions">
          <button className="ghost" onClick={onToggleSound}>
            <Icon name={soundOn ? "notifications_active" : "notifications_off"} />
            {soundOn ? "som ligado" : "ativar som"}
          </button>
          <button className="ghost" onClick={onOpenAgenda}>
            ver agenda
          </button>
        </div>
      </header>

      <div className="focus-main">
        <div className="focus-card">
          <div className="mode-row">
            {MODES.map((k) => (
              <button
                key={k}
                className={`mode ${k} ${picked === k ? "on" : ""}`}
                onClick={() => setPicked((m) => (m === k ? null : k))}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <div className="countdown">{cur ? fmtDuration(remaining) : "--:--"}</div>
          <div className="countdown-name">
            {cur ? cur.label ?? KIND_LABEL[cur.kind] : "sem evento agora"}
          </div>

          {cur && (
            <button className="mode pause-btn" onClick={onTogglePause}>
              <Icon name={paused ? "play_arrow" : "pause"} size={18} />
              {paused ? "retomar" : "pausar"}
            </button>
          )}
        </div>

        {showUpcoming && picked !== null ? (
          <>
            <div className="event-meta">
              <div className="event-number">
                {upcoming
                  ? `em breve · ${upcoming.seq ?? 1}º ${NTH_LABEL[picked]} do dia`
                  : `sem ${NTH_LABEL[picked]} restante`}
              </div>
              <div className="event-name">
                {upcoming ? upcoming.label ?? KIND_LABEL[picked] : "—"}
              </div>
              {upcoming && (
                <div className="event-when">{fmtWhen(upcoming.start_ts)}</div>
              )}
            </div>

            {picked === "work" && upcoming && (
              <TaskList
                dayAgendaId={upcoming.day_agenda_id}
                seq={upcoming.seq ?? 1}
              />
            )}
          </>
        ) : (
          <>
            <div className="event-meta">
              <div className="event-number">{metaText}</div>
              <div className="event-name">
                {cur ? cur.label ?? KIND_LABEL[cur.kind] : "sem evento agora"}
              </div>
            </div>

            {cur && cur.kind === "work" && (
              <TaskList dayAgendaId={cur.day_agenda_id} seq={cur.seq ?? 1} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
