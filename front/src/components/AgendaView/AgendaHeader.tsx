import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";
import { TimerHud } from "../TimerHud";
import { MoreOptionsMenu } from "./MoreOptionsMenu";
import { fmtDuration } from "../../lib/time";
import type { CurrentBlock } from "../../models";

type Props = {
  current: CurrentBlock | null;
  soundOn: boolean;
  debtMs: number;
  onNewTemplate: () => void;
  onOpenList: () => void;
  onOpenRecover: () => void;
  onClearCancelled: () => void;
  onToggleSound: () => void;
  onOpenFocus: () => void;
};

export function AgendaHeader({
  current,
  soundOn,
  debtMs,
  onNewTemplate,
  onOpenList,
  onOpenRecover,
  onClearCancelled,
  onToggleSound,
  onOpenFocus,
}: Props) {
  const { t } = useTranslation();

  return (
    <header>
      <h1>Pomodoro</h1>

      <div className="header-right">
        <button className="chip" onClick={onNewTemplate}>
          {t("agenda.header.newSchedule")}
        </button>
        <button className="chip" onClick={onOpenList}>
          {t("agenda.header.viewSchedules")}
        </button>

        <button
          className={`chip debt-chip ${debtMs > 1000 ? "on" : ""}`}
          title={t("agenda.header.balanceTitle")}
          onClick={onOpenRecover}
        >
          {t("agenda.header.balance")} &minus;{fmtDuration(debtMs)}
        </button>

        <MoreOptionsMenu onClearCancelled={onClearCancelled} />

        <div
          className="hud-box"
          role="button"
          tabIndex={0}
          title={t("agenda.header.goToFocus")}
          onClick={onOpenFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenFocus();
          }}
        >
          <TimerHud data={current} />
          <button
            className="sound-toggle"
            title={
              soundOn
                ? t("agenda.header.soundOn")
                : t("agenda.header.soundOff")
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
          >
            <Icon
              name={soundOn ? "notifications_active" : "notifications_off"}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
