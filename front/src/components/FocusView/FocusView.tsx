import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { blockService, isDesktop } from "../../services";
import { fmtDuration } from "../../lib/time";
import { Icon } from "../Icon";
import { FocusHeader } from "./FocusHeader";
import { UpcomingPanel } from "./UpcomingPanel";
import { CurrentPanel } from "./CurrentPanel";
import { useFocusLabels } from "./labels";
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
  const { t } = useTranslation();
  const { KIND_LABEL, NTH_LABEL } = useFocusLabels();
  const [now, setNow] = useState(() => Date.now());
  const [picked, setPicked] = useState<BlockKind | null>(null);
  const [upcoming, setUpcoming] = useState<Block | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
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
    ? t("focusView.nthOfDay", {
        n: metaRef.seq ?? 1,
        kind: NTH_LABEL[metaRef.kind],
      }) + (cur ? "" : ` ${t("focusView.next")}`)
    : t("focusView.noEventNow");

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
            {cur ? cur.label ?? KIND_LABEL[cur.kind] : t("focusView.noEventNow")}
          </div>

          {cur && (
            <button className="mode pause-btn" onClick={onTogglePause}>
              <Icon name={paused ? "play_arrow" : "pause"} size={18} />
              {paused ? t("focusView.resume") : t("focusView.pause")}
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
