import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";

type Props = {
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenAgenda: () => void;
};

/** Focus screen header: title + sound toggle + "ver agenda". */
export function FocusHeader({ soundOn, onToggleSound, onOpenAgenda }: Props) {
  const { t } = useTranslation();

  return (
    <header className="focus-header">
      <h1>Pomodoro</h1>
      <div className="focus-actions">
        <button className="ghost" onClick={onToggleSound}>
          <Icon name={soundOn ? "notifications_active" : "notifications_off"} />
          {soundOn
            ? t("focusView.header.soundOn")
            : t("focusView.header.soundOff")}
        </button>
        <button className="ghost" onClick={onOpenAgenda}>
          {t("focusView.header.viewAgenda")}
        </button>
      </div>
    </header>
  );
}
