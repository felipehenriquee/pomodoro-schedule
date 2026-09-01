import { useState } from "react";
import { Icon } from "../Icon";
import { TimerHud } from "../TimerHud";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <h1>Pomodoro</h1>

      <div className="header-right">
        <button className="chip" onClick={onNewTemplate}>
          + nova agenda
        </button>
        <button className="chip" onClick={onOpenList}>
          ver agendas
        </button>

        <button
          className={`chip debt-chip ${debtMs > 1000 ? "on" : ""}`}
          title="Saldo de foco pausado"
          onClick={onOpenRecover}
        >
          saldo &minus;{fmtDuration(debtMs)}
        </button>

        <div className="header-menu-wrap">
          <button
            className="row-ico"
            title="Mais opções"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name="more_vert" size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className="menu-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="header-menu">
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onClearCancelled();
                  }}
                >
                  <Icon name="delete" size={16} />
                  excluir todos os eventos cancelados
                </button>
              </div>
            </>
          )}
        </div>

        <div
          className="hud-box"
          role="button"
          tabIndex={0}
          title="Ir para o Foco"
          onClick={onOpenFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenFocus();
          }}
        >
          <TimerHud data={current} />
          <button
            className="sound-toggle"
            title={soundOn ? "Desativar som do alarme" : "Ativar som do alarme"}
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
