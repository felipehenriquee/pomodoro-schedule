import { useEffect, useState } from "react";
import { blockService, isDesktop } from "../../services";
import { fmtDuration } from "../../lib/time";
import { Icon } from "../Icon";
import { FocusHeader } from "./FocusHeader";
import { UpcomingPanel } from "./UpcomingPanel";
import { CurrentPanel } from "./CurrentPanel";
import { KIND_LABEL, NTH_LABEL } from "./labels";
import type { Block, BlockKind, CurrentBlock } from "../../models";

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
      <FocusHeader
        soundOn={soundOn}
        onToggleSound={onToggleSound}
        onOpenAgenda={onOpenAgenda}
      />

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
          <UpcomingPanel picked={picked} upcoming={upcoming} />
        ) : (
          <CurrentPanel cur={cur} metaText={metaText} />
        )}
      </div>
    </div>
  );
}
