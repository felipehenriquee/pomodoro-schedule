import { Icon } from "../Icon";

type Props = {
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenAgenda: () => void;
};

/** Focus screen header: title + sound toggle + "ver agenda". */
export function FocusHeader({ soundOn, onToggleSound, onOpenAgenda }: Props) {
  return (
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
  );
}
